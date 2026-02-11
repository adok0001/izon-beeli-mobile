import { create } from "zustand";
import { LESSONS } from "@/lib/mock-data";

interface ProgressState {
  completedLessonIds: Set<string>;
  points: number;
  streak: number;

  markComplete: (lessonId: string) => void;
  isCompleted: (lessonId: string) => boolean;
  completedCount: () => number;
}

// Seed with lessons already marked completed in mock data
const initialCompleted = new Set(
  LESSONS.filter((l) => l.completed).map((l) => l.id)
);

export const useProgressStore = create<ProgressState>((set, get) => ({
  completedLessonIds: initialCompleted,
  points: initialCompleted.size * 50,
  streak: 3,

  markComplete: (lessonId) =>
    set((state) => {
      if (state.completedLessonIds.has(lessonId)) return state;
      const next = new Set(state.completedLessonIds);
      next.add(lessonId);
      return {
        completedLessonIds: next,
        points: state.points + 50,
      };
    }),

  isCompleted: (lessonId) => get().completedLessonIds.has(lessonId),

  completedCount: () => get().completedLessonIds.size,
}));
