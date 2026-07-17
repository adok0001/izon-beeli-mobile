import { useReducer } from "react";

/**
 * Minimal typed form reducer shared by the Studio/contribute editors: one state
 * object updated by dispatching a partial patch. Collapses the flat
 * `useState`-per-field clusters those screens used to carry (wizard step + many
 * fields + error/dirty flags) into a single `useReducer` without any `any`.
 *
 *   const [state, set] = useForm({ step: 1, title: "", error: null });
 *   set({ title: "x" });   // merges the patch
 *   set({ step: 2 });      // advances the wizard
 */
export function useForm<S extends object>(initial: S) {
  return useReducer((state: S, patch: Partial<S>): S => ({ ...state, ...patch }), initial);
}
