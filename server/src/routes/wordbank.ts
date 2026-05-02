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

  // Track "Word Collector" daily challenge
  incrementDailyChallenge(userId, "save_words").catch(() => {});

  return c.json({ saved: true }, 201);
});

// POST /api/wordbank/:entryId/review - record review outcome and update schedule
wordbankRouter.post("/:entryId/review", async (c) => {
  const userId = c.get("userId");
  const entryId = c.req.param("entryId");
  const body = await c.req.json<{ confidence: "easy" | "hard" | "again" }>();

  if (!["easy", "hard", "again"].includes(body.confidence)) {
    return c.json({ error: "confidence must be 'easy', 'hard', or 'again'" }, 400);
  }

  const [entry] = await db
    .select()
    .from(wordBank)
    .where(and(eq(wordBank.userId, userId), eq(wordBank.dictionaryEntryId, entryId)))
    .limit(1);

  if (!entry) {
    return c.json({ error: "Word not found in bank" }, 404);
  }

  const now = new Date();
  const reviewCount = entry.reviewCount + 1;
  let newConfidence = entry.confidence;
  let nextReviewMs: number;

  if (body.confidence === "easy") {
    newConfidence = Math.min(newConfidence + 1, 5);
    // Interval roughly doubles: 4d, 8d, 16d... capped at 30d
    const days = Math.min(4 * Math.pow(2, newConfidence - 1), 30);
    nextReviewMs = now.getTime() + days * 24 * 60 * 60 * 1000;
  } else if (body.confidence === "hard") {
    newConfidence = Math.max(newConfidence - 1, 0);
    nextReviewMs = now.getTime() + 24 * 60 * 60 * 1000; // 1 day
  } else {
    // again — very soon
    newConfidence = 0;
    nextReviewMs = now.getTime() + 10 * 60 * 1000; // 10 minutes
  }

  const nextReviewAt = new Date(nextReviewMs);

  await db
    .update(wordBank)
    .set({ confidence: newConfidence, reviewCount, lastReviewedAt: now, nextReviewAt })
    .where(and(eq(wordBank.userId, userId), eq(wordBank.dictionaryEntryId, entryId)));

  // Award XP + increment daily challenge (fire-and-forget)
  const xpResult = await awardXP(userId, 5, "word_review").catch(() => null);
  incrementDailyChallenge(userId, "review_words").catch(() => {});

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
