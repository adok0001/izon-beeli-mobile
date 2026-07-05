import "dotenv/config";
import "./_guard.js";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  courses,
  culturalContent,
  culturalKeyTerms,
  cultureItems,
  dictionaryEntries,
  lessons,
  proverbs,
  sentenceTemplates,
  storyArcs,
  storyChapters,
  transcriptSegments,
} from "../db/schema.js";

// ---------------------------------------------------------------------------
// Dictionaries
// ---------------------------------------------------------------------------
import { AKAN_DICTIONARY } from "../../../mobile/lib/data/akan.js";
import { AMHARIC_DICTIONARY } from "../../../mobile/lib/data/amharic.js";
import { ARABIC_EGYPTIAN_DICTIONARY } from "../../../mobile/lib/data/arabic-egyptian.js";
import { BAMBARA_DICTIONARY } from "../../../mobile/lib/data/bambara.js";
import { EWE_DICTIONARY } from "../../../mobile/lib/data/ewe.js";
import { HAUSA_DICTIONARY } from "../../../mobile/lib/data/hausa.js";
import { IGBO_DICTIONARY } from "../../../mobile/lib/data/igbo.js";
import { IZON_DICTIONARY } from "../../../mobile/lib/data/izon.js";
import { KINYARWANDA_DICTIONARY } from "../../../mobile/lib/data/kinyarwanda.js";
import { OROMO_DICTIONARY } from "../../../mobile/lib/data/oromo.js";
import { SHONA_DICTIONARY } from "../../../mobile/lib/data/shona.js";
import { SOMALI_DICTIONARY } from "../../../mobile/lib/data/somali.js";
import { SWAHILI_DICTIONARY } from "../../../mobile/lib/data/swahili.js";
import { TAMAZIGHT_DICTIONARY } from "../../../mobile/lib/data/tamazight.js";
import { WOLOF_DICTIONARY } from "../../../mobile/lib/data/wolof.js";
import { YORUBA_DICTIONARY } from "../../../mobile/lib/data/yoruba.js";

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------
import { COURSES } from "../../../mobile/lib/data/courses.js";

// ---------------------------------------------------------------------------
// Bou Mie media package — story arcs (podcast season + 3 courses) and the
// Discover culture items (3 films + the podcast season). Podcast episode
// lessons and course lessons ride in via ALL_LESSONS / COURSES above.
// ---------------------------------------------------------------------------
import {
  IZON_PODCAST_STORY,
  IZON_BM_COURSE_STORIES,
  IZON_FILM_DISCOVER_ITEMS,
  buildIzonPodcastDiscoverItem,
} from "../../../mobile/lib/data/podcasts/izon/index.js";

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------
import { ALL_LESSONS } from "../../../mobile/lib/data/lessons/index.js";

// ---------------------------------------------------------------------------
// Proverbs
// ---------------------------------------------------------------------------
import { AKAN_PROVERBS } from "../../../mobile/lib/data/proverbs/akan.js";
import { AMHARIC_PROVERBS } from "../../../mobile/lib/data/proverbs/amharic.js";
import { ARABIC_EGYPTIAN_PROVERBS } from "../../../mobile/lib/data/proverbs/arabic-egyptian.js";
import { BAMBARA_PROVERBS } from "../../../mobile/lib/data/proverbs/bambara.js";
import { EWE_PROVERBS } from "../../../mobile/lib/data/proverbs/ewe.js";
import { HAUSA_PROVERBS } from "../../../mobile/lib/data/proverbs/hausa.js";
import { IGBO_PROVERBS } from "../../../mobile/lib/data/proverbs/igbo.js";
import { IZON_PROVERBS } from "../../../mobile/lib/data/proverbs/izon.js";
import { KINYARWANDA_PROVERBS } from "../../../mobile/lib/data/proverbs/kinyarwanda.js";
import { SOMALI_PROVERBS } from "../../../mobile/lib/data/proverbs/somali.js";
import { SWAHILI_PROVERBS } from "../../../mobile/lib/data/proverbs/swahili.js";
import { TAMAZIGHT_PROVERBS } from "../../../mobile/lib/data/proverbs/tamazight.js";
import { WOLOF_PROVERBS } from "../../../mobile/lib/data/proverbs/wolof.js";
import { YORUBA_PROVERBS } from "../../../mobile/lib/data/proverbs/yoruba.js";

