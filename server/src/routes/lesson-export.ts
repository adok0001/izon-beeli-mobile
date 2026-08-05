import { Hono } from "hono";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { courses, lessonChecks, lessons, transcriptSegments } from "../db/schema.js";
import { AuthEnv } from "../middleware/auth.js";
import { roleCap } from "./import-request.js";

/**
 * Lesson **export** — the other half of `POST /import/lessons`.
 *
 * Lessons could be uploaded and never downloaded, so correcting a transcript in
 * bulk meant retyping it. This hands back the same file format the importer
 * reads, for one lesson, a chosen few, or a whole Movement, and the client
 * joins them into a single uploadable file (see `buildLessonsFile`).
 *
 * Scope is `courseId` plus an optional `ids` list — an educator who has ticked
 * specific lessons is not also filtering, so `ids` narrows within the course
 * rather than replacing it. That ordering matters: it keeps "everything in this
 * Movement" and "these three lessons" the same request with one parameter
 * different, instead of two code paths.
 *
 * Values are returned as plain cells rather than a finished CSV, for the same
 * reason as the other exports: `apiFetch` ends in an unconditional `res.json()`
 * and cannot read a non-JSON body, and it keeps the file writer in one place
 * on the client.
 */

export const lessonExportRouter = new Hono<AuthEnv>();

/** Metadata cells, blank-stripped by the serializer. Mirrors `LESSON_META_COLUMNS`. */
function metaOf(row: {
  title: string;
  description: string;
  type: string;
  gameKey: string | null;
  style: string | null;
  artist: string | null;
  genre: string | null;
  duration: number | null;
  order: number;
  canDo: string | null;
  narrativeIntro: string | null;
  narrativeOutro: string | null;
}): Record<string, string> {
  return {
    title: row.title,
    description: row.description,
    // Always written, even for an ordinary lesson: the round trip should not
    // depend on the importer's default staying "lesson".
    type: row.type,
    gameKey: row.gameKey ?? "",
    style: row.style ?? "",
    artist: row.artist ?? "",
    genre: row.genre ?? "",
    duration: row.duration == null ? "" : String(row.duration),
    order: String(row.order),
    canDo: row.canDo ?? "",
    narrativeIntro: row.narrativeIntro ?? "",
    narrativeOutro: row.narrativeOutro ?? "",
  };
}

// GET /api/import/lesson-export?languageId=&courseId=&ids=
lessonExportRouter.get("/lesson-export", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId is required" }, 400);
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const courseId = c.req.query("courseId");
  if (!courseId) return c.json({ error: "courseId is required (pick a course to export from)" }, 400);

  // Check the course against the caller's language before reading anything from
  // it — otherwise a reviewer scoped to one language could name any course id
  // and read its lessons.
  const [course] = await db
    .select({ id: courses.id, languageId: courses.languageId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!course) return c.json({ error: `Course "${courseId}" not found` }, 404);
  if (course.languageId !== languageId) {
    return c.json({ error: "That course belongs to a different language" }, 400);
  }

  const idsParam = c.req.query("ids");
  const ids = idsParam ? idsParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  // Capped at what the same role may upload back — an export that cannot be
  // re-imported is worse than one that says it was cut short.
  const cap = roleCap(isAdmin);

  const rows = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      description: lessons.description,
      type: lessons.type,
      gameKey: lessons.gameKey,
      style: lessons.style,
      artist: lessons.artist,
      genre: lessons.genre,
      duration: lessons.duration,
      order: lessons.order,
      canDo: lessons.canDo,
      narrativeIntro: lessons.narrativeIntro,
      narrativeOutro: lessons.narrativeOutro,
    })
    .from(lessons)
    .where(and(
      eq(lessons.courseId, courseId),
      ids?.length ? inArray(lessons.id, ids) : undefined,
    ))
    .orderBy(asc(lessons.order), asc(lessons.id));

  const totalCount = rows.length;
  const picked = rows.slice(0, cap);
  if (picked.length === 0) {
    return c.json({ lessons: [], lessonCount: 0, totalCount, truncated: false, cap });
  }

  // Two reads for the whole batch rather than two per lesson: a Movement is ~10
  // lessons but a transcript is hundreds of lines, and neon-http has no
  // connection to keep warm between round trips.
  const lessonIds = picked.map((l) => l.id);
  const [segmentRows, checkRows] = await Promise.all([
    db
      .select({
        lessonId: transcriptSegments.lessonId,
        text: transcriptSegments.text,
        translation: transcriptSegments.translation,
        speaker: transcriptSegments.speaker,
        roman: transcriptSegments.roman,
      })
      .from(transcriptSegments)
      .where(inArray(transcriptSegments.lessonId, lessonIds))
      .orderBy(asc(transcriptSegments.lessonId), asc(transcriptSegments.order)),
    db
      .select({
        lessonId: lessonChecks.lessonId,
        type: lessonChecks.type,
        prompt: lessonChecks.prompt,
        answer: lessonChecks.answer,
        options: lessonChecks.options,
        explanation: lessonChecks.explanation,
        afterSegmentIndex: lessonChecks.afterSegmentIndex,
      })
      .from(lessonChecks)
      .where(inArray(lessonChecks.lessonId, lessonIds))
      .orderBy(asc(lessonChecks.lessonId), asc(lessonChecks.order)),
  ]);

  const segmentsBy = new Map<string, Record<string, string>[]>();
  for (const s of segmentRows) {
    const list = segmentsBy.get(s.lessonId) ?? [];
    list.push({
      text: s.text,
      translation: s.translation ?? "",
      speaker: s.speaker ?? "",
      roman: s.roman ?? "",
    });
    segmentsBy.set(s.lessonId, list);
  }

  const checksBy = new Map<string, Record<string, string>[]>();
  for (const ch of checkRows) {
    const list = checksBy.get(ch.lessonId) ?? [];
    list.push({
      type: ch.type,
      prompt: ch.prompt,
      answer: ch.answer,
      // The pipe form the checks grid and the unified sheet both use.
      options: (ch.options ?? []).join("|"),
      explanation: ch.explanation ?? "",
      // Blank is a real value here — it means "end of lesson", not "unset".
      afterSegmentIndex: ch.afterSegmentIndex == null ? "" : String(ch.afterSegmentIndex),
    });
    checksBy.set(ch.lessonId, list);
  }

  return c.json({
    lessons: picked.map((row) => ({
      id: row.id,
      meta: metaOf(row),
      segments: segmentsBy.get(row.id) ?? [],
      checks: checksBy.get(row.id) ?? [],
    })),
    lessonCount: picked.length,
    totalCount,
    truncated: totalCount > picked.length,
    cap,
  });
});
