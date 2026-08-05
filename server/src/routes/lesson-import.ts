import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { courses, lessonChecks, lessons, transcriptSegments } from "../db/schema.js";
import { randomUUID } from "node:crypto";
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
const strArray = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : undefined;
/**
 * A 0-based index that may arrive as a JSON number or a spreadsheet string.
 * `null` for absent/blank (meaning end of lesson); `NaN` for unparseable, which
 * the caller reports rather than silently treating as end-of-lesson — `str()`
 * yields "" for a number, so routing this through it read every numeric 0 as blank.
 */
const indexOf = (v: unknown): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isInteger(v) ? v : NaN;
  const t = str(v);
  return t === "" ? null : parseInt(t, 10);
};

const LESSON_STYLES = ["skit", "immersive_story", "host_narrated"] as const;

/** In-lesson check kinds. Shared with the educator editor so the two agree. */
export const CHECK_TYPES = ["predict-next", "meaning", "who-said", "cloze", "pick-reply"] as const;

export interface LessonSegmentInput {
  text: string;
  translation: string | null;
  roman: string | null;
  speaker: string | null;
  order: number;
}

export interface LessonCheckInput {
  type: string;
  prompt: string;
  answer: string;
  options: string[];
  explanation: string | null;
  /** 0-based segment the check fires after; null = end of lesson. */
  afterSegmentIndex: number | null;
  order: number;
}

export interface LessonGroupInput {
  id: string;
  title: string;
  description: string;
  type: string;
  /** `type: "game"` gates only — which playground mini-game the gate runs. */
  gameKey: string | null;
  style: string | null;
  artist: string | null;
  genre: string | null;
  duration: number | null;
  order: number;
  narrativeIntro: string | null;
  narrativeOutro: string | null;
  canDo: string | null;
  segments: LessonSegmentInput[];
  /**
   * `null` when the file has no `checks` key at all, which is different from an
   * empty list: absent means "leave whatever is there", `[]` means "remove them".
   * Same distinction the educator editor draws with `hasChecks`.
   */
  checks: LessonCheckInput[] | null;
}

/** A single uploaded lesson file, parsed client-side into metadata + lines. */
export interface LessonFileInput {
  meta?: unknown;
  segments?: unknown;
  checks?: unknown;
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

  // Checks are validated against THIS file's transcript, since the import
  // replaces it wholesale — an index that was valid against the old lesson means
  // nothing once the segments are gone.
  let checks: LessonCheckInput[] | null = null;
  if (file.checks !== undefined) {
    checks = [];
    const rawChecks = Array.isArray(file.checks) ? file.checks : [];
    rawChecks.forEach((raw, i) => {
      const row = (raw && typeof raw === "object" ? raw : {}) as Meta;
      const type = str(row.type);
      const prompt = str(row.prompt);
      const answer = str(row.answer);
      const label = `Lesson "${ref}" check ${i + 1}`;

      if (!CHECK_TYPES.includes(type as (typeof CHECK_TYPES)[number])) {
        errors.push({ id: ref, reason: `${label}: type must be one of ${CHECK_TYPES.join(", ")}` });
        return;
      }
      if (!prompt || !answer) {
        errors.push({ id: ref, reason: `${label}: needs both a prompt and an answer` });
        return;
      }
      // JSON files carry an array; a CSV cell carries "a|b", the same pipe form
      // the unified sheet uses for quiz options.
      const options = (strArray(row.options) ?? str(row.options).split("|"))
        .map((o) => o.trim())
        .filter(Boolean);
      if (options.length > 0 && !options.includes(answer)) {
        errors.push({ id: ref, reason: `${label}: options must include the answer` });
        return;
      }
      const after = indexOf(row.afterSegmentIndex);
      if (after != null && (Number.isNaN(after) || after < 0 || after >= segments.length)) {
        errors.push({
          id: ref,
          reason: `${label}: afterSegmentIndex ${String(row.afterSegmentIndex)} is out of range — this file has ${segments.length} transcript line(s)`,
        });
        return;
      }
      checks!.push({
        type, prompt, answer, options,
        explanation: opt(row.explanation),
        afterSegmentIndex: after,
        order: checks!.length,
      });
    });
  }

  if (errors.length > 0) return { group: null, errors };

  return {
    group: {
      id: lessonImportId(courseId, title),
      title,
      description,
      type: str(meta.type) || "lesson",
      gameKey: opt(meta.gameKey),
      style: style ?? null,
      artist: opt(meta.artist),
      genre: opt(meta.genre),
      duration: intOr(meta.duration, null),
      order: intOr(meta.order, 999) ?? 999,
      narrativeIntro: opt(meta.narrativeIntro),
      narrativeOutro: opt(meta.narrativeOutro),
      canDo: opt(meta.canDo),
      segments,
      checks,
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
): Promise<{ inserted: number; repositioned: number }> {
  /** Existing checks moved to the end because the new transcript is shorter. */
  let repositioned = 0;

  for (const group of groups) {
    await db
      .insert(lessons)
      .values({
        id: group.id,
        courseId: ctx.courseId,
        type: group.type,
        gameKey: group.gameKey,
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
          // A sheet with no gameKey column must not unlink a gate from its game,
          // so keep the stored value when the import doesn't name one. Copying a
          // Movement into another course is the case that needed this: on a fresh
          // insert there is nothing to fall back to, and the gate arrived dead.
          gameKey: sql`coalesce(excluded.game_key, lessons.game_key)`,
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

    if (group.checks !== null) {
      // Supplied: replace wholesale, like the transcript. Ids are regenerated
      // because a check has no stable natural key — it is defined by its position
      // in a transcript that this import just replaced.
      await db.delete(lessonChecks).where(eq(lessonChecks.lessonId, group.id));
      if (group.checks.length > 0) {
        await db.insert(lessonChecks).values(
          group.checks.map((ch) => ({
            id: `check-${randomUUID()}`,
            lessonId: group.id,
            type: ch.type,
            prompt: ch.prompt,
            answer: ch.answer,
            options: ch.options,
            explanation: ch.explanation,
            afterSegmentIndex: ch.afterSegmentIndex,
            order: ch.order,
          })),
        );
      }
    } else {
      /**
       * Not supplied, so existing checks stay — but the transcript they were
       * positioned against has just been replaced. Any `afterSegmentIndex` now
       * past the end would point into a transcript that no longer exists, and a
       * check that never fires is invisible breakage. Move those to the end of
       * the lesson, which is what `null` means, and count them so the import
       * result can say it happened.
       */
      const orphaned = await db
        .update(lessonChecks)
        .set({ afterSegmentIndex: null })
        .where(
          and(
            eq(lessonChecks.lessonId, group.id),
            gte(lessonChecks.afterSegmentIndex, group.segments.length),
          ),
        )
        .returning({ id: lessonChecks.id });
      repositioned += orphaned.length;
    }
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessons)
    .where(eq(lessons.courseId, ctx.courseId));
  await db.update(courses).set({ lessonsCount: row?.count ?? 0 }).where(eq(courses.id, ctx.courseId));

  return { inserted: groups.length, repositioned };
}
