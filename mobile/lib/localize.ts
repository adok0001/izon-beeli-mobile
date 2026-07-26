import type { UiLanguage } from "@/store/ui-language-store";
import type { LocalizedText } from "@/types";

/**
 * Resolves a translatable field to a string for the given UI language.
 *
 * Accepts both legacy string values and the new LocalizedText map, so call
 * sites can be migrated independently of data files.
 *
 * Fallback order: requested lang → "en" → first available value → fallback arg.
 */
export function localize(
  field: string | LocalizedText | null | undefined,
  lang: UiLanguage,
  fallback = ""
): string {
  if (!field) return fallback;
  if (typeof field === "string") {
    // Server may serialize LocalizedText as a JSON string — parse it transparently.
    if (field.startsWith("{")) {
      try {
        const parsed = JSON.parse(field) as LocalizedText;
        return parsed[lang] ?? parsed.en ?? (Object.values(parsed).find(Boolean) as string | undefined) ?? fallback;
      } catch { /* fall through */ }
    }
    return field || fallback;
  }
  return field[lang] ?? field.en ?? (Object.values(field).find(Boolean) as string | undefined) ?? fallback;
}

/**
 * Resolve a `<field>` / `<field>Translations` column pair to one language.
 *
 * The map is authoritative; the flat column is the English fallback for records
 * written before the map existed.
 */
export function localizePair(
  map: LocalizedText | null | undefined,
  flat: string | LocalizedText | null | undefined,
  lang: UiLanguage,
  fallback = ""
): string {
  return localize(map ?? flat, lang, fallback);
}
