import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { checkpointCompletions } from "../db/schema.js";
import { parseJson } from "../lib/http.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";
import { updateStreak } from "../lib/update-streak.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const checkpointsRouter = new Hono<AuthEnv>();

checkpointsRouter.use("*", authMiddleware);

/** XP for clearing a gate — a checkpoint spans five lessons, so it pays more
 *  than a single practice round but stays below a lesson completion. */
const CHECKPOINT_XP = 25;

/** A warm-up is a minute of exposure, not a test — it pays a token amount. */
const INTRO_XP = 5;

// GET /api/checkpoints?languageId= — the ids the learner has cleared.
// Drives every gate in the client, so it must stay cheap: ids only.
checkpointsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const languageId = c.req.query("languageId");

  if (!languageId) return c.json({ error: "languageId is required" }, 400);

  const rows = await db
    .select({ checkpointId: checkpointCompletions.checkpointId })
    .from(checkpointCompletions)
    .where(
      and(
        eq(checkpointCompletions.userId, userId),
        eq(checkpointCompletions.languageId, languageId)
      )
    );

  return c.json({ passed: rows.map((r) => r.checkpointId) });
});

// POST /api/checkpoints — record a cleared checkpoint.
// Only passing rounds are posted; the client gates on the same ratio, and the
// server re-derives it so a tampered client can't unlock the path with a miss.
checkpointsRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{
    checkpointId: string;
    languageId: string;
    correct: number;
    total: number;
    attempts?: number;
    waived?: boolean;
  }>(c);

  const { checkpointId, languageId } = body;
  const waived = body.waived === true;
  const correct = waived ? 0 : Math.max(0, Math.trunc(body.correct ?? 0));
  const total = waived ? 0 : Math.max(0, Math.trunc(body.total ?? 0));
  const xpFor = (intro: boolean) => (intro ? INTRO_XP : CHECKPOINT_XP);
  const attempts = Math.max(1, Math.trunc(body.attempts ?? 1));

  if (!checkpointId || !languageId) {
    return c.json({ error: "checkpointId and languageId are required" }, 400);
  }
  // Intros are exposure, not assessment — they preview a course's vocabulary
  // before it's taught, so there's no score to clear. Derived from the id shape
  // (`intro-<courseId>`, minted by mobile/lib/checkpoints.ts) rather than a
  // client-supplied flag, so a caller can't opt a *scored* checkpoint out of
  // its threshold just by asking.
  const isIntro = checkpointId.startsWith("intro-");

  // A waiver is the other case with no round to score: the covered lessons had
  // too little vocabulary to build questions from. Both open the path but earn
  // nothing, so neither can be used to farm XP.
  if (!waived && !isIntro) {
    if (total <= 0 || correct > total) {
      return c.json({ error: "correct and total must describe a real round" }, 400);
    }
    // Mirrors CHECKPOINT_PASS_RATIO in mobile/lib/checkpoints.ts.
    if (correct / total < 0.7) {
      return c.json({ error: "score does not clear the checkpoint" }, 422);
    }
  }

  // A retry of an already-cleared checkpoint updates the row rather than
  // inserting a duplicate — and must not pay XP twice.
  const [existing] = await db
    .select({ id: checkpointCompletions.id })
    .from(checkpointCompletions)
    .where(
      and(
        eq(checkpointCompletions.userId, userId),
        eq(checkpointCompletions.checkpointId, checkpointId)
      )
    )
    .limit(1);

  await db
    .insert(checkpointCompletions)
    .values({ userId, checkpointId, languageId, correct, total, attempts, waived })
    .onConflictDoUpdate({
      target: [checkpointCompletions.userId, checkpointCompletions.checkpointId],
      set: {
        correct,
        total,
        waived,
        attempts: sql`${checkpointCompletions.attempts} + 1`,
        completedAt: new Date(),
      },
    });

  // A repeat clear, or a waiver, opens the path without paying out again.
  if (existing || waived) {
    return c.json({ passed: true, alreadyPassed: !!existing, xpEarned: 0 });
  }

  const [xpResult, streakResult] = await Promise.all([
    awardXP(userId, xpFor(isIntro), "quiz"),
    updateStreak(userId),
  ]);

  // Sequenced after the base award so the reported total includes any challenge reward.
  const challenge = await incrementDailyChallenge(userId, "complete_quiz").catch(() => null);
  const finalXp = challenge?.award ?? xpResult;

  return c.json(
    {
      passed: true,
      alreadyPassed: false,
      xpEarned: xpFor(isIntro) + (challenge?.xpAwarded ?? 0),
      totalPoints: finalXp.totalPoints,
      leveledUp: xpResult.leveledUp || finalXp.leveledUp,
      newLevel: finalXp.newLevel,
      newTitle: finalXp.newTitle,
      streak: streakResult.newStreak,
      streakIncremented: streakResult.streakIncremented,
      streakMilestone: streakResult.streakMilestone ?? null,
      freezeCount: streakResult.freezeCount,
    },
    201
  );
});
