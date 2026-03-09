import { Hono } from "hono";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { userProgress, quizResults, wordBank } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const dashboardRouter = new Hono<AuthEnv>();

dashboardRouter.use("*", authMiddleware);

// GET /api/dashboard/weekly-stats
dashboardRouter.get("/weekly-stats", async (c) => {
  const userId = c.get("userId");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const lessonsRows = await db
    .select({
      date: sql<string>`to_char(${userProgress.completedAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, true),
        gte(userProgress.completedAt, sevenDaysAgo)
      )
    )
    .groupBy(sql`to_char(${userProgress.completedAt}, 'YYYY-MM-DD')`);

  const quizRows = await db
    .select({
      date: sql<string>`to_char(${quizResults.createdAt}, 'YYYY-MM-DD')`,
      avgAccuracy: sql<number>`avg(${quizResults.accuracy})::int`,
    })
    .from(quizResults)
    .where(
      and(
        eq(quizResults.userId, userId),
        gte(quizResults.createdAt, sevenDaysAgo)
      )
    )
    .groupBy(sql`to_char(${quizResults.createdAt}, 'YYYY-MM-DD')`);

  const reviewRows = await db
    .select({
      date: sql<string>`to_char(${wordBank.lastReviewedAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(wordBank)
    .where(
      and(
        eq(wordBank.userId, userId),
        gte(wordBank.lastReviewedAt, sevenDaysAgo)
      )
    )
    .groupBy(sql`to_char(${wordBank.lastReviewedAt}, 'YYYY-MM-DD')`);

  // Build day-by-day data for the last 7 days
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const lessonMap = new Map(lessonsRows.map((r) => [r.date, r.count]));
  const quizMap = new Map(quizRows.map((r) => [r.date, r.avgAccuracy]));
  const reviewMap = new Map(reviewRows.map((r) => [r.date, r.count]));

  const weeklyActivity = days.map((date) => ({
    date,
    lessonsCompleted: lessonMap.get(date) ?? 0,
    quizAccuracy: quizMap.get(date) ?? null,
    wordsReviewed: reviewMap.get(date) ?? 0,
  }));

  const totalLessonsThisWeek = weeklyActivity.reduce(
    (sum, d) => sum + d.lessonsCompleted,
    0
  );

  const quizDays = weeklyActivity.filter((d) => d.quizAccuracy !== null);
  const avgQuizAccuracyThisWeek =
    quizDays.length > 0
      ? Math.round(
          quizDays.reduce((sum, d) => sum + (d.quizAccuracy ?? 0), 0) /
            quizDays.length
        )
      : null;

  const totalWordsReviewedThisWeek = weeklyActivity.reduce(
    (sum, d) => sum + d.wordsReviewed,
    0
  );

  return c.json({
    weeklyActivity,
    totalLessonsThisWeek,
    avgQuizAccuracyThisWeek,
    totalWordsReviewedThisWeek,
  });
});

// GET /api/dashboard/streak-calendar - active days in last 30 days
dashboardRouter.get("/streak-calendar", async (c) => {
  const userId = c.get("userId");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const lessonDates = await db
    .select({
      date: sql<string>`to_char(${userProgress.completedAt}, 'YYYY-MM-DD')`,
    })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, true),
        gte(userProgress.completedAt, thirtyDaysAgo)
      )
    );

  const quizDates = await db
    .select({
      date: sql<string>`to_char(${quizResults.createdAt}, 'YYYY-MM-DD')`,
    })
    .from(quizResults)
    .where(
      and(
        eq(quizResults.userId, userId),
        gte(quizResults.createdAt, thirtyDaysAgo)
      )
    );

  const reviewDates = await db
    .select({
      date: sql<string>`to_char(${wordBank.lastReviewedAt}, 'YYYY-MM-DD')`,
    })
    .from(wordBank)
    .where(
      and(
        eq(wordBank.userId, userId),
        gte(wordBank.lastReviewedAt, thirtyDaysAgo)
      )
    );

  const allDates = new Set([
    ...lessonDates.map((r) => r.date),
    ...quizDates.map((r) => r.date),
    ...reviewDates.map((r) => r.date),
  ]);

  return c.json({ activeDays: Array.from(allDates).sort() });
});
