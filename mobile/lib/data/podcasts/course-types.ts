/**
 * Beeli Course (podcast-world companion) — typing + validator
 * -----------------------------------------------------------
 * Unlike podcasts/films, a "course" already IS an app-native shape: it is a
 * course-registry entry + a set of `LessonData` + (optionally) a `StoryArc`.
 * So there is almost nothing to down-convert — this file just provides:
 *   • `SeriesCourseEntry` — mirrors the (unexported) RawCourseEntry in
 *     mobile/lib/data/courses.ts, so authored entries are type-checked and can
 *     be spread straight into RAW_COURSES by an integrator.
 *   • `SeriesCourse` — bundles the entry + its lessons + its story arc.
 *   • `validateCourse()` — enforces the same discipline used elsewhere.
 *
 * Lessons here are authored directly as the real `LessonData` (target-language
 * `transcript`, `skills`, language-prefixed ids), so no adapter is needed for
 * them. The world/cast tie-in lives in lesson content + scene labels, matching
 * the "recurring characters via story arcs + speaker context" model (the app
 * has no character entity — see README.md "Schema gaps").
 */

import type { LessonData, LocalizedText } from "../lessons/types";
import type { CourseType, StoryArc } from "@/types";

/** Mirrors RawCourseEntry in mobile/lib/data/courses.ts (lessonsCount derived). */
export interface SeriesCourseEntry {
  id: string;
  languageId: string;
  title: string | LocalizedText;
  description: string | LocalizedText;
  level: "beginner" | "intermediate" | "advanced";
  order: number;
  courseType: CourseType;
}

export interface SeriesCourse {
  entry: SeriesCourseEntry;
  lessons: LessonData[];
  /** Optional narrative grouping (chapters → lessonIds), like stories/izon-basics.ts. */
  story?: StoryArc;
}

export interface CourseValidationIssue {
  courseId: string;
  lessonId?: string;
  severity: "error" | "warn";
  message: string;
}

/** Rough heuristic: does a string look like plain interface-language prose? */
function looksLikeEnglish(s: string): boolean {
  // spoken Izon lines never contain these function words; a placeholder does.
  return /\b(the|and|you|is|are|good morning|welcome|thank)\b/i.test(s) &&
    !/\[\[.*?\]\]/.test(s);
}

export function validateCourse(course: SeriesCourse): CourseValidationIssue[] {
  const issues: CourseValidationIssue[] = [];
  const { entry, lessons, story } = course;
  const prefix = `${entry.languageId}-`;
  const add = (severity: "error" | "warn", message: string, lessonId?: string) =>
    issues.push({ courseId: entry.id, lessonId, severity, message });

  if (!entry.id.startsWith("course-") || !entry.id.includes(entry.languageId))
    add("error", `course id "${entry.id}" should be language-prefixed (e.g. course-${entry.languageId}-…)`);

  const orders = new Set<number>();
  for (const l of lessons) {
    if (!l.id.startsWith(prefix))
      add("error", `lesson id "${l.id}" must start with "${prefix}"`, l.id);
    if (l.courseId !== entry.id)
      add("error", `lesson courseId "${l.courseId}" != "${entry.id}"`, l.id);
    if (orders.has(l.order)) add("warn", `duplicate lesson order ${l.order}`, l.id);
    orders.add(l.order);
    if (!l.skills || l.skills.length === 0) add("warn", `no skills tagged`, l.id);
    if (l.isActive !== false) add("warn", `isActive should be false until verified`, l.id);
    let placeholder = false;
    for (const seg of l.transcript) {
      if (!seg.text.trim()) add("error", `empty transcript text (${seg.id})`, l.id);
      if (/\[\[.*?\]\]/.test(seg.text)) placeholder = true;
      else if (looksLikeEnglish(seg.text))
        add("warn", `transcript line may be interface-language, not target: "${seg.text}"`, l.id);
      const t = seg.translation;
      const hasEn = typeof t === "string" ? !!t : !!(t && "en" in t && t.en);
      if (!hasEn) add("warn", `transcript segment missing en gloss (${seg.id})`, l.id);
    }
    if (placeholder && l.isActive) add("error", `placeholder text but isActive:true`, l.id);
  }

  if (story) {
    const ids = new Set(lessons.map((l) => l.id));
    for (const ch of story.chapters)
      if (!ids.has(ch.lessonId))
        add("error", `story chapter "${ch.id}" points at unknown lesson "${ch.lessonId}"`);
  }

  return issues;
}
