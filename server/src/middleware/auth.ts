import { createClerkClient, verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY environment variable is required");
}

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerkClient = createClerkClient({ secretKey: clerkSecretKey });

export type AuthEnv = {
  Variables: {
    userId: string;
    clerkId: string;
    reviewerLanguages: string[];
    isAdmin: boolean;
    reviewerRole: string | null;
  };
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token, { secretKey: clerkSecretKey });

    const clerkId = payload.sub;
    if (!clerkId) {
      return c.json({ error: "Invalid token" }, 401);
    }

    // Fast path: the user row already exists → one indexed SELECT by clerkId,
    // no Clerk API round-trip. The mobile client keeps name/email/avatar fresh
    // via POST /users/sync (see routes/users.ts), so we don't sync here.
    let [user] = await db
      .select({ id: users.id, deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    // First-seen only: fetch a good name/email from Clerk and create the row.
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      [user] = await db
        .insert(users)
        .values({
          clerkId,
          name: clerkUser.username ?? clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
          selectedLanguageId: "izon",
        })
        // No-op update so a concurrent first request still returns the row.
        .onConflictDoUpdate({
          target: users.clerkId,
          set: { clerkId },
        })
        .returning({ id: users.id, deletedAt: users.deletedAt });
    }

    // Block access if the account is soft-deleted but within the 30-day window.
    // The /restore endpoint bypasses this check via its own inline auth.
    if (user.deletedAt) {
      const restoreBy = new Date(user.deletedAt.getTime() + THIRTY_DAYS_MS);
      const isExpired = Date.now() > restoreBy.getTime();
      if (isExpired) {
        // Grace period elapsed — treat as fully gone
        return c.json({ error: "Account not found" }, 404);
      }
      // Allow requests only to the restore endpoint
      if (!c.req.path.endsWith("/me/restore")) {
        return c.json(
          {
            error: "account_scheduled_for_deletion",
            restoreBy: restoreBy.toISOString(),
          },
          403
        );
      }
    }

    c.set("userId", user.id);
    c.set("clerkId", clerkId);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

/**
 * Like authMiddleware, but treats a missing/invalid/expired token as
 * anonymous instead of rejecting — for routes that accept both guest and
 * signed-in submissions (userId stays unset for guests).
 */
export const optionalAuthMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    await next();
    return;
  }

  try {
    const payload = await verifyToken(authHeader.slice(7), { secretKey: clerkSecretKey });
    const clerkId = payload.sub;
    if (clerkId) {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);
      if (user) {
        c.set("userId", user.id);
        c.set("clerkId", clerkId);
      }
    }
  } catch {
    // Invalid/expired token — fall through as anonymous.
  }

  await next();
});

/**
 * Requires authMiddleware to have already run (userId set in context).
 * Rejects with 403 if the user does not have isAdmin = true.
 */
export const adminMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.isAdmin) return c.json({ error: "Forbidden" }, 403);

  await next();
});

/**
 * Allows access for admins OR reviewers.
 * Sets `reviewerLanguages` and `isAdmin` context vars for downstream route use.
 * Admins get an empty reviewerLanguages array (they can see all languages).
 */
export const reviewerMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const [user] = await db
    .select({ isAdmin: users.isAdmin, isReviewer: users.isReviewer, reviewerLanguages: users.reviewerLanguages, reviewerRole: users.reviewerRole })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.isAdmin && !user?.isReviewer) return c.json({ error: "Forbidden" }, 403);

  c.set("isAdmin", user.isAdmin);
  c.set("reviewerLanguages", user.isAdmin ? [] : (user.reviewerLanguages ?? []));
  c.set("reviewerRole", user.isAdmin ? null : (user.reviewerRole ?? null));

  await next();
});

/** Allows access for admins, professors, or elders (professor+). */
export const professorMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const [user] = await db
    .select({ isAdmin: users.isAdmin, reviewerRole: users.reviewerRole })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const allowed = user?.isAdmin || user?.reviewerRole === "professor" || user?.reviewerRole === "elder";
  if (!allowed) return c.json({ error: "Forbidden" }, 403);

  await next();
});

/** Allows access for admins or elders only. */
export const elderMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const [user] = await db
    .select({ isAdmin: users.isAdmin, reviewerRole: users.reviewerRole })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const allowed = user?.isAdmin || user?.reviewerRole === "elder";
  if (!allowed) return c.json({ error: "Forbidden" }, 403);

  await next();
});
