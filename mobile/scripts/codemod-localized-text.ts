/**
 * Codemod: convert *Fr suffix fields to LocalizedText maps in lib/data/**
 *
 * Transforms:
 *   translation: "en text", translationFr: "fr text"
 *   → translation: { en: "en text", fr: "fr text" }
 *
 *   title: "en text", titleFr: "fr text"
 *   → title: { en: "en text", fr: "fr text" }
 *
 *   description: "en text", descriptionFr: "fr text"
 *   → description: { en: "en text", fr: "fr text" }
 *
 *   meaning: "en text", meaningFr: "fr text"
 *   → meaning: { en: "en text", fr: "fr text" }
 *
 *   exampleTranslation: "en text", exampleTranslationFr: "fr text"
 *   → exampleTranslation: { en: "en text", fr: "fr text" }
 *
 *   english: "en text", french: "fr text"  (DictionaryEntry pattern)
 *   → english: { en: "en text", fr: "fr text" }  (and drops french: field)
 *
 * Run:
 *   npx tsx scripts/codemod-localized-text.ts [--dry-run] [path...]
 *
 * If no path args given, processes all lib/data files.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");
const pathArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));

function getFiles(): string[] {
  if (pathArgs.length > 0) {
    return pathArgs.map((p) => resolve(p));
  }
  const out = execSync("find lib/data -name '*.ts' ! -name '*.d.ts'", { cwd: ROOT })
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);
  return out.map((p) => resolve(ROOT, p));
}

/**
 * Pairs to convert: [baseField, frField]
 * Order matters: longer field names first to avoid partial matches.
 */
const FIELD_PAIRS: [string, string][] = [
  ["translationFr",      "translation"],   // handled differently — frField IS the base
  ["titleFr",            "title"],
  ["descriptionFr",      "description"],
  ["meaningFr",          "meaning"],
  ["exampleTranslationFr", "exampleTranslation"],
];

// Dictionary-specific: english/french → english map
const DICT_PAIRS: [string, string][] = [
  ["french", "english"],
];

/**
 * Given file content as a string, apply all transformations and return the result.
 *
 * Strategy: regex-based line-by-line substitution.
 *
 * For each pair (base, fr):
 *   Find lines like:   baseField: "...",
 *   Peek at next line: frField: "...",
 *   Replace both lines with a single: baseField: { en: "...", fr: "..." },
 */
const STR = `"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|null|undefined`;

function transform(src: string): string {
  let out = src;

  for (const [frField, baseField] of FIELD_PAIRS) {
    // ── Case 1: inline — both fields on the same line ────────────────────────
    // e.g.:  translation: "Good morning!",  translationFr: "Bonjour !",
    const reInline = new RegExp(
      `(${baseField}):\\s*(${STR}),\\s*${frField}:\\s*(${STR}),?`,
      "g"
    );
    out = out.replace(reInline, (_, _base, enVal, frVal) => {
      if (frVal === "null" || frVal === "undefined") return `${_base}: ${enVal},`;
      return `${_base}: { en: ${enVal}, fr: ${frVal} },`;
    });

    // ── Case 2: multi-line — base on one line, fr on the next ────────────────
    const reMulti = new RegExp(
      `([ \\t]*)(${baseField}):\\s*(${STR}),?\\s*\\n` +
      `([ \\t]*)(${frField}):\\s*(${STR}),?`,
      "g"
    );
    out = out.replace(reMulti, (_, indent, _base, enVal, _i2, _fr, frVal) => {
      if (frVal === "null" || frVal === "undefined") return `${indent}${_base}: ${enVal},`;
      return `${indent}${_base}: { en: ${enVal}, fr: ${frVal} },`;
    });

    // ── Orphan: lone frField line left after above passes ─────────────────────
    const reLone = new RegExp(
      `^([ \\t]*)(${frField}):\\s*(${STR}),?\\s*$`,
      "gm"
    );
    out = out.replace(reLone, "// CODEMOD_ORPHAN: $2: $3");
  }

  // Dictionary pattern: english: "...", french: "..." → english: { en: "...", fr: "..." }
  for (const [frField, baseField] of DICT_PAIRS) {
    const reInline = new RegExp(`(${baseField}):\\s*(${STR}),\\s*${frField}:\\s*(${STR}),?`, "g");
    out = out.replace(reInline, (_, _base, enVal, frVal) => {
      if (frVal === "null" || frVal === "undefined") return `${_base}: ${enVal},`;
      return `${_base}: { en: ${enVal}, fr: ${frVal} },`;
    });
    const reMulti = new RegExp(
      `([ \\t]*)(${baseField}):\\s*(${STR}),?\\s*\\n([ \\t]*)(${frField}):\\s*(${STR}),?`, "g"
    );
    out = out.replace(reMulti, (_, indent, _base, enVal, _i2, _fr, frVal) => {
      if (frVal === "null" || frVal === "undefined") return `${indent}${_base}: ${enVal},`;
      return `${indent}${_base}: { en: ${enVal}, fr: ${frVal} },`;
    });
  }

  return out;
}

function main() {
  const files = getFiles();
  let changed = 0;
  let unchanged = 0;
  const orphans: string[] = [];

  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const result = transform(src);

    const hasOrphans = result.includes("// CODEMOD_ORPHAN:");
    if (hasOrphans) {
      orphans.push(relative(ROOT, file));
    }

    if (result !== src) {
      changed++;
      const rel = relative(ROOT, file);
      if (DRY_RUN) {
        console.log(`[dry-run] would change: ${rel}`);
      } else {
        writeFileSync(file, result, "utf8");
        console.log(`✓ ${rel}`);
      }
    } else {
      unchanged++;
    }
  }

  console.log(`\n${DRY_RUN ? "[dry-run] " : ""}${changed} files changed, ${unchanged} unchanged.`);

  if (orphans.length > 0) {
    console.log(`\n⚠️  CODEMOD_ORPHAN markers in ${orphans.length} file(s) — review manually:`);
    for (const f of orphans) console.log(`   ${f}`);
  }
}

main();
