export type UiLanguage = "en" | "fr" | "pcm" | "ar" | "pt";

export const UI_LANGUAGE_STORAGE_KEY = "ui-language-store-lang";
export const UI_LANGUAGE_COOKIE = UI_LANGUAGE_STORAGE_KEY;

/** Languages that render right-to-left. */
export const RTL_LANGUAGES: readonly UiLanguage[] = ["ar"];

export function isRtlLanguage(lang: UiLanguage): boolean {
  return RTL_LANGUAGES.includes(lang);
}

export function normalizeUiLanguage(value: string | null | undefined): UiLanguage {
  if (value === "fr") return "fr";
  if (value === "pcm") return "pcm";
  if (value === "ar") return "ar";
  if (value === "pt") return "pt";
  return "en";
}

export function detectBrowserUiLanguage(): UiLanguage {
  if (typeof navigator === "undefined") return "en";
  const candidate = navigator.languages?.[0] ?? navigator.language;
  return normalizeUiLanguage(candidate?.split("-")[0]);
}
