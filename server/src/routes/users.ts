import { createClerkClient, verifyToken } from "@clerk/backend";
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import {
    classroomAssignments,
    classroomGroups,
    classroomMembers,
    comments,
    contributions,
    courses,
    dailyChallenges,
    dictionaryEntries,
    feedback,
    feedItems,
    gameSessionPlayers,
    gameSessions,
    journalEntries,
    lessonContributions,
    lessonContributionSegments,
    lessons,
    likes,
    matchmakingQueue,
    pushTokens,
    quizResults,
    userProgress,
    users,
    wordBank,
} from "../db/schema.js";
import { adminMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export const usersRouter = new Hono<AuthEnv>();

// GET /api/users/leaderboard - public top 100 by points
usersRouter.get("/leaderboard", async (c) => {
  const top = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      points: users.points,
      streak: users.streak,
      selectedLanguageId: users.selectedLanguageId,
    })
    .from(users)
    .where(isNotNull(users.name))
    .orderBy(desc(users.points), asc(users.createdAt))
    .limit(100);

  const result = top.map((u, i) => ({
    id: u.id,
    rank: i + 1,
    name: u.name,
    avatarUrl: u.avatarUrl ?? null,
    points: u.points ?? 0,
    streak: u.streak ?? 0,
    selectedLanguageId: u.selectedLanguageId ?? null,
    isCurrentUser: false,
  }));

  return c.json(result);
});

// POST /api/users/sync - sync Clerk profile on app open (called before other auth routes)
usersRouter.post("/sync", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  const clerkId = payload.sub;
  if (!clerkId) return c.json({ error: "Invalid token" }, 401);

  const body = await c.req.json<{ name?: string; email?: string; avatarUrl?: string }>();

  // Upsert user
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existing) {
    // Update name/email if provided
    if (body.name || body.email || body.avatarUrl) {
      await db
        .update(users)
        .set({
          ...(body.name ? { name: body.name } : {}),
          ...(body.email ? { email: body.email } : {}),
          ...(body.avatarUrl ? { avatarUrl: body.avatarUrl } : {}),
        })
        .where(eq(users.id, existing.id));
    }
    return c.json({ id: existing.id, synced: true });
  }

  // Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      clerkId,
      name: body.name ?? "Learner",
      email: body.email ?? "",
      avatarUrl: body.avatarUrl,
      selectedLanguageId: "izon",
    })
    .returning({ id: users.id });

  return c.json({ id: newUser.id, synced: true, created: true });
});

// GET /api/users/me - get current user profile
usersRouter.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    streak: user.streak,
    points: user.points,
    selectedLanguageId: user.selectedLanguageId,
    isAdmin: user.isAdmin,
    isReviewer: user.isReviewer,
    reviewerLanguages: user.reviewerLanguages,
    reviewerRole: user.reviewerRole,
    dailyGoal: user.dailyGoal,
    createdAt: user.createdAt,
  });
});

// PATCH /api/users/me - update profile
usersRouter.patch("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    name?: string;
    selectedLanguageId?: string;
    dailyGoal?: string;
  }>();

  await db
    .update(users)
    .set({
      ...(body.name ? { name: body.name } : {}),
      ...(body.selectedLanguageId
        ? { selectedLanguageId: body.selectedLanguageId }
        : {}),
      ...(body.dailyGoal ? { dailyGoal: body.dailyGoal } : {}),
    })
    .where(eq(users.id, userId));

  return c.json({ updated: true });
});

// DELETE /api/users/me
// Soft-delete: stamps deletedAt, signs the user out client-side.
// All data is preserved for 30 days so the user can restore.
// A scheduled purge (POST /api/internal/purge-deleted-users) does the hard delete.
usersRouter.delete("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");

  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.id, userId));

  // Push tokens removed immediately so no more notifications are sent
  await db.delete(pushTokens).where(eq(pushTokens.userId, userId));

  return c.json({ scheduled: true });
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// POST /api/users/me/restore
// Cancels a pending soft-delete if still within the 30-day window.
// The auth middleware passes this path through even when deletedAt is set.
usersRouter.post("/me/restore", authMiddleware, async (c) => {
  const userId = c.get("userId");

  const [user] = await db
    .select({ deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);
  if (!user.deletedAt) return c.json({ restored: true }); // nothing to undo

  const restoreBy = new Date(user.deletedAt.getTime() + THIRTY_DAYS_MS);
  if (Date.now() > restoreBy.getTime()) {
    return c.json({ error: "Restore window has expired" }, 410);
  }

  await db.update(users).set({ deletedAt: null }).where(eq(users.id, userId));

  return c.json({ restored: true });
});

// ---- Admin users router ----

export const adminUsersRouter = new Hono<AuthEnv>();
adminUsersRouter.use("*", authMiddleware);
adminUsersRouter.use("*", adminMiddleware);

// GET /api/admin/users?limit=100
adminUsersRouter.get("/", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "100", 10), 500);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      points: users.points,
      streak: users.streak,
      isAdmin: users.isAdmin,
      isReviewer: users.isReviewer,
      reviewerLanguages: users.reviewerLanguages,
      reviewerRole: users.reviewerRole,
      selectedLanguageId: users.selectedLanguageId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(isNotNull(users.id))
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return c.json(rows);
});

