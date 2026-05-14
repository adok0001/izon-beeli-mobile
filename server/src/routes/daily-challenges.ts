import { Hono } from "hono";
import { and, eq, gte } from "drizzle-orm";
import { db } from "../db/index.js";
import { dailyChallenges } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { getOrCreateTodayChallenges } from "../lib/daily-challenge.js";
import { randomInt } from "node:crypto";

export const dailyChallengesRouter = new Hono<AuthEnv>();

dailyChallengesRouter.use("*", authMiddleware);

// GET /api/daily-challenges/today
dailyChallengesRouter.get("/today", async (c) => {
  const userId = c.get("userId");
  const challenges = await getOrCreateTodayChallenges(userId);
  return c.json(challenges);
});

// POST /api/daily-challenges/today/refresh
dailyChallengesRouter.post("/today/refresh", async (c) => {
  const userId = c.get("userId");
  const today = new Date().toISOString().slice(0, 10);

  const existing = await db
    .select({ completed: dailyChallenges.completed })
    .from(dailyChallenges)
    .where(and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today)));

  if (existing.some((r) => r.completed)) {
    return c.json({ error: "Cannot refresh after completing a challenge" }, 409);
  }

  await db
    .delete(dailyChallenges)
    .where(and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today)));

  const seed = randomInt(1_000_000);
  const challenges = await getOrCreateTodayChallenges(userId, seed);
  return c.json(challenges);
});

// GET /api/daily-challenges/history - last 7 days
dailyChallengesRouter.get("/history", async (c) => {
  const userId = c.get("userId");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(dailyChallenges)
    .where(
      and(
        eq(dailyChallenges.userId, userId),
        gte(dailyChallenges.date, cutoffDate)
      )
    )
    .orderBy(dailyChallenges.date);

  return c.json(rows);
});
