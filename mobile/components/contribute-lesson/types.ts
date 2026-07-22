import type { useLessonContributionStore } from "@/store/lesson-contribution-store";

export type Step = "language" | "course" | "details" | "audio" | "transcript";

export type ContributionStore = ReturnType<typeof useLessonContributionStore.getState>;

export interface Course {
  id: string;
  title: string;
  level: string;
}

export interface Segment {
  text: string;
  translation: string;
  startTime: string;
  endTime: string;
}

export const STEPS: Step[] = ["language", "course", "details", "audio", "transcript"];
