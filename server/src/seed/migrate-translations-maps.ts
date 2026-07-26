import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * Move every translatable text field off the two-language `<field>` / `<field>Fr`
 * column pair and onto a `<field>Translations` jsonb map ({ en, fr, pcm, ... }).
 *
 * The flat `<field>` column stays — it holds the English projection, is `notNull`
 * on most tables, and is what plain SQL/CSV consumers read.
 *
 * This script is ADDITIVE and IDEMPOTENT — it only adds columns and fills maps
 * that are still null. It never drops anything. Dropping the `*_fr` columns is a
 * separate, explicitly authorized step: `migrate-drop-fr-columns.ts`.
 *
 *   npx tsx src/seed/migrate-translations-maps.ts          # dry run (prints plan)
 *   npx tsx src/seed/migrate-translations-maps.ts --apply  # apply to DATABASE_URL
 *
 * Run order for the whole migration:
 *   1. this script --apply          (columns exist + old rows carry their maps)
 *   2. vercel --prod                (deploy code that reads/writes only maps)
 *   3. this script --apply again    (catch rows written between 1 and 2)
 *   4. migrate-drop-fr-columns.ts --apply
 */

const sql = neon(process.env.DATABASE_URL!);

/** One translatable field: its flat column, its legacy French sidecar, its new map. */
interface Field {
  table: string;
  flat: string;
  fr: string;
  map: string;
}

