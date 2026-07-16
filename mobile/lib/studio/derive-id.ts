/**
 * Stable-ID helpers for Studio editors.
 *
 * The rule (see the season/interactive editors): derive an id from a display
 * name ONCE on create, then freeze it. Never re-derive on a later name edit —
 * other rows reference the id (a transcript's speaker, a scene's nextSceneId,
 * a lesson's scene slug) and a silent rename breaks those links.
 *
 * Pure and dependency-free, so it can be unit-tested in isolation.
 */

/**
 * Fold a display name into an id-safe slug. Diacritics are stripped — Izon
 * names carry dot-below vowels (ị/ọ/ẹ) and tone marks that must not reach an
 * ASCII id — spaces and punctuation collapse to single hyphens, length bounded.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD") // split precomposed letters into base + combining marks
    .replace(/\p{M}/gu, "") // drop the combining marks (dots below, tone accents)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics → one hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 48);
}

/**
 * Return `base`, or `base-2`, `base-3`, … — the first that isn't already taken.
 * Mirrors the inline helper in the interactive-story scene editor.
 */
export function uniqueId(base: string, taken: Iterable<string>): string {
  const set = taken instanceof Set ? taken : new Set(taken);
  const root = base || "item";
  let candidate = root;
  let n = 2;
  while (set.has(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}

/**
 * Derive a fresh, unique id from a display name. Call once on create, then
 * freeze. Falls back to `fallback` when the name has no slug-able characters.
 */
export function deriveId(name: string, taken: Iterable<string>, fallback = "item"): string {
  return uniqueId(slugify(name) || fallback, taken);
}
