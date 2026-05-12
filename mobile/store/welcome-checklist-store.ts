import AsyncStorage from "@/lib/storage";
import { create } from "zustand";

interface WelcomeChecklistState {
  completedActionIds: string[];
  _hydrated: boolean;
  markCompleted: (actionIds: string[]) => void;
  isCompleted: (actionId: string) => boolean;
  reset: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "izon-beeli-mobile-welcome-checklist";

function persist(completedActionIds: string[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completedActionIds)).catch(() => {});
}

export const useWelcomeChecklistStore = create<WelcomeChecklistState>((set, get) => ({
  completedActionIds: [],
  _hydrated: false,

  markCompleted: (actionIds) => {
    const updated = Array.from(new Set([...get().completedActionIds, ...actionIds]));
    set({ completedActionIds: updated });
    persist(updated);
  },

  isCompleted: (actionId) => get().completedActionIds.includes(actionId),

  reset: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    set({ completedActionIds: [] });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ completedActionIds: JSON.parse(stored) as string[], _hydrated: true });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
