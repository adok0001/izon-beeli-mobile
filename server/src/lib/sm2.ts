/**
 * SM-2 spaced repetition — shared by the word bank and the phrase bank so both
 * review queues age identically. Extracted verbatim from wordbank.ts.
 */

export const RATING_QUALITY: Record<string, 0 | 2 | 4 | 5> = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};

export type Rating = "again" | "hard" | "good" | "easy";

export function applySM2(
  quality: 0 | 2 | 4 | 5,
  repetitions: number,
  easeFactor: number,
  interval: number
): { repetitions: number; easeFactor: number; interval: number } {
  let newReps: number;
  let newInterval: number;
  if (quality >= 3) {
    newReps = repetitions + 1;
    newInterval =
      repetitions === 0 ? 1 : repetitions === 1 ? 6 : Math.round(interval * easeFactor);
  } else {
    newReps = 0;
    newInterval = 1;
  }
  const newEF = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );
  return { repetitions: newReps, easeFactor: newEF, interval: newInterval };
}

/** Next due date for a rating: "again" re-surfaces in-session (10 min). */
export function nextReviewDate(rating: Rating, intervalDays: number, now = new Date()): Date {
  if (rating === "again") return new Date(now.getTime() + 10 * 60 * 1000);
  return new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
}
