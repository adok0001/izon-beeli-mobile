import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { dictionaryEntries } from "../db/schema.js";

export const quizRouter = new Hono();

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/quiz/questions?languageId=&count=
quizRouter.get("/questions", async (c) => {
  const languageId = c.req.query("languageId");
  const rawCount = parseInt(c.req.query("count") ?? "10", 10);
  const count = Math.min(Math.max(Number.isNaN(rawCount) ? 10 : rawCount, 1), 20);

  if (!languageId) {
    return c.json({ error: "languageId is required" }, 400);
  }

  const entries = await db
    .select({ id: dictionaryEntries.id, word: dictionaryEntries.word, english: dictionaryEntries.english })
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId));

  if (entries.length < 4) {
    return c.json({ error: "Not enough vocabulary for this language" }, 400);
  }

  const selected = shuffle(entries).slice(0, count);
  const allEnglish = entries.map((e) => e.english);

  const questions = selected.map((entry) => {
    const distractors = shuffle(allEnglish.filter((e) => e !== entry.english)).slice(0, 3);
    const options = shuffle([entry.english, ...distractors]);
    return {
      id: entry.id,
      type: "word-to-english" as const,
      prompt: entry.word,
      correctAnswer: entry.english,
      options,
    };
  });

  return c.json(questions);
});

// POST /api/quiz/submit
quizRouter.post("/submit", async (c) => {
  const body = await c.req.json<{
    answers: { questionId: string; selectedAnswer: string; correct: boolean }[];
    languageId: string;
  }>();

  const answers = body.answers ?? [];
  const correctCount = answers.filter((a) => a.correct).length;
  const totalQuestions = answers.length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return c.json({
    totalQuestions,
    correctCount,
    accuracy,
    timeElapsed: 0,
    answeredQuestions: answers,
  });
});
