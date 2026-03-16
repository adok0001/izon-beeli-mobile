export type UiLanguage = "en" | "fr";

export const UI_LANGUAGE_STORAGE_KEY = "ui-language-store-lang";
export const UI_LANGUAGE_COOKIE = UI_LANGUAGE_STORAGE_KEY;

export function normalizeUiLanguage(value: string | null | undefined): UiLanguage {
  return value === "fr" ? "fr" : "en";
}

export function detectBrowserUiLanguage(): UiLanguage {
  if (typeof navigator === "undefined") return "en";
  const candidate = navigator.languages?.[0] ?? navigator.language;
  return normalizeUiLanguage(candidate?.split("-")[0]);
}
