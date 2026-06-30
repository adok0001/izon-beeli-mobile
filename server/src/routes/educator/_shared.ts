import type { PgColumn } from "drizzle-orm/pg-core";
import { inArray } from "drizzle-orm";

/** Return a Drizzle language-filter condition, or undefined (no filter) for admins. */
export function langFilter(
  table: { languageId: PgColumn },
  langs: string[],
) {
  return langs.length > 0 ? inArray(table.languageId, langs) : undefined;
}

export function isAudioUpload(file: File): boolean {
  if (file.type.toLowerCase().startsWith("audio/")) return true;
  return /\.(mp3|wav|m4a|aac|ogg|oga|webm|mp4|mpeg)$/i.test(file.name);
}

// Canonical dictionary categories — must match the admin route (dictionary.ts),
// the web/mobile editors, and CATEGORY_LABELS in mobile/lib/dictionary.ts. These
// are stored on dictionary_entries.category and drive label/icon lookup in the app.
export const VALID_CATEGORIES = [
  "greetings", "numbers", "family", "pronouns", "time", "verbs", "body",
  "market", "occupations", "nouns", "phrases", "food", "possessives",
  "ordinals", "commands", "animals", "phonetics", "money", "proverbs",
  "adjectives",
] as const;

/**
 * Normalize an incoming translations map. Accepts an object (JSON body) or a
 * JSON-stringified object (multipart field). Returns a trimmed { lang: text }
 * map, or undefined when there is nothing usable.
 */
export function parseMap(raw: unknown): Record<string, string> | undefined {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return undefined;
    try {
      obj = JSON.parse(s);
    } catch {
      return undefined;
    }
  }
  if (typeof obj !== "object" || obj === null) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return Object.keys(out).length ? out : undefined;
}

/** Build a translations map from legacy flat english/french fields. */
export function flatToMap(en?: string | null, fr?: string | null): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  if (en?.trim()) out.en = en.trim();
  if (fr?.trim()) out.fr = fr.trim();
  return Object.keys(out).length ? out : undefined;
}
