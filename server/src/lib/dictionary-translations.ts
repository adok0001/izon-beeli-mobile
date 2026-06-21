/**
 * Dictionary entries store translations as a `translations` jsonb map plus
 * derived flat `english`/`french` columns. Older rows predate the map and have
 * `translations === null`. `withTranslations` guarantees every row returned to a
 * client carries a populated `translations` (and `exampleTranslations`) map,
 * synthesizing one from the flat columns when needed, so the frontend never has
 * to branch on legacy shape.
 */

interface TranslatableRow {
  english: string;
  french: string | null;
  translations: Record<string, string> | null;
  exampleTranslation: string | null;
  exampleTranslationFr: string | null;
  exampleTranslations: Record<string, string> | null;
}

function flatMap(en?: string | null, fr?: string | null): Record<string, string> | null {
  const out: Record<string, string> = {};
  if (en?.trim()) out.en = en;
  if (fr?.trim()) out.fr = fr;
  return Object.keys(out).length ? out : null;
}

export function withTranslations<T extends TranslatableRow>(row: T): T {
  return {
    ...row,
    translations: row.translations ?? flatMap(row.english, row.french) ?? { en: row.english },
    exampleTranslations:
      row.exampleTranslations ?? flatMap(row.exampleTranslation, row.exampleTranslationFr),
  };
}
