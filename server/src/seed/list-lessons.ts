/**
 * What lessons exist for a language, by course?
 *
 *   npx tsx src/seed/list-lessons.ts izon
 *   npx tsx src/seed/list-lessons.ts izon --course course-izon-mv-household
 *
 * Read-only. Companion to `lookup-words.ts`: that one answers "is this word
 * already in the dictionary?", this one answers "which existing lesson does this
 * new material extend?" — the placement half of the lesson-note review gate
 * (see .claude/skills/update-lesson-content/SKILL.md).
 *
 * Inactive courses and unpublished lessons are included and marked, because a
 * note's material often belongs to a Movement that is still being authored.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const argv = process.argv.slice(2);
const languageId = argv[0];
if (!languageId || languageId.startsWith("--")) {
  console.error("usage: list-lessons.ts <languageId> [--course <courseId>]");
  process.exit(1);
}
const courseIdx = argv.indexOf("--course");
const courseFilter = courseIdx >= 0 ? argv[courseIdx + 1] : null;

const sql = neon(process.env.DATABASE_URL!);
const rows = (await sql`
  SELECT c.id AS course_id, c.title AS course_title, c."order" AS course_order,
         c.is_active AS course_active,
         l.id AS lesson_id, l.title AS lesson_title, l."order" AS lesson_order,
         l.is_active AS lesson_active, l.status
  FROM courses c
  LEFT JOIN lessons l ON l.course_id = c.id
  WHERE c.language_id = ${languageId}
    AND (${courseFilter}::text IS NULL OR c.id = ${courseFilter})
  ORDER BY c."order", l."order"
`) as Record<string, string | number | boolean | null>[];

let current: string | null = null;
for (const r of rows) {
  if (r.course_id !== current) {
    current = r.course_id as string;
    const dark = r.course_active ? "" : "  (course inactive)";
    console.log(`\n${r.course_order}. ${r.course_title} — ${r.course_id}${dark}`);
  }
  if (!r.lesson_id) {
    console.log("     (no lessons)");
    continue;
  }
  const flags = [r.lesson_active ? null : "inactive", r.status !== "published" ? r.status : null]
    .filter(Boolean)
    .join(", ");
  console.log(`     ${r.lesson_order}. ${r.lesson_title} — ${r.lesson_id}${flags ? `  [${flags}]` : ""}`);
}
console.log();
