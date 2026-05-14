import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  completedStepIds: string[];
  active: boolean;
  stepIndex: number;
  start: (startIndex?: number) => void;
  next: (totalSteps: number) => void;
  setStepIndex: (stepIndex: number) => void;
  markStepsCompleted: (stepIds: string[]) => void;
  finishSteps: (stepIds: string[]) => void;
  skipSteps: (stepIds: string[]) => void;
  reset: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      completedStepIds: [],
      active: false,
      stepIndex: 0,

      start: (startIndex = 0) => set({ active: true, stepIndex: startIndex }),

      next: (totalSteps: number) => {
        if (totalSteps <= 0) {
          set({ active: false, stepIndex: 0 });
          return;
        }

        const { stepIndex } = get();
        const nextIndex = stepIndex + 1;

        if (nextIndex >= totalSteps) {
          set({ active: false, stepIndex: 0 });
        } else {
          set({ stepIndex: nextIndex });
        }
      },

      setStepIndex: (stepIndex: number) => set({ stepIndex }),

      markStepsCompleted: (stepIds: string[]) =>
        set((state) => ({
          completedStepIds: Array.from(new Set([...state.completedStepIds, ...stepIds])),
        })),

      finishSteps: (stepIds: string[]) =>
        set((state) => ({
          active: false,
          stepIndex: 0,
          completedStepIds: Array.from(new Set([...state.completedStepIds, ...stepIds])),
        })),

      skipSteps: (stepIds: string[]) =>
        set((state) => ({
          active: false,
          stepIndex: 0,
          completedStepIds: Array.from(new Set([...state.completedStepIds, ...stepIds])),
        })),

      reset: () => set({ completedStepIds: [], active: false, stepIndex: 0 }),
    }),
    { name: "izon-beeli-tour" }
  )
);
