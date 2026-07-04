/**
 * Shared content selectors — the single source of truth for reading published
 * learning content. Both the public read routes and the offline snapshot
 * exporter call these, so the two can never drift.
 *
 * Publish gating: tables that already carry a boolean gate are filtered here
 * (`courses`, `lessons`, `scripts`, `scriptCharacters`, `interactiveStories` via
 * `isActive`). Tables without a status column yet (dictionary, sentences,
 * proverbs, cultural) return all rows — swap in `status = 'published'` once the
 * CMS editorial workflow (Phase 2) adds that column.
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  contributions,
  courses,
  culturalContent,
  culturalKeyTerms,
  dictionaryEntries,
  interactiveStories,
  lessons,
  proverbs,
  scriptCharacters,
  scripts,
  sentenceTemplates,
  transcriptSegments,
  users,
} from "../db/schema.js";
import { withTranslations } from "./dictionary-translations.js";
import { toApiInteractiveStory } from "../routes/interactive-stories.js";

/** Full published dictionary for a language: static entries + approved contributions. */
export async function selectDictionary(languageId: string) {
  const staticEntries = await db
    .select()
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId))
    .orderBy(asc(dictionaryEntries.word));

  const approvedContribs = await db
    .select({
      id: contributions.id,
      word: contributions.word,
      english: contributions.english,
      category: contributions.category,
      languageId: contributions.languageId,
      pronunciation: contributions.pronunciation,
      example: contributions.example,
      exampleTranslation: contributions.exampleTranslation,
      audioUrl: contributions.audioUrl,
      contributorId: contributions.userId,
      contributorName: users.name,
    })
    .from(contributions)
    .leftJoin(users, eq(contributions.userId, users.id))
    .where(and(eq(contributions.languageId, languageId), eq(contributions.status, "approved")))
    .orderBy(contributions.word);

  const contribsWithMap = approvedContribs.map((r) => ({
    ...r,
    translations: { en: r.english },
    exampleTranslations: r.exampleTranslation ? { en: r.exampleTranslation } : null,
  }));

  return [...staticEntries.map(withTranslations), ...contribsWithMap];
}

export async function selectSentences(languageId: string) {
  return db
    .select()
    .from(sentenceTemplates)
    .where(eq(sentenceTemplates.languageId, languageId));
}

export async function selectProverbs(languageId: string) {
  return db.select().from(proverbs).where(eq(proverbs.languageId, languageId));
}

/** Cultural content with its key terms grouped in (matches GET /cultural). */
export async function selectCultural(languageId: string) {
  const content = await db
    .select()
    .from(culturalContent)
    .where(eq(culturalContent.languageId, languageId));
  if (content.length === 0) return [];

  const contentIds = content.map((c) => c.id);
  const keyTerms = await db
    .select()
    .from(culturalKeyTerms)
    .where(inArray(culturalKeyTerms.culturalContentId, contentIds))
    .orderBy(asc(culturalKeyTerms.order));

  const termsByContentId = new Map<string, { word: string; english: string }[]>();
  for (const term of keyTerms) {
    const list = termsByContentId.get(term.culturalContentId) ?? [];
    list.push({ word: term.word, english: term.english });
    termsByContentId.set(term.culturalContentId, list);
  }
  return content.map((item) => ({ ...item, keyTerms: termsByContentId.get(item.id) ?? [] }));
}

export async function selectPublishedCourses(languageId: string) {
  return db
    .select()
    .from(courses)
    .where(and(eq(courses.languageId, languageId), eq(courses.isActive, true)))
    .orderBy(asc(courses.order));
}

/** All active lessons across the language's courses (+ their transcript segments). */
export async function selectPublishedLessons(languageId: string) {
  const langCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.languageId, languageId));
  if (langCourses.length === 0) return { lessons: [], segments: [] };

  const courseIds = langCourses.map((c) => c.id);
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(and(inArray(lessons.courseId, courseIds), eq(lessons.isActive, true)))
    .orderBy(asc(lessons.order));
  if (lessonRows.length === 0) return { lessons: lessonRows, segments: [] };

  const lessonIds = lessonRows.map((l) => l.id);
  const segments = await db
    .select()
    .from(transcriptSegments)
    .where(inArray(transcriptSegments.lessonId, lessonIds))
    .orderBy(asc(transcriptSegments.order));
  return { lessons: lessonRows, segments };
}

/** Active scripts for a language + their active characters (raw rows). */
export async function selectScripts(languageId: string) {
  const scriptRows = await db
    .select()
    .from(scripts)
    .where(and(eq(scripts.languageId, languageId), eq(scripts.isActive, true)))
    .orderBy(asc(scripts.name));
  if (scriptRows.length === 0) return { scripts: scriptRows, characters: [] };

  const scriptIds = scriptRows.map((s) => s.id);
  const characters = await db
    .select()
    .from(scriptCharacters)
    .where(and(inArray(scriptCharacters.scriptId, scriptIds), eq(scriptCharacters.isActive, true)))
    .orderBy(asc(scriptCharacters.displayOrder));
  return { scripts: scriptRows, characters };
}

/** Active interactive stories, optionally scoped to a display language. */
export async function selectInteractiveStories(language?: string) {
  const rows = await db
    .select()
    .from(interactiveStories)
    .where(
      and(
        eq(interactiveStories.isActive, true),
        language ? eq(interactiveStories.language, language) : undefined
      )
    )
    .orderBy(asc(interactiveStories.id));
  return rows.map(toApiInteractiveStory);
}
