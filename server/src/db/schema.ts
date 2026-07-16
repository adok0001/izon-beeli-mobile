import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/**
 * ---------- Glossary: "story" and "culture" each mean several things ----------
 *
 * Four tables have overlapping names and no relationship to each other. Read
 * this before assuming two of them are duplicates — they are not.
 *
 *   story_arcs + story_chapters  A SEASON. Holds no teaching content itself: it
 *                                sequences existing `lessons` and adds narrative
 *                                glue (intro/outro) between them. A playlist with
 *                                liner notes. Studio calls this "Season".
 *
 *   interactive_stories          A branching CHOOSE-YOUR-PATH GAME. `scenes` is a
 *                                jsonb graph wired by `choices[].nextSceneId`. No
 *                                lessons, no transcript, no vocabulary. Unrelated
 *                                to story_arcs despite the name.
 *
 *   culture_items                DISCOVER MEDIA — catalog cards (film | podcast |
 *                                blog). Metadata plus a pointer outward (audio or
 *                                content URL). Advertises an experience; does not
 *                                contain one.
 *
 *   cultural_content             CULTURE NOTES — per-language cultural writing,
 *                                shown in the culture gallery and attached to
 *                                lessons via `lesson_cultural_content`.
 *
 * The chain a learner walks: culture_items (card) -> story_arcs (season) ->
 * lessons (episode) -> transcript_segments (the actual words).
 */

// ---------- Enums ----------

export const challengeTypeEnum = pgEnum("challenge_type", [
  "complete_quiz",
  "review_words",
  "listen_lesson",
  "complete_lesson",
  "save_words",
]);

export const feedItemTypeEnum = pgEnum("feed_item_type", [
  "lesson_completed",
  "achievement",
  "contribution",
  "community",
]);

export const contributionTypeEnum = pgEnum("contribution_type", [
  "word",
  "phrase",
  "audio",
  "entry_audio",
  "entry_meaning",
  "entry_image",
]);

export const contributionStatusEnum = pgEnum("contribution_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

// Beeli Studio editorial workflow (Phase 2). Existing rows default to
// "published" so the content-selectors filter (added alongside this) doesn't
// hide anything that was already live before the workflow existed.
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "in_review",
  "published",
  "archived",
]);

export const bountyStatusEnum = pgEnum("bounty_status", [
  "active",
  "completed",
  "cancelled",
]);

export const feedbackCategoryEnum = pgEnum("feedback_category", [
  "bug",
  "suggestion",
  "other",
]);

export const lessonContributionStatusEnum = pgEnum("lesson_contribution_status", [
  "submitted",
  "approved",
  "rejected",
]);

// ---------- Organizations ----------

export const orgPlanEnum = pgEnum("org_plan", ["starter", "pro", "institution"]);
export const orgSubscriptionStatusEnum = pgEnum("org_subscription_status", [
  "active",
  "past_due",
  "canceled",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 128 }).unique(),
  createdBy: uuid("created_by").notNull(), // FK set after users table defined
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 128 }),
  plan: orgPlanEnum("plan").notNull(),
  status: orgSubscriptionStatusEnum("status").notNull(),
  studentLimit: integer("student_limit"), // null = unlimited (institution)
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------- App Config ----------

export const appConfig = pgTable("app_config", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
});

// ---------- Users ----------

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: varchar("clerk_id", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  avatarUrl: text("avatar_url"),
  streak: integer("streak").default(0).notNull(),
  points: integer("points").default(0).notNull(),
  lastActiveDate: varchar("last_active_date", { length: 10 }), // YYYY-MM-DD
  selectedLanguageId: varchar("selected_language_id", { length: 32 }),
  dailyGoal: varchar("daily_goal", { length: 16 }), // "casual" | "steady" | "intensive"
  streakFreezes: integer("streak_freezes").default(0).notNull(),
  lastFreezeUsedDate: varchar("last_freeze_used_date", { length: 10 }), // YYYY-MM-DD
  pushWotdEnabled: boolean("push_wotd_enabled").default(true).notNull(),
  pushStreakReminderEnabled: boolean("push_streak_reminder_enabled").default(true).notNull(),
  emailWotdEnabled: boolean("email_wotd_enabled").default(true).notNull(),
  emailStreakReminderEnabled: boolean("email_streak_reminder_enabled").default(true).notNull(),
  emailAssignmentDueEnabled: boolean("email_assignment_due_enabled").default(true).notNull(),
  emailContributionStatusEnabled: boolean("email_contribution_status_enabled").default(true).notNull(),
  emailReviewerStatusEnabled: boolean("email_reviewer_status_enabled").default(true).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isReviewer: boolean("is_reviewer").default(false).notNull(),
  reviewerLanguages: text("reviewer_languages").array().default([]).notNull(),
  reviewerRole: varchar("reviewer_role", { length: 32 }), // "teacher" | "professor" | "elder"
  // Monetization
  planTier: varchar("plan_tier", { length: 16 }).default("free").notNull(), // "free" | "plus"
  plusEnabledAt: timestamp("plus_enabled_at"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  accentColor: varchar("accent_color", { length: 16 }), // e.g. "#6366f1"
  profileTheme: varchar("profile_theme", { length: 16 }),
  profileAvatarId: varchar("profile_avatar_id", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Soft-delete: set when user requests deletion; hard purge runs after 30 days
  deletedAt: timestamp("deleted_at"),
});

// ---------- User Progress ----------
// lessonId references local mock data IDs (e.g. "lesson-1")

export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    lessonId: varchar("lesson_id", { length: 64 }).notNull(),
    completed: boolean("completed").default(false).notNull(),
    points: integer("points").default(0).notNull(),
    completedAt: timestamp("completed_at"),
    listenedAt: timestamp("listened_at"),
  },
  (table) => [
    uniqueIndex("user_progress_user_lesson_idx").on(table.userId, table.lessonId),
  ]
);

