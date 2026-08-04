/**
 * Turn a dictionary-coverage report into a fill-in CSV.
 *
 * `GET /educator/dictionary-coverage` reports transcript words that have no
 * dictionary entry (see `server/src/lib/dictionary-coverage.ts`). Reading that
 * list on screen tells an educator what is missing but gives them nothing to
 * work in, so the gap stayed open. This emits the same list as a sheet whose
 * leading columns are exactly the dictionary importer's (`DICT_COLUMNS` in
 * `import-types.ts`), pre-filled with the headword: fill the glosses, upload it
 * through the existing importer, and the words land as real entries.
 *
 * `occurrences` and `lessons` trail the importable columns as context — which
 * lesson wants the word, and how often it is said. `parseCsv` folds every header
 * into the row object and the importer reads only the fields it knows, so the
 * extra columns ride along harmlessly on re-import.
 *
 * `id` is deliberately blank: the importer synthesizes a deterministic
 * `headwordId(languageId, word)` when the column is empty, so a re-import
 * updates the same row rather than duplicating it.
 */

/** One lesson a missing word was found in. */
export interface CoverageLessonRef {
  id: string;
  title: string;
}

/** A transcript word with no dictionary entry. */
export interface MissingWordRow {
  word: string;
  count: number;
  lessons: CoverageLessonRef[];
}

/**
 * Importable dictionary columns first, then read-only context.
 * Keep the leading run identical to `DICT_COLUMNS` — the round trip depends on it.
 */
export const MISSING_WORDS_COLUMNS = [
  "id",
  "word",
  "english",
  "category",
  "pronunciation",
  "tone",
  "example",
  "exampleTranslation",
  "occurrences",
  "lessons",
] as const;

/** RFC-4180 quoting: wrap when the value carries a comma, quote or newline. */
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Build the sheet. Rows keep the report's order (the endpoint sorts by
 * frequency), so the words blocking the most lessons sit at the top.
 */
export function buildMissingWordsCsv(missing: readonly MissingWordRow[]): string {
  const lines = [MISSING_WORDS_COLUMNS.join(",")];

  for (const entry of missing) {
    const lessons = entry.lessons.map((l) => l.title).join("; ");
    lines.push(
      [
        "", // id — importer synthesizes from the headword
        entry.word,
        "", // english
        "", // category
        "", // pronunciation
        "", // tone
        "", // example
        "", // exampleTranslation
        String(entry.count),
        lessons,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return lines.join("\n");
}

/** `izon-missing-words-2026-08-04.csv` — language and date, so downloads don't collide. */
export function missingWordsFilename(languageId: string, isoDate: string): string {
  return `${languageId}-missing-words-${isoDate.slice(0, 10)}.csv`;
}
