import { useEffect, useId } from "react";
import { create } from "zustand";

interface PendingStreak {
  streak: number;
  isMilestone: boolean;
}

interface OverlayState {
  /**
   * Unique ids of screens/overlays currently holding the foreground. The streak
   * milestone modal stays queued until this list is empty, so it never overtakes
   * a results screen, a level-up popup, or anything else the learner is still on.
   */
  claims: string[];
  /** A streak milestone waiting to be celebrated once the foreground is clear. */
  pendingStreak: PendingStreak | null;
  claim: (id: string) => void;
  release: (id: string) => void;
  showStreak: (streak: number, isMilestone: boolean) => void;
  dismissStreak: () => void;
}

/**
 * Coordinates "celebration" overlays so they stack rather than overtake each
 * other. A streak milestone is recorded as `pendingStreak`, but the single
 * app-level {@link StreakCelebrationModal} only surfaces it once every foreground
 * `claim` has been released — i.e. after the learner has cleared their current
 * screen.
 */
export const useOverlayStore = create<OverlayState>((set) => ({
  claims: [],
  pendingStreak: null,
  claim: (id) =>
    set((s) => (s.claims.includes(id) ? s : { claims: [...s.claims, id] })),
  release: (id) => set((s) => ({ claims: s.claims.filter((c) => c !== id) })),
  showStreak: (streak, isMilestone) => set({ pendingStreak: { streak, isMilestone } }),
  dismissStreak: () => set({ pendingStreak: null }),
}));

/**
 * Holds the foreground (deferring the queued streak milestone modal) for as long
 * as `active` is true. Pass `isMilestonePending && isFocused` so a screen only
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
