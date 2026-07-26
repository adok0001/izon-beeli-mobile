import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * DESTRUCTIVE. Drops the legacy `<field>_fr` sidecar columns now that every
 * translatable field lives in its `<field>_translations` jsonb map.
 *
 * `drizzle-kit push` refuses destructive changes in CI (a column drop needs an
 * interactive TTY to confirm data loss), so this exists as an explicit,
 * reviewable, non-interactive migration — see CLAUDE.md.
 *
 *   npx tsx src/seed/migrate-drop-fr-columns.ts          # dry run (prints plan)
 *   npx tsx src/seed/migrate-drop-fr-columns.ts --apply  # DROPS THE COLUMNS
 *
 * ONLY run this after ALL of:
 *   1. `migrate-translations-maps.ts --apply` has run,
 *   2. the code that reads/writes only maps is deployed to production,
 *   3. `migrate-translations-maps.ts --apply` has run a second time (catching
 *      rows written by the old code between steps 1 and 2).
 *
 * The preflight below enforces (1) and (3): it refuses to drop a column while any
 * row still has content in it that never made it into the map.
 */

const sql = neon(process.env.DATABASE_URL!);

/** Each legacy column, paired with the map that must already carry its content. */
const DROPS: { table: string; column: string; map: string }[] = [
  { table: "courses", column: "title_fr", map: "title_translations" },
  { table: "courses", column: "description_fr", map: "description_translations" },
  { table: "lessons", column: "title_fr", map: "title_translations" },
  { table: "lessons", column: "description_fr", map: "description_translations" },
  { table: "lessons", column: "can_do_fr", map: "can_do_translations" },
  { table: "feed_items", column: "title_fr", map: "title_translations" },
  { table: "feed_items", column: "description_fr", map: "description_translations" },
  { table: "cultural_content", column: "title_fr", map: "title_translations" },
  { table: "cultural_content", column: "description_fr", map: "description_translations" },
  { table: "proverbs", column: "translation_fr", map: "translations" },
  { table: "proverbs", column: "meaning_fr", map: "meaning_translations" },
  { table: "transcript_segments", column: "translation_fr", map: "translations" },
  { table: "dictionary_entries", column: "french", map: "translations" },
  { table: "dictionary_entries", column: "example_translation_fr", map: "example_translations" },
  { table: "daily_challenge_templates", column: "title_fr", map: "title_translations" },
  { table: "daily_challenge_templates", column: "description_fr", map: "description_translations" },
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = (await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
  `) as unknown[];
  return rows.length > 0;
}

/**
 * Rows whose French text is NOT already in the map — dropping the column would
 * lose them. Any non-zero count aborts the whole run.
 */
async function unmigratedCount(table: string, column: string, map: string): Promise<number> {
  const rows = (await sql.query(`
    SELECT count(*)::int AS n FROM "${table}"
    WHERE nullif(btrim("${column}"), '') IS NOT NULL
      AND ("${map}" IS NULL OR "${map}" ->> 'fr' IS DISTINCT FROM btrim("${column}"))
  `)) as { n: number }[];
  return rows[0]?.n ?? 0;
}

async function run() {
  const apply = process.argv.includes("--apply");

  console.log(`\nDrop legacy *_fr columns — ${apply ? "APPLY (DESTRUCTIVE)" : "DRY RUN"}\n`);

  const plan: { table: string; column: string }[] = [];
  const blocked: string[] = [];

  for (const d of DROPS) {
    const label = `${d.table}.${d.column}`;

    if (!(await columnExists(d.table, d.column))) {
      console.log(`  · ${label.padEnd(46)} already gone`);
      continue;
    }
    if (!(await columnExists(d.table, d.map))) {
      blocked.push(`${label}: map column "${d.map}" does not exist — run migrate-translations-maps.ts first`);
      continue;
    }

    const pending = await unmigratedCount(d.table, d.column, d.map);
    if (pending > 0) {
      blocked.push(`${label}: ${pending} row(s) still hold French not present in "${d.map}"`);
      continue;
    }

    plan.push(d);
    console.log(`  ${apply ? "→" : "·"} ${label.padEnd(46)} safe to drop`);
  }

  if (blocked.length > 0) {
    console.error("\nABORTED — data would be lost:\n");
    blocked.forEach((b) => console.error(`  ✗ ${b}`));
    console.error("\nRun `npx tsx src/seed/migrate-translations-maps.ts --apply` and retry.\n");
    process.exit(1);
  }

  if (plan.length === 0) {
    console.log("\nNothing to drop — every legacy column is already gone.\n");
    return;
  }

  if (!apply) {
    console.log(`\nWould drop ${plan.length} column(s). Re-run with --apply to perform the migration.\n`);
    return;
  }

  for (const d of plan) {
    await sql.query(`ALTER TABLE "${d.table}" DROP COLUMN "${d.column}"`);
    console.log(`  ✓ dropped ${d.table}.${d.column}`);
  }

  console.log(`\nDropped ${plan.length} column(s). Now run: npm run db:preflight\n`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
