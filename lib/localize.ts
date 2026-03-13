import type { UiLanguage } from "@/store/ui-language-store";

/**
 * Returns the French value when lang is 'fr' and a non-empty string exists,
 * otherwise falls back to the English value.
 */
export function localizeField(
  en: string,
  fr: string | null | undefined,
  lang: UiLanguage
): string {
  if (lang === "fr" && fr) return fr;
  return en;
}
