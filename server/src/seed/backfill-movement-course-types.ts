/**
 * Backfill `courses.course_type` on Movement courses.
 *
 *   npx tsx src/seed/backfill-movement-course-types.ts            # dry run
 *   npx tsx src/seed/backfill-movement-course-types.ts --apply    # write
 *
 * Why: the journey map picks a course's icon, category gloss, colour and
 * background scene from `course_type` (`mobile/lib/journey.ts` COURSE_ICON /
 * COURSE_GLOSS, `journey-scenery.tsx` SCENE_FOR). Izon's ten Movement courses
 * predate the `mv_*` types — nine carry NULL and one carries `first_words` left
 * over from the journey migration — so `iconFor` falls back to "mappin" and
 * `glossFor` to "" for most of the flagship's journey.
 *
 * The mapping is derived from the course id suffix. Movement 3 appears twice:
 * `-mv-village` is current, and `-mv-naming` is its id prior to 2026-08-02 (see
 * `rename-movement-3-to-village.ts`). Both map to `mv_village` so this script is
 * correct whether or not the rename has run, and in either order.
 *
 * Additive and idempotent: it only sets `course_type`, only on courses whose id
 * matches `%-mv-%`, and re-running changes nothing.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");

/** Course-id suffix → the `mv_*` course type declared in `lib/lesson-stubs.ts`. */
const TYPE_FOR_SUFFIX: Record<string, string> = {
  "mv-arrival": "mv_arrival",
  "mv-household": "mv_household",
  "mv-naming": "mv_village", // legacy id; the Movement is "The Village"
  "mv-village": "mv_village",
  "mv-growing-up": "mv_growing_up",
  "mv-threshold": "mv_threshold",
  "mv-working-year": "mv_working_year",
  "mv-union": "mv_union",
  "mv-assembly": "mv_assembly",
  "mv-elders-voice": "mv_elders_voice",
  "mv-keeper": "mv_keeper",
};

function suffixOf(courseId: string): string | null {
  const i = courseId.indexOf("-mv-");
  return i === -1 ? null : courseId.slice(i + 1);
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT id, language_id, title, course_type
    FROM courses
    WHERE id LIKE '%-mv-%'
    ORDER BY language_id, "order"
  `;

  if (rows.length === 0) {
    console.log("No Movement courses found — nothing to do.");
    return;
  }

  const planned: { id: string; from: string; to: string }[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const r of rows as { id: string; course_type: string | null; title: string }[]) {
    const suffix = suffixOf(r.id);
    const target = suffix ? TYPE_FOR_SUFFIX[suffix] : undefined;
    if (!target) {
      skipped.push({ id: r.id, reason: `no mapping for suffix "${suffix ?? "?"}"` });
      continue;
    }
    if (r.course_type === target) {
      skipped.push({ id: r.id, reason: "already correct" });
      continue;
    }
    planned.push({ id: r.id, from: r.course_type ?? "NULL", to: target });
  }

  console.log(`${rows.length} Movement course(s) found.\n`);
  if (planned.length) {
    console.log("Would set:");
    for (const p of planned) console.log(`  ${p.id.padEnd(34)} ${p.from} → ${p.to}`);
  }
  if (skipped.length) {
    console.log("\nSkipped:");
    for (const s of skipped) console.log(`  ${s.id.padEnd(34)} ${s.reason}`);
  }

  if (!APPLY) {
    console.log(`\nDry run — nothing written. Re-run with --apply to set ${planned.length} row(s).`);
    return;
  }

  for (const p of planned) {
    await sql`UPDATE courses SET course_type = ${p.to} WHERE id = ${p.id}`;
  }
  console.log(`\nApplied — ${planned.length} row(s) updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