// ---------- Journal Entries ----------

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    lessonId: varchar("lesson_id", { length: 64 }),
    languageId: varchar("language_id", { length: 64 }),
    isPublic: boolean("is_public").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("journal_entries_user_id_idx").on(table.userId),
  ]
);

// ---------- Feed Items ----------

export const feedItems = pgTable(
  "feed_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    type: feedItemTypeEnum("type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    titleFr: varchar("title_fr", { length: 500 }),
    description: text("description").notNull(),
    descriptionFr: text("description_fr"),
    userName: varchar("user_name", { length: 200 }).notNull(),
    userAvatarUrl: text("user_avatar_url"),
    audioUrl: text("audio_url"),
    contributionId: uuid("contribution_id"),
    likesCount: integer("likes_count").default(0).notNull(),
    commentsCount: integer("comments_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("feed_items_created_at_idx").on(table.createdAt),
  ]
);

// ---------- Likes ----------

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    feedItemId: uuid("feed_item_id")
      .references(() => feedItems.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("likes_user_feed_item_idx").on(table.userId, table.feedItemId),
  ]
);

// ---------- Comments ----------

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    feedItemId: uuid("feed_item_id")
      .references(() => feedItems.id)
      .notNull(),
    userName: varchar("user_name", { length: 200 }).notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("comments_feed_item_id_idx").on(table.feedItemId),
  ]
);

// ---------- Contributions ----------

