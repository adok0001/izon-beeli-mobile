import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TourStep {
  id: string;
  /** data-tour attribute value to spotlight, or null for a centered modal step */
  target: string | null;
  titleKey: string;
  descriptionKey: string;
  /** Which side of the target to place the tooltip */
  placement?: "right" | "bottom" | "left" | "top";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    titleKey: "tour.welcomeTitle",
    descriptionKey: "tour.welcomeDescription",
    placement: undefined,
  },
  {
    id: "learn",
    target: "nav-learn",
    titleKey: "tour.learnTitle",
    descriptionKey: "tour.learnDescription",
    placement: "right",
  },
  {
    id: "listen",
    target: "nav-listen",
    titleKey: "tour.listenTitle",
    descriptionKey: "tour.listenDescription",
    placement: "right",
  },
  {
    id: "journal",
    target: "nav-journal",
    titleKey: "tour.journalTitle",
    descriptionKey: "tour.journalDescription",
    placement: "right",
  },
  {
    id: "feed",
    target: "nav-feed",
    titleKey: "tour.feedTitle",
    descriptionKey: "tour.feedDescription",
    placement: "right",
  },
  {
    id: "quiz",
    target: "nav-quiz",
    titleKey: "tour.quizTitle",
    descriptionKey: "tour.quizDescription",
    placement: "right",
  },
  {
    id: "profile",
    target: "nav-profile",
    titleKey: "tour.profileTitle",
    descriptionKey: "tour.profileDescription",
    placement: "right",
  },
  {
    id: "done",
    target: null,
    titleKey: "tour.doneTitle",
    descriptionKey: "tour.doneDescription",
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
