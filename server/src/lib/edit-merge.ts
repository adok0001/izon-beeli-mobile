/**
 * Merge one row of a bulk-**edit** sheet onto the row already in the table.
 *
 * Pure — no database import — so its tests need no `jest.mock("../../db/index.js")`.
 *
 * Three things live here, and each one is a trap the naive version falls into:
 *
 * 1. **Cell semantics.** Blank leaves a field unchanged; `--` clears it; `\--`
 *    is the literal two dashes. Blank-means-unchanged is what makes a
 *    round-tripped export safe — most of its cells are ones nobody touched.
 *
 * 2. **Per-locale gloss merging.** The insert path's `mapOf` builds a map from
 *    CSV columns *only*, so merging that way against a row holding
 *    `{ en, fr, pcm }` would write `{ en }` and silently drop the rest. Worse,
 *    `project()` falls back to the first value in the map, so a sheet with only
 *    `english:fr` filled would put French in the NOT NULL `english` column.
 *    Here the merge starts from the row's own (hydrated) map and touches only
 *    the locales the header actually names.
 *
 * 3. **NFC-aware diffing.** A spreadsheet round-trip flips `kọn` between NFC and
 *    NFD. Compare normalized and write NFC, or every row reports as changed.
 */
import { project, type TranslationMap } from "./translations.js";

export const CLEAR = "--";

/** A parsed sheet row: raw (already formula-unguarded) cell strings by column. */
export type EditCells = Record<string, string>;

export type CellIntent =
  | { kind: "skip" }
  | { kind: "clear" }
  | { kind: "set"; value: string };

/**
 * Decode one cell. Absent and blank are the same thing — an export writes an
 * empty cell for a null field, and re-uploading it must be a no-op.
 */
export function decodeCell(raw: string | undefined): CellIntent {
  const value = (raw ?? "").trim();
  if (value === "") return { kind: "skip" };
  if (value === CLEAR) return { kind: "clear" };
  // `\--`, `\\--`, … unescape one backslash to reach a literal `--`.
  if (/^\\+--$/.test(value)) return { kind: "set", value: value.slice(1) };
  return { kind: "set", value };
}

/** Normalize for comparison; also the form every value is written in. */
export function nfc(value: string): string {
  return value.normalize("NFC");
}

export function sameText(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return a === b;
  return nfc(a) === nfc(b);
}

export function sameMap(a: TranslationMap | null, b: TranslationMap | null): boolean {
  if (!a || !b) return !a && !b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (!sameText(a[k] ?? null, b[k] ?? null)) return false;
  }
  return true;
}

// ─── scalar fields ────────────────────────────────────────────────────────────

/** Apply a cell to a nullable scalar column. */
export function mergeScalar(current: string | null, raw: string | undefined): string | null {
  const cell = decodeCell(raw);
  if (cell.kind === "skip") return current;
  if (cell.kind === "clear") return null;
  return nfc(cell.value);
}

/**
 * A NOT NULL scalar: `--` is rejected rather than silently ignored, so an
 * educator who meant to clear it finds out at the dry run.
 */
export function mergeRequired(
  current: string,
  raw: string | undefined,
  field: string,
): { value: string } | { error: string } {
  const cell = decodeCell(raw);
  if (cell.kind === "skip") return { value: current };
  if (cell.kind === "clear") return { error: `"${field}" is required and cannot be cleared with "${CLEAR}"` };
  return { value: nfc(cell.value) };
}

// ─── gloss maps ───────────────────────────────────────────────────────────────

/**
 * Merge a translatable field's per-locale columns onto the row's existing map.
 *
 * `current` must already be hydrated (legacy rows have `translations === null`,
 * and merging onto `{}` would leave the flat column to `project()`'s
 * first-value fallback). Locales with no column in the sheet are untouched —
 * that is what lets a partial export round-trip.
 *
 * The bare column (`english`) is the `en` gloss; `english:<lang>` is the rest.
 */
export function mergeGlossMap(
  current: TranslationMap,
  cells: EditCells,
  field: string,
  locales: readonly string[],
): TranslationMap {
  const merged: TranslationMap = { ...current };
  for (const locale of locales) {
    const column = locale === "en" ? field : `${field}:${locale}`;
    if (!(column in cells)) continue;
    const cell = decodeCell(cells[column]);
    if (cell.kind === "skip") continue;
    if (cell.kind === "clear") delete merged[locale];
    else merged[locale] = nfc(cell.value);
  }
  return merged;
}

/** The `<field>` / `<field>Translations` pair a merged map writes. */
export function projectMap(map: TranslationMap): { flat: string | null; map: TranslationMap | null } {
  return Object.keys(map).length === 0
    ? { flat: null, map: null }
    : { flat: project(map), map };
}

// ─── diffing ──────────────────────────────────────────────────────────────────

export interface FieldDiff {
  field: string;
  before: string | null;
  after: string | null;
}

const show = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  return typeof v === "string" ? v : JSON.stringify(v);
};

/**
 * Compare merged values against the current row, field by field, NFC-normalized.
 * An empty result means nothing changed — the row is dropped from the UPDATE and
 * from the audit log, and crucially never flips a published row to `in_review`.
 */
export function diffFields(
  before: Record<string, string | null | TranslationMap>,
  after: Record<string, string | null | TranslationMap>,
): FieldDiff[] {
  const out: FieldDiff[] = [];
  for (const field of Object.keys(after)) {
    const a = before[field] ?? null;
    const b = after[field] ?? null;
    const equal =
      typeof a === "object" || typeof b === "object"
        ? sameMap((a as TranslationMap) ?? null, (b as TranslationMap) ?? null)
        : sameText(a, b);
    if (!equal) out.push({ field, before: show(a), after: show(b) });
  }
  return out;
}

// ─── length guards ────────────────────────────────────────────────────────────

/**
 * `varchar` limits from the schema. A `22001` mid-batch would leave a partial
 * edit applied — neon-http has no transactions — so these are checked in the
 * dry run, before anything is written.
 */
export const MAX_LENGTHS: Record<string, number> = {
  id: 64,
  word: 500,
  english: 500,
  category: 64,
  pronunciation: 500,
  tone: 16,
  semanticDomain: 200,
};

export function lengthError(field: string, value: string | null): string | null {
  const max = MAX_LENGTHS[field];
  if (max === undefined || value === null) return null;
  return value.length > max ? `"${field}" is ${value.length} characters — the column holds ${max}` : null;
}
