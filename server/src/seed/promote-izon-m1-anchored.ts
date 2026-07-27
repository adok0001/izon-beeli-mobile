import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { M1_ANCHORED } from "../../../.claude/skills/design-course/scaffold/m1-anchored.mts";

/**
 * Promote the anchored Movement 1 and retire the legacy Arrival lessons.
 *
 *   npx tsx src/seed/promote-izon-m1-anchored.ts          # dry run (default)
 *   npx tsx src/seed/promote-izon-m1-anchored.ts --apply  # write
 *
 * Two halves, and they must happen together — promoting without retiring
 * interleaves two courses' worth of lessons at colliding `order` values.
 *
 *   1. `izon-m1-*`  → is_active = true,  status = published
 *   2. the legacy 5 → is_active = false, status = draft
 *
 * The legacy five are the SOURCES of much of the new content, so nothing is
 * lost by retiring them: their lines now live inside the anchored lessons with
 * provenance recorded. Nothing is deleted — this is a status flip, reversible
 * by swapping the two updates.
 *
 * NOT TOUCHED: izon-pod-b1, izon-bmc-b1, izon-bmc-b2. All three are already
 * inactive AND are chapter anchors of live story arcs (story-izon-pod-longwayhome,
 * story-izon-bm-fw). Retiring a season's chapter 1 is a different decision from
 * retiring a duplicated topic lesson, and it was never asked for.
 */
const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);
const COURSE = "course-izon-mv-arrival";

/** Superseded by the anchored set. Story-arc anchors are deliberately absent. */
const LEGACY = ["izon-fw-1", "izon-fw-2", "izon-fw-3", "izon-cm-2", "izon-cm-3"];

const chapters = await sql`select lesson_id from story_chapters where lesson_id = ANY(${LEGACY})`;
if (chapters.length > 0) {
  console.error(`ABORT: ${chapters.length} of the legacy set are story chapters — retiring them would`);
  console.error(`break a live season. Ids: ${chapters.map((c: { lesson_id: string }) => c.lesson_id).join(", ")}`);
  process.exit(1);
}

const specIds = M1_ANCHORED.flatMap((b) =>
  b.lessons.map((l) => `izon-m1-${String(l.n).padStart(2, "0")}`));
const neu = await sql`select id, title, "order" from lessons where id = ANY(${specIds}) order by "order"`;
const old = await sql`select id, title, "order", is_active from lessons where id = ANY(${LEGACY}) order by "order"`;

const [q] = await sql`
  select count(*) filter (where t.text = '[[NEEDS IZON]]')::int gaps,
         count(*) filter (where t.translation like '%TONE REQUIRED%')::int tone,
         count(*)::int total
  from transcript_segments t join lessons l on l.id = t.lesson_id where l.id like 'izon-m1-%'`;

console.log(`PROMOTE  ${neu.length} anchored lessons → active + published`);
console.log(`RETIRE   ${old.length} legacy lessons → inactive + draft`);
for (const o of old) console.log(`   ${String(o.order).padStart(3)}  ${o.id.padEnd(12)} ${o.title}`);
console.log(`\nWhat learners will then see: ${q.total} lines, of which`);
console.log(`   ${q.total - q.gaps} real Ịzọn`);
console.log(`   ${q.gaps} reading "[[NEEDS IZON]]"        ← visible to learners`);
console.log(`   ${q.tone} carrying a TONE REQUIRED note   ← visible to learners`);

if (!APPLY) { console.log(`\ndry run — re-run with --apply to write.`); }
else {
  // Promote ONLY the slots the spec still defines. A blanket
  // `id like 'izon-m1-%'` would resurrect lessons that a block merge retired —
  // it did exactly that once, bringing the vacated 51–59 range back to life.
  const keep = M1_ANCHORED.flatMap((b) =>
    b.lessons.map((l) => `izon-m1-${String(l.n).padStart(2, "0")}`));
  await sql`update lessons set is_active = true, status = 'published', published_at = now()
            where id = ANY(${keep})`;
  // `type <> 'game'` matters: the block-closing games (`izon-m1-g01`…`g10`)
  // share the id prefix but are not in the spec's lesson list, so an
  // unqualified sweep would retire every gate on the path.
  await sql`update lessons set is_active = false, status = 'draft'
            where id like 'izon-m1-%' and type <> 'game' and not (id = ANY(${keep}))`;
  await sql`update lessons set is_active = false, status = 'draft' where id = ANY(${LEGACY})`;
  await sql`update courses c set lessons_count = (
    select count(*) from lessons l
    where l.course_id = c.id and l.is_active and l.type <> 'game') where c.id = ${COURSE}`;

  const live = await sql`select id, title, "order" from lessons
    where course_id = ${COURSE} and is_active order by "order"`;
  console.log(`\napplied — ${live.length} active lessons in the Arrival course:`);
  for (const l of live) console.log(`   ${String(l.order).padStart(3)}  ${l.id.padEnd(14)} ${l.title}`);
}
