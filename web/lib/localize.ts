import type { UiLanguage } from "@/lib/ui-language";

export function localizeField(
  en: string,
  fr: string | null | undefined,
  lang: UiLanguage
): string {
  if (lang === "fr" && fr) return fr;
  return en;
}
