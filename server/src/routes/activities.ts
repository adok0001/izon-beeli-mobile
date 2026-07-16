import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { activities } from "../db/schema.js";
import { AuthEnv, authMiddleware, adminMiddleware } from "../middleware/auth.js";

// ── Public ────────────────────────────────────────────────────────────────────

export const activitiesRouter = new Hono();

activitiesRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  const rows = await db
    .select()
    .from(activities)
    .where(and(eq(activities.languageId, languageId), eq(activities.isActive, true)));

  return c.json(rows.map(deserialize));
});

// ── Admin ─────────────────────────────────────────────────────────────────────

export const activitiesAdminRouter = new Hono<AuthEnv>();
activitiesAdminRouter.use("*", authMiddleware, adminMiddleware);

activitiesAdminRouter.post("/", async (c) => {
  const body = await parseJson<Record<string, unknown>>(c);
  const [row] = await db
    .insert(activities)
    .values(serialize(body))
    .returning();
  return c.json(deserialize(row), 201);
});

activitiesAdminRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await parseJson<Record<string, unknown>>(c);
  const [row] = await db
    .update(activities)
    .set({ ...serialize(body), updatedAt: new Date() })
    .where(eq(activities.id, id))
    .returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(deserialize(row));
});

activitiesAdminRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(activities).where(eq(activities.id, id));
  return c.json({ ok: true });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function serialize(body: Record<string, unknown>) {
  return {
    languageId: body.languageId as string,
    type: body.type as string,
    sentence: (body.sentence as string | undefined) ?? null,
    targetWord: (body.targetWord as string | undefined) ?? null,
    targetWordNative: (body.targetWordNative as string | undefined) ?? null,
    audioUrl: (body.audioUrl as string | undefined) ?? null,
    channels: body.channels != null ? JSON.stringify(body.channels) : null,
    imageUrl: (body.imageUrl as string | undefined) ?? null,
    imageAlt: (body.imageAlt as string | undefined) ?? null,
    zones: body.zones != null ? JSON.stringify(body.zones) : null,
    tokens: body.tokens != null ? JSON.stringify(body.tokens) : null,
  };
}

function deserialize(row: typeof activities.$inferSelect) {
  if (row.type === "soundboard") {
    return {
      id: row.id,
      type: "soundboard" as const,
      languageId: row.languageId,
      sentence: row.sentence ?? "",
      targetWord: row.targetWord ?? "",
      targetWordNative: row.targetWordNative ?? "",
      audioUrl: row.audioUrl ?? null,
      channels: row.channels ? JSON.parse(row.channels) : [],
    };
  }
  return {
    id: row.id,
    type: "placement" as const,
    languageId: row.languageId,
    imageUrl: row.imageUrl ?? "",
    imageAlt: row.imageAlt ?? "",
    zones: row.zones ? JSON.parse(row.zones) : [],
    tokens: row.tokens ? JSON.parse(row.tokens) : [],
  };
}
