import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { M1_ANCHORED } from "../../../.claude/skills/design-course/scaffold/m1-anchored.mts";

/**
 * Write the block-closing game rows for the anchored Movement 1.
 *
 *   npx tsx src/seed/write-izon-m1-games.ts          # dry run (default)
 *   npx tsx src/seed/write-izon-m1-games.ts --apply  # write
 *
 * Movement 1 is authored as ten blocks of four lessons plus a closing game, and
 * the game holds a real slot in the course's `order` sequence — the lessons sit
 * at 1-4, 6-9, … 46-49 and the games at 5, 10, … 50. Until now those slots were
 * empty and the client guessed where the gates went by counting lessons in
 * fives, which put every gate a lesson late (the first one closing Block 1
 * *plus Block 2's opening lesson*) and produced eight gates instead of ten.
 *
 * These rows make the block boundaries explicit. `mobile/lib/checkpoints.ts`
 * reads them; `mobile/lib/course-path.ts` keeps them out of lesson lists and
 * completion counts, because a game is a stop on the path but not a lesson.
 *
 * They also give the authored game vocabulary somewhere to live. Blocks 6 and 8
 * each hold a word list that was deliberately kept OUT of the transcripts — the
 * Endi-areama fish names and the `sịlị … akpa` money scale — because a long
 * word list reads as a wordbank dump inside a dialogue but drills well as a
 * game. Those words become the game row's transcript segments, which is what
 * finally lets a learner meet them, and lets an educator edit them in Studio.
 *
 * Idempotent: ids are deterministic and each row's segments are replaced
 * wholesale, the same contract `write-izon-m1-anchored.ts` uses.
 */
const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);
const COURSE = "course-izon-mv-arrival";

/** Lessons per block; the game takes the slot after them. */
const BLOCK_SIZE = 5;

type GameRow = {
  id: string;
  title: string;
  description: string;
  canDo: string;
  order: number;
  words: { text: string; translation: string; roman: string | null }[];
};

const rows: GameRow[] = M1_ANCHORED.map((b) => ({
  id: `izon-m1-g${String(b.n).padStart(2, "0")}`,
  title: `${b.title} — Block Game`,
  description: `Closes Block ${b.n} (${b.title}) — ${b.pillar}. Retrieval practice over the four lessons before it.`,
  canDo: `I can recall and use what Block ${b.n} taught without looking back at the lessons.`,
  order: b.n * BLOCK_SIZE,
  words: (b.gameVocabulary ?? []).map((w) => ({
    text: w.izon,
    translation: w.en,
    // `roman` carries the unmarked spelling, matching the lesson rows.
    roman: w.bare ?? null,
  })),
}));

const withWords = rows.filter((r) => r.words.length > 0);
const totalWords = rows.reduce((s, r) => s + r.words.length, 0);

console.log(`course ........... ${COURSE}`);
console.log(`game rows ........ ${rows.length}  at orders ${rows.map((r) => r.order).join(", ")}`);
console.log(`authored words ... ${totalWords}, across ${withWords.length} block(s)`);
for (const r of withWords) console.log(`   ${r.id}  ${String(r.words.length).padStart(3)} words  ${r.title}`);

// A game row must not land on top of a lesson: they share one `order` sequence,
// and a collision would put two stops in the same slot on the trail.
const clash = await sql`
  select id, "order", title from lessons
  where course_id = ${COURSE} and is_active and type <> 'game'
    and "order" = ANY(${rows.map((r) => r.order)})
  order by "order"`;
if (clash.length > 0) {
  console.error(`\nABORT: ${clash.length} active lesson(s) already occupy a game slot.`);
  for (const c of clash as { id: string; order: number; title: string }[]) {
    console.error(`   ${String(c.order).padStart(3)}  ${c.id}  ${c.title}`);
  }
  console.error(`Move or retire them before the games can take those slots.`);
  process.exit(1);
}

if (!APPLY) {
  console.log(`\ndry run — re-run with --apply to write.`);
} else {
  for (const r of rows) {
    await sql`
      insert into lessons (id, course_id, type, title, description, can_do, "order", style, is_active, status)
      values (${r.id}, ${COURSE}, 'game', ${r.title}, ${r.description}, ${r.canDo}, ${r.order}, 'skit', true, 'published')
      on conflict (id) do update set
        type = 'game', title = excluded.title, description = excluded.description,
        can_do = excluded.can_do, "order" = excluded."order",
        is_active = true, status = 'published'`;
    await sql`delete from transcript_segments where lesson_id = ${r.id}`;
    if (r.words.length > 0) {
      await sql`
        insert into transcript_segments (lesson_id, text, translation, speaker, roman, start_time, end_time, "order")
        select * from unnest(
          ${r.words.map(() => r.id)}::varchar[],
          ${r.words.map((w) => w.text)}::text[],
          ${r.words.map((w) => w.translation)}::text[],
          ${r.words.map(() => null)}::varchar[],
          ${r.words.map((w) => w.roman)}::text[],
          ${r.words.map(() => 0)}::integer[],
          ${r.words.map(() => 0)}::integer[],
          ${r.words.map((_, i) => i)}::integer[]
        )`;
    }
    process.stdout.write(`\r  wrote ${r.id}`);
  }

  // `lessons_count` is what the learner sees as "x/N lessons", and a game is
  // not a lesson — counting them would hold a finished course short of 100%.
  await sql`update courses c set lessons_count = (
    select count(*) from lessons l
    where l.course_id = c.id and l.is_active and l.type <> 'game') where c.id = ${COURSE}`;

  const live = await sql`
    select id, "order", type, title from lessons
    where course_id = ${COURSE} and is_active order by "order"`;
  const [count] = await sql`select lessons_count from courses where id = ${COURSE}`;
  console.log(`\n\napplied — the Arrival path now walks:`);
  for (const l of live as { id: string; order: number; type: string; title: string }[]) {
    console.log(`   ${String(l.order).padStart(3)}  ${l.type === "game" ? "▲" : " "} ${l.id.padEnd(14)} ${l.title}`);
  }
  console.log(`\nlessons_count (games excluded): ${(count as { lessons_count: number }).lessons_count}`);
}
