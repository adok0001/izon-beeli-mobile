import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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

// ---------- Content Tables ----------

export const languages = pgTable("languages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  nativeName: varchar("native_name", { length: 200 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
});

export const courses = pgTable(
  "courses",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    titleFr: varchar("title_fr", { length: 300 }),
    description: text("description").notNull(),
    descriptionFr: text("description_fr"),
    level: varchar("level", { length: 32 }).notNull(),
    lessonsCount: integer("lessons_count").default(0).notNull(),
    order: integer("order").default(0).notNull(),
    courseType: varchar("course_type", { length: 32 }),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [index("courses_language_id_idx").on(table.languageId)]
);

export const lessons = pgTable(
  "lessons",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    courseId: varchar("course_id", { length: 64 }).notNull(),
    type: varchar("type", { length: 16 }).default("lesson").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    titleFr: varchar("title_fr", { length: 300 }),
    description: text("description").notNull(),
    descriptionFr: text("description_fr"),
    audioUrl: text("audio_url"),
    duration: integer("duration"),
    order: integer("order").default(0).notNull(),
    artist: varchar("artist", { length: 300 }),
    genre: varchar("genre", { length: 100 }),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [index("lessons_course_id_idx").on(table.courseId)]
);

export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: varchar("lesson_id", { length: 64 }).notNull(),
    startTime: real("start_time").notNull(),
    endTime: real("end_time").notNull(),
    text: text("text").notNull(),
    translation: text("translation"),
    translationFr: text("translation_fr"),
    order: integer("order").default(0).notNull(),
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
    languageId: varchar("language_id", { length: 64 }).notNull(),
    word: varchar("word", { length: 500 }).notNull(),
    english: varchar("english", { length: 500 }).notNull(),
    french: varchar("french", { length: 500 }),
    category: varchar("category", { length: 64 }).notNull(),
    pronunciation: varchar("pronunciation", { length: 500 }),
    example: text("example"),
    exampleTranslation: text("example_translation"),
    exampleTranslationFr: text("example_translation_fr"),
    audioUrl: text("audio_url"),
    imageUrl: text("image_url"),
    exampleAudioUrl: text("example_audio_url"),
    contributorName: varchar("contributor_name", { length: 200 }),
    contributorId: varchar("contributor_id", { length: 64 }),
    englishWordId: varchar("english_word_id", { length: 64 }).references(() => englishWordbank.id),
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
  },
  (table) => [index("etymology_entries_language_id_idx").on(table.languageId)]
);

export const culturalContent = pgTable(
  "cultural_content",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    titleFr: varchar("title_fr", { length: 300 }),
    description: text("description").notNull(),
    descriptionFr: text("description_fr"),
    imageEmoji: varchar("image_emoji", { length: 16 }).notNull(),
  },
  (table) => [index("cultural_content_language_id_idx").on(table.languageId)]
);

export const culturalKeyTerms = pgTable(
  "cultural_key_terms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    culturalContentId: varchar("cultural_content_id", { length: 64 }).notNull(),
    word: varchar("word", { length: 200 }).notNull(),
    english: varchar("english", { length: 200 }).notNull(),
    order: integer("order").default(0).notNull(),
  },
  (table) => [
    index("cultural_key_terms_content_id_idx").on(table.culturalContentId),
  ]
);

export const sentenceKindEnum = pgEnum("sentence_kind", ["blank", "equivalent"]);

export const sentenceTemplates = pgTable(
  "sentence_templates",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    sentence: text("sentence").notNull(),
    answer: varchar("answer", { length: 300 }).notNull(),
    englishSentence: text("english_sentence").notNull(),
    /** Explicit question kind. "blank" = fill-in-the-blank; "equivalent" = which-word-means. */
    kind: sentenceKindEnum("kind").default("blank").notNull(),
    /** Literal gloss of the sentence (e.g. "wake up well" for an idiom). Null for regular templates. */
    literalTranslation: text("literal_translation"),
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
  },
  (table) => [index("scenarios_language_id_idx").on(table.languageId)]
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
  courseId: varchar("course_id", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storyChapters = pgTable(
  "story_chapters",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    storyArcId: varchar("story_arc_id", { length: 64 }).notNull(),
    lessonId: varchar("lesson_id", { length: 64 }).notNull(),
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
    languageId: varchar("language_id", { length: 64 }).notNull(),
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
  },
  (table) => [index("script_characters_script_id_idx").on(table.scriptId)]
);

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
    storyId: varchar("story_id", { length: 128 }),
    audioUrl: text("audio_url"),
    contentUrl: text("content_url"),
    body: text("body"),
    showNotes: text("show_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
