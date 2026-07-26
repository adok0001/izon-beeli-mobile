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

// Translation-map helpers live in lib/translations.ts now that every content
// table uses them, not just the dictionary. Re-exported here so the educator
// routes keep importing their shared surface from one place.
export { parseMap, toMap, project, hydrate } from "../../lib/translations.js";
