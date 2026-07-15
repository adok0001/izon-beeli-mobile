/**
 * Shared content selectors — the single source of truth for reading published
 * learning content. Both the public read routes and the offline snapshot
 * exporter call these, so the two can never drift.
 *
 * Publish gating: `courses`, `lessons`, `scripts`, and `scriptCharacters` are
 * filtered on their boolean `isActive` gate. Film stories (folded into
 * `culture_items`) are filtered on `scenes IS NOT NULL`. `dictionaryEntries`,
 * `sentenceTemplates`, `proverbs`, and `culturalContent` are filtered on the
 * Beeli Studio `status = 'published'` column (Phase 2).
 */
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  contributions,
  courses,
  cultureItems,
  culturalContent,
  culturalKeyTerms,
  dictionaryEntries,
  lessonCulturalContent,
  lessons,
  proverbs,
  storyArcCast,
  storyChapters,
  quizQuestions,
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
    .where(
      and(
        eq(dictionaryEntries.languageId, languageId),
        eq(dictionaryEntries.status, "published")
      )
    )
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
    .where(
      and(
        eq(sentenceTemplates.languageId, languageId),
        eq(sentenceTemplates.status, "published")
      )
    );
}

export async function selectProverbs(languageId: string) {
  return db
    .select()
    .from(proverbs)
    .where(and(eq(proverbs.languageId, languageId), eq(proverbs.status, "published")));
}

export async function selectQuizQuestions(languageId: string) {
  return db
    .select()
    .from(quizQuestions)
    .where(and(eq(quizQuestions.languageId, languageId), eq(quizQuestions.status, "published")))
    .orderBy(asc(quizQuestions.createdAt));
}

/** Cultural content with its key terms grouped in (matches GET /cultural). */
export async function selectCultural(languageId: string) {
  const content = await db
    .select()
    .from(culturalContent)
    .where(
      and(
        eq(culturalContent.languageId, languageId),
        eq(culturalContent.status, "published")
      )
    );
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

/** Collapse the flat `x` / `xFr` column pair into the app's LocalizedText map. */
function localized(en: string, fr: string | null) {
  return fr ? { en, fr } : { en };
}

/**
 * The recurring cast of the season this lesson belongs to, if any.
 *
 * The transcript tints each speaker's avatar by their cast id. That lookup used
 * to come from a bundled map; serving it with the lesson keeps the screen to a
 * single fetch, since a lesson has no direct link to its season (it is reached
 * through story_chapters).
 */
export async function selectLessonSeasonCast(lessonId: string) {
  return db
    .select({
      castId: storyArcCast.castId,
      name: storyArcCast.name,
      role: storyArcCast.role,
      avatar: storyArcCast.avatar,
      hue: storyArcCast.hue,
    })
    .from(storyChapters)
    .innerJoin(storyArcCast, eq(storyArcCast.storyArcId, storyChapters.storyArcId))
    .where(eq(storyChapters.lessonId, lessonId))
    .orderBy(asc(storyArcCast.order));
}

/**
 * The culture notes an educator attached to a specific lesson, shaped as the
 * app's `CulturalNote` so the lesson screen can render them inline.
 *
 * This read path did not exist until Jul 2026: Studio wrote these rows and
 * nothing ever served them, so an educator's note could never reach a learner.
 * The app compensated with a hardcoded bundle map keyed by lesson id, which is
 * now retired.
 *
 * `afterSegmentIndex` anchors a note after a specific transcript segment; null
 * means unanchored and the app groups it after the final segment.
 */
export async function selectLessonCulturalNotes(lessonId: string) {
  const rows = await db
    .select({
      title: culturalContent.title,
      titleFr: culturalContent.titleFr,
      description: culturalContent.description,
      descriptionFr: culturalContent.descriptionFr,
      category: culturalContent.category,
      afterSegmentIndex: lessonCulturalContent.afterSegmentIndex,
    })
    .from(lessonCulturalContent)
    .innerJoin(culturalContent, eq(lessonCulturalContent.culturalContentId, culturalContent.id))
    .where(
      and(
        eq(lessonCulturalContent.lessonId, lessonId),
        eq(culturalContent.status, "published")
      )
    )
    .orderBy(asc(lessonCulturalContent.order));

  return rows.map((r) => ({
    title: localized(r.title, r.titleFr),
    body: localized(r.description, r.descriptionFr),
    // The note card's overline reads tags[0]; the DB models this as a single
    // `category`, so lift it into the array shape the component expects.
    tags: [r.category],
    afterSegmentIndex: r.afterSegmentIndex ?? undefined,
  }));
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

/**
 * Film stories, optionally scoped to a display language. Interactive stories
 * were folded into `culture_items`: a "story" is a film row carrying an inline
 * scene graph. Gated on `scenes IS NOT NULL` (the film-has-a-story signal) so
 * the offline player resolves it, replacing the old `interactive_stories.isActive`.
 */
export async function selectInteractiveStories(language?: string) {
  const rows = await db
    .select()
    .from(cultureItems)
    .where(
      and(
        eq(cultureItems.type, "film"),
        isNotNull(cultureItems.scenes),
        language ? eq(cultureItems.language, language) : undefined
      )
    )
    .orderBy(asc(cultureItems.id));
  return rows.map(toApiInteractiveStory);
}
