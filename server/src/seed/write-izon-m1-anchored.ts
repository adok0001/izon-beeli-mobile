import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { M1_ANCHORED } from "../../../.claude/skills/design-course/scaffold/m1-anchored.mts";

/**
 * Write the anchored Movement 1 into `course-izon-mv-arrival`.
 *
 *   npx tsx src/seed/write-izon-m1-anchored.ts          # dry run (default)
 *   npx tsx src/seed/write-izon-m1-anchored.ts --apply  # write
 *
 * 40 lessons across 50 slots (four content lessons per block, game on the
 * fifth), 840 transcript lines, 90% of them Ịzọn a tutor actually taught or a
 * live lesson already carried. Every line's provenance is in the source file's
 * `src`; it rides into the DB so a reviewer can trace any claim.
 *
 * LANDS INACTIVE AND DRAFT. `is_active` is what actually gates learner
 * visibility — no lesson route reads `lessons.status` (lessons.ts:22/43/68) —
 * so both are set. 80 lines still have no Ịzọn and 1 more is blocked on tone;
 * none of that should reach a learner until it is resolved.
 *
 * Idempotent: lesson ids are deterministic, the upsert only moves content
 * columns, and each lesson's transcript is replaced wholesale — the same
 * contract `insertLessonGroups` uses.
 */
const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);
const COURSE = "course-izon-mv-arrival";

/** Rows with no Ịzọn yet. Never blank — a blank `text` is silently dropped. */
const PLACEHOLDER = "[[NEEDS IZON]]";

type Row = {
  id: string; title: string; description: string; canDo: string; order: number;
  segs: { text: string; translation: string; speaker: string | null; roman: string | null }[];
};

const rows: Row[] = [];
for (const b of M1_ANCHORED) {
  for (const l of b.lessons) {
    rows.push({
      id: `izon-m1-${String(l.n).padStart(2, "0")}`,
      title: l.title,
      description: `${b.title} — ${b.pillar}. ${b.grammar}.`,
      canDo: l.canDo,
      order: l.n,
      segs: l.lines.map((x) => ({
        // The tone-blocked possessives keep their Ịzọn (it is correct) but carry
        // the warning in the translation, so a reviewer cannot miss that the
        // written form does not distinguish "my" from "your" on its own.
        text: x.izon ?? PLACEHOLDER,
        translation: x.needsTone ? `${x.en}  ⚠ TONE REQUIRED — written form is person-ambiguous` : x.en,
        speaker: x.speaker || null,
        // `roman` carries the unmarked spelling, per the owner's orthography
        // decision: mark subdots in the text, keep the bare form findable.
        roman: x.bare ?? null,
      })),
    });
  }
}

const lines = rows.reduce((s, r) => s + r.segs.length, 0);
const gaps = rows.reduce((s, r) => s + r.segs.filter((x) => x.text === PLACEHOLDER).length, 0);
const tone = rows.reduce((s, r) => s + r.segs.filter((x) => x.translation.includes("TONE REQUIRED")).length, 0);

console.log(`course ............ ${COURSE}`);
console.log(`lessons ........... ${rows.length}`);
console.log(`transcript lines .. ${lines}  (${lines - gaps} with Ịzọn, ${gaps} placeholder, ${tone} tone-blocked)`);
console.log(`orders ............ ${Math.min(...rows.map((r) => r.order))}–${Math.max(...rows.map((r) => r.order))}`);

const existing = await sql`select id, title, "order", is_active from lessons where course_id=${COURSE} order by "order"`;
console.log(`\nalready in this course: ${existing.length}`);
for (const e of existing) console.log(`   ${String(e.order).padStart(3)}  ${e.id.padEnd(16)} active=${e.is_active}  ${e.title}`);
const clash = existing.filter((e: { order: number }) => rows.some((r) => r.order === e.order));
if (clash.length) {
  console.log(`\n⚠ ${clash.length} legacy lessons share an order value with the new set.`);
  console.log(`   Harmless while the new lessons are inactive, but the legacy set must be`);
  console.log(`   retired before these are promoted, or the sequence will interleave.`);
}

if (!APPLY) { console.log(`\ndry run — re-run with --apply to write.`); }
else {
  for (const r of rows) {
    await sql`
      insert into lessons (id, course_id, type, title, description, can_do, "order", style, is_active, status)
      values (${r.id}, ${COURSE}, 'lesson', ${r.title}, ${r.description}, ${r.canDo}, ${r.order}, 'skit', false, 'draft')
      on conflict (id) do update set
        title = excluded.title, description = excluded.description,
        can_do = excluded.can_do, "order" = excluded."order", style = excluded.style`;
    await sql`delete from transcript_segments where lesson_id = ${r.id}`;
    await sql`
      insert into transcript_segments (lesson_id, text, translation, speaker, roman, start_time, end_time, "order")
      select * from unnest(
        ${r.segs.map(() => r.id)}::varchar[],
        ${r.segs.map((s) => s.text)}::text[],
        ${r.segs.map((s) => s.translation)}::text[],
        ${r.segs.map((s) => s.speaker)}::varchar[],
        ${r.segs.map((s) => s.roman)}::text[],
        ${r.segs.map(() => 0)}::integer[],
        ${r.segs.map(() => 0)}::integer[],
        ${r.segs.map((_, i) => i)}::integer[]
      )`;
    process.stdout.write(`\r  wrote ${r.id}`);
  }
  // Retire any izon-m1-* lesson whose slot the spec no longer defines. The
  // upsert above never deletes, so a merge that frees slots (12 blocks → 10)
  // would otherwise leave the vacated lessons live alongside the new set at
  // colliding order values. Status flip, not delete — the same contract used
  // to retire the legacy Arrival lessons.
  //
  // Game rows are exempt: `izon-m1-g01`…`g10` match the id prefix but are not
  // in this spec's lesson list, so an unqualified sweep would retire every
  // block-closing game and collapse the path's gates on the next run.
  const keep = rows.map((r) => r.id);
  const stale = await sql`
    update lessons set is_active = false, status = 'draft'
    where id like 'izon-m1-%' and type <> 'game'
      and not (id = ANY(${keep})) and is_active
    returning id`;
  if (stale.length > 0) {
    console.log(`retired ${stale.length} vacated slot(s): ${stale.map((s: { id: string }) => s.id).join(", ")}`);
  }

  // Games are not lessons — counting them would hold the course short of 100%.
  await sql`update courses c set lessons_count = (
    select count(*) from lessons l
    where l.course_id = c.id and l.is_active and l.type <> 'game') where c.id = ${COURSE}`;
  const [n] = await sql`select count(*)::int n from transcript_segments t
    join lessons l on l.id=t.lesson_id where l.id like 'izon-m1-%'`;
  console.log(`\n\napplied — ${rows.length} lessons, ${n.n} transcript lines, all inactive/draft.`);
}
