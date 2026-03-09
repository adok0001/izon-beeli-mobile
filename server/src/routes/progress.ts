import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { userProgress, users } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);

export const progressRouter = new Hono<AuthEnv>();

progressRouter.use("*", authMiddleware);

// GET /api/progress/summary - points, streak, completedCount
progressRouter.get("/summary", async (c) => {
  const userId = c.get("userId");

  const [user] = await db
    .select({ points: users.points, streak: users.streak })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)));

  return c.json({
    points: user?.points ?? 0,
    streak: user?.streak ?? 0,
    completedCount: countResult?.count ?? 0,
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
  const todayStr = now.toISOString().slice(0, 10);

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

  // Update streak
  const [user] = await db
    .select({ points: users.points, streak: users.streak, lastActiveDate: users.lastActiveDate })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  let newStreak = user?.streak ?? 0;
  const lastActive = user?.lastActiveDate;

  if (lastActive) {
    const lastDate = new Date(lastActive);
    const today = new Date(todayStr);
    const diffDays = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  await db
    .update(users)
    .set({ streak: newStreak, lastActiveDate: todayStr })
    .where(eq(users.id, userId));

  // Award XP (updates points in DB)
  const xpResult = await awardXP(userId, 50, "lesson");

  // Fire-and-forget: increment daily challenge
  incrementDailyChallenge(userId, "complete_lesson").catch(() => {});
  incrementDailyChallenge(userId, "listen_lesson").catch(() => {});

  const streakMilestone = STREAK_MILESTONES.has(newStreak) ? newStreak : null;

  return c.json({
    completed: true,
    pointsEarned: 50,
    totalPoints: xpResult.totalPoints,
    streak: newStreak,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
    newTitle: xpResult.newTitle,
    streakMilestone,
  });
});

// DELETE /api/progress - reset all progress for the current user
progressRouter.delete("/", async (c) => {
  const userId = c.get("userId");

  await db.delete(userProgress).where(eq(userProgress.userId, userId));
  await db
    .update(users)
    .set({ points: 0, streak: 0, lastActiveDate: null })
    .where(eq(users.id, userId));

  return c.json({ reset: true });
});
