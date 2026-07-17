import type { UserLevel } from "@/types";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "level-store-user-level";

interface LevelState {
  level: UserLevel | null;
  _hydrated: boolean;
  setLevel: (level: UserLevel) => void;
  hydrate: () => Promise<void>;
}

export const useLevelStore = create<LevelState>((set) => ({
  level: null,
  _hydrated: false,

  setLevel: (level) => {
    set({ level });
    AsyncStorage.setItem(STORAGE_KEY, level).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      set({ level: (stored as UserLevel) ?? null, _hydrated: true });
    } catch {
      set({ _hydrated: true });
    }
  },
}));
