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

// Translation-map helpers live in lib/translations.ts, and the dictionary
// categories in lib/dictionary-categories.ts, now that both are shared with the
// admin and import routes rather than being educator-specific. Re-exported here
// so the educator routes keep importing their shared surface from one place.
export { parseMap, toMap, project, hydrate } from "../../lib/translations.js";
export { CATEGORY_ERROR, isDictionaryCategory } from "../../lib/dictionary-categories.js";