// ---------------------------------------------------------------------------
// Cultural content
// ---------------------------------------------------------------------------
import { AKAN_CULTURAL } from "../../../mobile/lib/data/cultural/akan.js";
import { AMHARIC_CULTURAL } from "../../../mobile/lib/data/cultural/amharic.js";
import { ARABIC_EGYPTIAN_CULTURAL } from "../../../mobile/lib/data/cultural/arabic-egyptian.js";
import { BAMBARA_CULTURAL } from "../../../mobile/lib/data/cultural/bambara.js";
import { EWE_CULTURAL } from "../../../mobile/lib/data/cultural/ewe.js";
import { HAUSA_CULTURAL } from "../../../mobile/lib/data/cultural/hausa.js";
import { IGBO_CULTURAL } from "../../../mobile/lib/data/cultural/igbo.js";
import { IZON_CULTURAL } from "../../../mobile/lib/data/cultural/izon.js";
import { KINYARWANDA_CULTURAL } from "../../../mobile/lib/data/cultural/kinyarwanda.js";
import { SOMALI_CULTURAL } from "../../../mobile/lib/data/cultural/somali.js";
import { SWAHILI_CULTURAL } from "../../../mobile/lib/data/cultural/swahili.js";
import { TAMAZIGHT_CULTURAL } from "../../../mobile/lib/data/cultural/tamazight.js";
import { WOLOF_CULTURAL } from "../../../mobile/lib/data/cultural/wolof.js";
import { YORUBA_CULTURAL } from "../../../mobile/lib/data/cultural/yoruba.js";

// ---------------------------------------------------------------------------
// Sentence templates
// ---------------------------------------------------------------------------
import { AMHARIC_SENTENCES } from "../../../mobile/lib/data/sentences/amharic.js";
import { ARABIC_EGYPTIAN_SENTENCES } from "../../../mobile/lib/data/sentences/arabic-egyptian.js";
import { BAMBARA_SENTENCES } from "../../../mobile/lib/data/sentences/bambara.js";
import { EWE_SENTENCES } from "../../../mobile/lib/data/sentences/ewe.js";
import { HAUSA_SENTENCES } from "../../../mobile/lib/data/sentences/hausa.js";
import { IGBO_SENTENCES } from "../../../mobile/lib/data/sentences/igbo.js";
import { IZON_SENTENCES } from "../../../mobile/lib/data/sentences/izon.js";
import { KINYARWANDA_SENTENCES } from "../../../mobile/lib/data/sentences/kinyarwanda.js";
import { SOMALI_SENTENCES } from "../../../mobile/lib/data/sentences/somali.js";
import { SWAHILI_SENTENCES } from "../../../mobile/lib/data/sentences/swahili.js";
import { TAMAZIGHT_SENTENCES } from "../../../mobile/lib/data/sentences/tamazight.js";
import { WOLOF_SENTENCES } from "../../../mobile/lib/data/sentences/wolof.js";
import { YORUBA_SENTENCES } from "../../../mobile/lib/data/sentences/yoruba.js";

// ---------------------------------------------------------------------------
// Sync functions
// ---------------------------------------------------------------------------

