import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { cultureItems } from "../db/schema.js";
import { AuthEnv, authMiddleware, adminMiddleware } from "../middleware/auth.js";

export const cultureItemsRouter = new Hono();

// GET /api/culture-items
cultureItemsRouter.get("/", async (c) => {
  const type = c.req.query("type");
  const query = db.select().from(cultureItems).orderBy(desc(cultureItems.publishedAt));
  const rows = type
    ? await db.select().from(cultureItems).where(eq(cultureItems.type, type as "film" | "podcast" | "blog")).orderBy(desc(cultureItems.publishedAt))
    : await query;
  return c.json(rows.map(toApi));
});

// GET /api/culture-items/:id
cultureItemsRouter.get("/:id", async (c) => {
  const [row] = await db.select().from(cultureItems).where(eq(cultureItems.id, c.req.param("id"))).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(toApi(row));
});

// ── Admin write routes ────────────────────────────────────────────────────────

export const cultureItemsAdminRouter = new Hono<AuthEnv>();
cultureItemsAdminRouter.use("*", authMiddleware);
cultureItemsAdminRouter.use("*", adminMiddleware);

type Body = {
  id: string;
  type: "film" | "podcast" | "blog";
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  duration: number;
  coverGradientFrom: string;
  coverGradientTo: string;
  coverEmoji: string;
  featured?: boolean;
  storyId?: string | null;
  audioUrl?: string | null;
  contentUrl?: string | null;
  body?: string | null;
  showNotes?: string | null;
};

// POST /api/culture-items/admin
cultureItemsAdminRouter.post("/", async (c) => {
  const body = await c.req.json<Body>();
  const { id, type, title, description, author, publishedAt, duration, coverGradientFrom, coverGradientTo, coverEmoji } = body;
  if (!id || !type || !title || !description || !author || !publishedAt || !duration || !coverGradientFrom || !coverGradientTo || !coverEmoji) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  const [row] = await db.insert(cultureItems).values({
    id,
    type,
    title,
    description,
    author,
    publishedAt: new Date(publishedAt),
    duration,
    coverGradientFrom,
    coverGradientTo,
    coverEmoji,
    featured: body.featured ?? false,
    storyId: body.storyId ?? null,
    audioUrl: body.audioUrl ?? null,
    contentUrl: body.contentUrl ?? null,
    body: body.body ?? null,
    showNotes: body.showNotes ?? null,
  }).returning();
  return c.json(toApi(row), 201);
});

// PATCH /api/culture-items/admin/:id
cultureItemsAdminRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select().from(cultureItems).where(eq(cultureItems.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const body = await c.req.json<Partial<Body & { featured: boolean }>>();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.type !== undefined) updates.type = body.type;
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.author !== undefined) updates.author = body.author;
  if (body.publishedAt !== undefined) updates.publishedAt = new Date(body.publishedAt);
  if (body.duration !== undefined) updates.duration = body.duration;
  if (body.coverGradientFrom !== undefined) updates.coverGradientFrom = body.coverGradientFrom;
  if (body.coverGradientTo !== undefined) updates.coverGradientTo = body.coverGradientTo;
  if (body.coverEmoji !== undefined) updates.coverEmoji = body.coverEmoji;
  if (body.featured !== undefined) updates.featured = body.featured;
  if ("storyId" in body) updates.storyId = body.storyId ?? null;
  if ("audioUrl" in body) updates.audioUrl = body.audioUrl ?? null;
  if ("contentUrl" in body) updates.contentUrl = body.contentUrl ?? null;
  if ("body" in body) updates.body = body.body ?? null;
  if ("showNotes" in body) updates.showNotes = body.showNotes ?? null;

  const [row] = await db.update(cultureItems).set(updates).where(eq(cultureItems.id, id)).returning();
  return c.json(toApi(row));
});

// DELETE /api/culture-items/admin/:id
cultureItemsAdminRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select().from(cultureItems).where(eq(cultureItems.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(cultureItems).where(eq(cultureItems.id, id));
  return c.json({ success: true });
});

// ── Serializer ────────────────────────────────────────────────────────────────

function toApi(row: typeof cultureItems.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    author: row.author,
    publishedAt: row.publishedAt.toISOString(),
    duration: row.duration,
    coverGradient: [row.coverGradientFrom, row.coverGradientTo] as [string, string],
    coverEmoji: row.coverEmoji,
    featured: row.featured,
    storyId: row.storyId ?? undefined,
    audioUrl: row.audioUrl ?? undefined,
    contentUrl: row.contentUrl ?? undefined,
    body: row.body ?? undefined,
    showNotes: row.showNotes ?? undefined,
  };
}
