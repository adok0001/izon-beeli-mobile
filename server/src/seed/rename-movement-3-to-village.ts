/**
 * Rename Movement 3's course id from `course-izon-mv-naming` to
 * `course-izon-mv-village`.
 *
 *   npx tsx src/seed/rename-movement-3-to-village.ts            # dry run
 *   npx tsx src/seed/rename-movement-3-to-village.ts --apply    # write
 *
 * Movement 3 was widened from "The Naming" to "The Village" on 2026-07-25 — the
 * naming ceremony became its climax rather than its whole content — but the id
 * was left alone at the time because renaming it would have orphaned any lessons
 * parented to it (`migrate-izon-journey.ts`, and the RESTRICT FK from
 * `lessons.course_id`).
 *
 * That reason has expired. The course is empty and inactive, and nothing points
 * at it — verified before writing:
 *
 *   lessons              0
 *   story_arcs           0
 *   game_sessions        0
 *   lesson_contributions 0
 *   matchmaking_queue    0
 *
 * The script re-checks all five itself and refuses to run if any is non-zero,
 * so a row that appears between now and the run cannot be silently orphaned.
 *
 * `lib/lesson-stubs.ts` already scaffolds new languages as `mv-village`; this
 * brings the flagship into line so there is one convention rather than two.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");
const OLD = "course-izon-mv-naming";
const NEW = "course-izon-mv-village";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const [course] = await sql`SELECT id, title, is_active FROM courses WHERE id = ${OLD}`;
  if (!course) {
    const [already] = await sql`SELECT id FROM courses WHERE id = ${NEW}`;
    console.log(already ? `Already renamed — ${NEW} exists. Nothing to do.` : `${OLD} not found. Nothing to do.`);
    return;
  }

  const [taken] = await sql`SELECT id FROM courses WHERE id = ${NEW}`;
  if (taken) {
    console.error(`Refusing to run: ${NEW} already exists. Merging two courses is not this script's job.`);
    process.exit(1);
  }

  // Every table carrying a course_id, FK-constrained or not.
  const [l] = await sql`SELECT count(*)::int n FROM lessons WHERE course_id = ${OLD}`;
  const [a] = await sql`SELECT count(*)::int n FROM story_arcs WHERE course_id = ${OLD}`;
  const [g] = await sql`SELECT count(*)::int n FROM game_sessions WHERE course_id = ${OLD}`;
  const [c] = await sql`SELECT count(*)::int n FROM lesson_contributions WHERE course_id = ${OLD}`;
  const [m] = await sql`SELECT count(*)::int n FROM matchmaking_queue WHERE course_id = ${OLD}`;

  const refs = [
    ["lessons", l.n], ["story_arcs", a.n], ["game_sessions", g.n],
    ["lesson_contributions", c.n], ["matchmaking_queue", m.n],
  ] as const;

  console.log(`${OLD} → ${NEW}`);
  console.log(`  title="${course.title}"  active=${course.is_active}\n`);
  console.log("references:");
  for (const [t, n] of refs) console.log(`  ${t.padEnd(22)} ${n}`);

  const total = refs.reduce((s, [, n]) => s + n, 0);
  if (total > 0) {
    console.error(
      `\nRefusing to run: ${total} row(s) reference ${OLD}.\n` +
        "neon-http has no transactions, so a rename here cannot be made atomic with\n" +
        "the repointing. Repoint those rows first, or extend this script deliberately."
    );
    process.exit(1);
  }

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply.");
    return;
  }

  await sql`UPDATE courses SET id = ${NEW} WHERE id = ${OLD}`;
  console.log(`\nApplied — course renamed to ${NEW}.`);
  console.log("Next: npx tsx src/seed/backfill-movement-course-types.ts --apply");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