export const contributions = pgTable(
  "contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    type: contributionTypeEnum("type").notNull(),
    languageId: varchar("language_id", { length: 32 }).notNull(),
    word: varchar("word", { length: 500 }).notNull(),
    english: varchar("english", { length: 500 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    pronunciation: varchar("pronunciation", { length: 500 }),
    example: text("example"),
    exampleTranslation: text("example_translation"),
    audioUrl: text("audio_url"),
    imageUrl: text("image_url"),
    dictionaryEntryId: varchar("dictionary_entry_id", { length: 64 }),
    status: contributionStatusEnum("status").default("submitted").notNull(),
    reviewNote: text("review_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    xpAwarded: integer("xp_awarded"),
    bountyId: uuid("bounty_id"),
    bountyXpAwarded: integer("bounty_xp_awarded"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("contributions_user_id_idx").on(table.userId),
    index("contributions_lang_status_idx").on(table.languageId, table.status),
  ]
);

// ---------- Word Bank ----------
// dictionaryEntryId references local dictionary IDs (e.g. "d1")

export const wordBank = pgTable(
  "word_bank",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    dictionaryEntryId: varchar("dictionary_entry_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // Spaced-repetition review fields
    nextReviewAt: timestamp("next_review_at"),
    confidence: integer("confidence").default(0).notNull(), // 0-5 SM-2 ease factor proxy
    reviewCount: integer("review_count").default(0).notNull(),
    lastReviewedAt: timestamp("last_reviewed_at"),
    easeFactor: real("ease_factor").default(2.5).notNull(),
    interval: integer("interval").default(0).notNull(), // days
  },
  (table) => [
    uniqueIndex("word_bank_user_entry_idx").on(
      table.userId,
      table.dictionaryEntryId
    ),
  ]
);

/**
 * Sentence-level SRS — the review unit is a whole transcript line in context,
 * NOT a word↔gloss pair. Rows SNAPSHOT the line (text/translation) because
 * transcript segments are replaced wholesale on lesson save; a segment id
 * would dangle. Same SM-2 fields as word_bank; the review-session composer
 * interleaves both banks.
 */
export const phraseBank = pgTable(
  "phrase_bank",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    lessonId: varchar("lesson_id", { length: 64 }).notNull(),
    text: text("text").notNull(),
    translation: text("translation"),
    /** "bookmark" (learner tapped save) | "completion" (auto-banked on finish) */
    source: varchar("source", { length: 16 }).default("bookmark").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // Spaced-repetition fields (SM-2, mirrors word_bank)
    nextReviewAt: timestamp("next_review_at"),
    reviewCount: integer("review_count").default(0).notNull(),
    lastReviewedAt: timestamp("last_reviewed_at"),
    easeFactor: real("ease_factor").default(2.5).notNull(),
    interval: integer("interval").default(0).notNull(), // days
  },
  (table) => [
    uniqueIndex("phrase_bank_user_line_idx").on(table.userId, table.lessonId, table.text),
    index("phrase_bank_user_due_idx").on(table.userId, table.nextReviewAt),
  ]
);

/**
 * Can-do self-checks — the reflective Movement-completion moment. Never a
 * blocker: the learner rates each lesson's can-do honestly; ratings surface on
 * the profile. One row per (user, lesson), latest rating wins.
 */
export const canDoChecks = pgTable(
  "can_do_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    lessonId: varchar("lesson_id", { length: 64 })
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    /** "yes" | "mostly" | "not_yet" */
    rating: varchar("rating", { length: 12 }).notNull(),
    ratedAt: timestamp("rated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("can_do_checks_user_lesson_idx").on(table.userId, table.lessonId)]
);

// ---------- Content Tables ----------

export const languages = pgTable("languages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  nativeName: varchar("native_name", { length: 200 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const courses = pgTable(
  "courses",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 })
      .notNull()
      .references(() => languages.id),
    title: varchar("title", { length: 300 }).notNull(),
    titleFr: varchar("title_fr", { length: 300 }),
    description: text("description").notNull(),
    descriptionFr: text("description_fr"),
    level: varchar("level", { length: 32 }).notNull(),
    lessonsCount: integer("lessons_count").default(0).notNull(),
    order: integer("order").default(0).notNull(),
    courseType: varchar("course_type", { length: 32 }),
    /**
     * Set when this is a companion course drilling a season's world (the Series
     * screen's level bands read from these). Null for ordinary standalone
     * courses, which is most of them.
     *
     * `AnyPgColumn` breaks a circular type inference: courses -> story_arcs
     * (here) and story_arcs.course_id -> courses.
     */
    seasonArcId: varchar("season_arc_id", { length: 64 }).references(
      (): AnyPgColumn => storyArcs.id,
      { onDelete: "set null" }
    ),
    isActive: boolean("is_active").default(true).notNull(),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [index("courses_language_id_idx").on(table.languageId)]
);

export const lessons = pgTable(
  "lessons",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    // RESTRICT (the default): a course delete that cascaded would take every
    // lesson, transcript and chapter beneath it — the worst blast radius in this
    // schema. Courses are retired via `isActive`, not deleted.
    courseId: varchar("course_id", { length: 64 })
      .notNull()
      .references(() => courses.id),
    type: varchar("type", { length: 16 }).default("lesson").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    titleFr: varchar("title_fr", { length: 300 }),
    description: text("description").notNull(),
    descriptionFr: text("description_fr"),
    audioUrl: text("audio_url"),
    /** Seconds. (Was written as minutes by the podcast converter until Jul 2026.) */
    duration: integer("duration"),
    order: integer("order").default(0).notNull(),
    /** Episode style for season lessons: "skit" | "immersive_story" | "host_narrated". */
    style: varchar("style", { length: 24 }),
    artist: varchar("artist", { length: 300 }),
    genre: varchar("genre", { length: 100 }),
    skills: text("skills").array().default([]).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    scene: varchar("scene", { length: 64 }),
    sceneTitle: varchar("scene_title", { length: 128 }),
    sceneOrder: integer("scene_order"),
    // "plain" (published, target-language transcript) | "helper" (includes production cues).
    // null is treated as "plain" by the app.
    transcriptType: varchar("transcript_type", { length: 16 }),
    // Story fold-in: narrative framing lives ON the lesson for course-bound
    // stories (standalone podcast seasons keep story_chapters). Both nullable —
    // an ordinary lesson simply has none.
    narrativeIntro: text("narrative_intro"),
    narrativeOutro: text("narrative_outro"),
    // Honest real-world competence statement shown on completion ("You can now …").
    canDo: text("can_do"),
    canDoFr: text("can_do_fr"),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [index("lessons_course_id_idx").on(table.courseId)]
);

/**
 * In-lesson checks — low-stakes formative questions that pause the narrative
 * at a transcript line (the same placement rail cultural notes ride). Distinct
 * from the quiz bank: these fire DURING input, not after it.
 */
export const lessonChecks = pgTable(
  "lesson_checks",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    lessonId: varchar("lesson_id", { length: 64 })
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    // "predict-next" | "meaning" | "who-said" | "cloze" | "pick-reply"
    type: varchar("type", { length: 24 }).notNull(),
    prompt: text("prompt").notNull(),
    answer: text("answer").notNull(),
    // Choice options (include the answer). Empty = tap-to-reveal check.
    options: text("options").array().default([]).notNull(),
    explanation: text("explanation"),
    // 0-based transcript segment the check fires after; null = end of lesson.
    afterSegmentIndex: integer("after_segment_index"),
    order: integer("order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [index("lesson_checks_lesson_id_idx").on(table.lessonId)]
);

export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Segments are owned parts of a lesson and referenced by nothing else.
    lessonId: varchar("lesson_id", { length: 64 })
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    startTime: real("start_time").notNull(),
    endTime: real("end_time").notNull(),
    text: text("text").notNull(),
    translation: text("translation"),
    translationFr: text("translation_fr"),
    order: integer("order").default(0).notNull(),
    // Who speaks this line (audio-drama attribution). null = unattributed / narration.
    speaker: varchar("speaker", { length: 64 }),
    // Romanized / pronunciation guidance for the learner (never spoken).
    roman: text("roman"),
  },
  (table) => [index("transcript_segments_lesson_id_idx").on(table.lessonId)]
);

export const englishWordbank = pgTable(
  "english_wordbank",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    word: varchar("word", { length: 500 }).notNull(),
    definition: text("definition"),
    category: varchar("category", { length: 64 }).notNull(),
    posType: varchar("pos_type", { length: 32 }),
  },
  (table) => [
    index("english_wordbank_word_idx").on(table.word),
  ]
);

