import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * Eleven published Izon lessons contain no Ịzọn at all — every transcript line
 * is bracketed English (`[What are you cooking?]`), the authoring placeholder,
 * shipped as though it were the language. This pulls them out of the learner's
 * path without deleting anything.
 *
 *   npx tsx src/seed/unpublish-izon-placeholder-lessons.ts          # dry run
 *   npx tsx src/seed/unpublish-izon-placeholder-lessons.ts --apply  # write
 *
 * BOTH columns move, and `is_active` is the one that matters: every lesson
 * route filters on `is_active` and no route reads `lessons.status`, by design.
 * Setting status alone would leave all eleven fully visible while looking, in
 * Studio, like they had been withdrawn. `status='draft'` is set too so the
 * workflow state matches reality rather than claiming published.
 *
 * Transcript rows are deliberately KEPT: the bracketed English is the brief for
 * whoever authors the real lines. Verified safe to withdraw — none of the
 * eleven is referenced by story_chapters, and none has learner progress.
 *
 * Reverse with: update lessons set is_active=true, status='published' where id = ANY(...)
 */
const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);

const IDS = [
  "izon-el-3", "izon-el-6",                                        // M2 The Household
  "izon-el-1", "izon-el-2", "izon-el-4", "izon-el-5",              // M6 The Working Year
  "izon-co-1", "izon-co-2", "izon-co-3", "izon-co-4", "izon-co-5", // M8 The Assembly
];

// Re-verify rather than trust the survey: only withdraw a lesson whose lines
// are ALL still placeholders. If someone authored real Ịzọn in the meantime,
// that lesson drops out of the batch instead of being silently withdrawn.
const check = await sql`
  select l.id, l.title, l.is_active, l.status, c.title course,
         count(t.id)::int total,
         count(*) filter (where t.text like '[%')::int bracketed
  from lessons l
  join courses c on c.id = l.course_id
  left join transcript_segments t on t.lesson_id = l.id
  where l.id = ANY(${IDS})
  group by l.id, l.title, l.is_active, l.status, c.title, c."order"
  order by c."order", l.id`;

const safe = check.filter((r) => r.total > 0 && r.bracketed === r.total);
const skip = check.filter((r) => !(r.total > 0 && r.bracketed === r.total));

for (const r of check) {
  const mark = safe.includes(r) ? "withdraw" : "SKIP    ";
  console.log(`  ${mark} ${r.id.padEnd(12)} ${String(r.bracketed)}/${r.total} placeholder · active=${r.is_active} ${r.status.padEnd(10)} ${r.title}`);
}
if (skip.length) console.log(`\n${skip.length} skipped — they now contain real Ịzọn and are left published.`);
console.log(`\n${safe.length} lessons to withdraw (is_active=false, status=draft). Transcripts kept.`);

if (APPLY && safe.length > 0) {
  const ids = safe.map((r) => r.id);
  await sql`update lessons set is_active = false, status = 'draft' where id = ANY(${ids})`;
  // lessons_count counts live rows, so it drifts unless recomputed here.
  await sql`
    update courses c set lessons_count = (
      select count(*) from lessons l where l.course_id = c.id and l.is_active
    ) where c.language_id = 'izon'`;
  const after = await sql`select id, is_active, status from lessons where id = ANY(${ids}) and is_active`;
  console.log(`\napplied — ${ids.length} withdrawn, ${after.length} still active (expect 0). Course counts recomputed.`);
} else if (!APPLY) {
  console.log("dry run — re-run with --apply to write.");
}
