import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------

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

export const feedbackCategoryEnum = pgEnum("feedback_category", [
  "bug",
  "suggestion",
  "other",
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
    description: text("description").notNull(),
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
    description: text("description").notNull(),
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
    category: varchar("category", { length: 64 }).notNull(),
    pronunciation: varchar("pronunciation", { length: 500 }),
    example: text("example"),
    exampleTranslation: text("example_translation"),
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
    meaning: text("meaning").notNull(),
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
    description: text("description").notNull(),
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

// ---------- Relations ----------

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  journalEntries: many(journalEntries),
  feedItems: many(feedItems),
  likes: many(likes),
  comments: many(comments),
  contributions: many(contributions),
  wordBank: many(wordBank),
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
