import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { dictionaryEntries, lessons, transcriptSegments } from "../db/schema.js";

export const quizRouter = new Hono();

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Strip only punctuation — preserves all language-specific characters including non-ASCII. */
function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,!?;:'"()\[\]{}«»\u201c\u201d\u2018\u2019\u2026]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a single padded string from transcript segments for whole-word substring matching. */
function buildTranscriptIndex(texts: string[]): string {
  const joined = texts.map((t) => normalizeForMatch(t)).join(" ");
  return " " + joined.replace(/\s+/g, " ").trim() + " ";
}

// GET /api/quiz/questions?languageId=&count=&courseId=&lessonId=
quizRouter.get("/questions", async (c) => {
  const languageId = c.req.query("languageId");
  const courseId = c.req.query("courseId");
  const lessonId = c.req.query("lessonId");
  const rawCount = parseInt(c.req.query("count") ?? "10", 10);
  const count = Math.min(Math.max(Number.isNaN(rawCount) ? 10 : rawCount, 1), 20);

  if (!languageId) {
    return c.json({ error: "languageId is required" }, 400);
  }

  if (courseId && courseId.length > 64) {
    return c.json({ error: "Invalid courseId" }, 400);
  }

  if (lessonId && lessonId.length > 64) {
    return c.json({ error: "Invalid lessonId" }, 400);
  }

  const languageEntries = await db
    .select({ id: dictionaryEntries.id, word: dictionaryEntries.word, english: dictionaryEntries.english })
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId));

  let entries = languageEntries;

  if (lessonId || courseId) {
    let scopedLessonIds: string[] = [];

    if (lessonId) {
      const [lesson] = await db
        .select({ id: lessons.id, courseId: lessons.courseId })
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .limit(1);

      if (!lesson) {
        return c.json({ error: "Lesson not found" }, 404);
      }

      if (courseId && lesson.courseId !== courseId) {
        return c.json({ error: "lessonId does not belong to the provided courseId" }, 400);
      }

      scopedLessonIds = [lesson.id];
    } else if (courseId) {
      const courseLessons = await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.courseId, courseId));
      scopedLessonIds = courseLessons.map((l) => l.id);
    }

    if (scopedLessonIds.length > 0) {
      const scopedSegments = await db
        .select({ text: transcriptSegments.text })
        .from(transcriptSegments)
        .where(inArray(transcriptSegments.lessonId, scopedLessonIds));

      const transcriptIndex = buildTranscriptIndex(scopedSegments.map((segment) => segment.text));

      entries = languageEntries.filter((entry) => {
        const normalized = normalizeForMatch(entry.word);
        return normalized.length > 0 && transcriptIndex.includes(` ${normalized} `);
      });
    } else {
      entries = [];
    }
  }

  if (entries.length < 4) {
    return c.json({ error: "Not enough vocabulary for this quiz scope" }, 400);
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
