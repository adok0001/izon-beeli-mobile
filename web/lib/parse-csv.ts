/**
 * Quote-aware CSV parsing for the Studio bulk-import panels.
 *
 * This used to be a byte-identical copy of mobile's parser. It isn't any more:
 * the web bundle already pulls `@mobile/lib/unified-import` in through
 * `@mobile/lib/edit-import`, so a second copy shipped the same code twice and
 * meant every parser fix (the BOM strip, most recently) had to be written
 * twice. Re-exported here so the existing `@/lib/parse-csv` call sites are
 * untouched.
 */
export { parseCsv } from "@mobile/lib/unified-import";

/**
 * Derive a stable, collision-resistant slug from a word — used to synthesize a
 * deterministic id for CSV dictionary rows that omit an explicit id, so
 * re-importing the same sheet upserts instead of duplicating. Subdot vowels
 * (ẹ/ị/ọ/ụ) decompose to their base letter under NFKD.
 */
export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics (subdots → base letter)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
