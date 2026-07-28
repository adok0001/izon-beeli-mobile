/**
 * Which lesson notes have been processed?
 *
 *   npx tsx src/seed/note-status.ts            # every tutor note in userio-docs
 *   npx tsx src/seed/note-status.ts --extras   # the dated sections of the extras file
 *
 * Read-only.
 *
 * There is no ledger column: `dictionary_entries` records who created a row and
 * when it was published, but never which note it came from. So "processed" can't
 * be looked up — it has to be inferred from three independent signals, which this
 * report puts side by side:
 *
 *   EXTRACTED  the note appears in userio-docs/izon_lesson_notes_content.csv
 *              (someone parsed it into glossed lines)
 *   SOURCED    the note is cited in userio-docs/izon_master_dictionary.csv
 *              (its lines made it into the sourced word list)
 *   IN DB      what share of the note's distinct Ịzọn tokens now exist in
 *              dictionary_entries — the closest thing to "did this reach learners"
 *
 * A note can be fully EXTRACTED and still be 0% IN DB. High IN DB is evidence,
 * not proof: common words are shared across notes, so a note of ordinary
 * vocabulary scores high whether or not anyone imported it. Treat a low score as
 * a reliable "not done" and a high score as "probably done, spot-check it".
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const DOCS = new URL("../../../userio-docs/", import.meta.url).pathname;
const CORPUS = `${DOCS}izon_lesson_notes_content.csv`;
const MASTER = `${DOCS}izon_master_dictionary.csv`;
const EXTRAS = `${DOCS}Izon_Lesson Notes Extras`;

const norm = (s: string) => s.normalize("NFC").toLowerCase().trim();

/**
 * Filename key. macOS `readdirSync` hands back NFD (`Ị` as I + combining dot)
 * while the CSVs store NFC, so raw string comparison reports every note as
 * unprocessed. Normalise both sides before matching.
 */
const fileKey = (s: string) => s.normalize("NFC").trim();
const TOKEN_RE = /[\p{L}\p{M}\p{N}'’-]+/gu;
const tokensOf = (text: string) =>
  (text.match(TOKEN_RE) ?? []).map(norm).filter((t) => t.length > 1 && !/^\p{N}+$/u.test(t));

/** Split a CSV line into fields, honouring double quotes. */
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(field); field = ""; }
    else field += ch;
  }
  out.push(field);
  return out;
}

const sql = neon(process.env.DATABASE_URL!);
const dictWords = (await sql`SELECT word FROM dictionary_entries WHERE language_id='izon'`) as { word: string }[];
const inDict = new Set<string>();
for (const r of dictWords) for (const t of tokensOf(r.word)) inDict.add(t);

/** Share of `tokens` already present in the dictionary, as a percentage. */
function dbCoverage(tokens: Set<string>): string {
  if (tokens.size === 0) return "    —";
  const hit = [...tokens].filter((t) => inDict.has(t)).length;
  return `${String(Math.round((hit / tokens.size) * 100)).padStart(3)}% (${hit}/${tokens.size})`;
}

// ── corpus + master citations, keyed by source filename ──────────────────────
const corpusTokens = new Map<string, Set<string>>();
for (const line of readFileSync(CORPUS, "utf8").split("\n").slice(1)) {
  const [sourceFile, , , izon] = splitCsv(line);
  if (!sourceFile || !izon) continue;
  const key = fileKey(sourceFile);
  const set = corpusTokens.get(key) ?? new Set<string>();
  for (const t of tokensOf(izon)) set.add(t);
  corpusTokens.set(key, set);
}

const masterRows = new Map<string, number>();
for (const line of readFileSync(MASTER, "utf8").split("\n").slice(1)) {
  const source = splitCsv(line)[2];
  if (source) masterRows.set(fileKey(source), (masterRows.get(fileKey(source)) ?? 0) + 1);
}

function reportNotes() {
  const notes = readdirSync(DOCS).filter((f) => f.includes("LESSON NOTE")).sort();
  console.log(`\n${notes.length} tutor notes in userio-docs/\n`);
  console.log(`${"note".padEnd(52)} ${"extracted".padEnd(10)} ${"sourced".padEnd(9)} in db`);
  console.log("-".repeat(96));
  for (const note of notes) {
    const tokens = corpusTokens.get(fileKey(note));
    const rows = masterRows.get(fileKey(note)) ?? 0;
    console.log(
      `${note.slice(0, 51).padEnd(52)} ${(tokens ? "yes" : "NO").padEnd(10)} ` +
      `${(rows ? String(rows) : "NO").padEnd(9)} ${tokens ? dbCoverage(tokens) : "—"}`
    );
  }
  const untouched = notes.filter((n) => !corpusTokens.has(fileKey(n)) && !masterRows.has(fileKey(n)));
  if (untouched.length) {
    console.log(`\n${untouched.length} note(s) with no trace anywhere — start here:`);
    for (const n of untouched) console.log(`  ${n}`);
  }
}

function reportExtras() {
  const lines = readFileSync(EXTRAS, "utf8").split("\n");
  const sections: { date: string; tokens: Set<string>; entries: number }[] = [];
  for (const line of lines) {
    if (/^\d{4}$/.test(line.trim())) {
      sections.push({ date: line.trim(), tokens: new Set(), entries: 0 });
      continue;
    }
    const current = sections.at(-1);
    // Prose starts once lines stop looking like notebook entries; the dated
    // sections are short, so stop at the first long paragraph.
    if (!current || line.length > 200) break;
    const izon = line.split(",")[0];
    if (!izon.trim()) continue;
    current.entries++;
    for (const t of tokensOf(izon)) current.tokens.add(t);
  }
  console.log(`\n${sections.length} dated section(s) in "Izon_Lesson Notes Extras"\n`);
  console.log(`${"section".padEnd(10)} ${"lines".padEnd(7)} in db`);
  console.log("-".repeat(40));
  for (const s of sections) {
    console.log(`${s.date.padEnd(10)} ${String(s.entries).padEnd(7)} ${dbCoverage(s.tokens)}`);
  }
  console.log(
    `\nThe extras file has no per-section record of what was imported. Until a run ` +
    `logs it,\nthese percentages are the only signal — a section near 0% is certainly outstanding.`
  );
}

if (process.argv.includes("--extras")) reportExtras();
else reportNotes();
process.exit(0);
