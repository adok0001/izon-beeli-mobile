import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DICTIONARY_CATEGORIES } from "../dictionary-categories.js";

/**
 * The API and the clients each need the category list at build time, but the API
 * deploys from `server/` alone and cannot import from `mobile/`, so the list
 * exists in exactly two places. This test is what stops those two from drifting:
 * it reads the mobile source from disk (dev/CI only — never at runtime) and
 * compares it to the server's copy.
 *
 * If this fails, you added or renamed a category in one file only. Fix both:
 *   - server/src/lib/dictionary-categories.ts  (DICTIONARY_CATEGORIES)
 *   - mobile/lib/dictionary.ts                 (DICTIONARY_CATEGORY_VALUES)
 * The mobile side also needs a CATEGORY_LABELS and CATEGORY_ICONS entry, which
 * its own `Record<DictionaryCategory, …>` types enforce.
 */
const MOBILE_DICTIONARY = join(__dirname, "../../../../mobile/lib/dictionary.ts");

function readMobileCategories(): string[] {
  const source = readFileSync(MOBILE_DICTIONARY, "utf8");
  const block = /export const DICTIONARY_CATEGORY_VALUES = \[([\s\S]*?)\] as const;/.exec(source);
  if (!block) {
    throw new Error(`Could not find DICTIONARY_CATEGORY_VALUES in ${MOBILE_DICTIONARY}`);
  }
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

describe("dictionary categories", () => {
  it("matches the mobile/web list exactly, in the same order", () => {
    expect(readMobileCategories()).toEqual([...DICTIONARY_CATEGORIES]);
  });

  it("has no duplicates", () => {
    expect(new Set(DICTIONARY_CATEGORIES).size).toBe(DICTIONARY_CATEGORIES.length);
  });
});
