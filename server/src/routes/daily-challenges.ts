import { Hono } from "hono";
import { and, eq, gte } from "drizzle-orm";
import { db } from "../db/index.js";
import { dailyChallenges } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { getOrCreateTodayChallenge } from "../lib/daily-challenge.js";

export const dailyChallengesRouter = new Hono<AuthEnv>();

dailyChallengesRouter.use("*", authMiddleware);

// GET /api/daily-challenges/today
dailyChallengesRouter.get("/today", async (c) => {
  const userId = c.get("userId");
  const challenge = await getOrCreateTodayChallenge(userId);
  return c.json(challenge);
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
