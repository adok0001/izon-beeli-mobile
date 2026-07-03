import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { courses, lessons, pushTokens, quizResults, userProgress, users } from "../db/schema.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";
import { sendPushBatch, chunk } from "../lib/send-push.js";
import { updateStreak, diffDaysFromToday } from "../lib/update-streak.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../middleware/auth.js";

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

// GET /api/progress/can-do - "what you can do" competence statements for the
// user's completed lessons (honest, real-world milestones — not XP/streaks).
progressRouter.get("/can-do", async (c) => {
  const userId = c.get("userId");

  const rows = await db
    .select({
      lessonId: lessons.id,
      title: lessons.title,
      canDo: lessons.canDo,
      canDoFr: lessons.canDoFr,
      completedAt: userProgress.completedAt,
    })
    .from(userProgress)
    .innerJoin(lessons, eq(lessons.id, userProgress.lessonId))
    .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)))
    .orderBy(desc(userProgress.completedAt));

  return c.json(rows.filter((r) => r.canDo != null && r.canDo !== ""));
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

  const streakResult = await updateStreak(userId);

  incrementDailyChallenge(userId, "listen_lesson").catch(() => {});
  return c.json({
    tracked: true,
    streak: streakResult.newStreak,
    streakIncremented: streakResult.streakIncremented,
    streakMilestone: streakResult.streakMilestone ?? null,
    freezeCount: streakResult.freezeCount,
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
  const now = new Date();
  const yesterdayStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
    .toISOString()
    .slice(0, 10);

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

  // Courses + completed progress in parallel (both only need languageId/userId)
  const [langCourses, completedRows] = await Promise.all([
    db
      .select({ id: courses.id, title: courses.title, titleFr: courses.titleFr, order: courses.order })
      .from(courses)
      .where(eq(courses.languageId, languageId))
      .orderBy(asc(courses.order)),
    db
      .select({ lessonId: userProgress.lessonId })
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true))),
  ]);

  if (langCourses.length === 0) return c.json(null);

  const courseIds = langCourses.map((c) => c.id);

  // All lessons ordered by courseId (preserve course order via JS sort) then lesson.order
  const allLessons = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      titleFr: lessons.titleFr,
      description: lessons.description,
      descriptionFr: lessons.descriptionFr,
      duration: lessons.duration,
      courseId: lessons.courseId,
      order: lessons.order,
    })
    .from(lessons)
    .where(inArray(lessons.courseId, courseIds))
    .orderBy(asc(lessons.courseId), asc(lessons.order));

  // Sort by course order, then lesson order
  const courseOrderMap = new Map(langCourses.map((c, i) => [c.id, i]));
  allLessons.sort(
    (a, b) =>
      (courseOrderMap.get(a.courseId) ?? 0) - (courseOrderMap.get(b.courseId) ?? 0) ||
      a.order - b.order
  );

  const completedSet = new Set(completedRows.map((r) => r.lessonId));

  // Single pass: count completed + find first uncompleted
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

  const course = langCourses.find((c) => c.id === next.courseId);

  return c.json({
    lesson: {
      id: next.id,
      title: next.title,
      titleFr: next.titleFr ?? null,
      description: next.description,
      descriptionFr: next.descriptionFr ?? null,
      duration: next.duration,
      courseId: next.courseId,
    },
    course: {
      id: course?.id ?? next.courseId,
      title: course?.title ?? "",
      titleFr: course?.titleFr ?? null,
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

// Resolve a relative lastActive token to a YYYY-MM-DD string (or null to clear).
// "yesterday" leaves the streak primed so the next activity increments it (diff 1);
// "today" marks it active today (next activity is a no-op); "stale" simulates a
// broken streak (diff >= 2). updateStreak keys entirely off this date, so tests
// must set it explicitly or a set streak gets clobbered on the next activity.
type LastActiveToken = "today" | "yesterday" | "stale" | "clear";

function resolveLastActiveDate(token: LastActiveToken): string | null {
  if (token === "clear") return null;
  const offset = token === "today" ? 0 : token === "yesterday" ? 1 : 3;
  // Use UTC date arithmetic so the result is consistent with diffDaysFromToday.
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset))
    .toISOString()
    .slice(0, 10);
}

// Coerce an optional body field to a non-negative integer. Returns the fallback
// when omitted, or null when present-but-invalid (non-integer, negative, string,
// NaN) so the caller can reject with a clear 400 instead of silently writing 0
// or letting a bad value hit the integer column.
function parseNonNegInt(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  return Number.isInteger(value) && (value as number) >= 0 ? (value as number) : null;
}

// POST /api/progress/admin/set-streak - admin-only streak override for testing.
// Body: { streak?, freezes?, lastActive?, userId? }. Defaults: streak 0,
// lastActive "yesterday", target = caller. Set streak 6 + lastActive "yesterday"
// to trip the 7-day milestone on the next lesson; streak 0 + "stale" to test the
// broken-streak path.
progressRouter.post("/admin/set-streak", adminMiddleware, async (c) => {
  const body = await c.req.json<{
    streak?: number;
    freezes?: number;
    lastActive?: LastActiveToken;
    userId?: string;
  }>().catch(() => ({}) as Record<string, never>);

  const targetUserId = body.userId ?? c.get("userId");
  const lastActive: LastActiveToken = body.lastActive ?? "yesterday";

  // streak defaults to 0; freezes stays undefined when omitted (left untouched).
  const streak = parseNonNegInt(body.streak, 0);
  const freezes = body.freezes === undefined ? undefined : parseNonNegInt(body.freezes, 0);
  if (streak === null || freezes === null) {
    return c.json({ error: "streak and freezes must be non-negative integers" }, 400);
  }

  const lastActiveDate = resolveLastActiveDate(lastActive);

  const [updated] = await db
    .update(users)
    .set({
      streak,
      lastActiveDate,
      ...(freezes !== undefined ? { streakFreezes: freezes } : {}),
    })
    .where(eq(users.id, targetUserId))
    .returning({
      streak: users.streak,
      lastActiveDate: users.lastActiveDate,
      streakFreezes: users.streakFreezes,
    });

  if (!updated) return c.json({ error: "User not found" }, 404);

  return c.json({
    userId: targetUserId,
    streak: updated.streak,
    lastActiveDate: updated.lastActiveDate,
    freezeCount: updated.streakFreezes,
  });
});
