/**
 * Deterministic slug for synthesizing stable content ids (mirrors the web
 * `slugify` in `web/lib/parse-csv.ts`). Subdot vowels (ẹ/ị/ọ/ụ) decompose to
 * their base letter under NFKD so an id derived from a headword stays ASCII.
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
