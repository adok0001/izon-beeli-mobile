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
 * Readable slug for a word. Subdot vowels (ẹ/ị/ọ/ụ) decompose to their base
 * letter under NFKD, so the result stays ASCII.
 *
 * Lossy by design — it folds case and drops the very marks Izon uses to tell
 * words apart. It is a display stem, not an identity; use `headwordId` to
 * synthesize anything that upserts.
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

/** FNV-1a (32-bit), base36 — mirrors `fnv1a` in `server/src/lib/slug.ts`. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  const src = s.normalize("NFC"); // an NFD sheet and an NFC sheet must agree
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, "0").slice(0, 7);
}

/**
 * The id a dictionary row gets when the sheet supplies none. MUST match
 * `headwordId` in `server/src/lib/slug.ts` — this panel synthesizes ids client
 * side, so any drift between the two silently splits one entry into two rows.
 *
 * Identity rides on a hash of the exact headword rather than on the slug, which
 * would merge distinct words (Keni / kèní / Kẹnị all slug to `keni`). Only the
 * headword feeds the hash, so correcting a gloss still updates in place.
 */
export function headwordId(languageId: string, word: string): string {
  const stem = slugify(word).slice(0, 40) || "entry";
  return `${languageId}-${stem}-${fnv1a(word)}`;
}
