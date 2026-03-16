import i18n from "@/lib/i18n";
import {
    detectBrowserUiLanguage,
    normalizeUiLanguage,
    UI_LANGUAGE_COOKIE,
    UI_LANGUAGE_STORAGE_KEY,
    type UiLanguage,
} from "@/lib/ui-language";
import { create } from "zustand";

interface UiLanguageState {
  uiLanguage: UiLanguage;
  _hydrated: boolean;
  setUiLanguage: (lang: UiLanguage) => void;
  hydrate: (initialLanguage?: UiLanguage) => Promise<void>;
}

function persistUiLanguage(lang: UiLanguage) {
  if (globalThis.window === undefined) return;
  globalThis.window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, lang);
  document.cookie = `${UI_LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = lang;
}

export const useUiLanguageStore = create<UiLanguageState>((set) => ({
  uiLanguage: "en",
  _hydrated: false,
  setUiLanguage: (lang) => {
    const next = normalizeUiLanguage(lang);
    set({ uiLanguage: next });
    persistUiLanguage(next);
    i18n.changeLanguage(next).catch(() => {});
  },
  hydrate: async (initialLanguage) => {
    const storedLanguage = globalThis.window?.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    const resolved =
      storedLanguage
        ? normalizeUiLanguage(storedLanguage)
        : initialLanguage ?? detectBrowserUiLanguage();

    set({ uiLanguage: resolved, _hydrated: true });
    persistUiLanguage(resolved);
    await i18n.changeLanguage(resolved).catch(() => {});
  },
}));

export type { UiLanguage } from "@/lib/ui-language";
