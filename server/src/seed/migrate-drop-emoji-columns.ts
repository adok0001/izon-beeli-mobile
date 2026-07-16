import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * DESTRUCTIVE — drops the emoji presentation columns.
 *
 * Emoji were retired from the content model: culture items, cultural notes, and
 * story cast members no longer carry a decorative glyph. The cutover server code
 * stops reading and writing these columns; this drops them for good.
 *
 *   cultural_content.image_emoji   (NOT NULL varchar) — dropped
 *   culture_items.cover_emoji      (NOT NULL varchar) — dropped
 *   story_arc_cast.avatar          (NOT NULL varchar, emoji avatar) — dropped
 *
 * ⚠️  RUN ONLY AFTER the emoji-removal code is DEPLOYED to production. Older
 *     server builds SELECT these columns and INSERT them as NOT NULL; dropping
 *     them while those builds are live breaks them. Sequence: deploy the new
 *     code → verify → then run this. Uses IF EXISTS, so re-running is a safe no-op.
 *
 *   npx tsx src/seed/migrate-drop-emoji-columns.ts          # dry run
 *   npx tsx src/seed/migrate-drop-emoji-columns.ts --apply  # apply to DATABASE_URL
 */

const sql = neon(process.env.DATABASE_URL!);

const STATEMENTS: { label: string; run: () => Promise<unknown> }[] = [
  {
    label: "cultural_content DROP COLUMN image_emoji",
    run: () => sql`ALTER TABLE "cultural_content" DROP COLUMN IF EXISTS "image_emoji"`,
  },
  {
    label: "culture_items DROP COLUMN cover_emoji",
    run: () => sql`ALTER TABLE "culture_items" DROP COLUMN IF EXISTS "cover_emoji"`,
  },
  {
    label: "story_arc_cast DROP COLUMN avatar",
    run: () => sql`ALTER TABLE "story_arc_cast" DROP COLUMN IF EXISTS "avatar"`,
  },
];

async function run() {
  const apply = process.argv.includes("--apply");

  console.log(`\nDrop emoji columns — ${apply ? "APPLY (DESTRUCTIVE)" : "DRY RUN"}\n`);
  if (apply) {
    console.log("  ⚠️  Ensure the emoji-removal code is deployed before running this.\n");
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