export const dictionaryEntries = pgTable(
  "dictionary_entries",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 })
      .notNull()
      .references(() => languages.id),
    word: varchar("word", { length: 500 }).notNull(),
    english: varchar("english", { length: 500 }).notNull(),
    french: varchar("french", { length: 500 }),
    /** Full gloss map { en, fr, pcm, ar, pt, ... }. `english`/`french` are kept as a derived projection. */
    translations: jsonb("translations").$type<Record<string, string>>(),
    category: varchar("category", { length: 64 }).notNull(),
    pronunciation: varchar("pronunciation", { length: 500 }),
    example: text("example"),
    exampleTranslation: text("example_translation"),
    exampleTranslationFr: text("example_translation_fr"),
    /** Full example-translation map; `exampleTranslation`/`exampleTranslationFr` are the en/fr projection. */
    exampleTranslations: jsonb("example_translations").$type<Record<string, string>>(),
    audioUrl: text("audio_url"),
    imageUrl: text("image_url"),
    exampleAudioUrl: text("example_audio_url"),
    contributorName: varchar("contributor_name", { length: 200 }),
    contributorId: varchar("contributor_id", { length: 64 }),
    englishWordId: varchar("english_word_id", { length: 64 }).references(() => englishWordbank.id),
    /** Words with equivalent or near-equivalent meaning in the same language. */
    synonyms: text("synonyms").array(),
    /** Words with opposite meaning. */
    antonyms: text("antonyms").array(),
    /** Hierarchical semantic domain, e.g. "body > senses > sight". */
    semanticDomain: varchar("semantic_domain", { length: 200 }),
    /** Dialect-specific forms: [{ dialect, form, region? }] */
    dialectalVariants: jsonb("dialectal_variants").$type<
      Array<{ dialect: string; form: string; region?: string }>
    >(),
    // Editorial workflow (Beeli Studio) — see contentStatusEnum.
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [
    index("dictionary_entries_language_idx").on(table.languageId),
    index("dictionary_entries_lang_cat_idx").on(table.languageId, table.category),
    index("dictionary_entries_english_word_idx").on(table.englishWordId),
  ]
);

export const proverbs = pgTable(
  "proverbs",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    text: text("text").notNull(),
    translation: text("translation").notNull(),
    translationFr: text("translation_fr"),
    meaning: text("meaning").notNull(),
    meaningFr: text("meaning_fr"),
    literal: text("literal"),
    context: text("context"),
    tags: text("tags").array(),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [index("proverbs_language_id_idx").on(table.languageId)]
);

export const etymologyEntries = pgTable(
  "etymology_entries",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    word: varchar("word", { length: 200 }).notNull(),
    english: varchar("english", { length: 300 }).notNull(),
    trail: text("trail").notNull(), // JSON array of { era, form, language, note }
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [index("etymology_entries_language_id_idx").on(table.languageId)]
);

export const culturalContent = pgTable(
  "cultural_content",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 })
      .notNull()
      .references(() => languages.id),
    category: varchar("category", { length: 64 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    titleFr: varchar("title_fr", { length: 300 }),
    description: text("description").notNull(),
    descriptionFr: text("description_fr"),
    imageEmoji: varchar("image_emoji", { length: 16 }).notNull(),
    /** Surfaced as the "Featured" hero card at the top of the gallery. */
    featured: boolean("featured").default(false).notNull(),
    /** Primary headword shown with an audio button in the reader. */
    headword: jsonb("headword").$type<{
      word: string;
      gloss?: unknown;
      audioUrl?: string;
    } | null>(),
    /** Contexts where this appears, rendered as chips. LocalizedText or plain strings. */
    applications: jsonb("applications").$type<unknown[] | null>(),
    /** Colour-band reader hero (e.g. the Izon colour-symbolism entry). */
    heroBands: jsonb("hero_bands").$type<{
      label: string;
      sublabel?: unknown;
      from: string;
      to: string;
      dark?: boolean;
    }[] | null>(),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [index("cultural_content_language_id_idx").on(table.languageId)]
);

export const culturalKeyTerms = pgTable(
  "cultural_key_terms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Key terms are owned by their entry.
    culturalContentId: varchar("cultural_content_id", { length: 64 })
      .notNull()
      .references(() => culturalContent.id, { onDelete: "cascade" }),
    word: varchar("word", { length: 200 }).notNull(),
    english: varchar("english", { length: 200 }).notNull(),
    order: integer("order").default(0).notNull(),
  },
  (table) => [
    index("cultural_key_terms_content_id_idx").on(table.culturalContentId),
  ]
);

/** Studio-authored attachment of cultural_content entries to a lesson — lets an
 * educator surface specific culture beats on a specific lesson instead of the
 * app's deterministic per-lesson fallback pick (see lib/journey-style code in
 * mobile's LessonCultureNote). `order` controls display order when a lesson has
 * more than one. */
export const lessonCulturalContent = pgTable(
  "lesson_cultural_content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Cascade on both sides: this is a pure join table, and a row whose lesson or
    // whose note has been deleted means nothing.
    lessonId: varchar("lesson_id", { length: 64 })
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    culturalContentId: varchar("cultural_content_id", { length: 64 })
      .notNull()
      .references(() => culturalContent.id, { onDelete: "cascade" }),
    order: integer("order").default(0).notNull(),
    /**
     * Render the note inline, immediately after this transcript segment (0-based
     * index into the lesson's ordered segments). Null = not anchored; the app
     * groups unanchored notes after the final segment.
     */
    afterSegmentIndex: integer("after_segment_index"),
  },
  (table) => [
    index("lesson_cultural_content_lesson_id_idx").on(table.lessonId),
    uniqueIndex("lesson_cultural_content_unique_idx").on(table.lessonId, table.culturalContentId),
  ]
);

