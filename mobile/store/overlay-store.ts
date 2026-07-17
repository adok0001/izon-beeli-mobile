import { useEffect, useId } from "react";
import { create } from "zustand";

export type Celebration =
  | { type: "streak"; streak: number; isMilestone: boolean }
  | { type: "achievement"; level: number; title: string };

interface OverlayState {
  /**
   * Unique ids of screens/overlays currently holding the foreground. Queued
   * celebrations stay put until this list is empty, so they never overtake a
   * results screen or anything else the learner is still on.
   */
  claims: string[];
  /**
   * Celebrations waiting to be shown once the foreground is clear, in the
   * order they were queued. Only the front of the queue is ever visible, so a
   * streak milestone and a level-up earned from the same action present one
   * after another instead of colliding.
   */
  queue: Celebration[];
  claim: (id: string) => void;
  release: (id: string) => void;
  showStreak: (streak: number, isMilestone: boolean) => void;
  showAchievement: (level: number, title: string) => void;
  dismissCurrent: () => void;
}

/**
 * Coordinates "celebration" overlays so they stack rather than overtake each
 * other. A streak milestone or level-up is enqueued, but the single app-level
 * {@link CelebrationHost} only surfaces the front of the queue once every
 * foreground `claim` has been released — i.e. after the learner has cleared
 * their current screen — and advances the queue on dismiss.
 */
export const useOverlayStore = create<OverlayState>((set) => ({
  claims: [],
  queue: [],
  claim: (id) =>
    set((s) => (s.claims.includes(id) ? s : { claims: [...s.claims, id] })),
  release: (id) => set((s) => ({ claims: s.claims.filter((c) => c !== id) })),
  showStreak: (streak, isMilestone) =>
    set((s) => ({ queue: [...s.queue, { type: "streak", streak, isMilestone }] })),
  showAchievement: (level, title) =>
    set((s) => ({ queue: [...s.queue, { type: "achievement", level, title }] })),
  dismissCurrent: () => set((s) => ({ queue: s.queue.slice(1) })),
}));

/**
 * Holds the foreground (deferring any queued celebration) for as long as
 * `active` is true. Pass `isCelebrationPending && isFocused` so a screen only
 * blocks the celebration while the learner is actually looking at it.
 */
export function useForegroundClaim(active: boolean) {
  const id = useId();
  const claim = useOverlayStore((s) => s.claim);
  const release = useOverlayStore((s) => s.release);

  useEffect(() => {
    if (!active) return;
    claim(id);
    return () => release(id);
  }, [active, id, claim, release]);
}
