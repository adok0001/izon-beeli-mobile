import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { cultureItems, storyArcs, type InteractiveStoryScene } from "../db/schema.js";
import { findScenesError } from "../lib/scene-validation.js";
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
  featured?: boolean;
  /**
   * The season this card belongs to. For a film it means "set in this season's
   * world" (the Series screen's "Also in this world" rail); for a podcast it IS
   * the season the card opens.
   */
  seasonArcId?: string | null;
  /**
   * A film's branching scene graph, folded inline (a film IS its story). The
   * `storyId` link a film used to carry is gone — a film's own `id` is the story id.
   */
  scenes?: Record<string, InteractiveStoryScene> | null;
  initialSceneId?: string | null;
  estimatedMinutes?: number | null;
  language?: string | null;
  audioUrl?: string | null;
  contentUrl?: string | null;
  body?: string | null;
  showNotes?: string | null;
};

// POST /api/culture-items/admin
cultureItemsAdminRouter.post("/", async (c) => {
  const body = await parseJson<Body>(c);
  const { id, type, title, description, author, publishedAt, duration, coverGradientFrom, coverGradientTo } = body;
  if (!id || !type || !title || !description || !author || !publishedAt || !duration || !coverGradientFrom || !coverGradientTo) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  // A film carries its branching scene graph inline — validate the graph.
  if (type === "film" && body.scenes) {
    const scenesError = findScenesError(body.initialSceneId ?? "", body.scenes);
    if (scenesError) return c.json({ error: scenesError }, 400);
  }
  if (!(await seasonExists(body.seasonArcId))) return c.json(UNKNOWN_SEASON, 400);

  const isFilm = type === "film";
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
    featured: body.featured ?? false,
    seasonArcId: body.seasonArcId || null,
    scenes: isFilm ? body.scenes ?? null : null,
    initialSceneId: isFilm ? body.initialSceneId ?? null : null,
    estimatedMinutes: isFilm ? body.estimatedMinutes ?? null : null,
    language: body.language ?? null,
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

  const body = await parseJson<Partial<Body & { featured: boolean }>>(c);
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.type !== undefined) updates.type = body.type;
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.author !== undefined) updates.author = body.author;
  if (body.publishedAt !== undefined) updates.publishedAt = new Date(body.publishedAt);
  if (body.duration !== undefined) updates.duration = body.duration;
  if (body.coverGradientFrom !== undefined) updates.coverGradientFrom = body.coverGradientFrom;
  if (body.coverGradientTo !== undefined) updates.coverGradientTo = body.coverGradientTo;
  if (body.featured !== undefined) updates.featured = body.featured;
  // A film's inline scene graph — revalidate when scenes/initialSceneId change.
  if ("scenes" in body || "initialSceneId" in body) {
    const nextScenes = body.scenes ?? existing.scenes;
    if (nextScenes) {
      const scenesError = findScenesError(
        body.initialSceneId ?? existing.initialSceneId ?? "",
        nextScenes
      );
      if (scenesError) return c.json({ error: scenesError }, 400);
    }
  }
  if ("scenes" in body) updates.scenes = body.scenes ?? null;
  if ("initialSceneId" in body) updates.initialSceneId = body.initialSceneId ?? null;
  if ("estimatedMinutes" in body) updates.estimatedMinutes = body.estimatedMinutes ?? null;
  if ("language" in body) updates.language = body.language ?? null;
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

// ── Season link ────────────────────────────────────────────────────────────────

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

// ── Serializer ────────────────────────────────────────────────────────────────

function toApi(row: typeof cultureItems.$inferSelect) {
  // The single `storyId` the app has always consumed: a film IS its story (its
  // own id, once it has a scene graph); a podcast opens its season. Keeps
  // installed app builds resolving via the /interactive-stories + /series routes.
  const storyId =
    row.type === "film"
      ? row.scenes
        ? row.id
        : undefined
      : row.type === "podcast"
        ? // A podcast opens its season.
          row.seasonArcId ?? undefined
        : undefined;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    author: row.author,
    publishedAt: row.publishedAt.toISOString(),
    duration: row.duration,
    coverGradient: [row.coverGradientFrom, row.coverGradientTo] as [string, string],
    featured: row.featured,
    storyId,
    seasonArcId: row.seasonArcId ?? undefined,
    scenes: row.scenes ?? undefined,
    initialSceneId: row.initialSceneId ?? undefined,
    estimatedMinutes: row.estimatedMinutes ?? undefined,
    language: row.language ?? undefined,
    audioUrl: row.audioUrl ?? undefined,
    contentUrl: row.contentUrl ?? undefined,
    body: row.body ?? undefined,
    showNotes: row.showNotes ?? undefined,
  };
}
