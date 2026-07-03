import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * Schema enablers for the audio/visual media layer (report §7 "schema enablers").
 * Adds the nullable columns the podcast/series content authors against but that
 * the shared app schema was previously dropping on down-conversion:
 *
 *   transcript_segments.speaker   varchar(64)  — audio-drama line attribution
 *   transcript_segments.roman     text         — pronunciation guidance
 *   lessons.transcript_type       varchar(16)  — "plain" | "helper"
 *   lessons.can_do                text         — "you can now …" competence line (en)
 *   lessons.can_do_fr             text         — French of the above
 *
 * All columns are NULLABLE and additive — non-destructive. Uses
 * `ADD COLUMN IF NOT EXISTS`, so re-running is a safe no-op. This mirrors what
 * `drizzle-kit push` would do against `schema.ts`, but as an explicit,
 * reviewable, non-interactive migration (the repo applies schema via push; the
 * drizzle/ journal is gitignored and not authoritative).
 *
 *   npx tsx src/seed/migrate-media-fields.ts          # dry run (prints plan)
 *   npx tsx src/seed/migrate-media-fields.ts --apply  # apply to DATABASE_URL
 *
 * After applying, run `npm run db:sync lessons` to backfill the seeded content's
 * speaker/roman/transcript_type/can_do into these columns.
 */

const sql = neon(process.env.DATABASE_URL!);

const STATEMENTS: { label: string; run: () => Promise<unknown> }[] = [
  {
    label: 'transcript_segments.speaker varchar(64)',
    run: () => sql`ALTER TABLE "transcript_segments" ADD COLUMN IF NOT EXISTS "speaker" varchar(64)`,
  },
  {
    label: 'transcript_segments.roman text',
    run: () => sql`ALTER TABLE "transcript_segments" ADD COLUMN IF NOT EXISTS "roman" text`,
  },
  {
    label: 'lessons.transcript_type varchar(16)',
    run: () => sql`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "transcript_type" varchar(16)`,
  },
  {
    label: 'lessons.can_do text',
    run: () => sql`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "can_do" text`,
  },
  {
    label: 'lessons.can_do_fr text',
    run: () => sql`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "can_do_fr" text`,
  },
];

async function run() {
  const apply = process.argv.includes("--apply");

  console.log(`\nMedia-fields migration — ${apply ? "APPLY" : "DRY RUN"}\n`);
  for (const s of STATEMENTS) {
    if (!apply) {
      console.log(`  would add: ${s.label}`);
      continue;
    }
    await s.run();
    console.log(`  ✓ ${s.label}`);
  }

  if (!apply) {
    console.log("\nRe-run with --apply to perform the migration.\n");
  } else {
    console.log("\nDone. Now run: npm run db:sync lessons\n");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
