/**
 * The canonical dictionary categories as far as the API is concerned — stored on
 * `dictionary_entries.category` and validated on every write and import path.
 *
 * Import this module rather than redeclaring the list. Four routes used to keep
 * their own copy (`dictionary.ts`, `admin-import.ts`, `bulk-import.ts`,
 * `educator/_shared.ts`) and they drifted apart; this is the one place to add a
 * category server-side.
 *
 * This duplicates `DICTIONARY_CATEGORY_VALUES` in `mobile/lib/dictionary.ts`,
 * which the clients use. That is deliberate and unavoidable: the API deploys
 * from `server/` alone (`cd server && vercel --prod`), so nothing outside this
 * directory exists at build time and a shared import would not resolve. The
 * duplication is kept honest by `__tests__/dictionary-categories.test.ts`, which
 * reads the mobile file from disk and fails when the two lists diverge — so a
 * category added on one side without the other breaks the test suite rather
 * than silently rejecting entries in production.
 */
export const DICTIONARY_CATEGORIES = [
  "greetings",
  "numbers",
  "family",
  "pronouns",
  "time",
  "verbs",
  "body",
  "market",
  "occupations",
  "nouns",
  "phrases",
  "food",
  "possessives",
  "ordinals",
  "commands",
  "animals",
  "phonetics",
  "money",
  "proverbs",
  "adjectives",
  "ideophones",
  "adverbs",
] as const;

export type DictionaryCategory = (typeof DICTIONARY_CATEGORIES)[number];

const CATEGORY_SET: ReadonlySet<string> = new Set(DICTIONARY_CATEGORIES);

/** Narrowing guard for untrusted input (request bodies, CSV/JSON import rows). */
export function isDictionaryCategory(value: unknown): value is DictionaryCategory {
  return typeof value === "string" && CATEGORY_SET.has(value);
}

/** Shared `400` copy so every route rejects an unknown category identically. */
export const CATEGORY_ERROR = `category must be one of: ${DICTIONARY_CATEGORIES.join(", ")}`;