export const sentenceKindEnum = pgEnum("sentence_kind", ["blank", "equivalent"]);

export const sentenceTemplates = pgTable(
  "sentence_templates",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 })
      .notNull()
      .references(() => languages.id),
    sentence: text("sentence").notNull(),
    answer: varchar("answer", { length: 300 }).notNull(),
    englishSentence: text("english_sentence").notNull(),
    /** Explicit question kind. "blank" = fill-in-the-blank; "equivalent" = which-word-means. */
    kind: sentenceKindEnum("kind").default("blank").notNull(),
    /** Literal gloss of the sentence (e.g. "wake up well" for an idiom). Null for regular templates. */
    literalTranslation: text("literal_translation"),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [index("sentence_templates_language_id_idx").on(table.languageId)]
);

// ---------- Scenarios ----------

export const scenarios = pgTable(
  "scenarios",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    languageId: varchar("language_id", { length: 32 }).notNull(),
    situation: varchar("situation", { length: 200 }).notNull(),
    turns: text("turns").notNull(), // JSON: {text, translation, audioUrl?}[]
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [index("scenarios_language_id_idx").on(table.languageId)]
);

// ---------- Quiz Question Bank ----------

/**
 * Authored quiz questions (Beeli Studio question bank). Distinct from
 * `quizResults`, which only records learner scores. Reviewer-scoped by
 * language and carries the full editorial workflow so the four-eyes rule
 * applies here too.
 */
export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    // "word-to-english" | "english-to-word" | "fill-in-the-blank" | "listening"
    type: varchar("type", { length: 32 }).notNull(),
    prompt: text("prompt").notNull(),
    answer: text("answer").notNull(),
    // Multiple-choice options (includes the answer). Empty for free-text types.
    options: text("options").array().default([]).notNull(),
    audioUrl: text("audio_url"),
    explanation: text("explanation"),
    // Retrieval scoping: which lesson (and scene within its course) this
    // question tests. Both nullable — a bare question stays language-level.
    // sceneId is the lesson-scene slug (lessons.scene), not a table reference.
    lessonId: varchar("lesson_id", { length: 64 }).references(() => lessons.id, { onDelete: "set null" }),
    sceneId: varchar("scene_id", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    status: contentStatusEnum("status").default("draft").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [
    index("quiz_questions_language_id_idx").on(table.languageId),
    index("quiz_questions_lesson_id_idx").on(table.lessonId),
  ]
);

// ---------- Lesson Contributions ----------

export const lessonContributions = pgTable(
  "lesson_contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    languageId: varchar("language_id", { length: 32 }).notNull(),
    courseId: varchar("course_id", { length: 64 }),
    type: varchar("type", { length: 16 }).default("lesson").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description").notNull(),
    audioUrl: text("audio_url").notNull(),
    duration: integer("duration"),
    artist: varchar("artist", { length: 300 }),
    genre: varchar("genre", { length: 100 }),
    status: lessonContributionStatusEnum("status").default("submitted").notNull(),
    reviewNote: text("review_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("lesson_contributions_user_id_idx").on(table.userId),
    index("lesson_contributions_status_idx").on(table.status),
  ]
);

export const lessonContributionSegments = pgTable(
  "lesson_contribution_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonContributionId: uuid("lesson_contribution_id")
      .references(() => lessonContributions.id)
      .notNull(),
    text: text("text").notNull(),
    translation: text("translation"),
    startTime: real("start_time"),
    endTime: real("end_time"),
    order: integer("order").default(0).notNull(),
  },
  (table) => [
    index("lesson_contribution_segments_contrib_id_idx").on(table.lessonContributionId),
  ]
);

// ---------- Classroom ----------

export const groupRoleEnum = pgEnum("group_role", ["teacher", "parent", "student"]);

