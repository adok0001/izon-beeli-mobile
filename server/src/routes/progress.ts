import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { lessons, pushTokens, quizResults, userProgress, users } from "../db/schema.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";
import { sendPushBatch, chunk } from "../lib/send-push.js";
import { updateStreak, diffDaysFromToday } from "../lib/update-streak.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const progressRouter = new Hono<AuthEnv>();

progressRouter.use("*", authMiddleware);

// GET /api/progress/summary - points, streak, freeze state, completedCount
progressRouter.get("/summary", async (c) => {
  const userId = c.get("userId");

  const [user] = await db
    .select({
      points: users.points,
      streak: users.streak,
      lastActiveDate: users.lastActiveDate,
      streakFreezes: users.streakFreezes,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [[countResult], [quizCountResult]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(quizResults)
      .where(eq(quizResults.userId, userId)),
  ]);

  // Streak is "broken" if user was last active 2+ days ago (missed at least one day)
  const diff = diffDaysFromToday(user?.lastActiveDate);
  const streakBroken = diff >= 2 && (user?.streak ?? 0) > 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const refreshedToday = user?.lastActiveDate === todayStr;

  return c.json({
    points: user?.points ?? 0,
    streak: user?.streak ?? 0,
    completedCount: countResult?.count ?? 0,
    quizCount: quizCountResult?.count ?? 0,
    freezeCount: user?.streakFreezes ?? 0,
    streakBroken,
    refreshedToday,
  });
});

// GET /api/progress - all completed lesson IDs
progressRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const rows = await db
    .select({ lessonId: userProgress.lessonId })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)));

  return c.json(rows.map((r) => r.lessonId));
});

// POST /api/progress/:lessonId/complete - mark complete
progressRouter.post("/:lessonId/complete", async (c) => {
  const userId = c.get("userId");
  const lessonId = c.req.param("lessonId");

  // Check if already completed
  const [existing] = await db
    .select()
    .from(userProgress)
    .where(
      and(eq(userProgress.userId, userId), eq(userProgress.lessonId, lessonId))
    )
    .limit(1);

  if (existing?.completed) {
    return c.json({ alreadyCompleted: true });
  }

  const now = new Date();

  if (existing) {
    await db
      .update(userProgress)
      .set({ completed: true, points: 50, completedAt: now })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({
      userId,
      lessonId,
      completed: true,
      points: 50,
      completedAt: now,
    });
  }

  const streakResult = await updateStreak(userId);

  // Award XP (updates points in DB)
  const xpResult = await awardXP(userId, 50, "lesson");

  await incrementDailyChallenge(userId, "complete_lesson").catch(() => {});

  // Streak milestone push — fire-and-forget
  if (streakResult.streakMilestone) {
    const milestone = streakResult.streakMilestone;
    db.select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId))
      .then((rows) => {
        const tokens = rows.map((r) => r.token);
        if (tokens.length === 0) return;
        const messages = tokens.map((token) => ({
          to: token,
          title: `${milestone}-day streak!`,
          body: "Keep it going.",
          data: { type: "streak_milestone" },
          sound: "default" as const,
        }));
        return Promise.all(chunk(messages, 100).map((batch) => sendPushBatch(batch)));
      })
      .catch(() => {});
  }

  return c.json({
    completed: true,
    pointsEarned: 50,
    totalPoints: xpResult.totalPoints,
    streak: streakResult.newStreak,
    streakIncremented: streakResult.streakIncremented,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
    newTitle: xpResult.newTitle,
    streakMilestone: streakResult.streakMilestone,
    freezeGranted: streakResult.freezeGranted,
    freezeCount: streakResult.freezeCount,
  });
});

// POST /api/progress/:lessonId/listen - track that user started listening to a lesson
progressRouter.post("/:lessonId/listen", async (c) => {
  const userId = c.get("userId");
  const lessonId = c.req.param("lessonId");
  const now = new Date();

  // Upsert a progress row to record listenedAt
  const [existing] = await db
    .select({ id: userProgress.id })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.lessonId, lessonId)))
    .limit(1);

  if (existing) {
    await db
      .update(userProgress)
      .set({ listenedAt: now })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({ userId, lessonId, listenedAt: now });
  }

  await updateStreak(userId);

  incrementDailyChallenge(userId, "listen_lesson").catch(() => {});
  return c.json({ tracked: true });
});

