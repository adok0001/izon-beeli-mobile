import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync } from "node:fs";
import { slugify } from "../lib/slug.js";

/**
 * Import `userio-docs/izon_master_dictionary.csv` into `dictionary_entries`.
 *
 *   npx tsx src/seed/import-izon-master-dictionary.ts          # dry run (default)
 *   npx tsx src/seed/import-izon-master-dictionary.ts --apply  # write
 *
 * The file is 10,175 sourced rows — 5,354 from the published Ịzọn dictionary,
 * 1,308 from dated tutor lesson notes, 276 from G.T. Prezi's academic
 * introduction, 233 from the numeral-system paper. Every row carries its
 * source and date, which is why this is a better seed than the 8,038 headwords
 * currently trapped in `course-izon-dc`'s fake lessons with no provenance.
 *
 * DEDUPE KEYS ON `word`, NOT ON id. Existing Izon entries carry opaque ids
 * (`d141` from the seed, `edu-<uuid>` from educators) — none is `slugify(word)`.
 * An id-keyed import therefore collides with nothing and would insert a second
 * copy of all 3,286 words that already exist. Matching is on NFC-normalised
 * lowercase `word`, so subdot vowels compare equal regardless of how the source
 * encoded them.
 *
 * Category comes from the part-of-speech tag the dictionary itself prints
 * (`v.t.`, `n.m.`, `adj.`, `id.`). Rows with no tag are lesson-note sentences
 * and become `phrases`/`greetings`. Nothing is defaulted to `nouns`: a
 * wrong-but-valid category passes validation and is never flagged again.
 */
const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);
const CSV = "/Users/tamaraadokeme/Projects/beeli/userio-docs/izon_master_dictionary.csv";
const HELD_CSV = "/Users/tamaraadokeme/Projects/beeli/userio-docs/izon-uncategorised-for-educator.csv";

function parseRows(t: string): string[][] {
  const out: string[][] = []; let r: string[] = [], f = "", q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { r.push(f); f = ""; }
    else if (c === "\n") { r.push(f); out.push(r); r = []; f = ""; }
    else if (c !== "\r") f += c; }
  if (f || r.length) { r.push(f); out.push(r); }
  return out;
}

/** Part-of-speech prefix → category. Order matters: `n.m.` must beat a bare `n`. */
const POS: [RegExp, string][] = [
  [/^v\.t\.|^v\.i\.|^v\b|^vb\b/i, "verbs"],
  [/^n\.m\.|^n\.f\.|^n\b/i, "nouns"],
  [/^adj\b/i, "adjectives"],
  [/^num\b/i, "numbers"],
  [/^pron\b/i, "pronouns"],
  [/^adv\b/i, "adverbs"],
  [/^interj\b/i, "greetings"],
  [/^id\b|^ideoph/i, "ideophones"],
];

/**
 * Untagged rows carry no part-of-speech marker, so category is read off the
 * shape of the entry — never defaulted. `null` means "I cannot justify a
 * category", and the row is held back rather than filed as a noun: a
 * wrong-but-valid category passes validation and nothing downstream ever
 * flags it again.
 */
function fallbackCategory(izon: string, english: string): string | null {
  const w = izon.trim(), g = english.trim().toLowerCase();

  if (/^\(greeting|^\(response/i.test(g)) return "greetings";
  // Fixed courtesy formulas the lesson notes drill as whole units.
  if (/^(good (morning|afternoon|evening|night)|thank you|welcome|hello|goodbye|good ?bye|please)\b/.test(g)) return "greetings";

  // "1 (one)", "5 (five)" — the numeral sheets from the counting lessons.
  if (/^\d+\s*(\(|$)/.test(g)) return "numbers";

  // `-dẹịn` is the comparative suffix; the gloss confirms it ("longer", "wiser").
  if (/dẹịn$/.test(w) || /^(more|less)\s|\b(er|est)$/.test(g)) return "adjectives";

  if (/\?$/.test(w)) return "phrases";
  if (/\s/.test(w)) return "phrases";   // multi-word → a phrase, not a headword
  return null;
}

const norm = (s: string) => s.toLowerCase().normalize("NFC").trim();
/** A row whose headword has no letters once combining marks are stripped is a PDF artifact. */
const hasLetters = (s: string) => /[a-zA-ZĀ-ɏḀ-ỿ]/.test(s.normalize("NFKD").replace(/[̀-ͯ]/g, ""));

const raw = readFileSync(CSV, "utf8").replace(/^﻿/, "");
const rows = parseRows(raw);
const head = rows[0].map((h) => h.trim());
const all = rows.slice(1).filter((r) => r.length >= 2)
  .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])) as Record<string, string>)
  .filter((x) => x.izon && x.english);

const corrupt = all.filter((x) => !hasLetters(x.izon));
const clean = all.filter((x) => hasLetters(x.izon));

const existing = await sql`select word from dictionary_entries where language_id = 'izon'`;
const have = new Set(existing.map((e: { word: string }) => norm(e.word)));

const seen = new Set<string>();          // in-file dedupe (identical word+gloss repeats)
const usedIds = new Set<string>(
  (await sql`select id from dictionary_entries`).map((r: { id: string }) => r.id),
);

