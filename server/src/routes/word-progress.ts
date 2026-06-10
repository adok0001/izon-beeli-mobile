import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { wordProgress } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const wordProgressRouter = new Hono<AuthEnv>();

wordProgressRouter.use("*", authMiddleware);

// GET /api/word-progress?languageId=
wordProgressRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const languageId = c.req.query("languageId");

  if (!languageId) return c.json({ error: "languageId is required" }, 400);

  const rows = await db
    .select({
      wordId: wordProgress.wordId,
      box: wordProgress.box,
      correctStreak: wordProgress.correctStreak,
      attempts: wordProgress.attempts,
      lastSeenAt: wordProgress.lastSeenAt,
    })
    .from(wordProgress)
    .where(and(eq(wordProgress.userId, userId), eq(wordProgress.languageId, languageId)));

  // Mastered = box 5
  const masteredCount = rows.filter((r) => r.box >= 5).length;

  return c.json({ rows, masteredCount });
});