const FIELDS: Field[] = [
  { table: "courses", flat: "title", fr: "title_fr", map: "title_translations" },
  { table: "courses", flat: "description", fr: "description_fr", map: "description_translations" },
  { table: "lessons", flat: "title", fr: "title_fr", map: "title_translations" },
  { table: "lessons", flat: "description", fr: "description_fr", map: "description_translations" },
  { table: "lessons", flat: "can_do", fr: "can_do_fr", map: "can_do_translations" },
  { table: "feed_items", flat: "title", fr: "title_fr", map: "title_translations" },
  { table: "feed_items", flat: "description", fr: "description_fr", map: "description_translations" },
  { table: "cultural_content", flat: "title", fr: "title_fr", map: "title_translations" },
  { table: "cultural_content", flat: "description", fr: "description_fr", map: "description_translations" },
  { table: "proverbs", flat: "translation", fr: "translation_fr", map: "translations" },
  { table: "proverbs", flat: "meaning", fr: "meaning_fr", map: "meaning_translations" },
  { table: "transcript_segments", flat: "translation", fr: "translation_fr", map: "translations" },
  // These two already had their map column before this migration; only the
  // still-null rows get filled.
  { table: "dictionary_entries", flat: "english", fr: "french", map: "translations" },
  { table: "dictionary_entries", flat: "example_translation", fr: "example_translation_fr", map: "example_translations" },
  { table: "daily_challenge_templates", flat: "title", fr: "title_fr", map: "title_translations" },
  { table: "daily_challenge_templates", flat: "description", fr: "description_fr", map: "description_translations" },
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = (await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
  `) as unknown[];
  return rows.length > 0;
}

/** Rows still missing their map, so the dry run can report real numbers. */
async function pendingCount(f: Field, hasFr: boolean): Promise<number> {
  const query = hasFr
    ? `SELECT count(*)::int AS n FROM "${f.table}"
       WHERE "${f.map}" IS NULL AND (nullif(btrim("${f.flat}"), '') IS NOT NULL OR nullif(btrim("${f.fr}"), '') IS NOT NULL)`
    : `SELECT count(*)::int AS n FROM "${f.table}"
       WHERE "${f.map}" IS NULL AND nullif(btrim("${f.flat}"), '') IS NOT NULL`;
  const rows = (await sql.query(query)) as { n: number }[];
  return rows[0]?.n ?? 0;
}

/**
 * Build the map from the flat pair. `jsonb_strip_nulls` drops a language whose
 * column is empty, so a row with no French gets `{"en": ...}` rather than a null
 * `fr` key.
 */
async function backfill(f: Field, hasFr: boolean): Promise<number> {
  const pairs = hasFr
    ? `'en', nullif(btrim("${f.flat}"), ''), 'fr', nullif(btrim("${f.fr}"), '')`
    : `'en', nullif(btrim("${f.flat}"), '')`;
  const guard = hasFr
    ? `nullif(btrim("${f.flat}"), '') IS NOT NULL OR nullif(btrim("${f.fr}"), '') IS NOT NULL`
    : `nullif(btrim("${f.flat}"), '') IS NOT NULL`;
  const rows = (await sql.query(`
    UPDATE "${f.table}"
    SET "${f.map}" = jsonb_strip_nulls(jsonb_build_object(${pairs}))
    WHERE "${f.map}" IS NULL AND (${guard})
    RETURNING 1
  `)) as unknown[];
  return rows.length;
}

/**
 * Rows that predate the map columns stored a JSON-encoded `{ en, fr, ... }` blob
 * inside the flat text column. Those need parsing, not wrapping — and they are
 * parsed AFTER `backfill`, overwriting the map it wrapped around the raw blob
 * text.
 *
 * A row whose text merely starts with `{` may not be valid JSON, and a bad row
 * would abort a table-wide cast. `CASE` is the one construct Postgres guarantees
 * to evaluate in order, so the guard reliably runs before the cast — that is what
 * makes this safe as a single statement rather than a row-at-a-time loop.
 */
const BLOB_CANDIDATES = (f: Field) => `
  SELECT id,
         CASE WHEN pg_input_is_valid(btrim("${f.flat}"), 'jsonb')
              THEN btrim("${f.flat}")::jsonb END AS m
  FROM "${f.table}"
  WHERE btrim("${f.flat}") LIKE '{%'
`;

async function normalizeBlobs(f: Field, apply: boolean): Promise<number> {
  if (!apply) {
    const rows = (await sql.query(`
      WITH c AS (${BLOB_CANDIDATES(f)})
      SELECT count(*)::int AS n FROM c WHERE m IS NOT NULL AND jsonb_typeof(m) = 'object'
    `)) as { n: number }[];
    return rows[0]?.n ?? 0;
  }

  // `jsonb_strip_nulls` drops null-valued languages; the flat column goes back to
  // being the readable English projection (or the first gloss if there is no en).
  const rows = (await sql.query(`
    WITH c AS (${BLOB_CANDIDATES(f)})
    UPDATE "${f.table}" AS x
    SET "${f.map}" = jsonb_strip_nulls(c.m),
        "${f.flat}" = coalesce(c.m ->> 'en', (SELECT value FROM jsonb_each_text(c.m) LIMIT 1))
    FROM c
    WHERE x.id = c.id
      AND c.m IS NOT NULL
      AND jsonb_typeof(c.m) = 'object'
      AND coalesce(c.m ->> 'en', (SELECT value FROM jsonb_each_text(c.m) LIMIT 1)) IS NOT NULL
    RETURNING 1
  `)) as unknown[];
  return rows.length;
}

async function run() {
  const apply = process.argv.includes("--apply");

  console.log(`\nTranslation-maps migration — ${apply ? "APPLY" : "DRY RUN"}\n`);

  let totalFilled = 0;
  let totalBlobs = 0;

  for (const f of FIELDS) {
    const label = `${f.table}.${f.map}`;

    if (!(await columnExists(f.table, f.map))) {
      if (apply) {
        await sql.query(`ALTER TABLE "${f.table}" ADD COLUMN "${f.map}" jsonb`);
        console.log(`  + added   ${label}`);
      } else {
        console.log(`  + would add ${label}`);
        // Nothing to count against a column that doesn't exist yet.
        continue;
      }
    }

    const hasFr = await columnExists(f.table, f.fr);
    const filled = apply ? await backfill(f, hasFr) : await pendingCount(f, hasFr);
    const blobs = await normalizeBlobs(f, apply);
    totalFilled += filled;
    totalBlobs += blobs;

    const frNote = hasFr ? "" : "  (no *_fr column — English only)";
    console.log(
      `  ${apply ? "✓" : "·"} ${label.padEnd(48)} ${String(filled).padStart(6)} rows${
        blobs ? `, ${blobs} JSON blob(s) unpacked` : ""
      }${frNote}`,
    );
  }

  console.log(
    `\n${apply ? "Filled" : "Would fill"} ${totalFilled} map(s)` +
      (totalBlobs ? `, ${apply ? "unpacked" : "would unpack"} ${totalBlobs} JSON blob(s)` : "") +
      ".",
  );
  if (!apply) {
    console.log("\nRe-run with --apply to perform the migration.\n");
  } else {
    console.log("\nDone. Deploy the code, re-run this, then drop the *_fr columns.\n");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
