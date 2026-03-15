import { create } from "zustand";
import AsyncStorage from "@/lib/storage";

type ThemePreference = "system" | "light" | "dark";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  _hydrated: boolean;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "izon-beeli-theme-preference";

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  _hydrated: false,

  setPreference: (pref) => {
    set({ preference: pref });
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        set({ preference: stored, _hydrated: true });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
