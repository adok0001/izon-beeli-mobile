import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { parseJson } from "../../lib/http.js";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import { cultureItems, type InteractiveStoryScene } from "../../db/schema.js";
import { findScenesError } from "../../lib/scene-validation.js";
import { AuthEnv } from "../../middleware/auth.js";

/**
 * Film authoring (the branching scene graph). Interactive stories were folded
 * into `culture_items`: a film IS its story, carrying `scenes` inline. These
 * routes keep the language-scoped educator four-eyes flow (per-language
 * reviewers, draft → in_review → published) but now read/write film rows in
 * `culture_items` (type='film', gated on a scene graph). Route paths are
 * unchanged so the mobile Studio film editor keeps working.
 */
export const educatorInteractiveStoriesRouter = new Hono<AuthEnv>();

/** Sentinel languageId for the admin-only "All" scope: instead of one
 * language, it returns every film story across all languages so an admin can
 * review the whole catalogue in one list. Read-only aggregate — you can't
 * create into it. Admin-only, since it spans beyond any single reviewer's
 * assigned-languages scope. */
const ALL_LANGUAGE_ID = "all";

/** Sentinel languageId for the admin-only language-agnostic scope: films
 * with no single language (e.g. a pan-African culture piece), stored with
 * a null language. Unlike "all" these are a real, creatable bucket. */
const GENERAL_LANGUAGE_ID = "general";

type FilmRow = typeof cultureItems.$inferSelect;

/** Only films that carry a scene graph are "stories" in this flow. */
const isFilmStory = () => and(eq(cultureItems.type, "film"), isNotNull(cultureItems.scenes));

/** Reconstruct the app-facing InteractiveStory shape (coverGradient tuple). */
function toApiStory(row: FilmRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverGradient: [row.coverGradientFrom, row.coverGradientTo] as [string, string],
    estimatedMinutes: row.estimatedMinutes ?? 5,
    author: row.author,
    language: row.language ?? undefined,
    initialSceneId: row.initialSceneId,
    scenes: row.scenes,
    status: row.status,
    createdBy: row.createdBy,
  };
}

// ─── Interactive Stories CRUD ──────────────────────────────────────────────

// GET /educator/interactive-stories?languageId=
educatorInteractiveStoriesRouter.get("/interactive-stories", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);

  if (languageId === ALL_LANGUAGE_ID) {
    if (!isAdmin) return c.json({ error: "Forbidden" }, 403);
    const rows = await db.select().from(cultureItems).where(isFilmStory());
    return c.json(rows.map(toApiStory));
  }

  if (languageId === GENERAL_LANGUAGE_ID) {
    if (!isAdmin) return c.json({ error: "Forbidden" }, 403);
    const rows = await db
      .select()
      .from(cultureItems)
      .where(and(isFilmStory(), isNull(cultureItems.language)));
    return c.json(rows.map(toApiStory));
  }

  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  const rows = await db
    .select()
    .from(cultureItems)
    .where(and(isFilmStory(), eq(cultureItems.language, languageId)));
  return c.json(rows.map(toApiStory));
});

