/**
 * Audit dictionary coverage of lesson transcripts.
 *
 * For each language (or one passed as an argument), lists transcript words
 * that have no dictionary entry and no approved word contribution — each with a
 * probable English gloss from the language's sourced word list, so the output is
 * a work list rather than a pile of unknown tokens.
 *
 *   npx tsx src/seed/audit-dictionary-coverage.ts [languageId]
 *
 * Replaces the deleted `scripts/izon-audit.mjs`, which diffed the same thing out
 * of the `mobile/lib/data/*` TypeScript files that commit 5b8dcfc removed. Its
 * gloss inference is preserved below; its "Bucket B" false-positive split is
 * not — see GLOSS_SOURCES.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  contributions,
  courses,
  dictionaryEntries,
  englishWordbank,
  lessons,
  transcriptSegments,
} from "../db/schema.js";
import { computeCoverage, tokenize } from "../lib/dictionary-coverage.js";

/**
 * Sourced `<native>,<english>,<source>,<date>` word lists, per language. Every
 * row traces to a published dictionary, an academic paper, or a dated tutor
 * lesson note, so a gloss taken from here carries provenance — unlike the
 * regex-parsed dictionary PDF the old audit script inferred from, which its own
 * comments admitted bled continuation text across entries.
 *
 * A language with no list here simply gets no gloss column.
 */
const GLOSS_SOURCES: Record<string, string> = {
  izon: new URL("../../../userio-docs/izon_master_dictionary.csv", import.meta.url).pathname,
};

/**
 * Token → probable English, built from a sourced word list.
 *
 * Single-token rows give a direct gloss. Rows of 2–3 tokens index each of their
 * words against the whole phrase's gloss, which is looser but is what makes an
 * unglossed token in a drill line traceable at all; direct hits always win, and
 * the phrase is printed alongside so the reader can see it is contextual.
 *
 * The old script also bucketed tokens as "probable inflection" or "diacritic
 * variant" by scanning every token against every dictionary word. That is
 * dropped deliberately: measured against the current corpus, its rule ("starts
 * or ends with any ≥3-char dictionary word") fires on 486 of the 1,576 uncovered
 * transcript tokens of 4+ characters — 31%. A bucket that quietly demotes a
 * third of the real gaps to "probably fine" is worse than no bucket, since the
 * point of this report is to not miss any.
 */
interface Gloss {
  english: string;
  /** Set when the gloss came from a multi-word row, not a headword of its own. */
  phrase?: string;
}

/**
 * Rows sourced from the published dictionary carry the whole entry — part of
 * speech, every sense, compounds, and a worked example. That is the right thing
 * to keep in the CSV and the wrong thing to print in a 600-row report, so the
 * report shows the first sense only. The full entry stays one grep away.
 */
const POS_PREFIX = /^(n|v\.?[ti]?|adj|adv|excl|conj|pron|num|interj|prep|aux|part|loc|id)\.\s*/i;
const MAX_GLOSS = 52;

function firstSense(english: string): string {
  const head = english.split(/[;:]/)[0].replace(POS_PREFIX, "").trim() || english.trim();
  return head.length > MAX_GLOSS ? `${head.slice(0, MAX_GLOSS - 1)}…` : head;
}

interface GlossIndex {
  /** Exact token match — the only kind quoted without a caveat. */
  exact: Map<string, Gloss>;
  /** Tone-folded token → every headword that collapses onto it. */
  toneless: Map<string, { native: string; gloss: Gloss }[]>;
}

/**
 * Tone marks are meaning-bearing in Ịzọn, so folding them is a search aid, never
 * an equivalence: `torú` (native chalk) and `toru` (river) differ by tone alone.
 * The subdot vowels ẹ ị ọ ụ are separate letters and are deliberately preserved —
 * only U+0300–U+030C combining accents come off.
 */
const TONE_MARKS = /[̀-̌]/g;
const foldTone = (s: string) => s.normalize("NFD").replace(TONE_MARKS, "").normalize("NFC");

