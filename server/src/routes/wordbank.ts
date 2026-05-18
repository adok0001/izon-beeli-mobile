import { Hono } from "hono";
import { eq, and, lte, or, isNull, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { wordBank, dictionaryEntries } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";

export const wordbankRouter = new Hono<AuthEnv>();

wordbankRouter.use("*", authMiddleware);

// GET /api/wordbank - list saved word IDs
wordbankRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const rows = await db
    .select({ dictionaryEntryId: wordBank.dictionaryEntryId })
    .from(wordBank)
    .where(eq(wordBank.userId, userId));

  return c.json(rows.map((r) => r.dictionaryEntryId));
});

// GET /api/wordbank/due - list word IDs due for review (nextReviewAt <= now or null)
wordbankRouter.get("/due", async (c) => {
  const userId = c.get("userId");
  const languageId = c.req.query("languageId");
  const now = new Date();

  const rows = await db
    .select({
      dictionaryEntryId: wordBank.dictionaryEntryId,
      confidence: wordBank.confidence,
      reviewCount: wordBank.reviewCount,
      nextReviewAt: wordBank.nextReviewAt,
      languageId: dictionaryEntries.languageId,
    })
    .from(wordBank)
    .innerJoin(dictionaryEntries, eq(wordBank.dictionaryEntryId, dictionaryEntries.id))
    .where(
      and(
        eq(wordBank.userId, userId),
        languageId ? eq(dictionaryEntries.languageId, languageId) : undefined,
        or(isNull(wordBank.nextReviewAt), lte(wordBank.nextReviewAt, now))
      )
    )
    .orderBy(asc(wordBank.nextReviewAt))
    .limit(20);

  return c.json(rows);
});

// POST /api/wordbank - save a word
wordbankRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ dictionaryEntryId: string }>();

  if (!body.dictionaryEntryId) {
    return c.json({ error: "dictionaryEntryId is required" }, 400);
  }

  // Check if already saved
  const [existing] = await db
    .select()
    .from(wordBank)
    .where(
      and(
        eq(wordBank.userId, userId),
        eq(wordBank.dictionaryEntryId, body.dictionaryEntryId)
      )
    )
    .limit(1);

  if (existing) {
    return c.json({ saved: true, alreadyExists: true });
  }

  await db.insert(wordBank).values({
    userId,
    dictionaryEntryId: body.dictionaryEntryId,
  });

  await incrementDailyChallenge(userId, "save_words").catch(() => {});

  return c.json({ saved: true }, 201);
});

const RATING_QUALITY: Record<string, 0 | 2 | 4 | 5> = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};

function applySM2(
  quality: 0 | 2 | 4 | 5,
  repetitions: number,
  easeFactor: number,
  interval: number
): { repetitions: number; easeFactor: number; interval: number } {
  let newReps: number;
  let newInterval: number;
  if (quality >= 3) {
    newReps = repetitions + 1;
    newInterval =
      repetitions === 0 ? 1 : repetitions === 1 ? 6 : Math.round(interval * easeFactor);
  } else {
    newReps = 0;
    newInterval = 1;
  }
  const newEF = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );
  return { repetitions: newReps, easeFactor: newEF, interval: newInterval };
}

// POST /api/wordbank/:entryId/review - record review outcome and update schedule
wordbankRouter.post("/:entryId/review", async (c) => {
  const userId = c.get("userId");
  const entryId = c.req.param("entryId");
  const body = await c.req.json<{ confidence: "again" | "hard" | "good" | "easy" }>();

  if (!Object.keys(RATING_QUALITY).includes(body.confidence)) {
    return c.json({ error: "confidence must be 'again', 'hard', 'good', or 'easy'" }, 400);
  }

  const [entry] = await db
    .select()
    .from(wordBank)
    .where(and(eq(wordBank.userId, userId), eq(wordBank.dictionaryEntryId, entryId)))
    .limit(1);

  if (!entry) {
    return c.json({ error: "Word not found in bank" }, 404);
  }

  const quality = RATING_QUALITY[body.confidence];
  const sm2 = applySM2(quality, entry.reviewCount, entry.easeFactor, entry.interval);

  const now = new Date();
  let nextReviewAt: Date;
  if (body.confidence === "again") {
    // Re-surface in the same session — 10 minutes
    nextReviewAt = new Date(now.getTime() + 10 * 60 * 1000);
  } else {
    nextReviewAt = new Date(now.getTime() + sm2.interval * 24 * 60 * 60 * 1000);
  }

  // Keep confidence as a 0-5 display proxy (clamped to quality range)
  const newConfidence = Math.min(5, Math.max(0, Math.round((sm2.easeFactor - 1.3) / (2.5 - 1.3) * 5)));

  await db
    .update(wordBank)
    .set({
      confidence: newConfidence,
      reviewCount: sm2.repetitions,
      lastReviewedAt: now,
      nextReviewAt,
      easeFactor: sm2.easeFactor,
      interval: sm2.interval,
    })
    .where(and(eq(wordBank.userId, userId), eq(wordBank.dictionaryEntryId, entryId)));

  // Award XP + increment daily challenge (fire-and-forget)
  const xpResult = await awardXP(userId, 5, "word_review").catch(() => null);
  await incrementDailyChallenge(userId, "review_words").catch(() => {});

  return c.json({
    nextReviewAt: nextReviewAt.toISOString(),
    xpEarned: 5,
    totalPoints: xpResult?.totalPoints,
    leveledUp: xpResult?.leveledUp ?? false,
    newLevel: xpResult?.newLevel,
  });
});

// DELETE /api/wordbank/:entryId - remove a saved word
wordbankRouter.delete("/:entryId", async (c) => {
  const userId = c.get("userId");
  const entryId = c.req.param("entryId");

  await db
    .delete(wordBank)
    .where(
      and(
        eq(wordBank.userId, userId),
        eq(wordBank.dictionaryEntryId, entryId)
      )
    );

  return c.json({ removed: true });
});
