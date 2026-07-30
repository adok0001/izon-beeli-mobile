import { parseCsv } from "./parse-csv";

/**
 * The unified content sheet — one CSV educators fill for any of the flat content
 * types. A `type` column routes each row server-side (see server bulk-import
 * `mapUnifiedRow`) to the matching per-type importer. Scenarios and cultural
 * content don't flatten to a grid and keep their own JSON import.
 *
 * This module only owns the client-facing contract: the column order, the
 * downloadable template, and the per-type field legend. The server owns the
 * mapping + validation, so it stays the single source of truth for what's valid.
 */
// No `id` column: ids are a DB concern, not an educator's. Dictionary rows get a
// stable id derived from the headword server-side (so re-imports update in
// place); the other types get a fresh id per row.
//
// Two ways to record a word that means more than one thing, and they are not the
// same thing:
//   polysemy   one word, related senses → ONE row, semicolons in `english`
//              ("old; ancient; former"). The app splits it into a numbered
//              Senses placard (see `parseSenses` in mobile/lib/dictionary.ts).
//              A quarter of the Izon corpus is already written this way.
//   homographs different words that share a spelling (oru "old" adj vs oru
//              "idol" noun) → separate rows, which need separate ids. Add an
//              `id` column; the server honors it in place of the derived one.
// Without an `id` column two rows with the same headword derive the same id and
// the import rejects the second, since one would overwrite the other.
export const UNIFIED_COLUMNS = [
  "type", "text", "english", "category",
  "pronunciation", "example", "example_english", "answer", "meaning", "options",
] as const;

export const UNIFIED_ROW_TYPES = ["dictionary", "sentence", "proverb", "quiz"] as const;
export type UnifiedRowType = (typeof UNIFIED_ROW_TYPES)[number];

/** Which columns each row type reads, and what each one means — shown in the UI. */
export const UNIFIED_FIELD_GUIDE: { type: UnifiedRowType; uses: string }[] = [
  { type: "dictionary", uses: "text = word · english = meaning; separate several senses of the same word with semicolons · category (required) · pronunciation, example, example_english (optional) · add english:fr, english:pcm, english:ar or english:pt (and the same on example_english) to fill the other languages · add an id column only to give two words that share a spelling separate entries" },
  { type: "sentence", uses: "text = full sentence · english = its translation · answer = the word to blank out (fill-in-the-blank is detected automatically)" },
  { type: "proverb", uses: "text = the proverb · english = its translation · meaning = the lesson it teaches · add english:fr, meaning:pcm and so on to fill the other languages" },
  { type: "quiz", uses: "text = prompt · english = correct answer · category = question type (word-to-english, english-to-word, fill-in-the-blank, listening) · options = choices separated by | (pipe)" },
];

/**
 * Starter template: the header plus one worked example per type. Rows are built
 * from arrays so a cell can never drift out of its column. Blank cells are
 * expected — each type fills only the few columns it uses (see the guide above).
 */
const UNIFIED_EXAMPLE_ROWS: string[][] = [
  // type          text        english            category          pron  example         example_english                answer   meaning                             options
  ["dictionary", "kọn",      "take",            "verbs",          "",   "Bo okpu kọn.", "Come and take the sugarcane.", "",      "",                                  ""],
  // Several senses of one word go in one row, separated by semicolons.
  ["dictionary", "oru",      "old; ancient; former", "adjectives", "",  "",             "",                            "",      "",                                  ""],
  ["sentence",   "Mị kasị.", "This is a chair.", "",               "",   "",             "",                            "kasị",  "",                                  ""],
  ["proverb",    "…",        "…",               "",               "",   "",             "",                            "",      "The lesson the proverb teaches.",   ""],
  ["quiz",       "kọn",      "take",            "word-to-english", "",   "",             "",                            "",      "",                                  "take|come|go|see"],
];

export const UNIFIED_TEMPLATE_CSV = [
  UNIFIED_COLUMNS.join(","),
  ...UNIFIED_EXAMPLE_ROWS.map((r) => r.join(",")),
  "",
].join("\n");

/** Parse an uploaded unified CSV into keyed rows for the /import/unified endpoint. */
export function parseUnifiedCsv(text: string): Record<string, string>[] {
  return parseCsv(text).filter((row) => (row.type ?? "").trim() !== "");
}