export const classroomGroups = pgTable("classroom_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  inviteCode: varchar("invite_code", { length: 8 }).notNull().unique(),
  languageId: varchar("language_id", { length: 32 }).notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classroomMembers = pgTable(
  "classroom_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => classroomGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: groupRoleEnum("role").default("student").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("classroom_members_group_user_idx").on(t.groupId, t.userId)]
);

export const classroomAssignments = pgTable("classroom_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => classroomGroups.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id", { length: 255 }).notNull(),
  assignedBy: uuid("assigned_by")
    .notNull()
    .references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Multiplayer ----------

export const gameSessionTypeEnum = pgEnum("game_session_type", [
  "quiz_battle",
  "paired_lesson",
]);

export const gameSessionStatusEnum = pgEnum("game_session_status", [
  "waiting",
  "active",
  "completed",
  "abandoned",
]);

export const matchmakingStatusEnum = pgEnum("matchmaking_status", [
  "queued",
  "matched",
  "cancelled",
]);

export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: gameSessionTypeEnum("type").notNull(),
  status: gameSessionStatusEnum("status").default("waiting").notNull(),
  inviteCode: varchar("invite_code", { length: 8 }).unique(),
  languageId: varchar("language_id", { length: 64 }).notNull(),
  courseId: varchar("course_id", { length: 64 }),
  lessonId: varchar("lesson_id", { length: 64 }),
  partyRoomId: varchar("party_room_id", { length: 128 }).notNull(),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  questionCount: integer("question_count").default(10).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const gameSessionPlayers = pgTable(
  "game_session_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .references(() => gameSessions.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    score: integer("score").default(0).notNull(),
    correctAnswers: integer("correct_answers").default(0).notNull(),
    totalAnswers: integer("total_answers").default(0).notNull(),
    finishedAt: timestamp("finished_at"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("game_session_players_session_user_idx").on(
      table.sessionId,
      table.userId
    ),
  ]
);

export const matchmakingQueue = pgTable(
  "matchmaking_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull()
      .unique(),
    type: gameSessionTypeEnum("type").notNull(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    courseId: varchar("course_id", { length: 64 }),
    status: matchmakingStatusEnum("status").default("queued").notNull(),
    matchedSessionId: uuid("matched_session_id").references(
      () => gameSessions.id
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("matchmaking_queue_type_lang_status_idx").on(
      table.type,
      table.languageId,
      table.status
    ),
  ]
);

// ---------- Quiz Results ----------

export const quizResults = pgTable(
  "quiz_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    languageId: varchar("language_id", { length: 32 }).notNull(),
    score: integer("score").notNull(),
    accuracy: integer("accuracy").notNull(), // 0-100
    durationMs: integer("duration_ms").notNull(),
    questionCount: integer("question_count").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("quiz_results_user_id_idx").on(table.userId),
    index("quiz_results_lang_id_idx").on(table.languageId),
  ]
);

// ---------- Reviewer Applications ----------

export const reviewerApplicationStatusEnum = pgEnum("reviewer_application_status", [
  "pending",
  "approved",
  "rejected",
]);

export const reviewerApplications = pgTable("reviewer_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 32 }).notNull(), // "teacher" | "professor" | "elder"
  background: text("background").notNull(),
  reason: text("reason").notNull(),
  languages: text("languages").array().default([]).notNull(),
  status: reviewerApplicationStatusEnum("status").default("pending").notNull(),
  reviewerNote: text("reviewer_note"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Feedback ----------

export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  category: feedbackCategoryEnum("category").notNull(),
  message: text("message").notNull(),
  platform: varchar("platform", { length: 32 }),
  osVersion: varchar("os_version", { length: 64 }),
  appVersion: varchar("app_version", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    platform: varchar("platform", { length: 16 }).notNull(), // "ios" | "android"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("push_tokens_user_token_idx").on(t.userId, t.token)]
);

// ---------- Daily Challenges ----------

export const dailyChallenges = pgTable(
  "daily_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    slot: smallint("slot").default(0).notNull(),     // 0 | 1 | 2
    challengeType: challengeTypeEnum("challenge_type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    target: integer("target").notNull(),
    progress: integer("progress").default(0).notNull(),
    completed: boolean("completed").default(false).notNull(),
    xpReward: integer("xp_reward").notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("daily_challenges_user_date_slot_idx").on(table.userId, table.date, table.slot),
    index("daily_challenges_user_id_idx").on(table.userId),
  ]
);

// ---------- Bounties ----------

export const bounties = pgTable(
  "bounties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description").notNull(),
    languageId: varchar("language_id", { length: 32 }).notNull(),
    category: varchar("category", { length: 32 }),
    contributionType: contributionTypeEnum("contribution_type"),
    targetCount: integer("target_count").notNull(),
    currentCount: integer("current_count").default(0).notNull(),
    xpReward: integer("xp_reward").notNull(),
    status: bountyStatusEnum("status").default("active").notNull(),
    expiresAt: timestamp("expires_at"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("bounties_lang_status_idx").on(t.languageId, t.status)]
);

// ---------- Story Mode ----------

export const storyArcs = pgTable("story_arcs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  // Null for standalone arcs that aren't attached to a single course (e.g. a
  // season-long narrative spanning a podcast). Real course-bound arcs still
  // get a unique courseId — one arc per course. SET NULL on course delete: the
  // season is a narrative in its own right and shouldn't die with the course.
  courseId: varchar("course_id", { length: 64 })
    .unique()
    .references((): AnyPgColumn => courses.id, { onDelete: "set null" }),
  // Always set on create, whether derived from the course or supplied directly
  // for standalone arcs — it is what the app filters on.
  languageId: varchar("language_id", { length: 64 }).references(() => languages.id),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  // Season "bible" metadata. Lived in mobile's SERIES_REGISTRY until the bundle
  // was retired; the Series screen reads it from here now.
  /** Target-language season title, e.g. "Bou Mie" — flavour, shown under the title. */
  nativeTitle: varchar("native_title", { length: 300 }),
  /** One-line hook for the season. */
  logline: text("logline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  status: contentStatusEnum("status").default("published").notNull(),
  publishAt: timestamp("publish_at"),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  publishedBy: uuid("published_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
});

/**
 * Recurring characters in a season, shown on the Series screen's cast strip.
 * `castId` is the stable authored id (e.g. "izon-cast-ebiere") that a
 * transcript segment's `speaker` refers to.
 */
export const storyArcCast = pgTable(
  "story_arc_cast",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storyArcId: varchar("story_arc_id", { length: 64 })
      .notNull()
      .references(() => storyArcs.id, { onDelete: "cascade" }),
    castId: varchar("cast_id", { length: 64 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    role: varchar("role", { length: 200 }).notNull(),
    /** Emoji avatar for the cast strip — a character-specific touch, not a semantic icon. */
    avatar: varchar("avatar", { length: 16 }).notNull(),
    /** Categorical accent hue tinting the avatar circle (see constants/accent-colors). */
    hue: varchar("hue", { length: 24 }).notNull(),
    order: integer("order").default(0).notNull(),
  },
  (t) => [
    index("story_arc_cast_arc_id_idx").on(t.storyArcId),
    uniqueIndex("story_arc_cast_arc_cast_idx").on(t.storyArcId, t.castId),
  ]
);

export const storyChapters = pgTable(
  "story_chapters",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    // Chapters are owned by their season — deleting the season takes them with it.
    storyArcId: varchar("story_arc_id", { length: 64 })
      .notNull()
      .references(() => storyArcs.id, { onDelete: "cascade" }),
    // Deliberately RESTRICT, not cascade: cascading would silently delete a
    // chapter (and punch a hole in the episode order) when an educator removes a
    // single lesson. The educator route returns a 409 instead.
    lessonId: varchar("lesson_id", { length: 64 })
      .notNull()
      .references(() => lessons.id),
    title: varchar("title", { length: 300 }).notNull(),
    narrativeIntro: text("narrative_intro").notNull(),
    narrativeOutro: text("narrative_outro").notNull(),
    order: integer("order").default(0).notNull(),
  },
  (t) => [index("story_chapters_arc_id_idx").on(t.storyArcId)]
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    languageId: varchar("language_id", { length: 64 })
      .notNull()
      .references(() => languages.id),
    type: varchar("type", { length: 32 }).notNull(), // "soundboard" | "placement"
    // soundboard fields
    sentence: text("sentence"),
    targetWord: varchar("target_word", { length: 255 }),
    targetWordNative: varchar("target_word_native", { length: 255 }),
    audioUrl: text("audio_url"),
    channels: text("channels"), // JSON array of SoundboardChannel
    // placement fields
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    zones: text("zones"),  // JSON array of PlacementZone
    tokens: text("tokens"), // JSON array of WordToken
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (t) => [index("activities_language_id_idx").on(t.languageId)]
);

// ---------- Relations ----------

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [organizations.createdBy],
    references: [users.id],
  }),
  subscriptions: many(organizationSubscriptions),
  members: many(users),
}));

