import { en } from "../locales/en";
import { fr } from "../locales/fr";
import { pcm } from "../locales/pcm";
import { pt } from "../locales/pt";
import { ar } from "../locales/ar";

/**
 * Guards against locale drift. `en` is the canonical schema (lib/locales/index.ts
 * derives TranslationResources = typeof en), but the other locales are NOT typed
 * against it, so tsc cannot catch a missing/extra key. i18next silently falls back
 * to English at runtime, which hides the gap. This test makes it loud.
 *
 * If this fails, run: `npx tsx scripts/i18n-sync.ts` to re-sync, then translate the
 * scaffolded keys it reports.
 */
type Tree = { [k: string]: string | Tree };

function flatten(tree: Tree, prefix = "", out: Set<string> = new Set()): Set<string> {
  for (const [k, v] of Object.entries(tree)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object") flatten(v as Tree, p, out);
    else out.add(p);
  }
  return out;
}

const enKeys = flatten(en as unknown as Tree);
const LOCALES: Record<string, Tree> = { fr, pcm, pt, ar } as unknown as Record<string, Tree>;

describe("locale parity vs en", () => {
  for (const [name, tree] of Object.entries(LOCALES)) {
    const keys = flatten(tree);

    it(`${name} has no missing keys`, () => {
      const missing = [...enKeys].filter((k) => !keys.has(k));
      expect(missing).toEqual([]);
    });

    it(`${name} has no extra (dead) keys`, () => {
      const extra = [...keys].filter((k) => !enKeys.has(k));
      expect(extra).toEqual([]);
    });
  }
});
