import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import { courses, storyArcs, storyChapters } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorStoryArcsRouter = new Hono<AuthEnv>();

// ─── Story Arcs ───────────────────────────────────────────────────────────────

// GET /educator/story-arcs — arcs within the educator's language scope
educatorStoryArcsRouter.get("/story-arcs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const rows = await db
    .select({
      id: storyArcs.id,
      courseId: storyArcs.courseId,
      title: storyArcs.title,
      description: storyArcs.description,
      updatedAt: storyArcs.updatedAt,
    })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(!isAdmin && reviewerLanguages.length > 0 ? inArray(courses.languageId, reviewerLanguages) : undefined)
    .orderBy(courses.languageId, storyArcs.courseId);

  return c.json(rows);
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
      title: storyArcs.title,
      description: storyArcs.description,
      languageId: courses.languageId,
    })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.courseId, courseId))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const chapters = await db
    .select()
    .from(storyChapters)
    .where(eq(storyChapters.storyArcId, arc.id))
    .orderBy(storyChapters.order);

  return c.json({ id: arc.id, courseId: arc.courseId, title: arc.title, description: arc.description, chapters });
});

// POST /educator/story-arcs — create a story arc for a course
educatorStoryArcsRouter.post("/story-arcs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const body = await c.req.json<{ courseId: string; title: string; description: string }>();
  const { courseId, title, description } = body;

  if (!courseId || !title?.trim() || !description?.trim()) {
    return c.json({ error: "courseId, title, and description are required" }, 400);
  }

  const [course] = await db.select({ languageId: courses.languageId }).from(courses)
    .where(eq(courses.id, courseId)).limit(1);
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(course.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = `story-arc-${randomUUID()}`;
  await db.insert(storyArcs).values({ id, courseId, title: title.trim(), description: description.trim() });

  return c.json({ id }, 201);
});

// PUT /educator/story-arcs/:id — update arc title and description
educatorStoryArcsRouter.put("/story-arcs/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ courseId: storyArcs.courseId, languageId: courses.languageId })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json<{ title?: string; description?: string }>();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();

  await db.update(storyArcs).set(updates).where(eq(storyArcs.id, id));
  return c.json({ success: true });
});

// DELETE /educator/story-arcs/:id — delete arc and all its chapters
educatorStoryArcsRouter.delete("/story-arcs/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: courses.languageId })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(arc.languageId)) {
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
    .select({ languageId: courses.languageId })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(arc.languageId)) {
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
