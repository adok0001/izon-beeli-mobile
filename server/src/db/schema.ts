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
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
    description: text("description").notNull(),
    userName: varchar("user_name", { length: 200 }).notNull(),
    userAvatarUrl: text("user_avatar_url"),
    audioUrl: text("audio_url"),
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
  },
  (table) => [index("courses_language_id_idx").on(table.languageId)]
);

export const lessons = pgTable(
  "lessons",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    courseId: varchar("course_id", { length: 64 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    titleFr: varchar("title_fr", { length: 300 }),
    description: text("description").notNull(),
    descriptionFr: text("description_fr"),
    audioUrl: text("audio_url"),
    duration: integer("duration"),
    order: integer("order").default(0).notNull(),
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
    contributorName: varchar("contributor_name", { length: 200 }),
    contributorId: varchar("contributor_id", { length: 64 }),
  },
  (table) => [
    index("dictionary_entries_language_idx").on(table.languageId),
    index("dictionary_entries_lang_cat_idx").on(table.languageId, table.category),
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

export const sentenceTemplates = pgTable(
  "sentence_templates",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 }).notNull(),
    sentence: text("sentence").notNull(),
    answer: varchar("answer", { length: 300 }).notNull(),
    englishSentence: text("english_sentence").notNull(),
  },
  (table) => [index("sentence_templates_language_id_idx").on(table.languageId)]
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
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description").notNull(),
    audioUrl: text("audio_url").notNull(),
    duration: integer("duration"),
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

// ---------- Relations ----------

export const usersRelations = relations(users, ({ many }) => ({
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
