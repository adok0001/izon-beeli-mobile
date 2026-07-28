/**
 * Does the dictionary already have these words?
 *
 *   npx tsx src/seed/lookup-words.ts izon kọn bara ereịn
 *   npx tsx src/seed/lookup-words.ts izon --file /tmp/new-words.txt
 *
 * Read-only. Matching is NFC-normalised lowercase on `word`, the same key
 * `import-izon-master-dictionary.ts` dedupes on — subdot vowels compare equal
 * regardless of how the source encoded them.
 *
 * Why this exists: the unified CSV importer derives a dictionary id with
 * `headwordId(languageId, word)`, but rows already in the table carry opaque ids
 * (`d141` from the seed, `edu-<uuid>` from educators, bare `slugify(word)` from
 * the master-dictionary import — 0 of 10,627 Izon rows match the synthesized
 * form). An import of a word that already exists therefore does NOT upsert — it
 * inserts a duplicate. Check here first and drop the hits from the sheet.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const argv = process.argv.slice(2);
const languageId = argv[0];
if (!languageId || languageId.startsWith("--")) {
  console.error("usage: lookup-words.mts <languageId> <word...> | <languageId> --file <path>");
  process.exit(1);
}

const fileIdx = argv.indexOf("--file");
const words =
  fileIdx >= 0
    ? readFileSync(argv[fileIdx + 1], "utf8").split(/\r?\n/)
    : argv.slice(1);

const norm = (s: string) => s.normalize("NFC").toLowerCase().trim();
const wanted = [...new Set(words.map(norm).filter(Boolean))];
if (wanted.length === 0) {
  console.error("no words given");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);
const rows = (await sql`
  SELECT word, english, category, status
  FROM dictionary_entries
  WHERE language_id = ${languageId}
    AND lower(normalize(word, NFC)) = ANY(${wanted})
`) as { word: string; english: string; category: string; status: string }[];

const found = new Map(rows.map((r) => [norm(r.word), r]));

console.log(`\n## Already in the dictionary (${found.size}) — drop these from the import sheet`);
for (const w of wanted) {
  const hit = found.get(w);
  if (hit) console.log(`  ${hit.word} — ${hit.english} [${hit.category}, ${hit.status}]`);
}

const missing = wanted.filter((w) => !found.has(w));
console.log(`\n## Not in the dictionary (${missing.length}) — these are the new rows`);
for (const w of missing) console.log(`  ${w}`);
console.log();
