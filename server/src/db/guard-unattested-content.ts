/**
 * Take unattested / placeholder lessons off the shelf.
 *
 *   npx tsx src/db/guard-unattested-content.ts           # dry run
 *   npx tsx src/db/guard-unattested-content.ts --apply   # deactivate them
 *
 * Two invariants, both authored in the content bundle and neither ever enforced
 * against the database (there is no importer — the rows were written by hand, so
 * the curation in `mobile/lib/data/podcasts/izon/index.ts` never applied to them):
 *
 *   1. A transcript line containing a `[[...]]` placeholder is an instruction to
 *      the production team, not language. It must never render to a learner.
 *   2. Lessons on the HELD list are held because an educator review found their
 *      target language FABRICATED. They stay dark until a keeper supplies the
 *      attested form.
 *
 * This deactivates (`is_active = false`) rather than deletes: the content stays
 * editable in Studio, it simply stops being served. Re-running is safe.
 *
 * Educators clear a lesson by fixing it in Studio — never by editing this list.
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index.js";

const APPLY = process.argv.includes("--apply");

/**
 * Held back by educator review: the Izon is fabricated. `teki`, `ina ẹrẹ` and
 * `ẹrẹmẹ` are unattested, and `Baịyo` means GOODBYE, not "good evening".
 * Mirrors HELD_PODCAST_IDS / HELD_COURSE_LESSON_IDS in the content bundle.
 * Remove an id here only once a keeper has supplied the attested form.
 */
const HELD_LESSON_IDS = ["izon-pod-b1", "izon-bmc-b1", "izon-bmc-b2"];

async function main() {
  console.log(APPLY ? "Content guard — APPLYING\n" : "Content guard — DRY RUN (pass --apply to write)\n");

  const { rows: placeholders } = await db.execute<{ id: string; n: number }>(sql`
    SELECT l.id, count(ts.id)::int AS n
    FROM lessons l
    JOIN transcript_segments ts ON ts.lesson_id = l.id
    WHERE ts.text LIKE '%[[%'
      AND l.is_active = true
    GROUP BY l.id
    ORDER BY l.id
  `);

  const { rows: held } = await db.execute<{ id: string }>(sql`
    SELECT id FROM lessons
    WHERE id IN ${HELD_LESSON_IDS} AND is_active = true
    ORDER BY id
  `);

  if (placeholders.length === 0 && held.length === 0) {
    console.log("Clean — no live lesson carries a placeholder or is on the held list.");
    process.exit(0);
  }

  if (placeholders.length > 0) {
    console.log(`Live lessons whose transcript still contains a [[placeholder]] (${placeholders.length}):`);
    for (const r of placeholders) console.log(`  ${r.id.padEnd(20)} ${r.n} segment(s)`);
  }

  if (held.length > 0) {
    console.log(`\nLive lessons on the held list — fabricated target language (${held.length}):`);
    for (const r of held) console.log(`  ${r.id}`);
  }

  if (!APPLY) {
    console.log("\nNothing written. Re-run with --apply to deactivate these.");
    process.exit(0);
  }

  await db.execute(sql`
    UPDATE lessons SET is_active = false
    WHERE is_active = true
      AND (
        id IN ${HELD_LESSON_IDS}
        OR EXISTS (
          SELECT 1 FROM transcript_segments ts
          WHERE ts.lesson_id = lessons.id AND ts.text LIKE '%[[%'
        )
      )
  `);

  const total = new Set([...placeholders.map((r) => r.id), ...held.map((r) => r.id)]).size;
  console.log(`\n-> deactivated ${total} lesson(s). They remain editable in Studio.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Guard failed:", err);
  process.exit(1);
});
