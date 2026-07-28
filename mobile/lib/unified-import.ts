/**
 * Unified content CSV — the mobile mirror of `web/lib/unified-import.ts`. One
 * sheet educators fill for any flat content type; a `type` column routes each
 * row server-side (`POST /import/unified` → `mapUnifiedRow`) to the matching
 * per-type importer. Server owns mapping + validation, so this file only holds
 * the client-facing contract (columns, template, legend) plus a small CSV
 * parser (mobile has none of its own). Keep in sync with the web copy.
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
 * Starter template: header plus one worked example per type. Rows are built from
 * arrays so a cell can never drift out of its column. Blank cells are expected —
 * each type fills only the few columns it uses (see the guide above).
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

/**
 * Quote-aware CSV parser (mirrors `web/lib/parse-csv.ts`): handles double-quoted
 * fields, commas and newlines inside quotes, escaped quotes (`""`), and CRLF.
 * Returns one object per data row keyed by the trimmed header names.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = tokenize(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== "")) // drop blank lines
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => {
        obj[h] = (r[i] ?? "").trim();
      });
      return obj;
    });
}

/** Parse an uploaded unified CSV into keyed rows for the /import/unified endpoint. */
export function parseUnifiedCsv(text: string): Record<string, string>[] {
  return parseCsv(text).filter((row) => (row.type ?? "").trim() !== "");
}

/**
 * Tokenize CSV text into a matrix of raw string cells.
 *
 * The leading U+FEFF is stripped before anything else: Excel writes a BOM on
 * Save-As, which is exactly what an educator does to a downloaded export, and
 * without this the first header reads as "﻿id" so every row fails on a
 * missing id.
 */
function tokenize(text: string): string[][] {
  const src = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
