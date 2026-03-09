import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { userProgress, users } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);
// Milestones that grant a freeze bonus
const FREEZE_GRANT_MILESTONES: Record<number, number> = { 7: 1, 30: 2 };

export const progressRouter = new Hono<AuthEnv>();

progressRouter.use("*", authMiddleware);

function diffDaysFromToday(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(dateStr);
  last.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

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

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)));

  // Streak is "broken" if user was last active 2+ days ago (missed at least one day)
  const diff = diffDaysFromToday(user?.lastActiveDate);
  const streakBroken = diff >= 2 && (user?.streak ?? 0) > 0;

  return c.json({
    points: user?.points ?? 0,
    streak: user?.streak ?? 0,
    completedCount: countResult?.count ?? 0,
    freezeCount: user?.streakFreezes ?? 0,
    streakBroken,
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
    .select({
      points: users.points,
      streak: users.streak,
      lastActiveDate: users.lastActiveDate,
      streakFreezes: users.streakFreezes,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  let newStreak = user?.streak ?? 0;
  const lastActive = user?.lastActiveDate;
  const diff = diffDaysFromToday(lastActive);

  if (!lastActive) {
    newStreak = 1;
  } else if (diff === 1) {
    newStreak += 1;
  } else if (diff === 0) {
    // Same day — no change
  } else {
    newStreak = 1; // streak broken
  }

  // Determine freeze grants at milestone
  const freezeGrant = FREEZE_GRANT_MILESTONES[newStreak] ?? 0;

  // Grant 1 freeze to first-timers (no lastActiveDate means first activity)
  const isFirstLesson = !lastActive;
  const firstTimerGrant = isFirstLesson ? 1 : 0;

  const totalFreezeGrant = freezeGrant + firstTimerGrant;

  await db
    .update(users)
    .set({
      streak: newStreak,
      lastActiveDate: todayStr,
      ...(totalFreezeGrant > 0
        ? { streakFreezes: (user?.streakFreezes ?? 0) + totalFreezeGrant }
        : {}),
    })
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
    freezeGranted: totalFreezeGrant > 0 ? totalFreezeGrant : null,
    freezeCount: (user?.streakFreezes ?? 0) + totalFreezeGrant,
  });
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