function loadGlosses(languageId: string): GlossIndex {
  const index: GlossIndex = { exact: new Map(), toneless: new Map() };
  const path = GLOSS_SOURCES[languageId];
  if (!path) return index;

  let csv: string;
  try {
    csv = readFileSync(path, "utf8");
  } catch {
    console.warn(`  (no gloss source at ${path} — continuing without glosses)`);
    return index;
  }

  const addToneless = (native: string, gloss: Gloss) => {
    const key = foldTone(tokenize(native)[0] ?? "");
    if (!key) return;
    const bucket = index.toneless.get(key) ?? [];
    if (!bucket.some((c) => c.gloss.english === gloss.english)) bucket.push({ native, gloss });
    index.toneless.set(key, bucket);
  };

  // Two passes so a direct single-token gloss always beats a phrase-derived one,
  // regardless of which row came first in the file.
  const phraseRows: { tokens: string[]; english: string; native: string }[] = [];
  for (const line of csv.split("\n").slice(1)) {
    const [native, english] = splitCsvLine(line);
    if (!native || !english) continue;
    const tokens = tokenize(native);
    if (tokens.length === 1) {
      if (!index.exact.has(tokens[0])) index.exact.set(tokens[0], { english });
      addToneless(tokens[0], { english });
    } else if (tokens.length <= 3) {
      phraseRows.push({ tokens, english, native });
    }
  }
  for (const row of phraseRows) {
    for (const token of row.tokens) {
      if (!index.exact.has(token)) index.exact.set(token, { english: row.english, phrase: row.native });
    }
  }
  return index;
}

/**
 * Render one word's gloss for the report. Everything that is not an exact
 * headword match is labelled as what it is — a lead to check, not a definition.
 * Nothing here may read as attested Ịzọn the educator can paste unchecked.
 */
function describeGloss(word: string, index: GlossIndex): string {
  const exact = index.exact.get(word);
  if (exact) {
    const sense = firstSense(exact.english);
    return exact.phrase ? `${sense}  [in: ${exact.phrase}]` : sense;
  }

  const candidates = index.toneless.get(foldTone(word)) ?? [];
  if (candidates.length === 1) {
    return `${firstSense(candidates[0].gloss.english)}  [? tone: ${candidates[0].native}]`;
  }
  if (candidates.length > 1) {
    const shown = candidates.slice(0, 2).map((c) => `${c.native} = ${firstSense(c.gloss.english)}`).join(" / ");
    const more = candidates.length > 2 ? ` +${candidates.length - 2}` : "";
    return `[? tone: ${shown}${more}]`;
  }
  return "—";
}

/** Split the first two fields of a CSV line, honouring double quotes. */
function splitCsvLine(line: string): [string, string] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length && fields.length < 2; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { fields.push(field); field = ""; }
    else field += ch;
  }
  fields.push(field);
  return [(fields[0] ?? "").trim(), (fields[1] ?? "").trim()];
}

async function auditLanguage(languageId: string, englishWords: string[]) {
  const lessonRows = await db
    .select({ id: lessons.id, title: lessons.title })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(courses.languageId, languageId));
  const lessonsById = new Map(lessonRows.map((l) => [l.id, l]));

  const segments = lessonRows.length
    ? await db
        .select({ lessonId: transcriptSegments.lessonId, text: transcriptSegments.text })
        .from(transcriptSegments)
        .where(inArray(transcriptSegments.lessonId, lessonRows.map((l) => l.id)))
    : [];

  const dictRows = await db
    .select({ word: dictionaryEntries.word })
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId));
  const approvedContribs = await db
    .select({ word: contributions.word })
    .from(contributions)
    .where(
      and(
        eq(contributions.status, "approved"),
        eq(contributions.languageId, languageId),
        notInArray(contributions.type, ["entry_audio", "entry_image", "entry_meaning"]),
      )
    );

  const report = computeCoverage(
    segments,
    [...dictRows, ...approvedContribs].map((r) => r.word),
    lessonsById,
    englishWords,
  );

  const pct = report.distinctWords
    ? Math.round((report.coveredWords / report.distinctWords) * 100)
    : 100;
  const glosses = loadGlosses(languageId);
  const exact = report.missing.filter((m) => glosses.exact.has(m.word)).length;

  console.log(
    `\n${languageId}: ${report.coveredWords}/${report.distinctWords} transcript words covered (${pct}%), ` +
    `${report.missing.length} missing, ${lessonRows.length} lessons, ${dictRows.length} dictionary entries`
  );
  if (glosses.exact.size) {
    console.log(
      `  ${exact} of ${report.missing.length} missing words match a sourced headword exactly. ` +
      `A "[?" gloss is a lead to verify, not an attested meaning.`
    );
  }
  for (const m of report.missing) {
    const where = m.lessons.map((l) => l.title).join(", ");
    console.log(
      `  ${m.word.padEnd(24)} ×${String(m.count).padEnd(4)} ${describeGloss(m.word, glosses).padEnd(46)} ${where}`
    );
  }
}

async function main() {
  const arg = process.argv[2];
  const languageIds = arg
    ? [arg]
    : (await db.selectDistinct({ languageId: courses.languageId }).from(courses))
        .map((r) => r.languageId)
        .sort((a, b) => a.localeCompare(b));

  const englishWords = (
    await db.select({ word: englishWordbank.word }).from(englishWordbank)
  ).map((r) => r.word);

  for (const languageId of languageIds) await auditLanguage(languageId, englishWords);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
