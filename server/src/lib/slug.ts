/**
 * Deterministic slug for synthesizing stable content ids (mirrors the web
 * `slugify` in `web/lib/parse-csv.ts`). Subdot vowels (ẹ/ị/ọ/ụ) decompose to
 * their base letter under NFKD so an id derived from a headword stays ASCII.
 *
 * The slug alone is NOT an identity — it is lossy by design. Use `headwordId`
 * for anything that upserts.
 */
export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (subdots → base letter)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * FNV-1a (32-bit), base36. Deterministic across Node and the browser, so the
 * web import panel can synthesize the same id the server would.
 *
 * Input is normalized to NFC first: the same headword typed on macOS (NFD) and
 * in a Windows-authored sheet (NFC) must hash identically, or a re-import would
 * insert beside the row it meant to update.
 */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  const src = s.normalize("NFC");
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, "0").slice(0, 7);
}

/**
 * The id a dictionary row gets when the sheet supplies none (mirrors
 * `headwordId` in `web/lib/parse-csv.ts` — keep the two in step).
 *
 * `slugify` is lossy exactly where Izon orthography is meaningful: it folds case
 * and strips the subdots and tone marks that distinguish separate words. Against
 * the live Izon corpus, 2,477 of 10,627 entries share a slug with another entry,
 * and only 52 of those are true homographs — the other 1,042 groups are
 * DIFFERENT headwords (Keni / kèní / Kẹnị, Angọ / ango, dị / Di) that a
 * slug-only id would silently merge on upsert.
 *
 * So the slug stays as the readable stem and identity rides on a hash of the
 * exact headword. Re-importing the same sheet is still idempotent, and editing a
 * gloss still updates in place, because only the headword feeds the hash.
 *
 * Two rows with a genuinely identical headword and different senses (oru "old"
 * vs oru "idol") still collide. That is deliberate — the importer reports them
 * as duplicates so an educator assigns explicit ids, rather than one sense
 * quietly overwriting the other.
 */
export function headwordId(languageId: string, word: string): string {
  const stem = slugify(word).slice(0, 40) || "entry";
  return `${languageId}-${stem}-${fnv1a(word)}`;
}
