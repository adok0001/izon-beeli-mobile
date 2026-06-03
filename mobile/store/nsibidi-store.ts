import { create } from "zustand";
import AsyncStorage from "@/lib/storage";

const STORAGE_KEY = "izon-beeli-nsibidi-learned";

interface NsibidiState {
  learnedIds: Set<string>;
  _hydrated: boolean;
  markLearned: (id: string) => void;
  hydrate: () => Promise<void>;
}

export const useNsibidiStore = create<NsibidiState>((set, get) => ({
  learnedIds: new Set<string>(),
  _hydrated: false,

  markLearned: (id) => {
    const next = new Set(get().learnedIds);
    next.add(id);
    set({ learnedIds: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        set({ learnedIds: new Set(parsed), _hydrated: true });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
