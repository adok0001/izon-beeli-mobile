import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { cultureItems, interactiveStories, storyArcs } from "../db/schema.js";
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
  /**
   * The season this card belongs to. Distinct from `storyId`: a film OPENS its
   * own interactive story but is SET IN a season's world, and the old single
   * polymorphic column could not say both.
   */
  seasonArcId?: string | null;
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
  const storyLink = await resolveStoryLink(body.storyId);
  if (!storyLink) return c.json(UNKNOWN_STORY, 400);
  if (!(await seasonExists(body.seasonArcId))) return c.json(UNKNOWN_SEASON, 400);

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
    ...storyLink,
    // An explicit season wins: for a film, storyId names the interactive story it
    // opens, so the season has to be stated separately.
    ...(body.seasonArcId !== undefined ? { seasonArcId: body.seasonArcId || null } : {}),
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
  if ("storyId" in body) {
    const storyLink = await resolveStoryLink(body.storyId);
    if (!storyLink) return c.json(UNKNOWN_STORY, 400);
    Object.assign(updates, storyLink);
  }
  if ("seasonArcId" in body) {
    if (!(await seasonExists(body.seasonArcId))) return c.json(UNKNOWN_SEASON, 400);
    updates.seasonArcId = body.seasonArcId || null;
  }
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

// ── Story link ────────────────────────────────────────────────────────────────

/**
 * `storyId` is the API's single field for "the experience this card opens", but
 * it is polymorphic: it may name an interactive story OR a story arc, and the
 * legacy column recorded no discriminator — which is why the app ships a "broken
 * story link" badge and why the web admin's free-text input could write ids that
 * resolve to nothing.
 *
 * Resolve it on write into the typed, foreign-keyed columns. An id that matches
 * neither table is now a 400 instead of silently-broken data.
 */
async function resolveStoryLink(storyId: string | null | undefined) {
  if (!storyId) {
    return { storyId: null, interactiveStoryId: null, seasonArcId: null };
  }

  const [story] = await db
    .select({ id: interactiveStories.id })
    .from(interactiveStories)
    .where(eq(interactiveStories.id, storyId))
    .limit(1);
  if (story) {
    return { storyId, interactiveStoryId: storyId, seasonArcId: null };
  }

  const [arc] = await db
    .select({ id: storyArcs.id })
    .from(storyArcs)
    .where(eq(storyArcs.id, storyId))
    .limit(1);
  if (arc) {
    return { storyId, interactiveStoryId: null, seasonArcId: storyId };
  }

  return null;
}

/** Does this season exist? `null` clears the link. `false` means it doesn't. */
async function seasonExists(seasonArcId: string | null | undefined) {
  if (!seasonArcId) return true;
  const [arc] = await db
    .select({ id: storyArcs.id })
    .from(storyArcs)
    .where(eq(storyArcs.id, seasonArcId))
    .limit(1);
  return !!arc;
}

const UNKNOWN_SEASON = { error: "No season with that id" } as const;

const UNKNOWN_STORY = { error: "No interactive story or season with that id" } as const;

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
    // Collapse the typed columns back into the single `storyId` the app has
    // always consumed, so installed versions keep working. `storyId` is the
    // un-migrated fallback for rows the import hasn't touched.
    storyId: row.interactiveStoryId ?? row.seasonArcId ?? row.storyId ?? undefined,
    seasonArcId: row.seasonArcId ?? undefined,
    audioUrl: row.audioUrl ?? undefined,
    contentUrl: row.contentUrl ?? undefined,
    body: row.body ?? undefined,
    showNotes: row.showNotes ?? undefined,
  };
}
