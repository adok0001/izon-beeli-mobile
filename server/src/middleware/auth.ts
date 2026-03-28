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

    // Fetch Clerk user for up-to-date username
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const username = clerkUser.username ?? clerkUser.id;

    // Upsert internal user, keeping name in sync with Clerk username
    const [user] = await db
      .insert(users)
      .values({
        clerkId,
        name: username,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        selectedLanguageId: "izon",
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: { name: username },
      })
      .returning({ id: users.id, deletedAt: users.deletedAt });

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
