import { Hono } from "hono";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { lessons, transcriptSegments, courses } from "../db/schema.js";

export const lessonsRouter = new Hono();

// GET /api/lessons?courseId= OR /api/lessons?languageId=
lessonsRouter.get("/", async (c) => {
  const courseId = c.req.query("courseId");
  const languageId = c.req.query("languageId");

  if (courseId) {
    if (courseId.length > 64) {
      return c.json({ error: "Invalid courseId" }, 400);
    }
    const result = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.order));
    return c.json(result);
  }

  if (languageId) {
    if (languageId.length > 64) {
      return c.json({ error: "Invalid languageId" }, 400);
    }
    // Fetch all courses for the language, then all lessons for those courses
    const langCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.languageId, languageId));

    if (langCourses.length === 0) {
      return c.json([]);
    }

    const courseIds = langCourses.map((c) => c.id);
    const result = await db
      .select()
      .from(lessons)
      .where(inArray(lessons.courseId, courseIds))
      .orderBy(asc(lessons.courseId), asc(lessons.order));

    return c.json(result);
  }

  return c.json({ error: "courseId or languageId query param required" }, 400);
});

// GET /api/lessons/:id — returns lesson with transcript segments
lessonsRouter.get("/:id", async (c) => {
  const { id } = c.req.param();
  if (!id || id.length > 64) {
    return c.json({ error: "Invalid lesson id" }, 400);
  }

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  const segments = await db
    .select()
    .from(transcriptSegments)
    .where(eq(transcriptSegments.lessonId, id))
    .orderBy(asc(transcriptSegments.order));

  return c.json({
    ...lesson,
    transcript: segments.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      text: s.text,
      translation: s.translation,
    })),
  });
});
