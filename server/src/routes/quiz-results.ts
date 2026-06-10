import { eq, and } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { appConfig, quizResults, wordProgress } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";
import { updateStreak } from "../lib/update-streak.js";

const LEITNER_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30]; // index = box (1-5; 0 unused)

async function updateWordProgressLeitner(
  userId: string,
  languageId: string,
  questions: { wordId: string; correct: boolean }[]
): Promise<void> {
  for (const { wordId, correct } of questions) {
    const [existing] = await db
      .select()
      .from(wordProgress)
      .where(and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, wordId)))
      .limit(1);

    if (existing) {
      const newStreak = correct ? Math.min(existing.correctStreak + 1, 5) : 0;
      const newBox = correct
        ? Math.min(existing.box + 1, 5)
        : Math.max(existing.box - 1, 1);
      await db
        .update(wordProgress)
        .set({
          box: newBox,
          correctStreak: newStreak,
          attempts: existing.attempts + 1,
          lastSeenAt: new Date(),
        })
        .where(eq(wordProgress.id, existing.id));
    } else {
      await db.insert(wordProgress).values({
        userId,
        wordId,
        languageId,
        box: correct ? 2 : 1,
        correctStreak: correct ? 1 : 0,
        attempts: 1,
        lastSeenAt: new Date(),
      }).onConflictDoNothing();
    }
  }
}

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
    questions?: { wordId: string; questionType: string; correct: boolean; responseMs?: number }[];
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

  if (body.questions && body.questions.length > 0) {
    await updateWordProgressLeitner(
      userId,
      body.languageId,
      body.questions.map((q) => ({ wordId: q.wordId, correct: q.correct }))
    ).catch(() => {});
  }

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
