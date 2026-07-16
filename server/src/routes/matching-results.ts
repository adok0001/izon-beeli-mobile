import { Hono } from "hono";
import { parseJson } from "../lib/http.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";
import { updateStreak } from "../lib/update-streak.js";

export const matchingResultsRouter = new Hono<AuthEnv>();

matchingResultsRouter.use("*", authMiddleware);

// POST /api/matching-results - record a completed matching game
matchingResultsRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{
    languageId: string;
    accuracy: number;
    totalPairs: number;
    durationMs: number;
  }>(c);

  const xpEarned = Math.max(1, Math.round((body.accuracy / 100) * body.totalPairs * 0.3));
  const [xpResult, streakResult] = await Promise.all([
    awardXP(userId, xpEarned, "quiz"),
    updateStreak(userId),
    incrementDailyChallenge(userId, "complete_quiz").catch(() => {}),
  ]);

  return c.json(
    {
      xpEarned,
      totalPoints: xpResult.totalPoints,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      streak: streakResult.newStreak,
      streakIncremented: streakResult.streakIncremented,
      streakMilestone: streakResult.streakMilestone ?? null,
      freezeCount: streakResult.freezeCount,
    },
    201
  );
});