export const organizationSubscriptionsRelations = relations(
  organizationSubscriptions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationSubscriptions.organizationId],
      references: [organizations.id],
    }),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  progress: many(userProgress),
  journalEntries: many(journalEntries),
  feedItems: many(feedItems),
  likes: many(likes),
  comments: many(comments),
  contributions: many(contributions),
  wordBank: many(wordBank),
  bountiesCreated: many(bounties),
}));

export const bountiesRelations = relations(bounties, ({ one }) => ({
  creator: one(users, {
    fields: [bounties.createdBy],
    references: [users.id],
  }),
}));

export const feedItemsRelations = relations(feedItems, ({ one, many }) => ({
  user: one(users, {
    fields: [feedItems.userId],
    references: [users.id],
  }),
  likes: many(likes),
  comments: many(comments),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  feedItem: one(feedItems, {
    fields: [likes.feedItemId],
    references: [feedItems.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  feedItem: one(feedItems, {
    fields: [comments.feedItemId],
    references: [feedItems.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [gameSessions.createdBy],
    references: [users.id],
  }),
  players: many(gameSessionPlayers),
}));

export const gameSessionPlayersRelations = relations(
  gameSessionPlayers,
  ({ one }) => ({
    session: one(gameSessions, {
      fields: [gameSessionPlayers.sessionId],
      references: [gameSessions.id],
    }),
    user: one(users, {
      fields: [gameSessionPlayers.userId],
      references: [users.id],
    }),
  })
);

// ---------- Content Partners ----------

export const contentPartners = pgTable("content_partners", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(), // "university" | "research" | "institution"
  region: varchar("region", { length: 100 }),
  url: text("url"),
  logoUrl: text("logo_url"),
  languageIds: text("language_ids").array().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: contentStatusEnum("status").default("published").notNull(),
  publishAt: timestamp("publish_at"),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  publishedBy: uuid("published_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
});

// ---------- Word Challenge Submissions ----------

// ---------- Script System Tables ----------

export const scripts = pgTable(
  "scripts",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    iconCharacter: varchar("icon_character", { length: 16 }),
    accentColor: varchar("accent_color", { length: 32 }),
    isActive: boolean("is_active").default(true).notNull(),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [index("scripts_language_id_idx").on(table.languageId)]
);

export const scriptCharacters = pgTable(
  "script_characters",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    scriptId: varchar("script_id", { length: 64 }).notNull(),
    character: text("character").notNull(),
    answer: varchar("answer", { length: 200 }).notNull(),
    hint: varchar("hint", { length: 200 }),
    category: varchar("category", { length: 64 }),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    // Full, untruncated fields per script type (previously lossy in the seed).
    // Nsibidi: codePoint + name + meaning. Ge'ez: baseConsonant + vowelOrder.
    // Adinkra: akanName + meaning + proverb + svgPath + svgViewBox.
    name: text("name"),
    meaning: text("meaning"),
    codePoint: integer("code_point"),
    baseConsonant: varchar("base_consonant", { length: 32 }),
    vowelOrder: smallint("vowel_order"),
    akanName: varchar("akan_name", { length: 200 }),
    proverb: text("proverb"),
    svgPath: text("svg_path"),
    svgViewBox: varchar("svg_view_box", { length: 64 }),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
  },
  (table) => [index("script_characters_script_id_idx").on(table.scriptId)]
);

// ---------- Interactive (branching) Story scenes ----------
// Choose-your-path narrative experiences surfaced in Discover. The branching
// scene graph is stored as jsonb on the film row itself (a film IS its story) —
// see `cultureItems.scenes`. The former standalone `interactive_stories` table
// was folded into `culture_items`; only this scene-node type remains.

export type InteractiveStoryScene = {
  id: string;
  type: "narrative" | "choice" | "conclusion";
  gradient: [string, string];
  backgroundEmoji: string;
  title?: string;
  text: string;
  choices?: { id: string; text: string; nextSceneId: string }[];
  nextSceneId?: string;
};

export const cultureItemTypeEnum = pgEnum("culture_item_type", ["film", "podcast", "blog"]);

export const cultureItems = pgTable(
  "culture_items",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    type: cultureItemTypeEnum("type").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description").notNull(),
    author: varchar("author", { length: 200 }).notNull(),
    publishedAt: timestamp("published_at").notNull(),
    duration: integer("duration").notNull(),
    coverGradientFrom: varchar("cover_gradient_from", { length: 16 }).notNull(),
    coverGradientTo: varchar("cover_gradient_to", { length: 16 }).notNull(),
    coverEmoji: varchar("cover_emoji", { length: 16 }).notNull(),
    featured: boolean("featured").default(false).notNull(),
    /**
     * The season this card belongs to. For a podcast card this IS the season it
     * opens; for a film it means "set in this season's world" (the Series
     * screen's "Also in this world" rail).
     */
    seasonArcId: varchar("season_arc_id", { length: 64 }).references(() => storyArcs.id, {
      onDelete: "set null",
    }),
    /**
     * The branching scene graph a film card opens, folded inline (a film IS its
     * story: its own `id` is the story id). Null for podcast/blog cards and for
     * story-less "mini-series" films. Superseded the separate `interactive_stories`
     * table — see `initialSceneId` / `estimatedMinutes` / `language` below.
     */
    scenes: jsonb("scenes").$type<Record<string, InteractiveStoryScene>>(),
    /** Entry scene id for the folded scene graph (films with `scenes`). */
    initialSceneId: varchar("initial_scene_id", { length: 64 }),
    /** Estimated read time in minutes for a film's scene graph. */
    estimatedMinutes: integer("estimated_minutes"),
    /**
     * Display language for language-scoped educator review (e.g. "Izon"). Null =
     * language-agnostic / admin-only "general" bucket, mirroring the old
     * `interactive_stories.language` semantics. Films are reviewed through the
     * four-eyes flow scoped by this column.
     */
    language: varchar("language", { length: 64 }),
    audioUrl: text("audio_url"),
    contentUrl: text("content_url"),
    body: text("body"),
    showNotes: text("show_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    status: contentStatusEnum("status").default("published").notNull(),
    publishAt: timestamp("publish_at"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    // Distinct from `publishedAt` above, which is the content's own display
    // date (e.g. the film's release date), not editorial-workflow state.
    studioPublishedAt: timestamp("studio_published_at"),
  },
  (table) => [index("culture_items_type_idx").on(table.type)]
);

// ---------- Word Progress (Leitner spaced-repetition) ----------

export const wordProgress = pgTable(
  "word_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    wordId: varchar("word_id", { length: 64 }).notNull(),
    languageId: varchar("language_id", { length: 32 }).notNull(),
    box: smallint("box").default(1).notNull(), // Leitner box 1-5
    correctStreak: smallint("correct_streak").default(0).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("word_progress_user_word_idx").on(table.userId, table.wordId),
    index("word_progress_user_lang_idx").on(table.userId, table.languageId),
  ]
);

export const wordChallengeSubmissions = pgTable(
  "word_challenge_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    wordId: varchar("word_id", { length: 64 }).notNull(),
    sentence: text("sentence").notNull(),
    languageId: varchar("language_id", { length: 32 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // One submission per user per word — also serves user-scoped lookups and
    // blocks XP farming via repeated submissions of the same word.
    uniqueIndex("wc_submissions_user_word_idx").on(table.userId, table.wordId),
    index("wc_submissions_word_idx").on(table.wordId),
  ]
);

// ---------- Editorial Workflow (Beeli Studio) ----------
// entityType/entityId are polymorphic (point at any content table above, whose
// primary keys are a mix of varchar and uuid), so they're plain strings rather
// than a real FK.

export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }).notNull(),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("content_versions_entity_version_idx").on(
      table.entityType,
      table.entityId,
      table.version
    ),
    index("content_versions_entity_idx").on(table.entityType, table.entityId),
  ]
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }).notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    at: timestamp("at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
    index("audit_log_actor_id_idx").on(table.actorId),
  ]
);

// Beeli Studio media library (Phase 5). Tracks every file uploaded through
// upload.ts so it can be browsed and reused instead of re-uploaded per entity.
export const mediaKindEnum = pgEnum("media_kind", ["image", "audio"]);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    url: text("url").notNull(),
    pathname: text("pathname").notNull(),
    kind: mediaKindEnum("kind").notNull(),
    filename: varchar("filename", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 128 }),
    size: integer("size"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_assets_kind_idx").on(table.kind),
    index("media_assets_created_at_idx").on(table.createdAt),
  ]
);
