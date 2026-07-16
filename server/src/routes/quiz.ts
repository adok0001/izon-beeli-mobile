import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { appConfig, dictionaryEntries, lessons, quizQuestions, transcriptSegments } from "../db/schema.js";

export const quizRouter = new Hono();

// 60-second in-memory cache for appConfig values
const _configCache = new Map<string, { value: string; ts: number }>();
async function getConfigValue(key: string, fallback: string): Promise<string> {
  const cached = _configCache.get(key);
  if (cached && Date.now() - cached.ts < 60_000) return cached.value;
  const [row] = await db.select({ value: appConfig.value }).from(appConfig).where(eq(appConfig.key, key)).limit(1);
  const value = row?.value ?? fallback;
  _configCache.set(key, { value, ts: Date.now() });
  return value;
}

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

function pickDistractors(correct: string, pool: string[], n: number): string[] {
  const correctNorm = correct.toLowerCase().trim();
  const correctTokens = new Set(correctNorm.split(/\s+/).filter((t) => t.length > 2));
  function hasOverlap(s: string) {
    if (correctTokens.size === 0) return false;
    return s.toLowerCase().trim().split(/\s+/).some((t) => t.length > 2 && correctTokens.has(t));
  }
  const seen = new Set<string>([correctNorm]);
  const result: string[] = [];
  for (const s of shuffle(pool)) {
    if (result.length >= n) break;
    const norm = s.toLowerCase().trim();
    if (!seen.has(norm) && !hasOverlap(s)) { seen.add(norm); result.push(s); }
  }
  if (result.length < n) {
    for (const s of shuffle(pool)) {
      if (result.length >= n) break;
      const norm = s.toLowerCase().trim();
      if (!seen.has(norm)) { seen.add(norm); result.push(s); }
    }
  }
  return result;
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
  const [maxCountStr, minVocabStr] = await Promise.all([
    getConfigValue("quiz.max_question_count", "20"),
    getConfigValue("quiz.min_vocabulary_count", "4"),
  ]);
  const maxCount = Math.max(1, parseInt(maxCountStr, 10) || 20);
  // Distractor generation requires at least 4 entries (1 correct + 3 distractors); enforce floor.
  const minVocab = Math.max(4, parseInt(minVocabStr, 10) || 4);
  const count = Math.min(Math.max(Number.isNaN(rawCount) ? 10 : rawCount, 1), maxCount);

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
    .where(and(eq(dictionaryEntries.languageId, languageId), eq(dictionaryEntries.isActive, true)));

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

  // Authored questions first: retrieval practice should test what an educator
  // wrote for THIS lesson; transcript-matched generation only tops up the rest.
  let authored: { id: string; type: string; prompt: string; correctAnswer: string; options: string[]; audioUrl: string | null; explanation: string | null }[] = [];
  if (lessonId) {
    const rows = await db
      .select()
      .from(quizQuestions)
      .where(
        and(
          eq(quizQuestions.lessonId, lessonId),
          eq(quizQuestions.status, "published"),
          eq(quizQuestions.isActive, true)
        )
      );
    authored = shuffle(rows).slice(0, count).map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      correctAnswer: q.answer,
      options: q.options,
      audioUrl: q.audioUrl,
      explanation: q.explanation,
    }));
  }

  const remaining = count - authored.length;
  if (remaining <= 0) return c.json(authored);

  if (entries.length < minVocab) {
    // A fully/partly authored lesson quiz is still a quiz — only 400 when
    // there's nothing at all to serve.
    if (authored.length > 0) return c.json(authored);
    return c.json({ error: "Not enough vocabulary for this quiz scope" }, 400);
  }

  const selected = shuffle(entries).slice(0, remaining);
  const allEnglish = entries.map((e) => e.english);

  const generated = selected.map((entry) => {
    const distractors = pickDistractors(entry.english, allEnglish, 3);
    const options = shuffle([entry.english, ...distractors]);
    return {
      id: entry.id,
      type: "word-to-english" as const,
      prompt: entry.word,
      correctAnswer: entry.english,
      options,
    };
  });

  return c.json([...authored, ...generated]);
});

// POST /api/quiz/submit
quizRouter.post("/submit", async (c) => {
  const body = await parseJson<{
    answers: { questionId: string; selectedAnswer: string; correct: boolean }[];
    languageId: string;
  }>(c);

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
