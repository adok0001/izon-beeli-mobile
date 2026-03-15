import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "@/lib/i18n";

export type UiLanguage = "en" | "fr";

const STORAGE_KEY = "ui-language-store-lang";

interface UiLanguageState {
  uiLanguage: UiLanguage;
  _hydrated: boolean;
  setUiLanguage: (lang: UiLanguage) => void;
  hydrate: () => Promise<void>;
}

export const useUiLanguageStore = create<UiLanguageState>((set) => ({
  uiLanguage: "en",
  _hydrated: false,
  setUiLanguage: (lang) => {
    set({ uiLanguage: lang });
    i18n.changeLanguage(lang).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "fr") {
        set({ uiLanguage: stored, _hydrated: true });
        i18n.changeLanguage(stored).catch(() => {});
      } else {
        // Fall back to device locale
        const deviceLang = getLocales()[0]?.languageCode;
        const lang: UiLanguage = deviceLang === "fr" ? "fr" : "en";
        set({ uiLanguage: lang, _hydrated: true });
        i18n.changeLanguage(lang).catch(() => {});
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
