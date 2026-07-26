import { toMap, type TranslationMap } from "./translations.js";

/**
 * Dictionary entries store glosses as `translations` / `exampleTranslations`
 * jsonb maps plus derived flat `english` / `exampleTranslation` columns. Older
 * rows predate the maps and have `translations === null`. `withTranslations`
 * guarantees every row returned to a client carries a populated `translations`
 * map, synthesizing one from the flat column when needed, so the frontend never
 * has to branch on legacy shape.
 */

interface TranslatableRow {
  english: string;
  translations: TranslationMap | null;
  exampleTranslation: string | null;
  exampleTranslations: TranslationMap | null;
}

export function withTranslations<T extends TranslatableRow>(row: T): T {
  return {
    ...row,
    // Contractually non-null for clients, even when `english` is blank.
    translations: row.translations ?? toMap(row.english) ?? { en: row.english },
    exampleTranslations: row.exampleTranslations ?? toMap(row.exampleTranslation) ?? null,
  };
}
