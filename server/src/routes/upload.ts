import { Hono } from "hono";
import { put, del } from "@vercel/blob";
import { and, desc, eq, ilike, lt } from "drizzle-orm";
import { db } from "../db/index.js";
import { mediaAssets } from "../db/schema.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";

// Reviewer-gated (not admin-only): any language reviewer needs to upload and
// reuse media for their own drafts, not just admins.
export const uploadAdminRouter = new Hono<AuthEnv>();
uploadAdminRouter.use("*", authMiddleware, reviewerMiddleware);

async function recordUpload(
  kind: "image" | "audio",
  file: File,
  blob: { url: string; pathname: string },
  uploadedBy: string
) {
  const [row] = await db
    .insert(mediaAssets)
    .values({
      url: blob.url,
      pathname: blob.pathname,
      kind,
      filename: file.name,
      mimeType: file.type || null,
      size: file.size,
      uploadedBy,
    })
    .returning();
  return row;
}

uploadAdminRouter.post("/image", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }
  const blob = await put(`activities/images/${Date.now()}-${file.name}`, file, {
    access: "public",
  });
  const row = await recordUpload("image", file, blob, c.get("userId"));
  return c.json({ url: blob.url, id: row.id });
});

uploadAdminRouter.post("/audio", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }
  const blob = await put(`activities/audio/${Date.now()}-${file.name}`, file, {
    access: "public",
  });
  const row = await recordUpload("audio", file, blob, c.get("userId"));
  return c.json({ url: blob.url, id: row.id });
});

// GET /upload/media?kind=image|audio&search=&cursor=<createdAt ISO>
uploadAdminRouter.get("/media", async (c) => {
  const kind = c.req.query("kind");
  const search = c.req.query("search");
  const cursor = c.req.query("cursor");
  const PAGE_SIZE = 60;

  const conditions = [
    kind === "image" || kind === "audio" ? eq(mediaAssets.kind, kind) : undefined,
    search ? ilike(mediaAssets.filename, `%${search}%`) : undefined,
    cursor ? lt(mediaAssets.createdAt, new Date(cursor)) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const rows = await db
    .select()
    .from(mediaAssets)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(PAGE_SIZE);

  const nextCursor = rows.length === PAGE_SIZE ? rows[rows.length - 1].createdAt.toISOString() : null;
  return c.json({ assets: rows, nextCursor });
});

uploadAdminRouter.delete("/media/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);

  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  try {
    await del(row.url);
  } catch {
    // Best-effort: the blob may already be gone or referenced elsewhere; the
    // library row is the source of truth for browsing, so don't fail the
    // request over a blob-store cleanup miss.
  }
  return c.json({ ok: true });
});