// PATCH /api/admin/users/:id — toggle isAdmin or set reviewer role
adminUsersRouter.patch("/:id", async (c) => {
  const targetId = c.req.param("id");
  const body = await c.req.json<{ isAdmin?: boolean; isReviewer?: boolean; reviewerLanguages?: string[]; reviewerRole?: string | null }>();

  const updates: Record<string, unknown> = {};
  if (typeof body.isAdmin === "boolean") updates.isAdmin = body.isAdmin;
  if (typeof body.isReviewer === "boolean") updates.isReviewer = body.isReviewer;
  if (Array.isArray(body.reviewerLanguages)) updates.reviewerLanguages = body.reviewerLanguages;
  if (body.reviewerRole !== undefined) updates.reviewerRole = body.reviewerRole ?? null;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  await db.update(users).set(updates).where(eq(users.id, targetId));
  return c.json({ updated: true });
});

// ── Admin Stats ───────────────────────────────────────────────────────────────

export const adminStatsRouter = new Hono<AuthEnv>();
adminStatsRouter.use("*", authMiddleware);
adminStatsRouter.use("*", adminMiddleware);

// GET /api/admin/stats
adminStatsRouter.get("/stats", async (c) => {
  const [
    [userCount],
    [lessonCount],
    [courseCount],
    [contributionCount],
    [pendingCount],
    [completedCount],
    [quizCount],
    [dictCount],
    [feedbackCount],
  ] = await Promise.all([
    db.select({ value: count() }).from(users).where(isNull(users.deletedAt)),
    db.select({ value: count() }).from(lessons),
    db.select({ value: count() }).from(courses),
    db.select({ value: count() }).from(contributions),
    db.select({ value: count() }).from(contributions).where(eq(contributions.status, "submitted")),
    db.select({ value: count() }).from(userProgress).where(eq(userProgress.completed, true)),
    db.select({ value: count() }).from(quizResults),
    db.select({ value: count() }).from(dictionaryEntries),
    db.select({ value: count() }).from(feedback),
  ]);

  return c.json({
    users: userCount.value,
    lessons: lessonCount.value,
    courses: courseCount.value,
    contributions: contributionCount.value,
    pendingContributions: pendingCount.value,
    lessonsCompleted: completedCount.value,
    quizzesTaken: quizCount.value,
    dictionaryEntries: dictCount.value,
    feedbackReceived: feedbackCount.value,
  });
});

/**
 * Hard-purge all users whose 30-day restore window has elapsed.
 * Called by POST /api/internal/purge-deleted-users (see app.ts).
 * Exported so it can be invoked from the cron route without duplicating logic.
 */
export async function purgeExpiredDeletedUsers(): Promise<number> {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

  const expired = await db
    .select({ id: users.id, clerkId: users.clerkId })
    .from(users)
    .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, cutoff)));

  if (expired.length === 0) return 0;

  const expiredIds = expired.map((u) => u.id);

  await db.transaction(async (tx) => {
    await tx.delete(matchmakingQueue).where(inArray(matchmakingQueue.userId, expiredIds));
    await tx.delete(gameSessionPlayers).where(inArray(gameSessionPlayers.userId, expiredIds));

    const ownedSessions = await tx
      .select({ id: gameSessions.id })
      .from(gameSessions)
      .where(inArray(gameSessions.createdBy, expiredIds));
    if (ownedSessions.length > 0) {
      const sessionIds = ownedSessions.map((s) => s.id);
      await tx.delete(gameSessionPlayers).where(inArray(gameSessionPlayers.sessionId, sessionIds));
      await tx.delete(gameSessions).where(inArray(gameSessions.id, sessionIds));
    }

    await tx.delete(classroomAssignments).where(inArray(classroomAssignments.assignedBy, expiredIds));
    await tx.delete(classroomMembers).where(inArray(classroomMembers.userId, expiredIds));
    await tx.delete(classroomGroups).where(inArray(classroomGroups.createdBy, expiredIds));
    await tx.delete(quizResults).where(inArray(quizResults.userId, expiredIds));

    const userLessonContribIds = await tx
      .select({ id: lessonContributions.id })
      .from(lessonContributions)
      .where(inArray(lessonContributions.userId, expiredIds));
    if (userLessonContribIds.length > 0) {
      const ids = userLessonContribIds.map((r) => r.id);
      await tx.delete(lessonContributionSegments).where(
        inArray(lessonContributionSegments.lessonContributionId, ids)
      );
    }
    await tx.delete(lessonContributions).where(inArray(lessonContributions.userId, expiredIds));
    await tx.delete(contributions).where(inArray(contributions.userId, expiredIds));
    await tx.delete(wordBank).where(inArray(wordBank.userId, expiredIds));
    await tx.delete(dailyChallenges).where(inArray(dailyChallenges.userId, expiredIds));
    await tx.delete(likes).where(inArray(likes.userId, expiredIds));
    await tx.delete(comments).where(inArray(comments.userId, expiredIds));

    const userFeedItemIds = await tx
      .select({ id: feedItems.id })
      .from(feedItems)
      .where(inArray(feedItems.userId, expiredIds));
    if (userFeedItemIds.length > 0) {
      const ids = userFeedItemIds.map((r) => r.id);
      await tx.delete(likes).where(inArray(likes.feedItemId, ids));
      await tx.delete(comments).where(inArray(comments.feedItemId, ids));
    }
    await tx.delete(feedItems).where(inArray(feedItems.userId, expiredIds));
    await tx.delete(journalEntries).where(inArray(journalEntries.userId, expiredIds));
    await tx.delete(userProgress).where(inArray(userProgress.userId, expiredIds));
    await tx.delete(feedback).where(inArray(feedback.userId, expiredIds));
    await tx.delete(users).where(inArray(users.id, expiredIds));
  });

  // Delete Clerk accounts after DB transaction succeeds
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  await Promise.allSettled(expired.map((u) => clerkClient.users.deleteUser(u.clerkId)));

  return expired.length;
}