// POST /educator/interactive-stories
educatorInteractiveStoriesRouter.post("/interactive-stories", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const body = await parseJson<{
    languageId: string;
    title: string;
    description: string;
    coverGradient: [string, string];
    estimatedMinutes: number;
    author: string;
    initialSceneId: string;
    scenes: Record<string, InteractiveStoryScene>;
  }>(c);

  if (!body.languageId || !body.title?.trim() || !body.description?.trim()) {
    return c.json({ error: "languageId, title, and description are required" }, 400);
  }
  // "All" is a read-only aggregate view, not a home for new stories — a story
  // must belong to a specific language (or the language-agnostic bucket).
  if (body.languageId === ALL_LANGUAGE_ID) {
    return c.json({ error: "Choose a specific language for a new story" }, 400);
  }
  const isGeneral = body.languageId === GENERAL_LANGUAGE_ID;
  if (isGeneral) {
    if (!isAdmin) return c.json({ error: "Forbidden" }, 403);
  } else if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(body.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  const scenesError = findScenesError(body.initialSceneId, body.scenes ?? {});
  if (scenesError) return c.json({ error: scenesError }, 400);

  const id = `story-${randomUUID()}`;
  const estimatedMinutes = body.estimatedMinutes || 5;
  const [row] = await db
    .insert(cultureItems)
    .values({
      id,
      type: "film",
      language: isGeneral ? null : body.languageId,
      title: body.title.trim(),
      description: body.description.trim(),
      author: body.author?.trim() || "Beeli",
      // Catalog fields a film card needs; the display date defaults to now and
      // duration is derived from the story's estimated read time.
      publishedAt: new Date(),
      duration: estimatedMinutes * 60,
      coverGradientFrom: body.coverGradient?.[0] ?? "#C4862A",
      coverGradientTo: body.coverGradient?.[1] ?? "#8B5E1F",
      estimatedMinutes,
      initialSceneId: body.initialSceneId,
      scenes: body.scenes as never,
      status: "draft",
      createdBy: c.get("userId"),
    })
    .returning();

  return c.json(toApiStory(row), 201);
});

// PATCH /educator/interactive-stories/:id
educatorInteractiveStoriesRouter.patch("/interactive-stories/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const id = c.req.param("id");
  const [existing] = await db
    .select({
      language: cultureItems.language,
      initialSceneId: cultureItems.initialSceneId,
      scenes: cultureItems.scenes,
    })
    .from(cultureItems)
    .where(and(eq(cultureItems.id, id), eq(cultureItems.type, "film")))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.language == null) {
    if (!isAdmin) return c.json({ error: "Forbidden" }, 403);
  } else if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(existing.language)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }

  const body = await parseJson<{
    title?: string;
    description?: string;
    coverGradient?: [string, string];
    estimatedMinutes?: number;
    author?: string;
    initialSceneId?: string;
    scenes?: Record<string, InteractiveStoryScene>;
    status?: string;
  }>(c);

  if (body.scenes !== undefined || body.initialSceneId !== undefined) {
    const nextScenes = body.scenes ?? existing.scenes;
    if (nextScenes) {
      const scenesError = findScenesError(
        body.initialSceneId ?? existing.initialSceneId ?? "",
        nextScenes
      );
      if (scenesError) return c.json({ error: scenesError }, 400);
    }
  }

  // Going live only happens through the four-eyes publish endpoint.
  const statusTransition =
    body.status !== undefined && ["draft", "in_review", "archived"].includes(body.status)
      ? { status: body.status as "draft" | "in_review" | "archived" }
      : {};

  const [row] = await db
    .update(cultureItems)
    .set({
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() } : {}),
      ...(body.coverGradient !== undefined
        ? { coverGradientFrom: body.coverGradient[0], coverGradientTo: body.coverGradient[1] }
        : {}),
      ...(body.estimatedMinutes !== undefined ? { estimatedMinutes: body.estimatedMinutes } : {}),
      ...(body.author !== undefined ? { author: body.author.trim() } : {}),
      ...(body.initialSceneId !== undefined ? { initialSceneId: body.initialSceneId } : {}),
      ...(body.scenes !== undefined ? { scenes: body.scenes as never } : {}),
      ...statusTransition,
      updatedBy: c.get("userId"),
    })
    .where(eq(cultureItems.id, id))
    .returning();

  return c.json(toApiStory(row));
});

// DELETE /educator/interactive-stories/:id
educatorInteractiveStoriesRouter.delete("/interactive-stories/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const id = c.req.param("id");
  const [existing] = await db
    .select({ language: cultureItems.language })
    .from(cultureItems)
    .where(and(eq(cultureItems.id, id), eq(cultureItems.type, "film")))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.language == null) {
    if (!isAdmin) return c.json({ error: "Forbidden" }, 403);
  } else if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(existing.language)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  await db.delete(cultureItems).where(eq(cultureItems.id, id));
  return c.json({ success: true });
});
