import { Hono } from "hono";
import { parseJson } from "../lib/http.js";
import { eq, and, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { pushTokens } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const pushTokensRouter = new Hono<AuthEnv>();
pushTokensRouter.use("*", authMiddleware);

// POST /api/push-tokens — register or update a push token
pushTokensRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{ token: string; platform: "ios" | "android" }>(c);
  const { token, platform } = body;

  if (!token || !platform || !["ios", "android"].includes(platform)) {
    return c.json({ error: "token and platform (ios|android) are required" }, 400);
  }

  // Remove this token from any other user (same device, different account)
  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.token, token), ne(pushTokens.userId, userId)));

  // Upsert: if this (userId, token) pair already exists, update updatedAt
  const [existing] = await db
    .select({ id: pushTokens.id })
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)))
    .limit(1);

  if (existing) {
    await db
      .update(pushTokens)
      .set({ updatedAt: new Date() })
      .where(eq(pushTokens.id, existing.id));
    return c.json({ registered: true });
  }

  await db.insert(pushTokens).values({ userId, token, platform });
  return c.json({ registered: true }, 201);
});

// DELETE /api/push-tokens — unregister a push token on sign-out
pushTokensRouter.delete("/", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{ token: string }>(c);
  const { token } = body;

  if (!token) {
    return c.json({ error: "token is required" }, 400);
  }

  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));

  return c.json({ unregistered: true });
});
