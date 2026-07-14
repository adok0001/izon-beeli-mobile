/**
 * Repair the orphan rows that would block the foreign-key rollout.
 *
 *   npx tsx src/db/cleanup-orphans.ts           # dry run — prints, changes nothing
 *   npx tsx src/db/cleanup-orphans.ts --apply   # actually writes
 *
 * Run this against production BEFORE deploying the schema.ts change that adds
 * the constraints. `drizzle-kit push` is not transactional: if an ADD CONSTRAINT
 * hits an orphan it raises 23503 and aborts mid-list, leaving the database
 * half-constrained and the deploy failed.
 *
 * Verify with `npm run db:preflight` afterwards — it must report zero.
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index.js";

const APPLY = process.argv.includes("--apply");

/**
 * Transcript segments whose lesson no longer exists.
 *
 * Historical damage, not an active leak: the only lesson-delete path in the app
 * (educator/lessons.ts) does remove its segments. These are the residue of past
 * bulk deletes that removed lessons without cascading. The rows are unreachable
 * — nothing can render a transcript for a lesson that isn't there.
 */
async function orphanedTranscriptSegments() {
  const { rows } = await db.execute<{ lesson_id: string; n: number }>(sql`
    SELECT ts.lesson_id, count(*)::int AS n
    FROM transcript_segments ts
    LEFT JOIN lessons l ON l.id = ts.lesson_id
    WHERE l.id IS NULL
    GROUP BY ts.lesson_id
    ORDER BY ts.lesson_id
  `);

  if (rows.length === 0) return console.log("  transcript_segments: clean");

  const total = rows.reduce((sum, r) => sum + r.n, 0);
  console.log(`  transcript_segments: ${total} orphan row(s) across ${rows.length} missing lesson(s)`);
  for (const r of rows) console.log(`      ${r.n.toString().padStart(3)} × ${r.lesson_id}`);

  if (APPLY) {
    await db.execute(sql`
      DELETE FROM transcript_segments ts
      WHERE NOT EXISTS (SELECT 1 FROM lessons l WHERE l.id = ts.lesson_id)
    `);
    console.log(`      -> deleted ${total}`);
  }
}

/**
 * Story arcs pointing at a course that doesn't exist.
 *
 * `story-izon-pod-longwayhome` names `course-izon-longwayhome`, a course that was
 * never created — the season is a standalone narrative that sequences lessons
 * from several real courses, so it has no single owning course. The schema
 * already blesses this (`story_arcs.course_id` is nullable precisely so arcs can
 * stand alone). Null the dangling pointer rather than inventing a course row;
 * `language_id` is what the app actually filters on and it is already correct.
 */
async function orphanedArcCourses() {
  const { rows } = await db.execute<{ id: string; course_id: string; language_id: string | null }>(sql`
    SELECT a.id, a.course_id, a.language_id
    FROM story_arcs a
    LEFT JOIN courses c ON c.id = a.course_id
    WHERE a.course_id IS NOT NULL AND c.id IS NULL
  `);

  if (rows.length === 0) return console.log("  story_arcs.course_id: clean");

  console.log(`  story_arcs.course_id: ${rows.length} arc(s) pointing at a missing course`);
  for (const r of rows) {
    console.log(`      ${r.id} -> "${r.course_id}" (language_id=${r.language_id ?? "NULL"}) — will set course_id = NULL`);
    if (r.language_id === null) {
      console.warn(`      !! ${r.id} has no language_id either; it will be invisible to the app. Set one.`);
    }
  }

  if (APPLY) {
    await db.execute(sql`
      UPDATE story_arcs a
      SET course_id = NULL
      WHERE a.course_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM courses c WHERE c.id = a.course_id)
    `);
    console.log(`      -> nulled ${rows.length}`);
  }
}

async function main() {
  console.log(APPLY ? "Orphan cleanup — APPLYING\n" : "Orphan cleanup — DRY RUN (pass --apply to write)\n");

  await orphanedTranscriptSegments();
  await orphanedArcCourses();

  console.log(
    APPLY
      ? "\nDone. Run `npm run db:preflight` — it must report zero before you deploy the FKs."
      : "\nNothing written. Re-run with --apply to commit these changes.",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
