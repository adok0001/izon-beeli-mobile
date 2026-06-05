import { Hono } from "hono";
import { db } from "../db/index.js";
import { wordChallengeSubmissions } from "../db/schema.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { updateStreak } from "../lib/update-streak.js";
import { eq, desc, and, gte, count } from "drizzle-orm";

export const wordChallengeRouter = new Hono<AuthEnv>();
export const wordChallengeAdminRouter = new Hono<AuthEnv>();

wordChallengeRouter.use("*", authMiddleware);

// POST /api/word-challenge — submit a sentence for the word of the day
wordChallengeRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    wordId?: string;
    sentence?: string;
    languageId?: string;
  }>().catch(() => ({} as { wordId?: string; sentence?: string; languageId?: string }));

  const wordId = body.wordId?.trim();
  const sentence = body.sentence?.trim();
  const languageId = body.languageId?.trim();
  if (!wordId || !sentence || !languageId) {
    return c.json({ error: "wordId, sentence, and languageId are required" }, 400);
  }

  // One submission per user per word (DB-enforced) — a repeat is a no-op so
  // the same word can't be resubmitted to farm XP/streaks.
  const [row] = await db
    .insert(wordChallengeSubmissions)
    .values({ userId, wordId, sentence, languageId })
    .onConflictDoNothing()
    .returning({ id: wordChallengeSubmissions.id });

  if (!row) {
    return c.json({ alreadySubmitted: true, xpEarned: 0 }, 200);
  }

  const [xpResult] = await Promise.all([
    awardXP(userId, 5, "quiz"),
    updateStreak(userId),
  ]);

  return c.json({ id: row.id, xpEarned: 5, totalPoints: xpResult.totalPoints }, 201);
});

// GET /api/word-challenge?wordId=... — count today's participants
wordChallengeRouter.get("/", async (c) => {
  const wordId = c.req.query("wordId");
  if (!wordId) return c.json({ count: 0 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ value: count() })
    .from(wordChallengeSubmissions)
    .where(
      and(
        eq(wordChallengeSubmissions.wordId, wordId),
        gte(wordChallengeSubmissions.createdAt, startOfDay)
      )
    );

  return c.json({ count: row?.value ?? 0 });
});

// Admin: GET /api/word-challenge/admin/submissions — list all submissions
wordChallengeAdminRouter.use("*", authMiddleware);
wordChallengeAdminRouter.use("*", adminMiddleware);

wordChallengeAdminRouter.get("/submissions", async (c) => {
  const wordId = c.req.query("wordId");
  const rows = await db
    .select()
    .from(wordChallengeSubmissions)
    .where(wordId ? eq(wordChallengeSubmissions.wordId, wordId) : undefined)
    .orderBy(desc(wordChallengeSubmissions.createdAt))
    .limit(100);

  return c.json(rows);
});

// Admin: DELETE /api/word-challenge/admin/submissions/:id
wordChallengeAdminRouter.delete("/submissions/:id", async (c) => {
  const id = c.req.param("id");
  await db
    .delete(wordChallengeSubmissions)
    .where(eq(wordChallengeSubmissions.id, id));
  return c.json({ deleted: true });
});
