import type { UiLanguage } from "@/lib/ui-language";

/**
 * Some rows store a JSON-encoded `{ en, fr }` blob in the plain-string title/
 * description column instead of splitting into the dedicated *Fr column. Unwrap
 * that shape here so every caller gets a plain string either way.
 */
function unwrapLocalizedBlob(value: string): { en: string; fr?: string } | null {
  if (!value.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed.en === "string") {
      return { en: parsed.en, fr: typeof parsed.fr === "string" ? parsed.fr : undefined };
    }
  } catch {
    // not JSON — fall through and treat `value` as plain text
  }
  return null;
}

export function localizeField(
  en: string,
  fr: string | null | undefined,
  lang: UiLanguage
): string {
  const blob = unwrapLocalizedBlob(en);
  if (blob) return lang === "fr" && blob.fr ? blob.fr : blob.en;
  if (lang === "fr" && fr) return fr;
  return en;
}
