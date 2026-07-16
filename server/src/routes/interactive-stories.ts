import { Hono } from "hono";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { cultureItems } from "../db/schema.js";

/**
 * Compatibility shim. Interactive stories were folded into `culture_items`: a
 * film IS its story (its own `id` is the story id; it carries `scenes` inline).
 * These endpoints keep the old `/interactive-stories` shape so installed app
 * builds — which resolve a film's story graph from this path and from the
 * offline snapshot — keep working. A "story" is a film row with a scene graph.
 */

type FilmStoryRow = typeof cultureItems.$inferSelect;

/** Reconstruct the app-facing InteractiveStory shape from a film row. */
export function toApiInteractiveStory(row: FilmStoryRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverGradient: [row.coverGradientFrom, row.coverGradientTo] as [string, string],
    estimatedMinutes: row.estimatedMinutes ?? 0,
    author: row.author,
    language: row.language ?? undefined,
    initialSceneId: row.initialSceneId,
    scenes: row.scenes,
  };
}

export const interactiveStoriesRouter = new Hono();

// GET /api/interactive-stories?languageId=  → film stories (summaries + graphs)
interactiveStoriesRouter.get("/", async (c) => {
  const language = c.req.query("languageId") ?? c.req.query("language");
  const rows = await db
    .select()
    .from(cultureItems)
    .where(
      and(
        eq(cultureItems.type, "film"),
        isNotNull(cultureItems.scenes),
        eq(cultureItems.isActive, true),
        language ? eq(cultureItems.language, language) : undefined
      )
    )
    .orderBy(asc(cultureItems.id));
  return c.json(rows.map(toApiInteractiveStory));
});

// GET /api/interactive-stories/story/:id  → single film story by its (film) id
interactiveStoriesRouter.get("/story/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db
    .select()
    .from(cultureItems)
    .where(and(eq(cultureItems.id, id), isNotNull(cultureItems.scenes), eq(cultureItems.isActive, true)))
    .limit(1);
  if (!row) return c.json({ error: "Story not found" }, 404);
  return c.json(toApiInteractiveStory(row));
});
