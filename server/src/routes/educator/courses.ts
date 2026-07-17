import { eq, inArray } from "drizzle-orm";
import { parseJson } from "../../lib/http.js";
import { Hono } from "hono";
import { db } from "../../db/index.js";
import { courses, lessons, storyArcs, storyChapters } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorCoursesRouter = new Hono<AuthEnv>();

// GET /educator/courses — available courses in educator's language scope
educatorCoursesRouter.get("/courses", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const rows = await db
    .select({ id: courses.id, title: courses.title, titleFr: courses.titleFr, description: courses.description, descriptionFr: courses.descriptionFr, languageId: courses.languageId, level: courses.level, order: courses.order, courseType: courses.courseType, seasonArcId: courses.seasonArcId, isActive: courses.isActive })
    .from(courses)
    .where(!isAdmin && reviewerLanguages.length > 0 ? inArray(courses.languageId, reviewerLanguages) : undefined)
    .orderBy(courses.languageId, courses.order);

  return c.json(rows);
});

// PATCH /educator/courses/:id
educatorCoursesRouter.patch("/courses/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const courseId = c.req.param("id");
  const body = await parseJson<{
    isActive?: boolean;
    title?: string;
    titleFr?: string | null;
    description?: string;
    descriptionFr?: string | null;
    level?: string;
    order?: number;
    courseType?: string | null;
    /** Companion course for a season — drives the Series screen's level bands. */
    seasonArcId?: string | null;
  }>(c);

  const [course] = await db.select({ languageId: courses.languageId }).from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(course.languageId)) return c.json({ error: "Forbidden" }, 403);

  const patch: Record<string, unknown> = {};
  if (body.isActive !== undefined) patch.isActive = body.isActive;
  if (body.title !== undefined) patch.title = body.title;
  if (body.titleFr !== undefined) patch.titleFr = body.titleFr;
  if (body.description !== undefined) patch.description = body.description;
  if (body.descriptionFr !== undefined) patch.descriptionFr = body.descriptionFr;
  if (body.level !== undefined) patch.level = body.level;
  if (body.order !== undefined) patch.order = body.order;
  if (body.courseType !== undefined) patch.courseType = body.courseType;

  if (body.seasonArcId !== undefined) {
    const seasonArcId = body.seasonArcId || null;
    if (seasonArcId) {
      const [arc] = await db.select({ id: storyArcs.id }).from(storyArcs).where(eq(storyArcs.id, seasonArcId)).limit(1);
      if (!arc) return c.json({ error: "No season with that id" }, 400);
    }
    patch.seasonArcId = seasonArcId;
  }

  if (Object.keys(patch).length === 0) return c.json({ error: "No fields to update" }, 400);

  await db.update(courses).set(patch).where(eq(courses.id, courseId));
  return c.json({ ok: true });
});

// DELETE /educator/courses/:id — cascade-deletes the course's lessons (their
// transcripts/checks/cultural links cascade at the DB level). Blocked if any
// lesson is sequenced into a season — same guard as a single lesson delete,
// since a course cascade shouldn't silently punch a hole in a season's order.
educatorCoursesRouter.delete("/courses/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const courseId = c.req.param("id");

  const [course] = await db.select({ languageId: courses.languageId }).from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(course.languageId)) return c.json({ error: "Forbidden" }, 403);

  const courseLessons = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.courseId, courseId));
  const lessonIds = courseLessons.map((l) => l.id);

  if (lessonIds.length > 0) {
    const chapters = await db
      .select({ order: storyChapters.order, arcTitle: storyArcs.title })
      .from(storyChapters)
      .leftJoin(storyArcs, eq(storyChapters.storyArcId, storyArcs.id))
      .where(inArray(storyChapters.lessonId, lessonIds));

    if (chapters.length > 0) {
      const where = chapters
        .map((ch) => `chapter ${ch.order} of "${ch.arcTitle ?? "an untitled season"}"`)
        .join(", ");
      return c.json(
        { error: `This course has lessons sequenced into a season (${where}). Remove them from the season before deleting the course.` },
        409,
      );
    }

    await db.delete(lessons).where(eq(lessons.courseId, courseId));
  }

  await db.delete(courses).where(eq(courses.id, courseId));
  return c.json({ deleted: true, lessonsDeleted: lessonIds.length });
});