/**
 * `english` is varchar(500) but 115 source rows are full multi-sense dictionary
 * articles, the longest 4,469 characters. Truncating alone would silently amputate
 * real lexicography, so the headline sense goes in `english` and the COMPLETE
 * original text is preserved in `example` (unbounded `text`). Nothing is lost;
 * the long tail is one click away in Studio instead of gone.
 */
const LIMIT = 500;
function splitGloss(english: string): { short: string; full: string | null } {
  if (english.length <= LIMIT) return { short: english, full: null };
  // Cut at the last sense/clause boundary that fits, so the stored gloss ends
  // on a real break rather than mid-word.
  const head = english.slice(0, LIMIT - 1);
  const cut = Math.max(head.lastIndexOf("; "), head.lastIndexOf(": "), head.lastIndexOf(". "));
  return { short: (cut > 80 ? head.slice(0, cut) : head).trimEnd() + "…", full: english };
}

const toInsert: { id: string; word: string; english: string; full: string | null; category: string; source: string }[] = [];
let skippedExisting = 0, skippedDupeInFile = 0;
const heldBack: Record<string, string>[] = [];
const catTally: Record<string, number> = {};

for (const x of clean) {
  const key = norm(x.izon);
  if (have.has(key)) { skippedExisting++; continue; }

  const pair = `${key}||${norm(x.english)}`;
  if (seen.has(pair)) { skippedDupeInFile++; continue; }
  seen.add(pair);

  const hit = POS.find(([re]) => re.test(x.english));
  const category = hit ? hit[1] : fallbackCategory(x.izon, x.english);
  if (!category) { heldBack.push(x); continue; }
  catTally[category] = (catTally[category] ?? 0) + 1;

  // Homographs are distinct entries (oru "old" vs oru "idol"), so a taken id is
  // suffixed rather than overwritten — never let one sense clobber another.
  let id = slugify(x.izon) || "entry";
  if (usedIds.has(id)) { let n = 2; while (usedIds.has(`${id}-${n}`)) n++; id = `${id}-${n}`; }
  usedIds.add(id);

  const { short, full } = splitGloss(x.english);
  toInsert.push({ id, word: x.izon, english: short, full, category, source: x.source || "" });
}

console.log(`file rows ................ ${all.length}`);
console.log(`  dropped, PDF artifacts . ${corrupt.length}`);
console.log(`  already in dictionary .. ${skippedExisting}  (matched on word)`);
console.log(`  duplicate within file .. ${skippedDupeInFile}`);
console.log(`  held back, no category . ${heldBack.length}`);
console.log(`  TO INSERT .............. ${toInsert.length}`);
console.log(`\ncategories:`);
for (const [k, v] of Object.entries(catTally).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${String(v).padStart(5)}  ${k}`);
}
if (heldBack.length) {
  // Held-back rows are written out, not dropped. They are real attested words
  // (child, girl, plentiful, meatseller) whose only problem is that the source
  // printed no part-of-speech tag. One pass by an educator over this sheet
  // turns them into a normal unified import — same contract as the M1
  // dictionary request. Losing them silently would be the worse outcome.
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = ["type,text,english,category,pronunciation,example,example_english"];
  for (const h of heldBack) csv.push(["dictionary", esc(h.izon), esc(h.english), "", "", "", ""].join(","));
  writeFileSync(HELD_CSV, csv.join("\n") + "\n", "utf8");
  console.log(`\nheld back (no justifiable category): ${heldBack.length} → ${HELD_CSV}`);
  console.log(`   fill the empty \`category\` column, then import as a normal unified CSV.`);
  for (const h of heldBack.slice(0, 6)) console.log(`   e.g. ${h.izon.padEnd(18)} ${h.english.slice(0, 52)}`);
}
console.log(`\nsamples:`);
for (const t of toInsert.slice(0, 5)) console.log(`   ${t.id.padEnd(24)} ${t.word.padEnd(18)} [${t.category}] ${t.english.slice(0, 46)}`);

if (!APPLY) {
  console.log(`\ndry run — re-run with --apply to write.`);
} else {
  // Entries land as drafts, not published: 6,797 unreviewed rows going live at
  // once would swamp the dictionary a learner sees. An educator promotes them.
  const SIZE = 500;
  let done = 0;
  for (let i = 0; i < toInsert.length; i += SIZE) {
    const batch = toInsert.slice(i, i + SIZE);
    await sql`
      insert into dictionary_entries (id, language_id, word, english, example, category, status, is_active, contributor_name)
      select * from unnest(
        ${batch.map((b) => b.id)}::varchar[],
        ${batch.map(() => "izon")}::varchar[],
        ${batch.map((b) => b.word)}::varchar[],
        ${batch.map((b) => b.english)}::varchar[],
        ${batch.map((b) => b.full)}::text[],
        ${batch.map((b) => b.category)}::varchar[],
        ${batch.map(() => "draft")}::content_status[],
        ${batch.map(() => false)}::boolean[],
        ${batch.map((b) => b.source.slice(0, 200))}::varchar[]
      )
      on conflict (id) do nothing`;
    done += batch.length;
    process.stdout.write(`\r  inserted ${done}/${toInsert.length}`);
  }
  const [after] = await sql`select count(*)::int n from dictionary_entries where language_id='izon'`;
  console.log(`\n\napplied — dictionary_entries for izon is now ${after.n}.`);
}
