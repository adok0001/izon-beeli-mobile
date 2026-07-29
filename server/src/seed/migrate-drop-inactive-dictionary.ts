import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

/**
 * Delete the inactive dictionary entries — 6,268 Izon drafts, never published,
 * to be re-imported in a later pass once they have been reviewed.
 *
 *   npx tsx src/seed/migrate-drop-inactive-dictionary.ts          # export + report
 *   npx tsx src/seed/migrate-drop-inactive-dictionary.ts --apply  # export, then delete
 *
 * DESTRUCTIVE, and separately authorized — never fold this into a deploy.
 * `drizzle-kit push` cannot do it anyway: dropping rows in CI has no TTY to
 * confirm data loss, which is why deletions live in explicit scripts like this.
 *
 * The export always runs, including on a dry run and before any delete. These
 * rows' gloss text exists nowhere else — no contributor, creator, audio or
 * pronunciation on a single one of them, so a CSV is the only copy there will
 * be. It is written in the unified-import column format, so "a later pass" is
 * literally re-uploading this file through Studio's bulk import.
 *
 * Refuses to delete if anything references a row it is about to remove. There
 * are no FK constraints on `dictionary_entries` in the live database, so the
 * check is by hand and the script is the only thing standing between a delete
 * and a dangling id.
 */

const sql = neon(process.env.DATABASE_URL!);

/** Tables holding a logical (unconstrained) pointer at a dictionary entry. */
const REFERRERS = ["contributions", "word_bank"] as const;

type Row = {
  id: string;
  language_id: string;
  word: string;
  english: string;
  category: string;
  pronunciation: string | null;
  example: string | null;
  example_translation: string | null;
  status: string;
};

/** RFC 4180 quoting, always — glosses are full of commas and semicolons. */
function csv(rows: (string | null)[][]): string {
  return rows
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

async function run() {
  const apply = process.argv.includes("--apply");

  const rows = (await sql`
    select id, language_id, word, english, category, pronunciation,
           example, example_translation, status
    from dictionary_entries
    where is_active = false
    order by language_id, word
  `) as Row[];

  if (rows.length === 0) {
    console.log("No inactive dictionary entries. Nothing to do.");
    process.exit(0);
  }

  const byLanguage = new Map<string, number>();
  for (const r of rows) byLanguage.set(r.language_id, (byLanguage.get(r.language_id) ?? 0) + 1);
  console.log(`\n${rows.length} inactive dictionary entries:`);
  console.table([...byLanguage.entries()].map(([language, n]) => ({ language, n })));

  // A published row must never be caught by this. `is_active` is the Studio
  // visibility switch and `status` is the editorial state — they are separate
  // columns, and an active/published mismatch means someone hid a live entry
  // rather than left a draft unfinished.
  const published = rows.filter((r) => r.status === "published");
  if (published.length > 0) {
    console.log(`\n❌ ${published.length} of these are status=published, not drafts:`);
    console.table(published.slice(0, 10).map(({ id, word, status }) => ({ id, word, status })));
    console.log("Refusing to touch published content. Resolve these first.");
    process.exit(1);
  }

  // `backups/`, not `tmp/` — after the delete this file is the only copy of
  // 6,268 glosses, and a directory named tmp invites exactly the cleanup that
  // would destroy them.
  const dir = join(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "inactive-dictionary-entries.csv");
  writeFileSync(
    path,
    // BOM so Excel reads the subdots and tone marks as UTF-8.
    `﻿${csv([
      ["type", "id", "text", "english", "category", "pronunciation", "example", "example_english"],
      ...rows.map((r) => [
        "dictionary", r.id, r.word, r.english, r.category,
        r.pronunciation, r.example, r.example_translation,
      ]),
    ])}\r\n`,
    "utf8",
  );
  console.log(`\nExported ${rows.length} rows → ${path}`);
  console.log("Re-importable through Studio's bulk import; ids are preserved, so a");
  console.log("re-upload restores these exact entries rather than creating new ones.");

  let blocked = false;
  for (const table of REFERRERS) {
    const [{ n }] = (await sql.query(
      `select count(*)::int n from ${table} x
       join dictionary_entries d on d.id = x.dictionary_entry_id
       where d.is_active = false`,
    )) as unknown as { n: number }[];
    console.log(`  ${table}: ${n} rows reference an entry being deleted`);
    if (n > 0) blocked = true;
  }

  if (blocked) {
    console.log("\n❌ Something still points at these entries. Deleting would leave dangling ids.");
    process.exit(1);
  }

  if (!apply) {
    console.log("\nDry run. Nothing deleted. Re-run with --apply once the export is safe.");
    process.exit(0);
  }

  const deleted = (await sql`
    delete from dictionary_entries where is_active = false returning id
  `) as { id: string }[];

  console.log(`\n✅ Deleted ${deleted.length} entries. The export above is now the only copy.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Inactive dictionary cleanup failed:", err);
  process.exit(1);
});
