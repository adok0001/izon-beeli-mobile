import "dotenv/config";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  comments,
  courses,
  culturalContent,
  culturalKeyTerms,
  dictionaryEntries,
  englishWordbank,
  etymologyEntries,
  feedItems,
  languages,
  lessons,
  proverbs,
  scriptCharacters,
  scripts,
  sentenceTemplates,
  transcriptSegments,
  users,
} from "../db/schema.js";

// ---------------------------------------------------------------------------
// Shared data (single source of truth lives in lib/data/)
// ---------------------------------------------------------------------------
import { COURSES } from "../../../mobile/lib/data/courses.js";
import { ETYMOLOGY_DATA } from "../../../mobile/lib/data/etymology.js";
import { SEED_COMMENTS, SEED_FEED } from "../../../mobile/lib/data/feed.js";
import { LANGUAGES } from "../../../mobile/lib/data/languages.js";
import { FIDEL_CHART } from "../../../mobile/lib/data/geez/fidel-chart.js";
import { NSIBIDI_CHARACTERS } from "../../../mobile/lib/data/nsibidi/index.js";
import { ALL_LESSONS } from "../../../mobile/lib/data/lessons/index.js";

// ---------------------------------------------------------------------------
// Dictionaries
// ---------------------------------------------------------------------------
import { ENGLISH_WORDBANK } from "../../../mobile/lib/data/english.js";
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
// UGC placeholder user
// ---------------------------------------------------------------------------
const PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000";

