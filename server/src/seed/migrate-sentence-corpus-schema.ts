import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * Create the sentence-corpus schema on its own, without deploying any code.
 *
 *   npx tsx src/seed/migrate-sentence-corpus-schema.ts          # report only
 *   npx tsx src/seed/migrate-sentence-corpus-schema.ts --apply  # run the DDL
 *
 * `drizzle-kit push` in `vercel-build` would create the same objects, but only
 * as a side effect of shipping every other pending change — and with git
 * auto-deploy off, pending changes pile up until someone runs `vercel --prod`.
 * Coupling additive DDL to that batch means the schema cannot move until
 * everything else is ready to go out. This decouples them.
 *
 * The DDL is inlined rather than read from `drizzle/*.sql` because
 * `server/drizzle/` is gitignored — those numbered files are local artifacts, so
 * a script reading them would break on a fresh clone.
 *
 * Additive only: no DROP, no ALTER of an existing column's type. Both new
 * `sentence_id` columns and `word_bank.sense_id` are nullable, so existing rows
 * and the currently-deployed code are unaffected — running this against
 * production while the old code is live is safe, because nothing reads what it
 * creates. Every statement is `IF NOT EXISTS` or swallows a duplicate, so it is
 * idempotent and the eventual `drizzle-kit push` sees no drift.
 *
 * The one non-additive step is `word_bank`'s unique index, which gains a
 * `WHERE sense_id IS NULL` clause. Postgres treats NULLs as distinct, so a plain
 * unique index over three columns would let a user accumulate unlimited
 * word-level rows for one headword. The old index is dropped and replaced by two
 * partial ones — no data is touched.
 */

const sql = neon(process.env.DATABASE_URL!);

/** Each entry is one statement. Order matters: tables before the keys into them. */
const DDL: [label: string, statement: string][] = [
  [
    "create table sentences",
    `create table if not exists "sentences" (
       "id" varchar(64) primary key not null,
       "language_id" varchar(64) not null,
       "text" text not null,
       "translation" text,
       "translations" jsonb,
       "literal" text,
       "roman" text,
       "audio_url" text,
       "status" "content_status" default 'published' not null,
       "created_by" uuid,
       "updated_by" uuid,
       "published_by" uuid,
       "published_at" timestamp,
       "is_active" boolean default true not null
     )`,
  ],
  [
    "create table dictionary_senses",
    `create table if not exists "dictionary_senses" (
       "id" uuid primary key default gen_random_uuid() not null,
       "entry_id" varchar(64) not null,
       "order" integer not null,
       "gloss" text not null,
       "gloss_translations" jsonb,
       "note" varchar(200)
     )`,
  ],
  [
    "create table dictionary_examples",
    `create table if not exists "dictionary_examples" (
       "id" uuid primary key default gen_random_uuid() not null,
       "sense_id" uuid not null,
       "sentence_id" varchar(64) not null,
       "order" integer not null,
       "needs_sense_review" boolean default false not null
     )`,
  ],
  ["add sentence_templates.sentence_id", `alter table "sentence_templates" add column if not exists "sentence_id" varchar(64)`],
  ["add transcript_segments.sentence_id", `alter table "transcript_segments" add column if not exists "sentence_id" varchar(64)`],
  ["add word_bank.sense_id", `alter table "word_bank" add column if not exists "sense_id" uuid`],

  // Foreign keys. `dictionary_examples.sentence_id` deliberately does NOT
  // cascade: deleting a sentence still cited somewhere must fail loudly rather
  // than silently strip the citation.
  ...([
    ["sentences_language_id_languages_id_fk", `"sentences" add constraint "sentences_language_id_languages_id_fk" foreign key ("language_id") references "languages"("id")`],
    ["sentences_created_by_users_id_fk", `"sentences" add constraint "sentences_created_by_users_id_fk" foreign key ("created_by") references "users"("id")`],
    ["sentences_updated_by_users_id_fk", `"sentences" add constraint "sentences_updated_by_users_id_fk" foreign key ("updated_by") references "users"("id")`],
    ["sentences_published_by_users_id_fk", `"sentences" add constraint "sentences_published_by_users_id_fk" foreign key ("published_by") references "users"("id")`],
    ["dictionary_senses_entry_id_fk", `"dictionary_senses" add constraint "dictionary_senses_entry_id_dictionary_entries_id_fk" foreign key ("entry_id") references "dictionary_entries"("id") on delete cascade`],
    ["dictionary_examples_sense_id_fk", `"dictionary_examples" add constraint "dictionary_examples_sense_id_dictionary_senses_id_fk" foreign key ("sense_id") references "dictionary_senses"("id") on delete cascade`],
    ["dictionary_examples_sentence_id_fk", `"dictionary_examples" add constraint "dictionary_examples_sentence_id_sentences_id_fk" foreign key ("sentence_id") references "sentences"("id")`],
    ["sentence_templates_sentence_id_fk", `"sentence_templates" add constraint "sentence_templates_sentence_id_sentences_id_fk" foreign key ("sentence_id") references "sentences"("id")`],
    ["transcript_segments_sentence_id_fk", `"transcript_segments" add constraint "transcript_segments_sentence_id_sentences_id_fk" foreign key ("sentence_id") references "sentences"("id")`],
    ["word_bank_sense_id_fk", `"word_bank" add constraint "word_bank_sense_id_dictionary_senses_id_fk" foreign key ("sense_id") references "dictionary_senses"("id") on delete cascade`],
  ] as [string, string][]).map(
    ([label, body]) =>
      [
        `fk ${label}`,
        `do $$ begin alter table ${body}; exception when duplicate_object then null; end $$`,
      ] as [string, string],
  ),

  ["index sentences_language_idx", `create index if not exists "sentences_language_idx" on "sentences" ("language_id")`],
  ["index dictionary_senses_entry_order_idx", `create unique index if not exists "dictionary_senses_entry_order_idx" on "dictionary_senses" ("entry_id","order")`],
  ["index dictionary_examples_sense_idx", `create index if not exists "dictionary_examples_sense_idx" on "dictionary_examples" ("sense_id","order")`],
  ["index dictionary_examples_sentence_idx", `create index if not exists "dictionary_examples_sentence_idx" on "dictionary_examples" ("sentence_id")`],
  ["index dictionary_examples_sense_sentence_idx", `create unique index if not exists "dictionary_examples_sense_sentence_idx" on "dictionary_examples" ("sense_id","sentence_id")`],
  ["index sentence_templates_sentence_idx", `create index if not exists "sentence_templates_sentence_idx" on "sentence_templates" ("sentence_id")`],
  ["index transcript_segments_sentence_idx", `create index if not exists "transcript_segments_sentence_idx" on "transcript_segments" ("sentence_id")`],

  // Replace word_bank's unique index with the two partial ones. Dropping an
  // index touches no rows; the constraint it enforced is preserved by the pair.
  ["drop old word_bank_user_entry_idx", `drop index if exists "word_bank_user_entry_idx"`],
  ["index word_bank_user_entry_idx", `create unique index if not exists "word_bank_user_entry_idx" on "word_bank" ("user_id","dictionary_entry_id") where "sense_id" is null`],
  ["index word_bank_user_entry_sense_idx", `create unique index if not exists "word_bank_user_entry_sense_idx" on "word_bank" ("user_id","dictionary_entry_id","sense_id") where "sense_id" is not null`],
];

