/**
 * Convert minute-scale `lessons.duration` values to seconds.
 *
 *   npx tsx src/db/backfill-lesson-duration.ts           # dry run
 *   npx tsx src/db/backfill-lesson-duration.ts --apply
 *
 * `LessonData.duration` was documented as minutes but every renderer treats it
 * as seconds (`formatDuration` in mobile/lib/mock-data.ts divides by 60), which
 * is why a 7-minute episode displayed as "0:07". The podcast converter wrote
 * `targetMinutes` straight into the column; it now writes `targetMinutes * 60`.
 * These rows were written under the old convention and need the same ×60.
 *
 * Selection: `duration < 60`. A real lesson under one minute does not exist in
 * this catalogue (the shortest podcast episode is 7 minutes), and every row this
 * matches is an `izon-pod-*` episode. Re-running is safe — once a row is scaled
 * past 60 it stops matching.
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index.js";

const APPLY = process.argv.includes("--apply");
/** Below this, a value cannot plausibly be seconds — so it is minutes. */
const MINUTE_SCALE_CEILING = 60;

async function main() {
  console.log(APPLY ? "Duration backfill — APPLYING\n" : "Duration backfill — DRY RUN (pass --apply to write)\n");

  const { rows } = await db.execute<{ id: string; duration: number }>(sql`
    SELECT id, duration FROM lessons
    WHERE duration IS NOT NULL AND duration < ${MINUTE_SCALE_CEILING}
    ORDER BY id
  `);

  if (rows.length === 0) {
    console.log("No minute-scale durations found — nothing to do.");
    process.exit(0);
  }

  console.log(`${rows.length} lesson(s) holding minutes:`);
  for (const r of rows) {
    console.log(`  ${r.id.padEnd(24)} ${r.duration} -> ${r.duration * 60}s (${r.duration}:00)`);
  }

  if (APPLY) {
    await db.execute(sql`
      UPDATE lessons SET duration = duration * 60
      WHERE duration IS NOT NULL AND duration < ${MINUTE_SCALE_CEILING}
    `);
    console.log(`\n-> updated ${rows.length}`);
  } else {
    console.log("\nNothing written. Re-run with --apply to commit.");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
