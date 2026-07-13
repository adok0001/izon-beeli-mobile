import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import { interactiveStories, type InteractiveStoryScene } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorInteractiveStoriesRouter = new Hono<AuthEnv>();

/**
 * Referential integrity for the scene graph: every narrative scene's
 * nextSceneId and every choice's nextSceneId must resolve to a real scene,
 * and choice scenes must actually offer a choice. Enforced here (not just in
 * the mobile editor) because this endpoint is the trust boundary — a
 * dangling reference that slips through would strand a learner mid-story
 * once published, with nothing else in the pipeline re-checking it.
 */
function findScenesError(initialSceneId: string, scenes: Record<string, InteractiveStoryScene>): string | null {
  if (!initialSceneId || !scenes[initialSceneId]) return "initialSceneId must reference an existing scene";

  for (const [key, scene] of Object.entries(scenes)) {
    if (!scene.text?.trim()) return `Scene "${key}" needs text`;
    if (scene.type === "narrative") {
      if (!scene.nextSceneId || !scenes[scene.nextSceneId]) {
        return `Narrative scene "${key}" must lead to an existing scene`;
      }
    } else if (scene.type === "choice") {
      if (!scene.choices || scene.choices.length === 0) {
        return `Choice scene "${key}" needs at least one choice`;
      }
      for (const choice of scene.choices) {
        if (!choice.text?.trim() || !choice.nextSceneId || !scenes[choice.nextSceneId]) {
          return `A choice in scene "${key}" needs text and must lead to an existing scene`;
        }
      }
    } else if (scene.type !== "conclusion") {
      return `Scene "${key}" has an unknown type`;
    }
  }
  return null;
}

/** Reconstruct the app-facing InteractiveStory shape (coverGradient tuple). */
function toApiStory(row: typeof interactiveStories.$inferSelect) {
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
    status: row.status,
    createdBy: row.createdBy,
  };
}

// ─── Interactive Stories CRUD ──────────────────────────────────────────────

// GET /educator/interactive-stories?languageId=
educatorInteractiveStoriesRouter.get("/interactive-stories", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  const rows = await db
    .select()
    .from(interactiveStories)
    .where(eq(interactiveStories.language, languageId));
  return c.json(rows.map(toApiStory));
});

// POST /educator/interactive-stories
educatorInteractiveStoriesRouter.post("/interactive-stories", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const body = await c.req.json<{
    languageId: string;
    title: string;
    description: string;
    coverGradient: [string, string];
    coverEmoji: string;
    estimatedMinutes: number;
    author: string;
    initialSceneId: string;
    scenes: Record<string, InteractiveStoryScene>;
  }>();

  if (!body.languageId || !body.title?.trim() || !body.description?.trim()) {
    return c.json({ error: "languageId, title, and description are required" }, 400);
  }
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(body.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  const scenesError = findScenesError(body.initialSceneId, body.scenes ?? {});
  if (scenesError) return c.json({ error: scenesError }, 400);

  const id = `story-${randomUUID()}`;
  const [row] = await db
    .insert(interactiveStories)
    .values({
      id,
      language: body.languageId,
      title: body.title.trim(),
      description: body.description.trim(),
      coverGradientFrom: body.coverGradient?.[0] ?? "#C4862A",
      coverGradientTo: body.coverGradient?.[1] ?? "#8B5E1F",
      coverEmoji: body.coverEmoji || "📖",
      estimatedMinutes: body.estimatedMinutes || 5,
      author: body.author?.trim() || "Beeli",
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
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const id = c.req.param("id");
  const [existing] = await db
    .select({
      language: interactiveStories.language,
      initialSceneId: interactiveStories.initialSceneId,
      scenes: interactiveStories.scenes,
    })
    .from(interactiveStories)
    .where(eq(interactiveStories.id, id))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (reviewerLanguages.length > 0 && existing.language && !reviewerLanguages.includes(existing.language)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }

  const body = await c.req.json<{
    title?: string;
    description?: string;
    coverGradient?: [string, string];
    coverEmoji?: string;
    estimatedMinutes?: number;
    author?: string;
    initialSceneId?: string;
    scenes?: Record<string, InteractiveStoryScene>;
    status?: string;
  }>();

  if (body.scenes !== undefined || body.initialSceneId !== undefined) {
    const scenesError = findScenesError(
      body.initialSceneId ?? existing.initialSceneId,
      body.scenes ?? existing.scenes
    );
    if (scenesError) return c.json({ error: scenesError }, 400);
  }

  // Going live only happens through the four-eyes publish endpoint.
  const statusTransition =
    body.status !== undefined && ["draft", "in_review", "archived"].includes(body.status)
      ? { status: body.status as "draft" | "in_review" | "archived" }
      : {};

  const [row] = await db
    .update(interactiveStories)
    .set({
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() } : {}),
      ...(body.coverGradient !== undefined
        ? { coverGradientFrom: body.coverGradient[0], coverGradientTo: body.coverGradient[1] }
        : {}),
      ...(body.coverEmoji !== undefined ? { coverEmoji: body.coverEmoji } : {}),
      ...(body.estimatedMinutes !== undefined ? { estimatedMinutes: body.estimatedMinutes } : {}),
      ...(body.author !== undefined ? { author: body.author.trim() } : {}),
      ...(body.initialSceneId !== undefined ? { initialSceneId: body.initialSceneId } : {}),
      ...(body.scenes !== undefined ? { scenes: body.scenes as never } : {}),
      ...statusTransition,
      updatedBy: c.get("userId"),
    })
    .where(eq(interactiveStories.id, id))
    .returning();

  return c.json(toApiStory(row));
});

// DELETE /educator/interactive-stories/:id
educatorInteractiveStoriesRouter.delete("/interactive-stories/:id", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const id = c.req.param("id");
  const [existing] = await db
    .select({ language: interactiveStories.language })
    .from(interactiveStories)
    .where(eq(interactiveStories.id, id))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (reviewerLanguages.length > 0 && existing.language && !reviewerLanguages.includes(existing.language)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  await db.delete(interactiveStories).where(eq(interactiveStories.id, id));
  return c.json({ success: true });
});
