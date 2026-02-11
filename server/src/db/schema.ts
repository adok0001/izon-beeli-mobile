import {
  pgTable,
  varchar,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  lessonId: varchar("lesson_id", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------- Feed Items ----------

export const feedItems = pgTable("feed_items", {
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
});

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

export const comments = pgTable("comments", {
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
});

// ---------- Contributions ----------

export const contributions = pgTable("contributions", {
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
});

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
