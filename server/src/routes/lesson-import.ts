import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { courses, lessons, transcriptSegments } from "../db/schema.js";
import { slugify } from "../lib/slug.js";

/**
 * Bulk lesson importer. One uploaded file is one full lesson: a metadata block
 * (title/description/style/…) plus its transcript lines. The educator can pick
 * several files at once, so the endpoint receives an array of `{ meta, segments }`
 * lessons — this module validates and persists them. The target course is chosen
 * in the UI (not in the file), so there's no opaque course id in the sheet.
 *
 * Re-import is idempotent per (course, title): the lesson id is derived from
 * both, and the transcript is replaced wholesale — the same contract the
 * single-lesson editor uses.
 */

type Meta = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const opt = (v: unknown): string | null => {
  const t = str(v);
  return t.length > 0 ? t : null;
};
const intOr = (v: unknown, fallback: number | null): number | null => {
  const n = parseInt(str(v), 10);
  return Number.isNaN(n) ? fallback : n;
};

const LESSON_STYLES = ["skit", "immersive_story", "host_narrated"] as const;

export interface LessonSegmentInput {
  text: string;
  translation: string | null;
  roman: string | null;
  speaker: string | null;
  order: number;
}

export interface LessonGroupInput {
  id: string;
  title: string;
  description: string;
  type: string;
  style: string | null;
  artist: string | null;
  genre: string | null;
  duration: number | null;
  order: number;
  narrativeIntro: string | null;
  narrativeOutro: string | null;
  canDo: string | null;
  segments: LessonSegmentInput[];
}

/** A single uploaded lesson file, parsed client-side into metadata + lines. */
export interface LessonFileInput {
  meta?: unknown;
  segments?: unknown;
}

/** Stable, length-bounded lesson id derived from its course + title. */
export function lessonImportId(courseId: string, title: string): string {
  const raw = `${courseId}-${slugify(title)}`;
  return raw.length <= 64 ? raw : raw.slice(0, 64);
}

/**
 * Validate + build one lesson from a parsed file (`{ meta, segments }`). Returns
 * the built lesson or `null` plus the reasons it was rejected. `index` labels the
 * file in error messages when the lesson has no usable title yet.
 */
export function buildLessonGroup(
  file: LessonFileInput,
  courseId: string,
  index: number,
): { group: LessonGroupInput | null; errors: { id: string; reason: string }[] } {
  const errors: { id: string; reason: string }[] = [];
  const meta = (file.meta && typeof file.meta === "object" ? file.meta : {}) as Meta;
  const title = str(meta.title);
  const description = str(meta.description);
  const ref = title || `File ${index + 1}`;

  if (!title) errors.push({ id: `file-${index + 1}`, reason: `File ${index + 1}: missing title` });
  if (!description) errors.push({ id: ref, reason: `Lesson "${ref}": missing description` });

  const style = opt(meta.style);
  if (style && !LESSON_STYLES.includes(style as (typeof LESSON_STYLES)[number])) {
    errors.push({ id: ref, reason: `Lesson "${ref}": style must be one of ${LESSON_STYLES.join(", ")}` });
  }

  const rawSegments = Array.isArray(file.segments) ? file.segments : [];
  const segments: LessonSegmentInput[] = [];
  for (const raw of rawSegments) {
    const row = (raw && typeof raw === "object" ? raw : {}) as Meta;
    const text = str(row.text);
    if (!text) continue;
    segments.push({
      text,
      translation: opt(row.translation),
      roman: opt(row.roman),
      speaker: opt(row.speaker),
      order: segments.length,
    });
  }
  if (segments.length === 0) {
    errors.push({ id: ref, reason: `Lesson "${ref}": no transcript lines (add rows after the --- separator)` });
  }

  if (errors.length > 0) return { group: null, errors };

  return {
    group: {
      id: lessonImportId(courseId, title),
      title,
      description,
      type: str(meta.type) || "lesson",
      style: style ?? null,
      artist: opt(meta.artist),
      genre: opt(meta.genre),
      duration: intOr(meta.duration, null),
      order: intOr(meta.order, 999) ?? 999,
      narrativeIntro: opt(meta.narrativeIntro),
      narrativeOutro: opt(meta.narrativeOutro),
      canDo: opt(meta.canDo),
      segments,
    },
    errors: [],
  };
}

type StatusValues = {
  status: "published" | "in_review";
  createdBy: string;
  publishedBy: string | null;
  publishedAt: Date | null;
};

/**
 * Upsert each lesson and replace its transcript, then recompute the course's
 * lessonsCount from the live rows (so re-imports never drift the counter). On
 * conflict only content columns move — the workflow state of an existing lesson
 * (status/authorship) is left untouched, matching the leaf importers.
 */
export async function insertLessonGroups(
  groups: LessonGroupInput[],
  ctx: { courseId: string; status: StatusValues },
): Promise<number> {
  for (const group of groups) {
    await db
      .insert(lessons)
      .values({
        id: group.id,
        courseId: ctx.courseId,
        type: group.type,
        title: group.title,
        description: group.description,
        style: group.style,
        artist: group.artist,
        genre: group.genre,
        duration: group.duration,
        order: group.order,
        narrativeIntro: group.narrativeIntro,
        narrativeOutro: group.narrativeOutro,
        canDo: group.canDo,
        updatedBy: ctx.status.createdBy,
        ...ctx.status,
      })
      .onConflictDoUpdate({
        target: lessons.id,
        set: {
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          type: sql`excluded.type`,
          style: sql`excluded.style`,
          artist: sql`excluded.artist`,
          genre: sql`excluded.genre`,
          duration: sql`excluded.duration`,
          narrativeIntro: sql`excluded.narrative_intro`,
          narrativeOutro: sql`excluded.narrative_outro`,
          canDo: sql`excluded.can_do`,
          updatedBy: sql`excluded.updated_by`,
        },
      });

    await db.delete(transcriptSegments).where(eq(transcriptSegments.lessonId, group.id));
    if (group.segments.length > 0) {
      await db.insert(transcriptSegments).values(
        group.segments.map((s) => ({
          lessonId: group.id,
          text: s.text,
          translation: s.translation,
          roman: s.roman,
          speaker: s.speaker,
          startTime: 0,
          endTime: 0,
          order: s.order,
        })),
      );
    }
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessons)
    .where(eq(lessons.courseId, ctx.courseId));
  await db.update(courses).set({ lessonsCount: row?.count ?? 0 }).where(eq(courses.id, ctx.courseId));

  return groups.length;
}
