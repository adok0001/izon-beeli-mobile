import { put } from "@vercel/blob";
import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import { courses, languages, lessons, transcriptSegments } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";
import { stubForCourse, stubForLanguage } from "../../lib/lesson-stubs.js";
import { recordMediaAsset } from "../upload.js";
import { isAudioUpload } from "./_shared.js";

export const educatorLessonsRouter = new Hono<AuthEnv>();

// GET /educator/lessons
educatorLessonsRouter.get("/lessons", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const rows = await db
    .select({
      id: lessons.id,
      courseId: lessons.courseId,
      courseTitle: courses.title,
      languageId: courses.languageId,
      title: lessons.title,
      titleFr: lessons.titleFr,
      description: lessons.description,
      descriptionFr: lessons.descriptionFr,
      type: lessons.type,
      audioUrl: lessons.audioUrl,
      duration: lessons.duration,
      order: lessons.order,
      artist: lessons.artist,
      genre: lessons.genre,
      isActive: lessons.isActive,
      status: lessons.status,
      createdBy: lessons.createdBy,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(!isAdmin && reviewerLanguages.length > 0 ? inArray(courses.languageId, reviewerLanguages) : undefined)
    .orderBy(courses.languageId, lessons.order);

  return c.json(rows);
});

// POST /educator/lessons — create a lesson directly (bypasses contribution review)
educatorLessonsRouter.post("/lessons", async (c) => {
  const userId = c.get("userId");
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const formData = await c.req.formData();
  const languageId = (formData.get("languageId") as string)?.trim() ?? "";
  const courseId = (formData.get("courseId") as string) || null;
  const title = (formData.get("title") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() ?? "";
  const type = (formData.get("type") as string) || "lesson";
  const artist = (formData.get("artist") as string)?.trim() || null;
  const genre = (formData.get("genre") as string)?.trim() || null;
  const durationStr = formData.get("duration") as string | null;
  const duration = durationStr ? parseInt(durationStr, 10) : null;
  const orderStr = formData.get("order") as string | null;
  const order = orderStr ? parseInt(orderStr, 10) : 999;
  const segmentsJson = (formData.get("segments") as string) ?? "[]";

  if (!languageId || !title || !description) {
    return c.json({ error: "languageId, title, and description are required" }, 400);
  }
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  let segments: { text: string; translation?: string; translationFr?: string; startTime?: number; endTime?: number; order: number }[] = [];
  try { segments = JSON.parse(segmentsJson); } catch { /* no segments */ }

  // Resolve courseId
  let resolvedCourseId = courseId;
  if (!resolvedCourseId) {
    const [firstCourse] = await db.select({ id: courses.id }).from(courses)
      .where(eq(courses.languageId, languageId)).limit(1);
    resolvedCourseId = firstCourse?.id ?? null;
  }
  if (!resolvedCourseId) {
    return c.json({ error: "No course found for this language. Create a course first." }, 400);
  }

  let audioUrl: string | null = null;
  const audioFile = formData.get("audio") as File | null;
  if (audioFile?.size) {
    try {
      const blob = await put(
        `educator-lessons/${Date.now()}-${audioFile.name}`,
        audioFile,
        { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
      );
      audioUrl = blob.url;
      await recordMediaAsset("audio", audioFile, blob, userId);
    } catch {
      return c.json({ error: "Failed to upload audio" }, 500);
    }
  }

  const lessonId = `edu-${randomUUID()}`;

  await db.insert(lessons).values({
    id: lessonId,
    courseId: resolvedCourseId,
    type,
    title,
    description,
    audioUrl,
    duration: duration && !isNaN(duration) ? duration : null,
    order: isNaN(order) ? 999 : order,
    artist,
    genre,
    status: "draft",
    createdBy: userId,
    updatedBy: userId,
  });

  if (segments.length > 0) {
    await db.insert(transcriptSegments).values(
      segments.map((seg) => ({
        lessonId,
        text: seg.text,
        translation: seg.translation || null,
        translationFr: seg.translationFr || null,
        startTime: seg.startTime ?? 0,
        endTime: seg.endTime ?? 0,
        order: seg.order,
      }))
    );
  }

  const [course] = await db.select({ lessonsCount: courses.lessonsCount })
    .from(courses).where(eq(courses.id, resolvedCourseId)).limit(1);
  if (course) {
    await db.update(courses).set({ lessonsCount: course.lessonsCount + 1 })
      .where(eq(courses.id, resolvedCourseId));
  }

  return c.json({ id: lessonId }, 201);
});

const PATCHABLE_LESSON_STATUSES = ["draft", "in_review", "archived"] as const;

// PATCH /educator/lessons/:id
educatorLessonsRouter.patch("/lessons/:id", async (c) => {
  const userId = c.get("userId");
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [existing] = await db
    .select({ languageId: courses.languageId })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json<{
    title?: string; description?: string; type?: string;
    artist?: string | null; genre?: string | null; order?: number; isActive?: boolean;
    status?: string;
  }>();

  if (body.status && !PATCHABLE_LESSON_STATUSES.includes(body.status as (typeof PATCHABLE_LESSON_STATUSES)[number])) {
    // "published" only happens through the guarded POST /content/lessons/:id/publish endpoint.
    return c.json({ error: `status must be one of: ${PATCHABLE_LESSON_STATUSES.join(", ")}` }, 400);
  }

  const updates: Record<string, unknown> = { updatedBy: userId };
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.type !== undefined) updates.type = body.type;
  if (body.artist !== undefined) updates.artist = body.artist?.trim() || null;
  if (body.genre !== undefined) updates.genre = body.genre?.trim() || null;
  if (body.order !== undefined) updates.order = body.order;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.status !== undefined) updates.status = body.status;

  await db.update(lessons).set(updates).where(eq(lessons.id, id));
  return c.json({ success: true });
});

// GET /educator/lessons/:id — lesson detail with transcript segments
educatorLessonsRouter.get("/lessons/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [lesson] = await db
    .select({
      id: lessons.id,
      courseId: lessons.courseId,
      courseTitle: courses.title,
      languageId: courses.languageId,
      title: lessons.title,
      titleFr: lessons.titleFr,
      description: lessons.description,
      descriptionFr: lessons.descriptionFr,
      type: lessons.type,
      audioUrl: lessons.audioUrl,
      duration: lessons.duration,
      order: lessons.order,
      artist: lessons.artist,
      genre: lessons.genre,
      isActive: lessons.isActive,
      status: lessons.status,
      createdBy: lessons.createdBy,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(lesson.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const segs = await db
    .select()
    .from(transcriptSegments)
    .where(eq(transcriptSegments.lessonId, id))
    .orderBy(transcriptSegments.order);

  return c.json({ ...lesson, segments: segs });
});

// PUT /educator/lessons/:id/segments — replace all transcript segments
educatorLessonsRouter.put("/lessons/:id/segments", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [lesson] = await db
    .select({ languageId: courses.languageId })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(lesson.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const { segments } = await c.req.json<{
    segments: { text: string; translation?: string; translationFr?: string; startTime: number; endTime: number; order: number }[];
  }>();

  for (const seg of segments) {
    if (!seg.text?.trim()) return c.json({ error: "Every segment must have text" }, 400);
    if (seg.endTime < seg.startTime) {
      return c.json({ error: `Segment "${seg.text.slice(0, 30)}" has endTime before startTime` }, 400);
    }
  }

  await db.delete(transcriptSegments).where(eq(transcriptSegments.lessonId, id));

  if (segments.length > 0) {
    await db.insert(transcriptSegments).values(
      segments.map((seg, i) => ({
        lessonId: id,
        text: seg.text.trim(),
        translation: seg.translation?.trim() || null,
        translationFr: seg.translationFr?.trim() || null,
        startTime: seg.startTime,
        endTime: seg.endTime,
        order: seg.order ?? i,
      }))
    );
  }

  return c.json({ success: true, count: segments.length });
});

// POST /educator/lessons/:id/audio — replace audio file
educatorLessonsRouter.post("/lessons/:id/audio", async (c) => {
  const userId = c.get("userId");
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [lesson] = await db
    .select({ languageId: courses.languageId })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(lesson.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const formData = await c.req.formData();
  const audioFile = formData.get("audio") as File | null;
  const durationStr = formData.get("duration") as string | null;

  if (!audioFile?.size) return c.json({ error: "audio file is required" }, 400);
  if (!isAudioUpload(audioFile)) return c.json({ error: "Only audio files are allowed" }, 400);

  try {
    const blob = await put(
      `educator-lessons/${id}/${Date.now()}-${audioFile.name}`,
      audioFile,
      { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
    );
    await db.update(lessons).set({
      audioUrl: blob.url,
      ...(durationStr ? { duration: parseInt(durationStr, 10) } : {}),
    }).where(eq(lessons.id, id));
    await recordMediaAsset("audio", audioFile, blob, userId);
    return c.json({ audioUrl: blob.url });
  } catch {
    return c.json({ error: "Failed to upload audio" }, 500);
  }
});

// DELETE /educator/lessons/:id
educatorLessonsRouter.delete("/lessons/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [existing] = await db
    .select({
      courseLanguageId: courses.languageId,
      courseId: lessons.courseId,
    })
    .from(lessons)
    .leftJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "Not found" }, 404);
  const lessonLanguageId = existing.courseLanguageId;
  if (!isAdmin && (!lessonLanguageId || !reviewerLanguages.includes(lessonLanguageId))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db.delete(transcriptSegments).where(eq(transcriptSegments.lessonId, id));
  await db.delete(lessons).where(eq(lessons.id, id));

  if (existing.courseId) {
    const [course] = await db.select({ lessonsCount: courses.lessonsCount })
      .from(courses).where(eq(courses.id, existing.courseId)).limit(1);
    if (course && course.lessonsCount > 0) {
      await db.update(courses).set({ lessonsCount: course.lessonsCount - 1 })
        .where(eq(courses.id, existing.courseId));
    }
  }

  return c.json({ deleted: true });
});

// ─── POST /educator/generate-stubs ───────────────────────────────────────────
// Seeds template courses + lessons for a language that has no content yet.
// All generated lessons start as isActive=false so educators review before publish.

educatorLessonsRouter.post("/generate-stubs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const { languageId, courseType } = await c.req.json<{ languageId: string; courseType?: string }>();
  if (!languageId?.trim()) return c.json({ error: "languageId is required" }, 400);

  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const [lang] = await db
    .select({ id: languages.id, nativeName: languages.nativeName })
    .from(languages)
    .where(eq(languages.id, languageId))
    .limit(1);
  if (!lang) return c.json({ error: "Unknown language" }, 400);

  // ── Per-course seed ────────────────────────────────────────────────────────
  if (courseType) {
    const stub = stubForCourse(lang, courseType);
    if (!stub) return c.json({ error: "Unknown course type" }, 400);

    const { course, lessons: stubLessons } = stub;

    // Block only if this specific course already has lessons
    const [existingLesson] = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.courseId, course.id))
      .limit(1);
    if (existingLesson) {
      return c.json({ error: "This course already has lessons." }, 409);
    }

    await db.insert(courses).values({
      id: course.id,
      languageId: course.languageId,
      title: course.title,
      titleFr: course.titleFr ?? null,
      description: course.description,
      descriptionFr: course.descriptionFr ?? null,
      level: course.level,
      lessonsCount: course.lessonsCount,
      order: course.order,
      courseType: course.courseType ?? null,
    }).onConflictDoNothing();

    for (const lesson of stubLessons) {
      const { segments, ...lessonData } = lesson;
      await db.insert(lessons).values({
        id: lessonData.id, courseId: lessonData.courseId, type: lessonData.type,
        title: lessonData.title, titleFr: lessonData.titleFr,
        description: lessonData.description, descriptionFr: lessonData.descriptionFr,
        audioUrl: null, duration: null, order: lessonData.order,
        artist: lessonData.artist, genre: lessonData.genre, isActive: false,
      }).onConflictDoNothing();

      if (segments.length > 0) {
        await db.insert(transcriptSegments).values(
          segments.map((seg) => ({
            lessonId: lessonData.id, startTime: seg.startTime, endTime: seg.endTime,
            text: seg.text, translation: seg.translation, translationFr: seg.translationFr,
            order: seg.order,
          }))
        ).onConflictDoNothing();
      }
    }

    return c.json({ courses: 1, lessons: stubLessons.length });
  }

  // ── Full language seed (no courseType) ────────────────────────────────────
  // Block if any courses already exist — use the per-course path for add-ons
  const [existing] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.languageId, languageId))
    .limit(1);
  if (existing) {
    return c.json({ error: "Content already exists for this language. Use per-course generation to add missing courses." }, 409);
  }

  const { courses: stubCourses, lessons: stubLessons } = stubForLanguage(lang);

  for (const course of stubCourses) {
    await db.insert(courses).values({
      id: course.id,
      languageId: course.languageId,
      title: course.title,
      titleFr: course.titleFr ?? null,
      description: course.description,
      descriptionFr: course.descriptionFr ?? null,
      level: course.level,
      lessonsCount: course.lessonsCount,
      order: course.order,
      courseType: course.courseType ?? null,
    }).onConflictDoNothing();
  }

  for (const lesson of stubLessons) {
    const { segments, ...lessonData } = lesson;
    await db.insert(lessons).values({
      id: lessonData.id, courseId: lessonData.courseId, type: lessonData.type,
      title: lessonData.title, titleFr: lessonData.titleFr,
      description: lessonData.description, descriptionFr: lessonData.descriptionFr,
      audioUrl: null, duration: null, order: lessonData.order,
      artist: lessonData.artist, genre: lessonData.genre, isActive: false,
    }).onConflictDoNothing();

    if (segments.length > 0) {
      await db.insert(transcriptSegments).values(
        segments.map((seg) => ({
          lessonId: lessonData.id, startTime: seg.startTime, endTime: seg.endTime,
          text: seg.text, translation: seg.translation, translationFr: seg.translationFr,
          order: seg.order,
        }))
      ).onConflictDoNothing();
    }
  }

  return c.json({ courses: stubCourses.length, lessons: stubLessons.length });
});