// ---------------------------------------------------------------------------
// Helper: batch insert in chunks to avoid DB limits
// ---------------------------------------------------------------------------
async function batchInsert<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
  chunkSize = 100
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db.insert(table).values(chunk as any).onConflictDoNothing();
  }
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------
async function seed() {
  console.log("Seeding database...");

  // 1. Languages
  console.log("  Inserting languages...");
  await batchInsert(languages, LANGUAGES);

  // 2. Courses — upsert so lessonsCount and descriptions stay current
  console.log("  Inserting courses...");
  for (const course of COURSES) {
    await db.insert(courses).values({
      id: course.id,
      languageId: course.languageId,
      title: course.title,
      titleFr: course.titleFr ?? null,
      description: course.description,
      descriptionFr: course.descriptionFr ?? null,
      level: course.level,
      lessonsCount: course.lessonsCount,
      order: course.order,
      courseType: course.courseType ?? null,
    }).onConflictDoUpdate({
      target: courses.id,
      set: {
        title: course.title,
        titleFr: course.titleFr ?? null,
        description: course.description,
        descriptionFr: course.descriptionFr ?? null,
        level: course.level,
        lessonsCount: course.lessonsCount,
        order: course.order,
        courseType: course.courseType ?? null,
      },
    });
  }

  // 3. Lessons + 4. Transcript segments
  // Lessons are upserted so content edits are reflected on re-seed.
  // Transcript segments have no stable natural key (auto UUID), so we
  // delete and re-insert them to keep them in sync with the lesson data.
  console.log("  Inserting lessons and transcripts...");
  for (const lesson of ALL_LESSONS) {
    const { transcript, ...lessonData } = lesson;

    await db.insert(lessons).values({
      ...lessonData,
      type: lessonData.type ?? "lesson",
      titleFr: lessonData.titleFr ?? null,
      descriptionFr: lessonData.descriptionFr ?? null,
      artist: lessonData.artist ?? null,
      genre: lessonData.genre ?? null,
      isActive: lessonData.isActive ?? true,
    }).onConflictDoUpdate({
      target: lessons.id,
      set: {
        type: lessonData.type ?? "lesson",
        title: lessonData.title,
        titleFr: lessonData.titleFr ?? null,
        description: lessonData.description,
        descriptionFr: lessonData.descriptionFr ?? null,
        audioUrl: lessonData.audioUrl,
        duration: lessonData.duration,
        order: lessonData.order,
        artist: lessonData.artist ?? null,
        genre: lessonData.genre ?? null,
        isActive: lessonData.isActive ?? true,
      },
    });

    // Always replace transcript segments so edits are reflected
    await db.delete(transcriptSegments).where(eq(transcriptSegments.lessonId, lesson.id));
    if (transcript.length > 0) {
      const segments = transcript.map((seg, idx) => ({
        lessonId: lesson.id,
        startTime: seg.startTime,
        endTime: seg.endTime,
        text: seg.text,
        translation: seg.translation ?? null,
        translationFr: seg.translationFr ?? null,
        order: idx,
      }));
      await batchInsert(transcriptSegments, segments);
    }
  }

  // 5a. English wordbank (must seed before dictionary_entries due to FK)
  console.log("  Inserting English wordbank...");
  const ewRows = ENGLISH_WORDBANK.map((e) => ({
    id: e.id,
    word: e.word,
    definition: e.definition ?? null,
    category: e.category,
    posType: e.posType ?? null,
  }));
  for (let i = 0; i < ewRows.length; i += 100) {
    await db.insert(englishWordbank).values(ewRows.slice(i, i + 100)).onConflictDoNothing();
  }

  // 5. Dictionary entries
  console.log("  Inserting dictionary entries...");
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
  const dictRows = allDictEntries.map((e) => ({
    id: e.id,
    languageId: e.languageId,
    word: e.word,
    english: e.english,
    category: e.category,
    pronunciation: e.pronunciation ?? null,
    example: e.example ?? null,
    exampleTranslation: e.exampleTranslation ?? null,
    audioUrl: typeof e.audioUrl === "string" ? e.audioUrl : null,
    contributorName: e.contributorName ?? null,
    contributorId: e.contributorId ?? null,
    englishWordId: e.englishWordId ?? null,
  }));
  for (let i = 0; i < dictRows.length; i += 100) {
    const chunk = dictRows.slice(i, i + 100);
    await db.insert(dictionaryEntries).values(chunk).onConflictDoUpdate({
      target: dictionaryEntries.id,
      set: {
        pronunciation: sql`excluded.pronunciation`,
        example: sql`excluded.example`,
        exampleTranslation: sql`excluded.example_translation`,
        englishWordId: sql`excluded.english_word_id`,
      },
    });
  }

  // 6. Proverbs — delete then re-insert so edits are reflected on reseed
  console.log("  Inserting proverbs...");
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
  const proverbIds = allProverbs.map((p) => p.id);
  if (proverbIds.length > 0) {
    await db.delete(proverbs).where(inArray(proverbs.id, proverbIds));
  }
  const proverbRows = allProverbs.map((p) => ({
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
  await batchInsert(proverbs, proverbRows);

  // 7. Etymology entries
  console.log("  Inserting etymology entries...");
  await batchInsert(
    etymologyEntries,
    ETYMOLOGY_DATA.map((e) => ({
      id: e.id,
      languageId: e.languageId,
      word: e.word,
      english: e.english,
      trail: JSON.stringify(e.trail),
    }))
  );

  // 8. Cultural content + key terms
  // Delete before re-inserting: culturalKeyTerms has no stable ID so
  // onConflictDoNothing can't deduplicate it — every reseed appended new rows.
  console.log("  Inserting cultural content...");
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
  const culturalIds = allCultural.map((c) => c.id);

  // Remove key terms first (FK references culturalContent), then content rows
  if (culturalIds.length > 0) {
    await db.delete(culturalKeyTerms).where(inArray(culturalKeyTerms.culturalContentId, culturalIds));
    await db.delete(culturalContent).where(inArray(culturalContent.id, culturalIds));
  }

  const culturalRows = allCultural.map((c) => ({
    id: c.id,
    languageId: c.languageId,
    category: c.category,
    title: c.title,
    titleFr: (c as any).titleFr ?? null,
    description: c.description,
    descriptionFr: (c as any).descriptionFr ?? null,
    imageEmoji: c.imageEmoji,
  }));
  await batchInsert(culturalContent, culturalRows);

  const keyTermRows = allCultural.flatMap((c) =>
    (c.keyTerms ?? []).map((term, idx) => ({
      culturalContentId: c.id,
      word: term.word,
      english: term.english,
      order: idx,
    }))
  );
  await batchInsert(culturalKeyTerms, keyTermRows);

  // 9. Sentence templates
  console.log("  Inserting sentence templates...");
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
  const sentenceRows = allSentences.map((s) => ({
    id: s.id,
    languageId: s.languageId,
    sentence: s.sentence,
    answer: s.answer,
    englishSentence: s.englishSentence,
  }));
  await batchInsert(sentenceTemplates, sentenceRows);

  // 10. Scripts & script characters
  console.log("  Inserting scripts...");
  const SCRIPT_DEFS = [
    { id: "geez-amharic",  languageId: "amharic",  name: "Ge’ez / Fidel", description: "Ethiopic alphabet used in Amharic", iconCharacter: "ሀ", accentColor: "#4ade80" },
    { id: "geez-tigrinya", languageId: "tigrinya", name: "Ge’ez / Fidel", description: "Ethiopic alphabet used in Tigrinya",  iconCharacter: "ሀ", accentColor: "#4ade80" },
    { id: "nsibidi-igbo",  languageId: "igbo",     name: "Nsọbịdị", description: "Indigenous Igbo pictographic script",  iconCharacter: "", accentColor: "#f59e0b" },
  ];
  await batchInsert(scripts, SCRIPT_DEFS);

  console.log("  Inserting script characters...");
  const geezChars = FIDEL_CHART.map((c, i) => ({
    id: `geez-${c.id}`,
    scriptId: "geez-amharic",
    character: c.character,
    answer: c.romanization,
    hint: `Order ${c.order}`,
    category: c.baseConsonant,
    displayOrder: i,
  }));
  // Tigrinya reuses the same Ge'ez character set
  const geezTigrinyaChars = FIDEL_CHART.map((c, i) => ({
    id: `geez-tigrinya-${c.id}`,
    scriptId: "geez-tigrinya",
    character: c.character,
    answer: c.romanization,
    hint: `Order ${c.order}`,
    category: c.baseConsonant,
    displayOrder: i,
  }));
  const nsibidiChars = NSIBIDI_CHARACTERS.map((c, i) => ({
    id: `nsibidi-${c.id}`,
    scriptId: "nsibidi-igbo",
    character: c.character,
    answer: c.meaning,
    hint: c.name,
    category: c.category,
    displayOrder: i,
  }));
  await batchInsert(scriptCharacters, [...geezChars, ...geezTigrinyaChars, ...nsibidiChars]);

  // 11. UGC: placeholder user + feed + comments
  console.log("  Seeding UGC (feed & comments)...");

  const seedFeedRows = await db
  .select({ id: feedItems.id }).from(feedItems).where(eq(feedItems.userId, PLACEHOLDER_USER_ID));

  const seedFeedIds = seedFeedRows.map((row) => row.id);

  if (seedFeedIds.length > 0) {
    await db.delete(comments).where(inArray(comments.feedItemId, seedFeedIds));
    await db.delete(feedItems).where(inArray(feedItems.id, seedFeedIds));
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, PLACEHOLDER_USER_ID))
    .limit(1);

  if (!existing) {
    await db.insert(users).values({
      id: PLACEHOLDER_USER_ID,
      clerkId: "seed_placeholder",
      name: "Seed User",
      email: "seed@example.com",
    });
  }

  const insertedFeedItems: { id: string }[] = [];
  for (const item of SEED_FEED) {
    const [inserted] = await db
      .insert(feedItems)
      .values({ userId: PLACEHOLDER_USER_ID, ...item })
      .returning({ id: feedItems.id });
    insertedFeedItems.push(inserted!);
  }

  for (const comment of SEED_COMMENTS) {
    const feedItem = insertedFeedItems[comment.feedIndex];
    if (feedItem) {
      await db.insert(comments).values({
        userId: PLACEHOLDER_USER_ID,
        feedItemId: feedItem.id,
        userName: comment.userName,
        text: comment.text,
        createdAt: comment.createdAt,
      });
    }
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
