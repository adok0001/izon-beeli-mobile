import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "language-store-language-id";

interface LanguageState {
  selectedLanguageId: string;
  _hydrated: boolean;
  setLanguage: (id: string) => void;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  selectedLanguageId: "izon",
  _hydrated: false,

  setLanguage: (id) => {
    set({ selectedLanguageId: id });
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ selectedLanguageId: stored, _hydrated: true });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
