import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TourStep {
  id: string;
  /** data-tour attribute value to spotlight, or null for a centered modal step */
  target: string | null;
  title: string;
  description: string;
  /** Which side of the target to place the tooltip */
  placement?: "right" | "bottom" | "left" | "top";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to Izon Beeli 🌍",
    description:
      "Your platform for learning African languages through audio lessons, quizzes, and community. Let's take a quick look around.",
    placement: undefined,
  },
  {
    id: "learn",
    target: "nav-learn",
    title: "Learn",
    description:
      "Browse courses for your chosen language. Each course is a curated set of audio lessons grouped by theme and difficulty.",
    placement: "right",
  },
  {
    id: "listen",
    target: "nav-listen",
    title: "Listen",
    description:
      "Pick any lesson and listen with an interactive transcript. Tap a line to jump straight to that moment in the audio.",
    placement: "right",
  },
  {
    id: "journal",
    target: "nav-journal",
    title: "Journal",
    description:
      "Write notes after each session. Journaling reinforces vocabulary and helps you notice your own progress.",
    placement: "right",
  },
  {
    id: "feed",
    target: "nav-feed",
    title: "Community",
    description:
      "See what other learners are completing, celebrate achievements together, and leave comments.",
    placement: "right",
  },
  {
    id: "quiz",
    target: "nav-quiz",
    title: "Quiz",
    description:
      "Test your vocabulary with spaced-repetition questions. The more you quiz, the better the words stick.",
    placement: "right",
  },
  {
    id: "profile",
    target: "nav-profile",
    title: "Your Profile",
    description:
      "Track your streak, XP points, and lessons completed. Consistency is the key to fluency.",
    placement: "right",
  },
  {
    id: "done",
    target: null,
    title: "You're all set 🎉",
    description:
      "That's the whole app. Start with the Learn tab and pick a language — your first lesson is waiting.",
    placement: undefined,
  },
];

interface TourState {
  completed: boolean;
  active: boolean;
  stepIndex: number;
  start: () => void;
  next: () => void;
  skip: () => void;
  finish: () => void;
  reset: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      completed: false,
      active: false,
      stepIndex: 0,

      start: () => set({ active: true, stepIndex: 0 }),

      next: () => {
        const { stepIndex } = get();
        const nextIndex = stepIndex + 1;
        if (nextIndex >= TOUR_STEPS.length) {
          set({ active: false, completed: true, stepIndex: 0 });
        } else {
          set({ stepIndex: nextIndex });
        }
      },

      skip: () => set({ active: false, completed: true, stepIndex: 0 }),

      finish: () => set({ active: false, completed: true, stepIndex: 0 }),

      reset: () => set({ completed: false, active: false, stepIndex: 0 }),
    }),
    { name: "izon-beeli-tour" }
  )
);
