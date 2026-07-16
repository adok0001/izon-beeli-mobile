import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * Recycle-rate report — measures the spiral (izon-course-plan.md §6).
 *
 * For each Movement course (in journey order), splits its transcript token
 * vocabulary into RETURNING (seen in an earlier Movement) vs NEW, and reports
 * the recycle rate. A healthy spiral re-encounters earlier language in new
 * contexts; a Movement introducing mostly-new tokens is front-loading too much.
 *
 * Read-only. Tokens are diacritic-insensitive lowercased words; punctuation
 * stripped; [[placeholder]] lines skipped. This is a content-health signal for
 * editors, not a learner-facing number.
 *
 *   npx tsx src/seed/report-recycle-rate.ts [languageId=izon] [--floor 0.3]
 */

const sql = neon(process.env.DATABASE_URL!);
const languageId = process.argv.find((a) => !a.startsWith("-") && !a.includes("/") && !a.includes("tsx") && !a.includes("node") && !a.includes("report-recycle-rate")) ?? "izon";
const floorIdx = process.argv.indexOf("--floor");
const FLOOR = floorIdx >= 0 ? parseFloat(process.argv[floorIdx + 1] ?? "0.3") : 0.3;

function tokenize(text: string): string[] {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

async function main() {
  const courses = (await sql`
    SELECT id, title, "order" FROM courses
    WHERE language_id = ${languageId} AND is_active = true AND "order" < 100
    ORDER BY "order"
  `) as { id: string; title: string; order: number }[];

  if (courses.length === 0) {
    console.log(`No active journey courses for ${languageId}.`);
    return;
  }

  console.log(`Recycle-rate report — ${languageId} (floor ${FLOOR})\n`);
  console.log("A returning token appeared in ANY earlier unit. Low recycle = too much new at once.\n");

  const seen = new Set<string>();
  let flagged = 0;

  for (const course of courses) {
    const segs = (await sql`
      SELECT ts.text FROM transcript_segments ts
      JOIN lessons l ON l.id = ts.lesson_id
      WHERE l.course_id = ${course.id} AND l.is_active = true AND ts.text NOT LIKE '%[[%'
    `) as { text: string }[];

    const tokens = new Set(segs.flatMap((s) => tokenize(s.text)));
    if (tokens.size === 0) {
      console.log(`  #${String(course.order).padStart(2)} ${course.id.padEnd(30)} (no live transcript)`);
      continue;
    }

    const returning = [...tokens].filter((t) => seen.has(t)).length;
    const rate = returning / tokens.size;
    const isFirst = seen.size === 0;
    const under = !isFirst && rate < FLOOR;
    if (under) flagged += 1;

    console.log(
      `  #${String(course.order).padStart(2)} ${course.id.padEnd(30)} ${tokens.size} tokens · ` +
      (isFirst ? "baseline (first unit)" : `${(rate * 100).toFixed(0)}% returning${under ? "  ← BELOW FLOOR" : ""}`)
    );

    for (const t of tokens) seen.add(t);
  }

  console.log(`\nCumulative vocabulary: ${seen.size} distinct tokens.`);
  console.log(flagged > 0
    ? `${flagged} unit(s) below the ${FLOOR} recycle floor — consider re-weaving earlier language into their scenes.`
    : "Every unit meets the recycle floor. The spiral holds.");
}

main().catch((err) => {
  console.error("Report failed:", err);
  process.exit(1);
});
