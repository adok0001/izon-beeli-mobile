/**
 * i18n parity checker for the UI-string locale catalog (lib/locales/*).
 *
 * `en` is the canonical schema (matches lib/locales/index.ts, where
 * TranslationResources = typeof en). This script flattens every locale to
 * dot-paths and reports, per non-en locale:
 *   - missing: keys present in en but absent here (i18next falls back to en at
 *     runtime, so these are silent English leaks)
 *   - extra:   keys present here but absent from en (dead keys)
 *
 * Usage:
 *   npx tsx scripts/i18n-parity.ts            # summary table (exit 1 if any drift)
 *   npx tsx scripts/i18n-parity.ts --report   # + full missing/extra path lists
 *   npx tsx scripts/i18n-parity.ts --json      # machine-readable {locale: {missing, extra}}
 *
 * The Jest guard in lib/__tests__/locale-parity.test.ts asserts zero drift; this
 * script is the human-facing/CI-debug and translation-scaffolding companion.
 */
import { en } from "../lib/locales/en";
import { fr } from "../lib/locales/fr";
import { pcm } from "../lib/locales/pcm";
import { pt } from "../lib/locales/pt";
import { ar } from "../lib/locales/ar";

type Tree = { [key: string]: string | Tree };

const LOCALES: Record<string, Tree> = { fr, pcm, pt, ar } as unknown as Record<string, Tree>;
const EN = en as unknown as Tree;

/** Collect dot-paths of all string leaves. */
function flatten(tree: Tree, prefix = "", out: Map<string, string> = new Map()): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      flatten(value as Tree, path, out);
    } else {
      out.set(path, String(value));
    }
  }
  return out;
}

export interface LocaleDrift {
  missing: string[]; // in en, not in locale
  extra: string[]; // in locale, not in en
}

export function diffLocale(locale: Tree, canonical: Tree = EN): LocaleDrift {
  const canonPaths = flatten(canonical);
  const localePaths = flatten(locale);
  const missing = [...canonPaths.keys()].filter((p) => !localePaths.has(p));
  const extra = [...localePaths.keys()].filter((p) => !canonPaths.has(p));
  return { missing, extra };
}

function main() {
  const args = process.argv.slice(2);
  const showReport = args.includes("--report");
  const asJson = args.includes("--json");

  const result: Record<string, LocaleDrift & { enValues?: Record<string, string> }> = {};
  const enFlat = flatten(EN);
  let totalDrift = 0;

  for (const [name, tree] of Object.entries(LOCALES)) {
    const drift = diffLocale(tree);
    totalDrift += drift.missing.length + drift.extra.length;
    result[name] = {
      ...drift,
      enValues: Object.fromEntries(drift.missing.map((p) => [p, enFlat.get(p) ?? ""])),
    };
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(totalDrift === 0 ? 0 : 1);
  }

  console.log(`i18n parity vs en (${enFlat.size} keys)\n`);
  for (const [name, drift] of Object.entries(result)) {
    const flag = drift.missing.length + drift.extra.length === 0 ? "OK" : "DRIFT";
    console.log(`  ${name.padEnd(4)} missing:${String(drift.missing.length).padStart(4)}  extra:${String(drift.extra.length).padStart(4)}  [${flag}]`);
    if (showReport) {
      for (const p of drift.missing) console.log(`      - missing ${p}  =  ${JSON.stringify(drift.enValues?.[p])}`);
      for (const p of drift.extra) console.log(`      + extra   ${p}`);
    }
  }
  console.log(totalDrift === 0 ? "\nAll locales in parity." : `\n${totalDrift} total drift entries.`);
  process.exit(totalDrift === 0 ? 0 : 1);
}

/** All non-en locales keyed by name — exported so the Jest guard can iterate them. */
export const NON_EN_LOCALES = LOCALES;

if (require.main === module) main();
