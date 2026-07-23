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
// stable id derived from the word server-side (so re-imports update in place);
// the other types get a fresh id per row. The server still honors an explicit
// `id` column if a power user adds one — it's just not part of the template.
export const UNIFIED_COLUMNS = [
  "type", "text", "english", "category",
  "pronunciation", "example", "example_english", "answer", "meaning", "options",
] as const;

export const UNIFIED_ROW_TYPES = ["dictionary", "sentence", "proverb", "quiz"] as const;
export type UnifiedRowType = (typeof UNIFIED_ROW_TYPES)[number];

/** Which columns each row type reads, and what each one means — shown in the UI. */
export const UNIFIED_FIELD_GUIDE: { type: UnifiedRowType; uses: string }[] = [
  { type: "dictionary", uses: "text = word · english = meaning · category (required) · pronunciation, example, example_english (optional)" },
  { type: "sentence", uses: "text = full sentence · english = its translation · answer = the word to blank out (fill-in-the-blank is detected automatically)" },
  { type: "proverb", uses: "text = the proverb · english = its translation · meaning = the lesson it teaches" },
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
