import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * Schema enablers for the Film + Interactive Story collapse (Direction B).
 * Adds the nullable columns a film card needs to carry its branching scene graph
 * inline, folding the separate `interactive_stories` table into `culture_items`:
 *
 *   culture_items.scenes            jsonb        — the branching scene graph
 *   culture_items.initial_scene_id  varchar(64)  — entry scene id
 *   culture_items.estimated_minutes integer      — story read time
 *   culture_items.language          varchar(64)  — language-scoped educator review
 *
 * All columns are NULLABLE and additive — non-destructive. Uses
 * `ADD COLUMN IF NOT EXISTS`, so re-running is a safe no-op. This is what
 * `drizzle-kit push` would do against `schema.ts`, but as an explicit,
 * reviewable, non-interactive migration (no whole-schema diff, no truncation
 * risk). Run BEFORE `fold-interactive-stories.ts --apply`.
 *
 *   npx tsx src/seed/migrate-culture-scene-fields.ts          # dry run (prints plan)
 *   npx tsx src/seed/migrate-culture-scene-fields.ts --apply  # apply to DATABASE_URL
 */

const sql = neon(process.env.DATABASE_URL!);

const STATEMENTS: { label: string; run: () => Promise<unknown> }[] = [
  {
    label: "culture_items.scenes jsonb",
    run: () => sql`ALTER TABLE "culture_items" ADD COLUMN IF NOT EXISTS "scenes" jsonb`,
  },
  {
    label: "culture_items.initial_scene_id varchar(64)",
    run: () => sql`ALTER TABLE "culture_items" ADD COLUMN IF NOT EXISTS "initial_scene_id" varchar(64)`,
  },
  {
    label: "culture_items.estimated_minutes integer",
    run: () => sql`ALTER TABLE "culture_items" ADD COLUMN IF NOT EXISTS "estimated_minutes" integer`,
  },
  {
    label: "culture_items.language varchar(64)",
    run: () => sql`ALTER TABLE "culture_items" ADD COLUMN IF NOT EXISTS "language" varchar(64)`,
  },
];

async function run() {
  const apply = process.argv.includes("--apply");

  console.log(`\nCulture scene-fields migration — ${apply ? "APPLY" : "DRY RUN"}\n`);
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
    console.log("\nDone. Now run: npx tsx src/seed/fold-interactive-stories.ts --apply\n");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
