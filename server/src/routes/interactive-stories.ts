import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { interactiveStories } from "../db/schema.js";

type InteractiveStoryRow = typeof interactiveStories.$inferSelect;

/** Reconstruct the app-facing InteractiveStory shape (coverGradient tuple). */
export function toApiInteractiveStory(row: InteractiveStoryRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverGradient: [row.coverGradientFrom, row.coverGradientTo] as [string, string],
    coverEmoji: row.coverEmoji,
    estimatedMinutes: row.estimatedMinutes,
    author: row.author,
    language: row.language ?? undefined,
    initialSceneId: row.initialSceneId,
    scenes: row.scenes,
  };
}

export const interactiveStoriesRouter = new Hono();

// GET /api/interactive-stories?languageId=  → list (branching story summaries + graphs)
interactiveStoriesRouter.get("/", async (c) => {
  const language = c.req.query("languageId") ?? c.req.query("language");
  const rows = await db
    .select()
    .from(interactiveStories)
    .where(
      and(
        eq(interactiveStories.isActive, true),
        language ? eq(interactiveStories.language, language) : undefined
      )
    )
    .orderBy(asc(interactiveStories.id));
  return c.json(rows.map(toApiInteractiveStory));
});

// GET /api/interactive-stories/story/:id  → single branching story by storyId
interactiveStoriesRouter.get("/story/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db
    .select()
    .from(interactiveStories)
    .where(and(eq(interactiveStories.id, id), eq(interactiveStories.isActive, true)))
    .limit(1);
  if (!row) return c.json({ error: "Story not found" }, 404);
  return c.json(toApiInteractiveStory(row));
});
