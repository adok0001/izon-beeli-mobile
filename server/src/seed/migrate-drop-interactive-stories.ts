import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * DESTRUCTIVE — Phase 6 of the Film + Interactive Story collapse.
 *
 * Drops the folded-away `interactive_stories` table and the two dead
 * `culture_items` link columns. Every film now carries its scene graph inline
 * (`culture_items.scenes`); nothing reads these objects anymore.
 *
 *   culture_items.interactive_story_id   (FK → interactive_stories) — dropped
 *   culture_items.story_id               (legacy polymorphic pointer) — dropped
 *   interactive_stories                  (whole table) — dropped
 *
 * ⚠️  RUN ONLY AFTER the cutover code (v4.5.0+) is DEPLOYED to production.
 *     Older server builds read `interactive_stories`; dropping it while they are
 *     live breaks them. Sequence: deploy the new code → verify → then run this.
 *     Dropping a column removes its FK automatically, so columns go before the
 *     table. Uses IF EXISTS, so re-running is a safe no-op.
 *
 *   npx tsx src/seed/migrate-drop-interactive-stories.ts          # dry run
 *   npx tsx src/seed/migrate-drop-interactive-stories.ts --apply  # apply to DATABASE_URL
 */

const sql = neon(process.env.DATABASE_URL!);

const STATEMENTS: { label: string; run: () => Promise<unknown> }[] = [
  {
    label: "culture_items DROP COLUMN interactive_story_id (removes its FK)",
    run: () => sql`ALTER TABLE "culture_items" DROP COLUMN IF EXISTS "interactive_story_id"`,
  },
  {
    label: "culture_items DROP COLUMN story_id",
    run: () => sql`ALTER TABLE "culture_items" DROP COLUMN IF EXISTS "story_id"`,
  },
  {
    label: "DROP TABLE interactive_stories",
    run: () => sql`DROP TABLE IF EXISTS "interactive_stories"`,
  },
];

async function run() {
  const apply = process.argv.includes("--apply");

  console.log(`\nDrop interactive_stories — ${apply ? "APPLY (DESTRUCTIVE)" : "DRY RUN"}\n`);
  if (apply) {
    console.log("  ⚠️  Ensure the cutover code (v4.5.0+) is deployed before running this.\n");
  }
  for (const s of STATEMENTS) {
    if (!apply) {
      console.log(`  would run: ${s.label}`);
      continue;
    }
    await s.run();
    console.log(`  ✓ ${s.label}`);
  }

  if (!apply) {
    console.log("\nRe-run with --apply to perform the drop.\n");
  } else {
    console.log("\nDone. Run `npm run db:preflight` to confirm the schema is clean.\n");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