async function syncDict() {
  console.log("  Syncing dictionary entries...");

  const allDictEntries = [
    ...IZON_DICTIONARY,
    ...YORUBA_DICTIONARY,
    ...IGBO_DICTIONARY,
    ...HAUSA_DICTIONARY,
    ...SWAHILI_DICTIONARY,
    ...AMHARIC_DICTIONARY,
    ...AKAN_DICTIONARY,
    ...WOLOF_DICTIONARY,
    ...ARABIC_EGYPTIAN_DICTIONARY,
    ...SOMALI_DICTIONARY,
    ...BAMBARA_DICTIONARY,
    ...TAMAZIGHT_DICTIONARY,
    ...KINYARWANDA_DICTIONARY,
    ...EWE_DICTIONARY,
    ...OROMO_DICTIONARY,
    ...SHONA_DICTIONARY,
  ];

  const rows = allDictEntries.map((e) => ({
    id: e.id,
    languageId: e.languageId,
    word: e.word,
    english: e.english,
    french: (e as any).french ?? null,
    category: e.category,
    pronunciation: e.pronunciation ?? null,
    example: e.example ?? null,
    exampleTranslation: e.exampleTranslation ?? null,
    exampleTranslationFr: (e as any).exampleTranslationFr ?? null,
    audioUrl: typeof e.audioUrl === "string" ? e.audioUrl : null,
    imageUrl: (e as any).imageUrl ?? null,
    contributorName: e.contributorName ?? null,
    contributorId: e.contributorId ?? null,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await db.insert(dictionaryEntries).values(chunk).onConflictDoUpdate({
      target: dictionaryEntries.id,
      set: {
        word:               sql`excluded.word`,
        english:            sql`excluded.english`,
        french:             sql`excluded.french`,
        category:           sql`excluded.category`,
        pronunciation:      sql`excluded.pronunciation`,
        example:            sql`excluded.example`,
        exampleTranslation: sql`excluded.example_translation`,
        exampleTranslationFr: sql`excluded.example_translation_fr`,
        // Preserve externally-added data — never overwrite with null from source files
        audioUrl:        sql`COALESCE(dictionary_entries.audio_url, excluded.audio_url)`,
        imageUrl:        sql`COALESCE(dictionary_entries.image_url, excluded.image_url)`,
        contributorName: sql`COALESCE(dictionary_entries.contributor_name, excluded.contributor_name)`,
        contributorId:   sql`COALESCE(dictionary_entries.contributor_id, excluded.contributor_id)`,
      },
    });
  }

  console.log(`    ${rows.length} dictionary entries synced.`);
}

/**
 * Collapses a LocalizedText value (object) into a plain string for one language
 * column. Source data files may provide either a legacy plain string or a
 * `{ en, fr, ... }` map; the DB columns store one language each (e.g. `title`
 * holds English, `titleFr` holds French). This keeps the API contract a plain
 * string so older app builds — which don't parse LocalizedText — render cleanly.
 */
function resolveText(
  v: string | Record<string, string | undefined> | null | undefined,
  lang: "en" | "fr"
): string | null {
  if (v == null) return null;
  if (typeof v === "string") return lang === "en" ? v : null;
  return v[lang] ?? null;
}

async function syncLessons() {
  console.log("  Syncing lessons and transcripts...");

  let lessonCount = 0;
  let segmentCount = 0;

  for (const lesson of ALL_LESSONS) {
    const { transcript, ...lessonData } = lesson;

    // Collapse LocalizedText -> per-language columns (mirrors syncCourses).
    // The source `title`/`description` may be a `{ en, fr }` map; the DB stores
    // English in `title`/`description` and French in `titleFr`/`descriptionFr`.
    const title = resolveText(lessonData.title as any, "en") ?? "";
    const titleFr = resolveText(lessonData.title as any, "fr") ?? lessonData.titleFr ?? null;
    const description = resolveText(lessonData.description as any, "en") ?? "";
    const descriptionFr = resolveText(lessonData.description as any, "fr") ?? lessonData.descriptionFr ?? null;

    const transcriptType = (lessonData as any).transcriptType ?? null;
    const canDo = resolveText((lessonData as any).canDo, "en");
    const canDoFr = resolveText((lessonData as any).canDo, "fr") ?? (lessonData as any).canDoFr ?? null;

    await db.insert(lessons).values({
      ...lessonData,
      type: lessonData.type ?? "lesson",
      title,
      titleFr,
      description,
      descriptionFr,
      artist: lessonData.artist ?? null,
      genre: lessonData.genre ?? null,
      isActive: lessonData.isActive ?? true,
      scene: (lessonData as any).scene ?? null,
      sceneTitle: (lessonData as any).sceneTitle ?? null,
      sceneOrder: (lessonData as any).sceneOrder ?? null,
      transcriptType,
      canDo,
      canDoFr,
    }).onConflictDoUpdate({
      target: lessons.id,
      set: {
        type:          lessonData.type ?? "lesson",
        title,
        titleFr,
        description,
        descriptionFr,
        duration:      lessonData.duration,
        order:         lessonData.order,
        artist:        lessonData.artist ?? null,
        genre:         lessonData.genre ?? null,
        isActive:      lessonData.isActive ?? true,
        scene:         (lessonData as any).scene ?? null,
        sceneTitle:    (lessonData as any).sceneTitle ?? null,
        sceneOrder:    (lessonData as any).sceneOrder ?? null,
        transcriptType,
        canDo,
        canDoFr,
        // Preserve educator-uploaded audio — never overwrite with placeholder from source file
        audioUrl: sql`COALESCE(lessons.audio_url, excluded.audio_url)`,
      },
    });

    // Transcript segments have no stable external key — delete and re-insert
    await db.delete(transcriptSegments).where(eq(transcriptSegments.lessonId, lesson.id));
    if (transcript.length > 0) {
      const segments = transcript.map((seg, idx) => ({
        lessonId: lesson.id,
        startTime: seg.startTime,
        endTime: seg.endTime,
        text: seg.text,
        translation: resolveText(seg.translation as any, "en"),
        translationFr: resolveText(seg.translation as any, "fr") ?? (seg as any).translationFr ?? null,
        speaker: (seg as any).speaker ?? null,
        roman: (seg as any).roman ?? null,
        order: idx,
      }));
      for (let i = 0; i < segments.length; i += 100) {
        await db.insert(transcriptSegments).values(segments.slice(i, i + 100));
      }
      segmentCount += segments.length;
    }
    lessonCount++;
  }

  console.log(`    ${lessonCount} lessons, ${segmentCount} transcript segments synced.`);
}

async function syncProverbs() {
  console.log("  Syncing proverbs...");

  const allProverbs = [
    ...IZON_PROVERBS,
    ...YORUBA_PROVERBS,
    ...AKAN_PROVERBS,
    ...IGBO_PROVERBS,
    ...HAUSA_PROVERBS,
    ...SWAHILI_PROVERBS,
    ...AMHARIC_PROVERBS,
    ...WOLOF_PROVERBS,
    ...ARABIC_EGYPTIAN_PROVERBS,
    ...SOMALI_PROVERBS,
    ...BAMBARA_PROVERBS,
    ...TAMAZIGHT_PROVERBS,
    ...KINYARWANDA_PROVERBS,
    ...EWE_PROVERBS,
  ];

  const rows = allProverbs.map((p) => ({
    id: p.id,
    languageId: p.languageId,
    text: p.text,
    translation: p.translation,
    translationFr: p.translationFr ?? null,
    meaning: p.meaning,
    meaningFr: p.meaningFr ?? null,
    literal: p.literal ?? null,
    context: p.context ?? null,
    tags: p.tags ?? null,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await db.insert(proverbs).values(chunk).onConflictDoUpdate({
      target: proverbs.id,
      set: {
        text:          sql`excluded.text`,
        translation:   sql`excluded.translation`,
        translationFr: sql`excluded.translation_fr`,
        meaning:       sql`excluded.meaning`,
        meaningFr:     sql`excluded.meaning_fr`,
        literal:       sql`excluded.literal`,
        context:       sql`excluded.context`,
        tags:          sql`excluded.tags`,
      },
    });
  }

  console.log(`    ${rows.length} proverbs synced.`);
}

async function syncCultural() {
  console.log("  Syncing cultural content...");

  const allCultural = [
    ...IZON_CULTURAL,
    ...YORUBA_CULTURAL,
    ...AKAN_CULTURAL,
    ...IGBO_CULTURAL,
    ...HAUSA_CULTURAL,
    ...SWAHILI_CULTURAL,
    ...AMHARIC_CULTURAL,
    ...WOLOF_CULTURAL,
    ...ARABIC_EGYPTIAN_CULTURAL,
    ...SOMALI_CULTURAL,
    ...BAMBARA_CULTURAL,
    ...TAMAZIGHT_CULTURAL,
    ...KINYARWANDA_CULTURAL,
    ...EWE_CULTURAL,
  ];

  const culturalRows = allCultural.map((c) => ({
    id: c.id,
    languageId: c.languageId,
    category: c.category,
    title: c.title,
    titleFr: (c as any).titleFr ?? null,
    description: c.description,
    descriptionFr: (c as any).descriptionFr ?? null,
    imageEmoji: c.imageEmoji,
    featured: (c as any).featured ?? false,
    headword: (c as any).headword ?? null,
    applications: (c as any).applications ?? null,
    heroBands: (c as any).heroBands ?? null,
  }));

  for (let i = 0; i < culturalRows.length; i += 100) {
    const chunk = culturalRows.slice(i, i + 100);
    await db.insert(culturalContent).values(chunk).onConflictDoUpdate({
      target: culturalContent.id,
      set: {
        category:    sql`excluded.category`,
        title:       sql`excluded.title`,
        titleFr:     sql`excluded.title_fr`,
        description: sql`excluded.description`,
        descriptionFr: sql`excluded.description_fr`,
        imageEmoji:  sql`excluded.image_emoji`,
        featured:    sql`excluded.featured`,
        headword:    sql`excluded.headword`,
        applications: sql`excluded.applications`,
        heroBands:   sql`excluded.hero_bands`,
      },
    });
  }

  // Key terms have UUID primary keys — delete per content ID and re-insert
  const culturalIds = allCultural.map((c) => c.id);
  if (culturalIds.length > 0) {
    await db.delete(culturalKeyTerms).where(inArray(culturalKeyTerms.culturalContentId, culturalIds));
  }
  const keyTermRows = allCultural.flatMap((c) =>
    (c.keyTerms ?? []).map((term, idx) => ({
      culturalContentId: c.id,
      word: term.word,
      english: term.english,
      order: idx,
    }))
  );
  for (let i = 0; i < keyTermRows.length; i += 100) {
    await db.insert(culturalKeyTerms).values(keyTermRows.slice(i, i + 100));
  }

  console.log(`    ${culturalRows.length} cultural entries, ${keyTermRows.length} key terms synced.`);
}

async function syncSentences() {
  console.log("  Syncing sentence templates...");

  const allSentences = [
    ...IZON_SENTENCES,
    ...IGBO_SENTENCES,
    ...HAUSA_SENTENCES,
    ...SWAHILI_SENTENCES,
    ...AMHARIC_SENTENCES,
    ...WOLOF_SENTENCES,
    ...ARABIC_EGYPTIAN_SENTENCES,
    ...SOMALI_SENTENCES,
    ...BAMBARA_SENTENCES,
    ...TAMAZIGHT_SENTENCES,
    ...KINYARWANDA_SENTENCES,
    ...EWE_SENTENCES,
    ...YORUBA_SENTENCES,
  ];

  const rows = allSentences.map((s) => ({
    id: s.id,
    languageId: s.languageId,
    sentence: s.sentence,
    answer: s.answer,
    englishSentence: s.englishSentence,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await db.insert(sentenceTemplates).values(chunk).onConflictDoUpdate({
      target: sentenceTemplates.id,
      set: {
        sentence:        sql`excluded.sentence`,
        answer:          sql`excluded.answer`,
        englishSentence: sql`excluded.english_sentence`,
      },
    });
  }

  console.log(`    ${rows.length} sentence templates synced.`);
}

async function syncCourses() {
  console.log("  Syncing courses...");

  for (const course of COURSES) {
    const title = resolveText(course.title as any, "en") ?? "";
    const titleFr = resolveText(course.title as any, "fr");
    const description = resolveText(course.description as any, "en") ?? "";
    const descriptionFr = resolveText(course.description as any, "fr");

    await db.insert(courses).values({
      id: course.id,
      languageId: course.languageId,
      title,
      titleFr,
      description,
      descriptionFr,
      level: course.level,
      lessonsCount: course.lessonsCount,
      order: course.order,
      courseType: course.courseType ?? null,
      isActive: true,
    }).onConflictDoUpdate({
      target: courses.id,
      set: {
        title,
        titleFr,
        description,
        descriptionFr,
        level: course.level,
        order: course.order,
        courseType: course.courseType ?? null,
      },
    });
  }

  console.log(`    ${COURSES.length} courses synced.`);
}

async function syncStories() {
  console.log("  Syncing story arcs...");

  const arcs = [IZON_PODCAST_STORY, ...IZON_BM_COURSE_STORIES];
  let arcCount = 0;
  let chapterCount = 0;

  for (const arc of arcs) {
    await db.insert(storyArcs).values({
      id: arc.id,
      courseId: arc.courseId,
      title: arc.title,
      description: arc.description,
    }).onConflictDoUpdate({
      target: storyArcs.id,
      set: {
        courseId:    sql`excluded.course_id`,
        title:       sql`excluded.title`,
        description: sql`excluded.description`,
        updatedAt:   sql`now()`,
      },
    });

    // Chapters have stable external ids — delete per arc and re-insert.
    await db.delete(storyChapters).where(eq(storyChapters.storyArcId, arc.id));
    if (arc.chapters.length > 0) {
      await db.insert(storyChapters).values(
        arc.chapters.map((ch) => ({
          id: ch.id,
          storyArcId: arc.id,
          lessonId: ch.lessonId,
          title: ch.title,
          narrativeIntro: ch.narrativeIntro,
          narrativeOutro: ch.narrativeOutro,
          order: ch.order,
        })),
      );
      chapterCount += arc.chapters.length;
    }
    arcCount++;
  }

  console.log(`    ${arcCount} story arcs, ${chapterCount} chapters synced.`);
}

async function syncCultureItems() {
  console.log("  Syncing culture items (Discover)...");

  // The podcast season card + the three films.
  const items = [
    buildIzonPodcastDiscoverItem("2026-07-01T00:00:00Z"),
    ...IZON_FILM_DISCOVER_ITEMS,
  ];

  const rows = items.map((it) => ({
    id: it.id,
    type: it.type,
    title: it.title,
    description: it.description,
    author: it.author,
    publishedAt: new Date(it.publishedAt),
    duration: it.duration,
    coverGradientFrom: it.coverGradient[0],
    coverGradientTo: it.coverGradient[1],
    coverEmoji: it.coverEmoji,
    // culture_items has no is_active gate; each card carries its own authored
    // `featured` flag. The Bou Mie content is now live per the owner's call, so
    // the spotlight follows the author's intent: the podcast season and the
    // fully-authored film are featured; the two heritage films that still await
    // a keeper's recording stay present (in the Films rail) but not spotlighted.
    featured: (it as { featured?: boolean }).featured ?? false,
    storyId: it.storyId ?? null,
    audioUrl: typeof it.audioUrl === "string" ? it.audioUrl : null,
    contentUrl: (it as { videoUrl?: string | null }).videoUrl ?? null,
    body: it.body ?? null,
    showNotes: it.showNotes ?? null,
  }));

  for (const row of rows) {
    await db.insert(cultureItems).values(row).onConflictDoUpdate({
      target: cultureItems.id,
      set: {
        type:              sql`excluded.type`,
        title:             sql`excluded.title`,
        description:       sql`excluded.description`,
        author:            sql`excluded.author`,
        publishedAt:       sql`excluded.published_at`,
        duration:          sql`excluded.duration`,
        coverGradientFrom: sql`excluded.cover_gradient_from`,
        coverGradientTo:   sql`excluded.cover_gradient_to`,
        coverEmoji:        sql`excluded.cover_emoji`,
        featured:          sql`excluded.featured`,
        storyId:           sql`excluded.story_id`,
        audioUrl:          sql`excluded.audio_url`,
        contentUrl:        sql`excluded.content_url`,
        body:              sql`excluded.body`,
        showNotes:         sql`excluded.show_notes`,
        updatedAt:         sql`now()`,
      },
    });
  }

  console.log(`    ${rows.length} culture items synced (featured=false; no is_active gate on this table).`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const UNITS: Record<string, () => Promise<void>> = {
  courses:      syncCourses,
  dict:         syncDict,
  lessons:      syncLessons,
  proverbs:     syncProverbs,
  cultural:     syncCultural,
  sentences:    syncSentences,
  stories:      syncStories,
  cultureItems: syncCultureItems,
};

const unit = process.argv[2] ?? "all";

async function main() {
  console.log(`Syncing content${unit === "all" ? "" : `: ${unit}`}...`);

  if (unit === "all") {
    for (const fn of Object.values(UNITS)) {
      await fn();
    }
  } else if (UNITS[unit]) {
    await UNITS[unit]!();
  } else {
    console.error(`Unknown unit "${unit}". Valid: ${Object.keys(UNITS).join(", ")}, all`);
    process.exit(1);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
