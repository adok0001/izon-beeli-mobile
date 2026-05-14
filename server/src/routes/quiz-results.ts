import { Hono } from "hono";
import { db } from "../db/index.js";
import { quizResults } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";
import { updateStreak } from "../lib/update-streak.js";

export const quizResultsRouter = new Hono<AuthEnv>();

quizResultsRouter.use("*", authMiddleware);

// POST /api/quiz-results - record a completed quiz attempt
quizResultsRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    languageId: string;
    score: number;
    accuracy: number;
    durationMs: number;
    questionCount: number;
  }>();

  const [row] = await db
    .insert(quizResults)
    .values({
      userId,
      languageId: body.languageId,
      score: body.score,
      accuracy: body.accuracy,
      durationMs: body.durationMs,
      questionCount: body.questionCount,
    })
    .returning({ id: quizResults.id });

  // Award XP based on accuracy × questionCount
  const xpEarned = Math.max(1, Math.round((body.accuracy / 100) * body.questionCount * 0.3));
  const [xpResult] = await Promise.all([
    awardXP(userId, xpEarned, "quiz"),
    updateStreak(userId),
  ]);

  // Fire-and-forget: increment daily challenge
  incrementDailyChallenge(userId, "complete_quiz").catch(() => {});

  return c.json(
    {
      id: row.id,
      xpEarned,
      totalPoints: xpResult.totalPoints,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      newTitle: xpResult.newTitle,
    },
    201
  );
});
