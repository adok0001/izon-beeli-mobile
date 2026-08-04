/**
 * The canonical lexical tones as far as the API is concerned — stored on
 * `dictionary_entries.tone` and validated on every write and import path.
 *
 * Several of the languages here are tonal (Izon most of all, where the written
 * form is routinely ambiguous without tone). `pronunciation` is free text and
 * cannot be filtered or drilled; this is the structured field.
 *
 * Optional everywhere. Null/absent means "not recorded" — never "level" — so
 * every route accepts a missing or empty value and only rejects a value that is
 * present and unknown.
 *
 * Import this module rather than redeclaring the list; the categories next door
 * (`dictionary-categories.ts`) drifted across four routes before they were
 * centralized, and this list has the same shape of exposure.
 *
 * This duplicates `WORD_TONE_VALUES` in `mobile/lib/dictionary.ts`, which the
 * clients use. That is deliberate and unavoidable: the API deploys from
 * `server/` alone (`cd server && vercel --prod`), so nothing outside this
 * directory exists at build time and a shared import would not resolve. The
 * duplication is kept honest by `__tests__/word-tones.test.ts`, which reads the
 * mobile file from disk and fails when the two lists diverge — so a tone added
 * on one side without the other breaks the test suite rather than silently
 * rejecting entries in production.
 */
export const WORD_TONES = ["high", "rising", "level", "falling"] as const;

export type WordTone = (typeof WORD_TONES)[number];

const TONE_SET: ReadonlySet<string> = new Set(WORD_TONES);

/** Narrowing guard for untrusted input (request bodies, CSV/JSON import rows). */
export function isWordTone(value: unknown): value is WordTone {
  return typeof value === "string" && TONE_SET.has(value);
}

/**
 * Guard for an *optional* tone field: null, undefined and "" are all "not
 * recorded" and pass; anything else must be a known tone.
 */
export function isValidToneInput(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return isWordTone(typeof value === "string" ? value.trim() : value);
}

/** Normalize an optional tone field to the column's value (`null` = not recorded). */
export function normalizeTone(value: unknown): WordTone | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return isWordTone(trimmed) ? trimmed : null;
}

/** Shared `400` copy so every route rejects an unknown tone identically. */
export const TONE_ERROR = `tone must be one of: ${WORD_TONES.join(", ")} (or left empty)`;
