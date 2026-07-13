import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import { courses, storyArcs, storyChapters } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorStoryArcsRouter = new Hono<AuthEnv>();

// ─── Story Arcs ───────────────────────────────────────────────────────────────

/**
 * A story arc's courseId is usually a real course, but a season-long narrative
 * that spans several courses (e.g. a podcast's overarching arc) deliberately
 * gets its own id instead of shadowing one course's arc — see
 * mobile/lib/data/podcasts/izon/index.ts. Such an arc has no matching `courses`
 * row, so a plain join can't resolve its language scope; fall back to the
 * language prefix baked into every arc id ("story-izon-..." → "izon"), the same
 * language-prefixed-id convention used throughout the content package.
 */
function languageIdFromArcId(arcId: string): string | null {
  return /^story-([a-z]+)-/.exec(arcId)?.[1] ?? null;
}

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
      status: storyArcs.status,
      createdBy: storyArcs.createdBy,
      languageId: courses.languageId,
    })
    .from(storyArcs)
    .leftJoin(courses, eq(storyArcs.courseId, courses.id))
    .orderBy(storyArcs.courseId);

  const scoped = rows.map((r) => ({ ...r, languageId: r.languageId ?? languageIdFromArcId(r.id) }));
  const visible = isAdmin
    ? scoped
    : scoped.filter((r) => r.languageId != null && reviewerLanguages.includes(r.languageId));

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
      title: storyArcs.title,
      description: storyArcs.description,
      languageId: courses.languageId,
    })
    .from(storyArcs)
    .leftJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.courseId, courseId))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  const languageId = arc.languageId ?? languageIdFromArcId(arc.id);
  if (!isAdmin && !(languageId != null && reviewerLanguages.includes(languageId))) {
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
  await db.insert(storyArcs).values({
    id,
    courseId,
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
    .select({ courseId: storyArcs.courseId, languageId: courses.languageId })
    .from(storyArcs)
    .leftJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  const putLanguageId = arc.languageId ?? languageIdFromArcId(id);
  if (!isAdmin && !(putLanguageId != null && reviewerLanguages.includes(putLanguageId))) {
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
    .select({ languageId: courses.languageId })
    .from(storyArcs)
    .leftJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  const deleteLanguageId = arc.languageId ?? languageIdFromArcId(id);
  if (!isAdmin && !(deleteLanguageId != null && reviewerLanguages.includes(deleteLanguageId))) {
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
    .leftJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  const chaptersLanguageId = arc.languageId ?? languageIdFromArcId(id);
  if (!isAdmin && !(chaptersLanguageId != null && reviewerLanguages.includes(chaptersLanguageId))) {
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
