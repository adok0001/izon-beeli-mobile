/**
 * i18n sync tool — keeps fr/pt/pcm/ar structurally identical to en (the canonical
 * schema, per lib/locales/index.ts). Run this after editing en.ts.
 *
 *   npx tsx scripts/i18n-sync.ts           # rewrite the 4 locales to en's shape
 *   npx tsx scripts/i18n-sync.ts --check   # dry-run: exit 1 if any file would change
 *
 * Behaviour per locale:
 *   - key order + nesting come from en (deterministic output, clean diffs)
 *   - existing translations are preserved
 *   - keys missing from the locale are scaffolded with the EN value as a placeholder
 *     (matches i18next's runtime fallbackLng: "en") and reported so a translator can
 *     fill them in
 *   - dead keys (present in the locale, absent from en) are dropped
 *
 * The permanent guard against drift is lib/__tests__/locale-parity.test.ts; this
 * tool is how you fix drift once the test flags it.
 */
import * as fs from "fs";
import * as path from "path";
import { en } from "../lib/locales/en";
import { fr } from "../lib/locales/fr";
import { pcm } from "../lib/locales/pcm";
import { pt } from "../lib/locales/pt";
import { ar } from "../lib/locales/ar";

type Tree = { [k: string]: string | Tree };

const LOCALES_DIR = path.resolve(__dirname, "../lib/locales");
const HEADER = "// Auto-synced to parity with en.ts. Run `npx tsx scripts/i18n-sync.ts` after editing en.\n";
const isIdent = (k: string) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k);

function flatten(tree: Tree, prefix = "", out: Map<string, string> = new Map()) {
  for (const [k, v] of Object.entries(tree)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object") flatten(v as Tree, p, out);
    else out.set(p, String(v));
  }
  return out;
}

/** Mirror en's structure; keep existing translations, scaffold gaps from en. */
function rebuild(enTree: Tree, existing: Map<string, string>, missing: string[], prefix = ""): Tree {
  const out: Tree = {};
  for (const [k, v] of Object.entries(enTree)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object") {
      out[k] = rebuild(v as Tree, existing, missing, p);
    } else if (existing.has(p)) {
      out[k] = existing.get(p)!;
    } else {
      out[k] = String(v); // scaffold from en (runtime already falls back to en)
      missing.push(p);
    }
  }
  return out;
}

function serialize(tree: Tree, indent = 1): string {
  const pad = "  ".repeat(indent);
  const lines = Object.entries(tree).map(([k, v]) => {
    const key = isIdent(k) ? k : JSON.stringify(k);
    if (v !== null && typeof v === "object") return `${pad}${key}: ${serialize(v as Tree, indent + 1)},`;
    return `${pad}${key}: ${JSON.stringify(v)},`;
  });
  return `{\n${lines.join("\n")}\n${"  ".repeat(indent - 1)}}`;
}

function main() {
  const check = process.argv.includes("--check");
  const enTree = en as unknown as Tree;
  let changed = false;
  let totalMissing = 0;

  for (const [name, tree] of Object.entries({ fr, pcm, pt, ar })) {
    const missing: string[] = [];
    const rebuilt = rebuild(enTree, flatten(tree as unknown as Tree), missing);
    const body = `${HEADER}export const ${name} = ${serialize(rebuilt)} as const;\n`;
    const file = path.join(LOCALES_DIR, `${name}.ts`);
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    totalMissing += missing.length;

    if (body !== current) {
      changed = true;
      if (missing.length) console.log(`${name}: ${missing.length} key(s) scaffolded from en (need translation):\n  ${missing.join("\n  ")}`);
      if (!check) {
        fs.writeFileSync(file, body, "utf8");
        console.log(`  → wrote ${name}.ts`);
      }
    } else {
      console.log(`${name}: up to date`);
    }
  }

  if (check && changed) {
    console.error(`\nLocales are out of sync with en (${totalMissing} scaffold gap(s)). Run: npx tsx scripts/i18n-sync.ts`);
    process.exit(1);
  }
  console.log(changed ? "\nSync complete." : "\nAll locales already in parity.");
}

main();
