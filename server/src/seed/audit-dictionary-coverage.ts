/**
 * Audit dictionary coverage of lesson transcripts.
 *
 * For each language (or one passed as an argument), lists transcript words
 * that have no dictionary entry and no approved word contribution.
 *
 *   npx tsx src/seed/audit-dictionary-coverage.ts [languageId]
 */
import "dotenv/config";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  contributions,
  courses,
  dictionaryEntries,
  englishWordbank,
  lessons,
  transcriptSegments,
} from "../db/schema.js";
import { computeCoverage } from "../lib/dictionary-coverage.js";

async function auditLanguage(languageId: string, englishWords: string[]) {
  const lessonRows = await db
    .select({ id: lessons.id, title: lessons.title })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(courses.languageId, languageId));
  const lessonsById = new Map(lessonRows.map((l) => [l.id, l]));

  const segments = lessonRows.length
    ? await db
        .select({ lessonId: transcriptSegments.lessonId, text: transcriptSegments.text })
        .from(transcriptSegments)
        .where(inArray(transcriptSegments.lessonId, lessonRows.map((l) => l.id)))
    : [];

  const dictRows = await db
    .select({ word: dictionaryEntries.word })
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId));
  const approvedContribs = await db
    .select({ word: contributions.word })
    .from(contributions)
    .where(
      and(
        eq(contributions.status, "approved"),
        eq(contributions.languageId, languageId),
        notInArray(contributions.type, ["entry_audio", "entry_image", "entry_meaning"]),
      )
    );

  const report = computeCoverage(
    segments,
    [...dictRows, ...approvedContribs].map((r) => r.word),
    lessonsById,
    englishWords,
  );

  const pct = report.distinctWords
    ? Math.round((report.coveredWords / report.distinctWords) * 100)
    : 100;
  console.log(
    `\n${languageId}: ${report.coveredWords}/${report.distinctWords} transcript words covered (${pct}%), ` +
    `${report.missing.length} missing, ${lessonRows.length} lessons, ${dictRows.length} dictionary entries`
  );
  for (const m of report.missing) {
    const where = m.lessons.map((l) => l.title).join(", ");
    console.log(`  ${m.word.padEnd(24)} ×${String(m.count).padEnd(4)} ${where}`);
  }
}

async function main() {
  const arg = process.argv[2];
  const languageIds = arg
    ? [arg]
    : (await db.selectDistinct({ languageId: courses.languageId }).from(courses))
        .map((r) => r.languageId)
        .sort((a, b) => a.localeCompare(b));

  const englishWords = (
    await db.select({ word: englishWordbank.word }).from(englishWordbank)
  ).map((r) => r.word);

  for (const languageId of languageIds) await auditLanguage(languageId, englishWords);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
