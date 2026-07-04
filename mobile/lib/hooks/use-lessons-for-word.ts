import { useMemo } from "react";
import { useCourses } from "@/lib/hooks/use-courses";
import { getSnapshotLessons } from "@/store/content-store";
import type { Lesson, TranscriptSegment } from "@/types";

export interface LessonWordMatch {
  lesson: Lesson;
  /** The first transcript line where the word appears — shown as the usage snippet. */
  segment: TranscriptSegment;
}

/** Lowercased word tokens, splitting on anything that isn't a letter or combining mark. */
function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{M}]+/u).filter(Boolean);
}

/** First transcript line that uses `word`, or null. Phrases match as a substring. */
function findUsage(lesson: Lesson, word: string): TranscriptSegment | null {
  const target = word.toLowerCase().trim();
  if (!target) return null;
  const isPhrase = /\s/.test(target);
  return (
    lesson.transcript?.find((seg) =>
      isPhrase ? seg.text.toLowerCase().includes(target) : tokenize(seg.text).includes(target)
    ) ?? null
  );
}

/** Lessons in the word's language whose transcript uses the word, with the matching line. */
export function useLessonsForWord(word: string | undefined, languageId: string): LessonWordMatch[] {
  const { data: courses = [] } = useCourses(languageId);
  return useMemo(() => {
    if (!word) return [];
    const courseIds = new Set(courses.map((c) => c.id));
    const matches: LessonWordMatch[] = [];
    for (const lesson of getSnapshotLessons(languageId)) {
      if (!courseIds.has(lesson.courseId)) continue;
      const segment = findUsage(lesson, word);
      if (segment) matches.push({ lesson, segment });
    }
    return matches;
  }, [word, courses, languageId]);
}
