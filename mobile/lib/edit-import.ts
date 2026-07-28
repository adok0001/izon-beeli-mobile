/**
 * Bulk **edit** CSV — the contract for correcting dictionary rows that already
 * exist, as opposed to `unified-import.ts` which only ever adds them.
 *
 * Web imports this module directly (`@mobile/lib/edit-import`); there is no
 * second copy to keep in sync.
 *
 * The whole feature turns on one rule: **matching is by `id`, and an unknown id
 * is an error — never an insert.** An educator exports rows, edits them in a
 * spreadsheet, and re-uploads; the sheet can change what is already there and
 * nothing else.
 *
 * Cell semantics (decoded server-side in `server/src/lib/edit-merge.ts`):
 *
 * | Cell      | Meaning                        |
 * |-----------|--------------------------------|
 * | blank     | leave the field unchanged      |
 * | `--`      | clear the field                |
 * | `\--`     | the literal two-character `--` |
 *
 * Blank means "unchanged" rather than "clear" because a round-tripped export is
 * mostly cells the educator never touched — "blank clears" would empty thousands
 * of fields on a single upload.
 */
import { parseCsv } from "./unified-import";

/** The sentinel that clears a field. */
export const CLEAR = "--";

/** What each column does — shown in the Studio UI above the picker. */
export const EDIT_FIELD_GUIDE: { label: string; uses: string }[] = [
  { label: "id", uses: "the row to change — must already exist in this language. Never edit it; an unknown id is an error, not a new word." },
  { label: "word · category", uses: "required, so they can be corrected but not cleared. `category` must be one of the Studio categories." },
  { label: "english", uses: "the English gloss. `english:fr`, `english:pcm`, `english:ar`, `english:pt` set the other glosses; a locale with no column is left alone." },
  { label: "example · exampleTranslation", uses: "the example sentence and its glosses (same per-language columns as `english`)." },
  { label: "blank cell", uses: "leaves the field exactly as it is — that is why you can export, change three cells, and re-upload." },
  { label: `\`${CLEAR}\``, uses: "clears the field. Write `\\--` for a value that really is two dashes." },
  { label: "status", uses: "read-only. Exported for context; the importer ignores it." },
];

// ─── cell escaping ────────────────────────────────────────────────────────────
// Two layers, kept strictly separate:
//   1. transport  — quoting, BOM, spreadsheet formula guard. Symmetric:
//                   `parseEditCsv(toCsv(rows))` returns `rows` exactly.
//   2. semantics  — the blank / `--` / `\--` sentinel, decoded server-side.
// `encodeEditCell` belongs to layer 2 and runs *before* `toCsv`.

/** Leading characters a spreadsheet would read as the start of a formula. */
const FORMULA_LEAD = /^('*)([=+\-@])/;

/**
 * Neutralize a leading `=`/`+`/`-`/`@` with an apostrophe so a spreadsheet shows
 * the text instead of evaluating it. Escaping an existing `'` run keeps this
 * reversible, so `unguardFormula` restores the original exactly.
 */
function guardFormula(value: string): string {
  return FORMULA_LEAD.test(value) ? `'${value}` : value;
}

function unguardFormula(value: string): string {
  return value.startsWith("'") && FORMULA_LEAD.test(value.slice(1)) ? value.slice(1) : value;
}

/**
 * Escape a value that would otherwise be read as the `--` clear sentinel. Only
 * a cell that is *entirely* `--` (or an already-escaped run of it) is ambiguous.
 */
export function encodeEditCell(value: string): string {
  return /^\\*--$/.test(value) ? `\\${value}` : value;
}

// ─── serialize ────────────────────────────────────────────────────────────────

/** True when a cell has to be quoted to survive a round trip through `tokenize`. */
function needsQuoting(value: string): boolean {
  return /[",\n]/.test(value) || value !== value.trim();
}

function serializeCell(raw: string): string {
  const value = guardFormula(raw);
  return needsQuoting(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Serialize rows to CSV — the exact inverse of `tokenize`. Quotes any cell
 * containing a comma, a quote, a newline or edge whitespace; doubles internal
 * quotes; and guards leading formula characters reversibly.
 *
 * Values must already carry their edit semantics (see `encodeEditCell`).
 */
export function toCsv(
  rows: Record<string, string>[],
  columns: readonly string[],
  encode: (value: string) => string = (v) => v,
): string {
  const lines = [columns.map(serializeCell).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => serializeCell(encode(row[c] ?? ""))).join(","));
  }
  return `${lines.join("\n")}\n`;
}

// ─── parse ────────────────────────────────────────────────────────────────────

/**
 * Parse an uploaded edit sheet. Filters on `id` rather than `type`: an edit
 * sheet has no `type` column, so `parseUnifiedCsv`'s filter would eat every row.
 *
 * Unlike `toCsv`'s inverse, the `--` sentinel is left encoded — the server
 * decodes it, because only the server knows whether a field may be cleared.
 *
 * `parseCsv` trims every cell, so edge whitespace does not survive a round trip
 * (and `" -- "` is therefore the clear sentinel too). `toCsv` still quotes such
 * cells so they at least survive a detour through a spreadsheet.
 */
export function parseEditCsv(text: string): Record<string, string>[] {
  return parseCsv(text)
    .map((row) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) out[k] = unguardFormula(v);
      return out;
    })
    .filter((row) => (row.id ?? "").trim() !== "");
}

/**
 * Turn `GET /import/export`'s rows into the downloadable sheet.
 *
 * The server returns plain values rather than a finished CSV precisely so this
 * step — escaping the `--` sentinel, then serializing — happens once, here,
 * for both clients. (The server can't import this module: it builds from its
 * own `rootDir` with no path alias into `mobile/`.)
 */
export function buildEditCsv(rows: Record<string, string>[], columns: readonly string[]): string {
  return toCsv(rows, columns, encodeEditCell);
}
