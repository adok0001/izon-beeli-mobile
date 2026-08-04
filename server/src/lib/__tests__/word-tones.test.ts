import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WORD_TONES, isValidToneInput, isWordTone, normalizeTone } from "../word-tones.js";

/**
 * The API and the clients each need the tone list at build time, but the API
 * deploys from `server/` alone and cannot import from `mobile/`, so the list
 * exists in exactly two places. This test is what stops those two from drifting:
 * it reads the mobile source from disk (dev/CI only — never at runtime) and
 * compares it to the server's copy.
 *
 * If this fails, you added or renamed a tone in one file only. Fix both:
 *   - server/src/lib/word-tones.ts  (WORD_TONES)
 *   - mobile/lib/dictionary.ts      (WORD_TONE_VALUES)
 * The mobile side also needs a TONE_LABELS entry, which its own
 * `Record<WordTone, …>` type enforces.
 */
const MOBILE_DICTIONARY = join(__dirname, "../../../../mobile/lib/dictionary.ts");

function readMobileTones(): string[] {
  const source = readFileSync(MOBILE_DICTIONARY, "utf8");
  const block = /export const WORD_TONE_VALUES = \[([\s\S]*?)\] as const;/.exec(source);
  if (!block) {
    throw new Error(`Could not find WORD_TONE_VALUES in ${MOBILE_DICTIONARY}`);
  }
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

describe("word tones", () => {
  it("matches the mobile/web list exactly, in the same order", () => {
    expect(readMobileTones()).toEqual([...WORD_TONES]);
  });

  it("has no duplicates", () => {
    expect(new Set(WORD_TONES).size).toBe(WORD_TONES.length);
  });

  it("fits the varchar(16) column", () => {
    for (const tone of WORD_TONES) expect(tone.length).toBeLessThanOrEqual(16);
  });

  it("rejects unknown values", () => {
    expect(isWordTone("mid")).toBe(false);
    expect(isValidToneInput("mid")).toBe(false);
  });

  it("treats absent, null and blank as not recorded", () => {
    for (const value of [null, undefined, "", "   "]) {
      expect(isValidToneInput(value)).toBe(true);
      expect(normalizeTone(value)).toBeNull();
    }
  });

  it("normalizes a padded tone to the stored value", () => {
    expect(normalizeTone(" rising ")).toBe("rising");
  });
});
