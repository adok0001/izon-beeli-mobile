import AsyncStorage from "@/lib/storage";
import { create } from "zustand";

interface StoredState {
  completedActionIds: string[];
  bonusAwarded: boolean;
}

interface WelcomeChecklistState {
  completedActionIds: string[];
  bonusAwarded: boolean;
  _hydrated: boolean;
  markCompleted: (actionIds: string[]) => void;
  isCompleted: (actionId: string) => boolean;
  markBonusAwarded: () => void;
  reset: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "izon-beeli-mobile-welcome-checklist";

function persist(state: StoredState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}

export const useWelcomeChecklistStore = create<WelcomeChecklistState>((set, get) => ({
  completedActionIds: [],
  bonusAwarded: false,
  _hydrated: false,

  markCompleted: (actionIds) => {
    const updated = Array.from(new Set([...get().completedActionIds, ...actionIds]));
    set({ completedActionIds: updated });
    persist({ completedActionIds: updated, bonusAwarded: get().bonusAwarded });
  },

  isCompleted: (actionId) => get().completedActionIds.includes(actionId),

  markBonusAwarded: () => {
    set({ bonusAwarded: true });
    persist({ completedActionIds: get().completedActionIds, bonusAwarded: true });
  },

  reset: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    set({ completedActionIds: [], bonusAwarded: false });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredState | string[];
        // Handle old format (plain array) gracefully
        if (Array.isArray(parsed)) {
          set({ completedActionIds: parsed, bonusAwarded: false, _hydrated: true });
        } else {
          set({
            completedActionIds: parsed.completedActionIds ?? [],
            bonusAwarded: parsed.bonusAwarded ?? false,
            _hydrated: true,
          });
        }
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
