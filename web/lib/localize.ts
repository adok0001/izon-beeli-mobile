import type { UiLanguage } from "@/lib/ui-language";

/**
 * A few rows written before the `<field>Translations` columns existed stored a
 * JSON-encoded map inside the plain-string title/description column. Unwrap that
 * shape here so every caller gets a plain string either way.
 */
export function unwrapLocalizedBlob(value: string): { en: string; fr?: string } | null {
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

export type TranslationMap = Partial<Record<UiLanguage, string>>;

/**
 * Resolve a `<field>` / `<field>Translations` column pair to one language.
 *
 * The map is authoritative; the flat column is the English fallback for records
 * written before the map existed.
 *
 * Fallback order: requested lang → en → first available → the flat column.
 */
export function localizePair(
  map: TranslationMap | null | undefined,
  flat: string | null | undefined,
  lang: UiLanguage
): string {
  if (map) {
    const hit = map[lang] ?? map.en ?? Object.values(map).find(Boolean);
    if (hit) return hit;
  }
  const value = flat ?? "";
  const blob = unwrapLocalizedBlob(value);
  if (blob) return lang === "fr" && blob.fr ? blob.fr : blob.en;
  return value;
}
