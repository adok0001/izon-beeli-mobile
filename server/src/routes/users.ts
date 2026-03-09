import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { verifyToken } from "@clerk/backend";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const usersRouter = new Hono<AuthEnv>();

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
