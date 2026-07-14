import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import { courses, lessons, storyArcs, storyChapters } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorStoryArcsRouter = new Hono<AuthEnv>();

// ─── Story Arcs ───────────────────────────────────────────────────────────────

function canAccessLanguage(isAdmin: boolean, reviewerLanguages: string[], languageId: string | null) {
  return isAdmin || (languageId != null && reviewerLanguages.includes(languageId));
}

// GET /educator/story-arcs — arcs within the educator's language scope
educatorStoryArcsRouter.get("/story-arcs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const rows = await db
    .select({
      id: storyArcs.id,
      courseId: storyArcs.courseId,
      languageId: storyArcs.languageId,
      title: storyArcs.title,
      description: storyArcs.description,
      updatedAt: storyArcs.updatedAt,
      status: storyArcs.status,
      createdBy: storyArcs.createdBy,
    })
    .from(storyArcs)
    .orderBy(storyArcs.courseId);

  const visible = rows.filter((r) => canAccessLanguage(isAdmin, reviewerLanguages, r.languageId));

  return c.json(visible);
});

// GET /educator/story-arcs/:courseId — arc with chapters for a specific course
educatorStoryArcsRouter.get("/story-arcs/:courseId", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { courseId } = c.req.param();

  const [arc] = await db
    .select({
      id: storyArcs.id,
      courseId: storyArcs.courseId,
      languageId: storyArcs.languageId,
      title: storyArcs.title,
      description: storyArcs.description,
    })
    .from(storyArcs)
    .where(eq(storyArcs.courseId, courseId))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const chapters = await db
    .select()
    .from(storyChapters)
    .where(eq(storyChapters.storyArcId, arc.id))
    .orderBy(storyChapters.order);

  return c.json({ id: arc.id, courseId: arc.courseId, title: arc.title, description: arc.description, chapters });
});

// POST /educator/story-arcs — create a story arc, either bound to a course or standalone
educatorStoryArcsRouter.post("/story-arcs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const body = await c.req.json<{ courseId?: string; languageId?: string; title: string; description: string }>();
  const { courseId, title, description } = body;

  if (!title?.trim() || !description?.trim()) {
    return c.json({ error: "title and description are required" }, 400);
  }

  let languageId = body.languageId ?? null;

  if (courseId) {
    const [course] = await db.select({ languageId: courses.languageId }).from(courses)
      .where(eq(courses.id, courseId)).limit(1);
    if (!course) return c.json({ error: "Course not found" }, 404);
    languageId = course.languageId;
  }

  if (!languageId) {
    return c.json({ error: "languageId is required when courseId is not set" }, 400);
  }
  if (!canAccessLanguage(isAdmin, reviewerLanguages, languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = `story-arc-${randomUUID()}`;
  await db.insert(storyArcs).values({
    id,
    courseId: courseId ?? null,
    languageId,
    title: title.trim(),
    description: description.trim(),
    status: "draft",
    createdBy: c.get("userId"),
  });

  return c.json({ id }, 201);
});

// PUT /educator/story-arcs/:id — update arc title and description
educatorStoryArcsRouter.put("/story-arcs/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: storyArcs.languageId })
    .from(storyArcs)
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json<{ title?: string; description?: string; status?: string }>();
  const updates: Record<string, unknown> = { updatedAt: new Date(), updatedBy: c.get("userId") };
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  // Editors may move an arc between draft/in_review/archived; going live only
  // happens through POST /content/story_arcs/:id/publish (four-eyes guard).
  if (body.status !== undefined && ["draft", "in_review", "archived"].includes(body.status)) {
    updates.status = body.status;
  }

  await db.update(storyArcs).set(updates).where(eq(storyArcs.id, id));
  return c.json({ success: true });
});

// DELETE /educator/story-arcs/:id — delete arc and all its chapters
educatorStoryArcsRouter.delete("/story-arcs/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: storyArcs.languageId })
    .from(storyArcs)
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db.delete(storyChapters).where(eq(storyChapters.storyArcId, id));
  await db.delete(storyArcs).where(eq(storyArcs.id, id));

  return c.json({ success: true });
});

// PUT /educator/story-arcs/:id/chapters — replace all chapters (bulk upsert)
educatorStoryArcsRouter.put("/story-arcs/:id/chapters", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: storyArcs.languageId })
    .from(storyArcs)
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json<{
    chapters: { id?: string; lessonId: string; title: string; narrativeIntro: string; narrativeOutro: string; order: number }[];
  }>();

  for (const ch of body.chapters) {
    if (!ch.lessonId || !ch.title?.trim() || !ch.narrativeIntro?.trim() || !ch.narrativeOutro?.trim()) {
      return c.json({ error: "Each chapter requires lessonId, title, narrativeIntro, and narrativeOutro" }, 400);
    }
  }

  // Every chapter must point at a lesson that exists. Without this the arc
  // silently stores a dangling lessonId and the season renders a chapter with
  // no episode behind it.
  const lessonIds = [...new Set(body.chapters.map((ch) => ch.lessonId))];
  if (lessonIds.length > 0) {
    const found = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(inArray(lessons.id, lessonIds));
    const foundIds = new Set(found.map((l) => l.id));
    const missing = lessonIds.filter((lessonId) => !foundIds.has(lessonId));
    if (missing.length > 0) {
      return c.json({ error: `No such lesson: ${missing.join(", ")}` }, 400);
    }
  }

  await db.delete(storyChapters).where(eq(storyChapters.storyArcId, id));

  if (body.chapters.length > 0) {
    await db.insert(storyChapters).values(
      body.chapters.map((ch, i) => ({
        id: `story-ch-${randomUUID()}`,
        storyArcId: id,
        lessonId: ch.lessonId,
        title: ch.title.trim(),
        narrativeIntro: ch.narrativeIntro.trim(),
        narrativeOutro: ch.narrativeOutro.trim(),
        order: ch.order ?? i + 1,
      }))
    );
  }

  await db.update(storyArcs).set({ updatedAt: new Date() }).where(eq(storyArcs.id, id));

  return c.json({ success: true, count: body.chapters.length });
});
