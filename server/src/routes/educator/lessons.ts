import { put } from "@vercel/blob";
import { parseJson } from "../../lib/http.js";
import { eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import { courses, culturalContent, languages, lessonChecks, lessonCulturalContent, lessons, storyArcs, storyChapters, transcriptSegments } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";
import { stubForCourse, stubForLanguage } from "../../lib/lesson-stubs.js";
import { recordMediaAsset } from "../upload.js";
import { isAudioUpload } from "./_shared.js";

export const educatorLessonsRouter = new Hono<AuthEnv>();

/** How a season episode is told. Null for ordinary lessons. */
const LESSON_STYLES = ["skit", "immersive_story", "host_narrated"] as const;

/** In-lesson check types — formative questions fired between transcript lines. */
const CHECK_TYPES = ["predict-next", "meaning", "who-said", "cloze", "pick-reply"] as const;

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
      style: lessons.style,
      isActive: lessons.isActive,
      scene: lessons.scene,
      sceneTitle: lessons.sceneTitle,
      sceneOrder: lessons.sceneOrder,
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
  const style = (formData.get("style") as string)?.trim() || null;
  const durationStr = formData.get("duration") as string | null;
  const duration = durationStr ? parseInt(durationStr, 10) : null;
  const orderStr = formData.get("order") as string | null;
  const order = orderStr ? parseInt(orderStr, 10) : 999;
  const segmentsJson = (formData.get("segments") as string) ?? "[]";

  if (!languageId || !title || !description) {
    return c.json({ error: "languageId, title, and description are required" }, 400);
  }
  if (style && !LESSON_STYLES.includes(style as (typeof LESSON_STYLES)[number])) {
    return c.json({ error: `style must be one of: ${LESSON_STYLES.join(", ")}` }, 400);
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
    style,
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

  const body = await parseJson<{
    title?: string; description?: string; type?: string;
    artist?: string | null; genre?: string | null; order?: number; isActive?: boolean;
    status?: string; style?: string | null;
    narrativeIntro?: string | null; narrativeOutro?: string | null;
    canDo?: string | null; canDoFr?: string | null;
    scene?: string | null; sceneTitle?: string | null; sceneOrder?: number | null;
  }>(c);

  if (body.status && !PATCHABLE_LESSON_STATUSES.includes(body.status as (typeof PATCHABLE_LESSON_STATUSES)[number])) {
    // "published" only happens through the guarded POST /content/lessons/:id/publish endpoint.
    return c.json({ error: `status must be one of: ${PATCHABLE_LESSON_STATUSES.join(", ")}` }, 400);
  }

  if (body.style != null && body.style !== "" && !LESSON_STYLES.includes(body.style as (typeof LESSON_STYLES)[number])) {
    return c.json({ error: `style must be one of: ${LESSON_STYLES.join(", ")}` }, 400);
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
  // Only meaningful for a season episode; drives the style chip on the Series
  // screen. Empty clears it.
  if (body.style !== undefined) updates.style = body.style?.trim() || null;
  // Story fold-in narrative framing + can-do statement. Empty clears.
  if (body.narrativeIntro !== undefined) updates.narrativeIntro = body.narrativeIntro?.trim() || null;
  if (body.narrativeOutro !== undefined) updates.narrativeOutro = body.narrativeOutro?.trim() || null;
  if (body.canDo !== undefined) updates.canDo = body.canDo?.trim() || null;
  if (body.canDoFr !== undefined) updates.canDoFr = body.canDoFr?.trim() || null;
  // Scene grouping within the course (journey rendering). Clearing scene
  // clears its title/order with it — a title without a scene is meaningless.
  if (body.scene !== undefined) {
    updates.scene = body.scene?.trim() || null;
    if (!body.scene?.trim()) { updates.sceneTitle = null; updates.sceneOrder = null; }
  }
  if (body.sceneTitle !== undefined) updates.sceneTitle = body.sceneTitle?.trim() || null;
  if (body.sceneOrder !== undefined) updates.sceneOrder = body.sceneOrder;

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
      style: lessons.style,
      isActive: lessons.isActive,
      status: lessons.status,
      createdBy: lessons.createdBy,
      narrativeIntro: lessons.narrativeIntro,
      narrativeOutro: lessons.narrativeOutro,
      canDo: lessons.canDo,
      canDoFr: lessons.canDoFr,
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

  const attachedCulturalContent = await db
    .select({
      culturalContentId: lessonCulturalContent.culturalContentId,
      afterSegmentIndex: lessonCulturalContent.afterSegmentIndex,
    })
    .from(lessonCulturalContent)
    .where(eq(lessonCulturalContent.lessonId, id))
    .orderBy(lessonCulturalContent.order);

  const checks = await db
    .select()
    .from(lessonChecks)
    .where(eq(lessonChecks.lessonId, id))
    .orderBy(lessonChecks.order);

  return c.json({
    ...lesson,
    segments: segs,
    // Flat id list kept for older Studio builds; `culturalAttachments` carries
    // the anchor and is what the PUT round-trips.
    culturalContentIds: attachedCulturalContent.map((r) => r.culturalContentId),
    culturalAttachments: attachedCulturalContent,
    checks,
  });
});

// PUT /educator/lessons/:id/cultural-content — replace attached cultural content
educatorLessonsRouter.put("/lessons/:id/cultural-content", async (c) => {
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

  // Two accepted shapes. The bare `string[]` is the original contract and is
  // still sent by older Studio builds; the object form adds `afterSegmentIndex`,
  // which anchors the note inline after a given transcript segment instead of
  // letting it fall to the end.
  const { culturalContentIds } = await parseJson<{
    culturalContentIds: (string | { culturalContentId: string; afterSegmentIndex?: number | null })[];
  }>(c);

  const attachments = culturalContentIds.map((entry) =>
    typeof entry === "string"
      ? { culturalContentId: entry, afterSegmentIndex: null }
      : { culturalContentId: entry.culturalContentId, afterSegmentIndex: entry.afterSegmentIndex ?? null }
  );

  if (attachments.some((a) => !a.culturalContentId)) {
    return c.json({ error: "Each attachment requires a culturalContentId" }, 400);
  }

  if (attachments.length > 0) {
    const ids = attachments.map((a) => a.culturalContentId);
    const rows = await db
      .select({ id: culturalContent.id, languageId: culturalContent.languageId })
      .from(culturalContent)
      .where(inArray(culturalContent.id, ids));
    const foundIds = new Set(rows.map((r) => r.id));
    const missing = ids.filter((cid) => !foundIds.has(cid));
    if (missing.length > 0) {
      return c.json({ error: `Unknown cultural content id(s): ${missing.join(", ")}` }, 400);
    }
    const wrongLanguage = rows.filter((r) => r.languageId !== lesson.languageId);
    if (wrongLanguage.length > 0) {
      return c.json({ error: "Cultural content must be in the lesson's language" }, 400);
    }

    // An anchor past the end of the transcript would silently never render.
    const [{ count: segmentCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transcriptSegments)
      .where(eq(transcriptSegments.lessonId, id));

    const badAnchor = attachments.find(
      (a) => a.afterSegmentIndex != null && (a.afterSegmentIndex < 0 || a.afterSegmentIndex >= segmentCount)
    );
    if (badAnchor) {
      return c.json(
        { error: `afterSegmentIndex ${badAnchor.afterSegmentIndex} is out of range — this lesson has ${segmentCount} transcript segment(s)` },
        400,
      );
    }
  }

  await db.delete(lessonCulturalContent).where(eq(lessonCulturalContent.lessonId, id));

  if (attachments.length > 0) {
    await db.insert(lessonCulturalContent).values(
      attachments.map((a, index) => ({
        lessonId: id,
        culturalContentId: a.culturalContentId,
        order: index,
        afterSegmentIndex: a.afterSegmentIndex,
      }))
    );
  }

  return c.json({ success: true, count: attachments.length });
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

  const { segments } = await parseJson<{
    segments: { text: string; translation?: string; translationFr?: string; startTime: number; endTime: number; order: number }[];
  }>(c);

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

// PUT /educator/lessons/:id/save — atomic lesson save (metadata + segments + notes)
//
// Replaces the three-call sequence (PATCH + PUT /segments + PUT /cultural-content)
// with one transactional round-trip, so a mid-way failure can never leave a
// lesson half-saved. All validation runs up front (neon-http batches the tx body,
// which is writes only). Cultural-note anchors are checked against the segments
// being saved in THIS request — not a previously-persisted count — so the
// transcript and its anchored notes stay consistent even when both change.
educatorLessonsRouter.put("/lessons/:id/save", async (c) => {
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

  const body = await c.req.json<{
    payload?: {
      title?: string; description?: string; type?: string;
      artist?: string | null; genre?: string | null; order?: number;
      isActive?: boolean; status?: string; style?: string | null;
      narrativeIntro?: string | null; narrativeOutro?: string | null;
      canDo?: string | null; canDoFr?: string | null;
      scene?: string | null; sceneTitle?: string | null; sceneOrder?: number | null;
    };
    segments?: { text: string; translation?: string; translationFr?: string; startTime: number; endTime: number; order: number }[];
    attachments?: (string | { culturalContentId: string; afterSegmentIndex?: number | null })[];
    checks?: { type: string; prompt: string; answer: string; options?: string[]; explanation?: string | null; afterSegmentIndex?: number | null; isActive?: boolean }[];
  }>();

  const payload = body.payload ?? {};
  const hasSegments = Array.isArray(body.segments);
  const segments = body.segments ?? [];
  const hasAttachments = Array.isArray(body.attachments);
  const hasChecks = Array.isArray(body.checks);
  const checks = body.checks ?? [];

  // ── Validate metadata (mirrors PATCH /lessons/:id) ──
  if (payload.status && !PATCHABLE_LESSON_STATUSES.includes(payload.status as (typeof PATCHABLE_LESSON_STATUSES)[number])) {
    return c.json({ error: `status must be one of: ${PATCHABLE_LESSON_STATUSES.join(", ")}` }, 400);
  }
  if (payload.style != null && payload.style !== "" && !LESSON_STYLES.includes(payload.style as (typeof LESSON_STYLES)[number])) {
    return c.json({ error: `style must be one of: ${LESSON_STYLES.join(", ")}` }, 400);
  }

  // ── Validate segments (mirrors PUT /lessons/:id/segments) ──
  if (hasSegments) {
    for (const seg of segments) {
      if (!seg.text?.trim()) return c.json({ error: "Every segment must have text" }, 400);
      if (seg.endTime < seg.startTime) {
        return c.json({ error: `Segment "${seg.text.slice(0, 30)}" has endTime before startTime` }, 400);
      }
    }
  }

  // ── Validate cultural attachments (mirrors PUT /lessons/:id/cultural-content) ──
  let attachments: { culturalContentId: string; afterSegmentIndex: number | null }[] = [];
  if (hasAttachments) {
    attachments = body.attachments!.map((entry) =>
      typeof entry === "string"
        ? { culturalContentId: entry, afterSegmentIndex: null }
        : { culturalContentId: entry.culturalContentId, afterSegmentIndex: entry.afterSegmentIndex ?? null }
    );
    if (attachments.some((a) => !a.culturalContentId)) {
      return c.json({ error: "Each attachment requires a culturalContentId" }, 400);
    }
    if (attachments.length > 0) {
      const ids = attachments.map((a) => a.culturalContentId);
      const rows = await db
        .select({ id: culturalContent.id, languageId: culturalContent.languageId })
        .from(culturalContent)
        .where(inArray(culturalContent.id, ids));
      const foundIds = new Set(rows.map((r) => r.id));
      const missing = ids.filter((cid) => !foundIds.has(cid));
      if (missing.length > 0) {
        return c.json({ error: `Unknown cultural content id(s): ${missing.join(", ")}` }, 400);
      }
      if (rows.some((r) => r.languageId !== lesson.languageId)) {
        return c.json({ error: "Cultural content must be in the lesson's language" }, 400);
      }

      // Anchor range: check against the segments saved in this call when the
      // transcript is included, else against what's already stored.
      let segmentCount: number;
      if (hasSegments) {
        segmentCount = segments.length;
      } else {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(transcriptSegments)
          .where(eq(transcriptSegments.lessonId, id));
        segmentCount = count;
      }
      const badAnchor = attachments.find(
        (a) => a.afterSegmentIndex != null && (a.afterSegmentIndex < 0 || a.afterSegmentIndex >= segmentCount)
      );
      if (badAnchor) {
        return c.json(
          { error: `afterSegmentIndex ${badAnchor.afterSegmentIndex} is out of range — this save has ${segmentCount} transcript segment(s)` },
          400,
        );
      }
    }
  }

  // ── Validate in-lesson checks ──
  if (hasChecks) {
    let checkSegmentCount: number;
    if (hasSegments) {
      checkSegmentCount = segments.length;
    } else {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(transcriptSegments)
        .where(eq(transcriptSegments.lessonId, id));
      checkSegmentCount = count;
    }
    for (const ch of checks) {
      if (!CHECK_TYPES.includes(ch.type as (typeof CHECK_TYPES)[number])) {
        return c.json({ error: `check type must be one of: ${CHECK_TYPES.join(", ")}` }, 400);
      }
      if (!ch.prompt?.trim() || !ch.answer?.trim()) {
        return c.json({ error: "Every check requires a prompt and an answer" }, 400);
      }
      if (ch.options && ch.options.length > 0 && !ch.options.includes(ch.answer)) {
        return c.json({ error: `Check "${ch.prompt.slice(0, 30)}" — options must include the answer` }, 400);
      }
      if (ch.afterSegmentIndex != null && (ch.afterSegmentIndex < 0 || ch.afterSegmentIndex >= checkSegmentCount)) {
        return c.json(
          { error: `check afterSegmentIndex ${ch.afterSegmentIndex} is out of range — this save has ${checkSegmentCount} transcript segment(s)` },
          400,
        );
      }
    }
  }

  // ── Build metadata updates (mirrors PATCH) ──
  const updates: Record<string, unknown> = { updatedBy: userId };
  if (payload.title !== undefined) updates.title = payload.title.trim();
  if (payload.description !== undefined) updates.description = payload.description.trim();
  if (payload.type !== undefined) updates.type = payload.type;
  if (payload.artist !== undefined) updates.artist = payload.artist?.trim() || null;
  if (payload.genre !== undefined) updates.genre = payload.genre?.trim() || null;
  if (payload.order !== undefined) updates.order = payload.order;
  if (payload.isActive !== undefined) updates.isActive = payload.isActive;
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.style !== undefined) updates.style = payload.style?.trim() || null;
  if (payload.narrativeIntro !== undefined) updates.narrativeIntro = payload.narrativeIntro?.trim() || null;
  if (payload.narrativeOutro !== undefined) updates.narrativeOutro = payload.narrativeOutro?.trim() || null;
  if (payload.canDo !== undefined) updates.canDo = payload.canDo?.trim() || null;
  if (payload.canDoFr !== undefined) updates.canDoFr = payload.canDoFr?.trim() || null;
  if (payload.scene !== undefined) {
    updates.scene = payload.scene?.trim() || null;
    if (!payload.scene?.trim()) { updates.sceneTitle = null; updates.sceneOrder = null; }
  }
  if (payload.sceneTitle !== undefined) updates.sceneTitle = payload.sceneTitle?.trim() || null;
  if (payload.sceneOrder !== undefined) updates.sceneOrder = payload.sceneOrder;

  // ── One transaction: all writes land, or none do ──
  await db.transaction(async (tx) => {
    await tx.update(lessons).set(updates).where(eq(lessons.id, id));

    if (hasSegments) {
      await tx.delete(transcriptSegments).where(eq(transcriptSegments.lessonId, id));
      if (segments.length > 0) {
        await tx.insert(transcriptSegments).values(
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
    }

    if (hasAttachments) {
      await tx.delete(lessonCulturalContent).where(eq(lessonCulturalContent.lessonId, id));
      if (attachments.length > 0) {
        await tx.insert(lessonCulturalContent).values(
          attachments.map((a, index) => ({
            lessonId: id,
            culturalContentId: a.culturalContentId,
            order: index,
            afterSegmentIndex: a.afterSegmentIndex,
          }))
        );
      }
    }

    if (hasChecks) {
      await tx.delete(lessonChecks).where(eq(lessonChecks.lessonId, id));
      if (checks.length > 0) {
        await tx.insert(lessonChecks).values(
          checks.map((ch, index) => ({
            id: `check-${randomUUID()}`,
            lessonId: id,
            type: ch.type,
            prompt: ch.prompt.trim(),
            answer: ch.answer.trim(),
            options: ch.options ?? [],
            explanation: ch.explanation?.trim() || null,
            afterSegmentIndex: ch.afterSegmentIndex ?? null,
            order: index,
            isActive: ch.isActive ?? true,
          }))
        );
      }
    }
  });

  return c.json({
    success: true,
    segments: hasSegments ? segments.length : undefined,
    attachments: hasAttachments ? attachments.length : undefined,
    checks: hasChecks ? checks.length : undefined,
  });
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

  // A lesson that a season sequences cannot just vanish — deleting it would
  // leave a hole in the chapter order and a dangling story_chapters.lesson_id.
  // Make the educator unpick it from the season first, deliberately.
  const chapters = await db
    .select({ order: storyChapters.order, arcTitle: storyArcs.title })
    .from(storyChapters)
    .leftJoin(storyArcs, eq(storyChapters.storyArcId, storyArcs.id))
    .where(eq(storyChapters.lessonId, id));

  if (chapters.length > 0) {
    const where = chapters
      .map((ch) => `chapter ${ch.order} of "${ch.arcTitle ?? "an untitled season"}"`)
      .join(", ");
    return c.json(
      { error: `This lesson is ${where}. Remove it from the season before deleting it.` },
      409,
    );
  }

  await db.delete(lessonCulturalContent).where(eq(lessonCulturalContent.lessonId, id));
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

  const { languageId, courseType } = await parseJson<{ languageId: string; courseType?: string }>(c);
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