// POST /api/progress/freeze - spend a freeze to restore broken streak
progressRouter.post("/freeze", async (c) => {
  const userId = c.get("userId");
  const todayStr = new Date().toISOString().slice(0, 10);

  const [user] = await db
    .select({
      streak: users.streak,
      lastActiveDate: users.lastActiveDate,
      streakFreezes: users.streakFreezes,
      lastFreezeUsedDate: users.lastFreezeUsedDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const diff = diffDaysFromToday(user.lastActiveDate);

  if (diff < 2) {
    return c.json({ error: "Streak is not broken" }, 400);
  }
  if ((user.streakFreezes ?? 0) <= 0) {
    return c.json({ error: "No freezes available" }, 400);
  }
  if (user.lastFreezeUsedDate === todayStr) {
    return c.json({ error: "Already used a freeze today" }, 400);
  }

  // Restore: set lastActiveDate to yesterday so next activity continues streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  await db
    .update(users)
    .set({
      lastActiveDate: yesterdayStr,
      streakFreezes: (user.streakFreezes ?? 0) - 1,
      lastFreezeUsedDate: todayStr,
    })
    .where(eq(users.id, userId));

  return c.json({
    restored: true,
    streak: user.streak,
    freezesRemaining: (user.streakFreezes ?? 0) - 1,
  });
});

// GET /api/progress/next-lesson - next uncompleted lesson in path order
progressRouter.get("/next-lesson", async (c) => {
  const userId = c.get("userId");
  const queryLangId = c.req.query("languageId");

  const [user] = await db
    .select({ selectedLanguageId: users.selectedLanguageId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const languageId = queryLangId ?? user?.selectedLanguageId;
  if (!languageId) return c.json(null);

  const LEVEL_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

  const [allLessons, completedRows] = await Promise.all([
    db
      .select({
        id: lessons.id,
        title: lessons.title,
        titleFr: lessons.titleFr,
        description: lessons.description,
        descriptionFr: lessons.descriptionFr,
        duration: lessons.duration,
        courseId: lessons.courseId,
        level: lessons.level,
        theme: lessons.theme,
        order: lessons.order,
      })
      .from(lessons)
      .where(and(eq(lessons.languageId, languageId), eq(lessons.isActive, true)))
      .orderBy(asc(lessons.level), asc(lessons.order)),
    db
      .select({ lessonId: userProgress.lessonId })
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true))),
  ]);

  if (allLessons.length === 0) return c.json(null);

  allLessons.sort(
    (a, b) =>
      (LEVEL_RANK[a.level ?? ""] ?? 99) - (LEVEL_RANK[b.level ?? ""] ?? 99) || a.order - b.order
  );

  const completedSet = new Set(completedRows.map((r) => r.lessonId));

  const total = allLessons.length;
  let completed = 0;
  let next: (typeof allLessons)[0] | undefined;
  for (const lesson of allLessons) {
    if (completedSet.has(lesson.id)) {
      completed++;
    } else if (!next) {
      next = lesson;
    }
  }

  if (!next) return c.json({ overallProgress: { completed, total } });

  return c.json({
    lesson: {
      id: next.id,
      title: next.title,
      titleFr: next.titleFr ?? null,
      description: next.description,
      descriptionFr: next.descriptionFr ?? null,
      duration: next.duration,
      courseId: next.courseId ?? null,
      level: next.level ?? null,
      theme: next.theme ?? null,
    },
    overallProgress: { completed, total },
  });
});

// POST /api/progress/checklist-bonus - one-time bonus XP for completing all checklist tasks
progressRouter.post("/checklist-bonus", async (c) => {
  const userId = c.get("userId");
  const xpResult = await awardXP(userId, 100, "checklist_bonus");
  return c.json({
    pointsEarned: 100,
    totalPoints: xpResult.totalPoints,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
    newTitle: xpResult.newTitle,
  });
});

// DELETE /api/progress - reset all progress for the current user
progressRouter.delete("/", async (c) => {
  const userId = c.get("userId");

  await db.delete(userProgress).where(eq(userProgress.userId, userId));
  await db
    .update(users)
    .set({ points: 0, streak: 0, lastActiveDate: null, streakFreezes: 0 })
    .where(eq(users.id, userId));

  return c.json({ reset: true });
});