const EXPECTED_TABLES = ["sentences", "dictionary_senses", "dictionary_examples"];
const EXPECTED_COLUMNS: [table: string, column: string][] = [
  ["sentence_templates", "sentence_id"],
  ["transcript_segments", "sentence_id"],
  ["word_bank", "sense_id"],
];

async function state() {
  const tables = (await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name = any(${EXPECTED_TABLES})
  `) as { table_name: string }[];
  const columns = (await sql`
    select table_name, column_name from information_schema.columns
    where table_schema = 'public'
      and (column_name = 'sentence_id' or (table_name = 'word_bank' and column_name = 'sense_id'))
  `) as { table_name: string; column_name: string }[];
  return {
    tables: new Set(tables.map((t) => t.table_name)),
    columns: new Set(columns.map((c) => `${c.table_name}.${c.column_name}`)),
  };
}

function report(label: string, s: Awaited<ReturnType<typeof state>>) {
  console.log(`\n${label}`);
  for (const t of EXPECTED_TABLES) console.log(`  ${s.tables.has(t) ? "✓" : "·"} table  ${t}`);
  for (const [t, c] of EXPECTED_COLUMNS) {
    console.log(`  ${s.columns.has(`${t}.${c}`) ? "✓" : "·"} column ${t}.${c}`);
  }
  return (
    EXPECTED_TABLES.filter((t) => !s.tables.has(t)).length +
    EXPECTED_COLUMNS.filter(([t, c]) => !s.columns.has(`${t}.${c}`)).length
  );
}

async function run() {
  const apply = process.argv.includes("--apply");

  const missing = report("Before:", await state());

  if (!apply) {
    console.log(
      missing === 0
        ? "\nEverything is already in place. --apply would re-run the index changes only."
        : `\n${DDL.length} statements would run. Re-run with --apply.`,
    );
    process.exit(0);
  }

  console.log(`\nApplying ${DDL.length} statements…`);
  for (const [label, statement] of DDL) {
    await sql.query(statement);
    console.log(`  ✓ ${label}`);
  }

  if (report("After:", await state()) > 0) {
    console.log("\n❌ Something did not get created. Inspect the log above.");
    process.exit(1);
  }

  console.log("\n✅ Schema in place. Nothing reads it yet — the backfill is next:");
  console.log("   npm run db:migrate-sentence-corpus -- --apply");
  process.exit(0);
}

run().catch((err) => {
  console.error("Corpus schema migration failed:", err);
  process.exit(1);
});
