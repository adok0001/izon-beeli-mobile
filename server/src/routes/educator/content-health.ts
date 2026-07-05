import { count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../db/index.js";
import {
  activities,
  courses,
  culturalContent,
  dictionaryEntries,
  etymologyEntries,
  proverbs,
  quizQuestions,
  scenarios,
  sentenceTemplates,
} from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";
import { getDictionaryCoverageReport, getTranslationCoverageReport } from "./dictionary.js";

export const educatorContentHealthRouter = new Hono<AuthEnv>();

// Entities with a direct `languageId` column, so a per-language publish-status
// breakdown is meaningful. lessons/story_arcs are course-scoped (not directly
// language-scoped) and content_partners has no language scope at all — same
// caveat as content-publish.ts's ENTITY_TYPES, so they're left out here.
const LANGUAGE_SCOPED_ENTITIES = [
  { entityType: "dictionary_entries", table: dictionaryEntries },
  { entityType: "proverbs", table: proverbs },
  { entityType: "etymology_entries", table: etymologyEntries },
  { entityType: "cultural_content", table: culturalContent },
  { entityType: "sentence_templates", table: sentenceTemplates },
  { entityType: "scenarios", table: scenarios },
  { entityType: "quiz_questions", table: quizQuestions },
  { entityType: "courses", table: courses },
  { entityType: "activities", table: activities },
] as const;

const STATUSES = ["draft", "in_review", "published", "archived"] as const;

// GET /educator/content-health?languageId=xx
// One dashboard combining dictionary coverage, per-locale translation
// coverage, media (audio/image) coverage, and a publish-status breakdown —
// each already computed elsewhere for a single-entity view; this aggregates
// them for the Studio overview pages.
educatorContentHealthRouter.get("/content-health", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const languageId = c.req.query("languageId") ?? (isAdmin ? "" : reviewerLanguages[0]);

  if (!languageId) return c.json({ error: "languageId is required" }, 400);
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const [dictionaryCoverage, translationCoverage, mediaRows, statusBreakdown] = await Promise.all([
    getDictionaryCoverageReport(languageId),
    getTranslationCoverageReport(languageId),
    db
      .select({
        total: count(),
        withAudio: count(dictionaryEntries.audioUrl),
        withImage: count(dictionaryEntries.imageUrl),
        withExampleAudio: count(dictionaryEntries.exampleAudioUrl),
      })
      .from(dictionaryEntries)
      .where(eq(dictionaryEntries.languageId, languageId)),
    Promise.all(
      LANGUAGE_SCOPED_ENTITIES.map(async ({ entityType, table }) => {
        const rows = await db
          .select({ status: table.status, count: count() })
          .from(table)
          .where(eq(table.languageId, languageId))
          .groupBy(table.status);
        const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<(typeof STATUSES)[number], number>;
        for (const row of rows) byStatus[row.status] = row.count;
        return { entityType, ...byStatus };
      })
    ),
  ]);

  const media = mediaRows[0] ?? { total: 0, withAudio: 0, withImage: 0, withExampleAudio: 0 };
  const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return c.json({
    languageId,
    dictionaryCoverage: {
      distinctWords: dictionaryCoverage.distinctWords,
      coveredWords: dictionaryCoverage.coveredWords,
      pct: pct(dictionaryCoverage.coveredWords, dictionaryCoverage.distinctWords),
    },
    translationCoverage,
    mediaCoverage: {
      total: media.total,
      audio: { count: media.withAudio, pct: pct(media.withAudio, media.total) },
      image: { count: media.withImage, pct: pct(media.withImage, media.total) },
      exampleAudio: { count: media.withExampleAudio, pct: pct(media.withExampleAudio, media.total) },
    },
    statusBreakdown,
  });
});
