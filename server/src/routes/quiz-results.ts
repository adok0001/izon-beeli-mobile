import { Hono } from "hono";
import { db } from "../db/index.js";
import { quizResults } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

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

  return c.json({ id: row.id }, 201);
});
