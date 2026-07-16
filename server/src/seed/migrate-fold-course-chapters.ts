import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * Story fold-in (course-bound arcs only): move narrative framing from
 * `story_chapters` onto the chapters' lessons, then remove those chapter rows.
 *
 * Scope guard — this touches ONLY chapters whose arc has `course_id` set.
 * Standalone podcast seasons (e.g. Bou Mie, course_id IS NULL) keep their
 * story_chapters untouched; the season surface is unaffected.
 *
 * Steps (per course-bound chapter):
 *   1. lessons.narrative_intro/outro  ← story_chapters.narrative_intro/outro
 *      (only when the lesson's field is NULL — never overwrite educator edits)
 *   2. delete the story_chapters row
 * A row-count check runs before any delete; a chapter whose lesson_id doesn't
 * resolve is reported and SKIPPED, never silently dropped.
 *
 *   npx tsx src/seed/migrate-fold-course-chapters.ts          # dry run (default)
 *   npx tsx src/seed/migrate-fold-course-chapters.ts --apply  # write
 *
 * Requires lessons.narrative_intro/outro to exist (additive, lands with the
 * schema deploy). DESTRUCTIVE for course-bound story_chapters rows — run only
 * with explicit --apply, per project convention.
 */

const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log(APPLY ? "Fold course chapters — APPLYING\n" : "Fold course chapters — DRY RUN (pass --apply to write)\n");

  // Course-bound chapters, with whether their lesson resolves.
  const chapters = (await sql`
    SELECT sc.id, sc.story_arc_id, sc.lesson_id, sc."order", sc.title,
           sa.course_id, (l.id IS NOT NULL) AS lesson_exists,
           l.narrative_intro AS lesson_intro, l.narrative_outro AS lesson_outro
    FROM story_chapters sc
    JOIN story_arcs sa ON sa.id = sc.story_arc_id
    LEFT JOIN lessons l ON l.id = sc.lesson_id
    WHERE sa.course_id IS NOT NULL
    ORDER BY sa.course_id, sc."order"
  `) as {
    id: string; story_arc_id: string; lesson_id: string | null; order: number; title: string;
    course_id: string; lesson_exists: boolean; lesson_intro: string | null; lesson_outro: string | null;
  }[];

  if (chapters.length === 0) {
    console.log("Nothing to fold — no story_chapters belong to a course-bound arc.");
    const [standalone] = (await sql`
      SELECT count(*)::int AS n FROM story_chapters sc
      JOIN story_arcs sa ON sa.id = sc.story_arc_id
      WHERE sa.course_id IS NULL
    `) as { n: number }[];
    console.log(`(${standalone.n} standalone-season chapter(s) left untouched, as designed.)`);
    return;
  }

  const orphans = chapters.filter((ch) => !ch.lesson_exists);
  const foldable = chapters.filter((ch) => ch.lesson_exists);

  console.log(`Course-bound chapters found: ${chapters.length}`);
  console.log(`  foldable (lesson resolves): ${foldable.length}`);
  if (orphans.length > 0) {
    console.log(`  ORPHANED (lesson missing — will be SKIPPED, fix by hand): ${orphans.length}`);
    for (const o of orphans) console.log(`    chapter ${o.id} "${o.title}" -> lesson_id ${o.lesson_id ?? "NULL"}`);
  }
  for (const ch of foldable) {
    const keep = ch.lesson_intro != null || ch.lesson_outro != null;
    console.log(`  ${ch.course_id}  ch.${ch.order} "${ch.title}" -> lesson ${ch.lesson_id}${keep ? "  (lesson already has narrative — chapter copy skipped, row still removed)" : ""}`);
  }

  if (!APPLY) {
    console.log("\nNothing written. Re-run with --apply to fold.");
    return;
  }

  let copied = 0;
  for (const ch of foldable) {
    await sql`
      UPDATE lessons SET
        narrative_intro = COALESCE(narrative_intro, (SELECT narrative_intro FROM story_chapters WHERE id = ${ch.id})),
        narrative_outro = COALESCE(narrative_outro, (SELECT narrative_outro FROM story_chapters WHERE id = ${ch.id}))
      WHERE id = ${ch.lesson_id}
    `;
    copied += 1;
  }

  // Row-count check before the delete: only foldable rows go.
  const ids = foldable.map((ch) => ch.id);
  const [{ n: toDelete }] = (await sql`
    SELECT count(*)::int AS n FROM story_chapters WHERE id = ANY(${ids})
  `) as { n: number }[];
  if (toDelete !== foldable.length) {
    throw new Error(`Row-count mismatch: expected ${foldable.length} chapters to delete, found ${toDelete}. Aborting.`);
  }
  await sql`DELETE FROM story_chapters WHERE id = ANY(${ids})`;

  console.log(`\n-> narrative copied onto ${copied} lesson(s); ${toDelete} course-bound chapter row(s) removed.`);
  if (orphans.length > 0) console.log(`-> ${orphans.length} orphaned chapter(s) left in place for manual review.`);
}

main().catch((err) => {
  console.error("Fold failed:", err);
  process.exit(1);
});
