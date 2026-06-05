import { Hono } from "hono";
import { db } from "../db/index.js";
import { wordChallengeSubmissions } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { updateStreak } from "../lib/update-streak.js";
import { eq, desc } from "drizzle-orm";

export const wordChallengeRouter = new Hono<AuthEnv>();
export const wordChallengeAdminRouter = new Hono<AuthEnv>();

wordChallengeRouter.use("*", authMiddleware);

// POST /api/word-challenge — submit a sentence for the word of the day
wordChallengeRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    wordId: string;
    sentence: string;
    languageId: string;
  }>();

  const [row] = await db
    .insert(wordChallengeSubmissions)
    .values({
      userId,
      wordId: body.wordId,
      sentence: body.sentence.trim(),
      languageId: body.languageId,
    })
    .returning({ id: wordChallengeSubmissions.id });

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

  const rows = await db
    .select({ id: wordChallengeSubmissions.id })
    .from(wordChallengeSubmissions)
    .where(eq(wordChallengeSubmissions.wordId, wordId));

  return c.json({ count: rows.length });
});

// Admin: GET /api/word-challenge/admin/submissions — list all submissions
wordChallengeAdminRouter.use("*", authMiddleware);

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
