import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { appConfig, quizResults } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";
import { updateStreak } from "../lib/update-streak.js";

let _xpCache: { value: number; ts: number } | null = null;
async function getXpMultiplier(): Promise<number> {
  if (_xpCache && Date.now() - _xpCache.ts < 60_000) return _xpCache.value;
  const [row] = await db.select({ value: appConfig.value }).from(appConfig).where(eq(appConfig.key, "quiz.xp_multiplier")).limit(1);
  const value = parseFloat(row?.value ?? "0.3") || 0.3;
  _xpCache = { value, ts: Date.now() };
  return value;
}

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

  // Award XP based on accuracy × questionCount × configurable multiplier
  const xpMultiplier = await getXpMultiplier();
  const xpEarned = Math.max(1, Math.round((body.accuracy / 100) * body.questionCount * xpMultiplier));
  const [xpResult] = await Promise.all([
    awardXP(userId, xpEarned, "quiz"),
    updateStreak(userId),
  ]);

  await incrementDailyChallenge(userId, "complete_quiz").catch(() => {});

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
