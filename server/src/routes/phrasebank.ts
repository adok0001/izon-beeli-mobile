import { and, asc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { courses, lessons, phraseBank, transcriptSegments, wordBank, dictionaryEntries } from "../db/schema.js";
import { applySM2, nextReviewDate, RATING_QUALITY, type Rating } from "../lib/sm2.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { awardXP } from "../lib/award-xp.js";
import { incrementDailyChallenge } from "../lib/daily-challenge.js";
import { updateStreak } from "../lib/update-streak.js";

/**
 * Sentence-level SRS + the review-session composer.
 *
 * The review unit is a whole transcript line in context — never a word↔gloss
 * pair. Lines enter the bank two ways: a learner bookmarks one (source
 * "bookmark"), or finishing a lesson auto-banks its lines (source
 * "completion"). Rows snapshot text/translation because segments are replaced
 * wholesale on lesson save.
 *
 * The composer (`GET /session`) MANUFACTURES interleaving: SM-2 alone clusters
 * same-age items, so the session is deliberately diversified — capped per
 * lesson, phrases and words mixed, exercise modes rotated.
 */
export const phrasebankRouter = new Hono<AuthEnv>();

phrasebankRouter.use("*", authMiddleware);

// POST /api/phrasebank — bookmark one line
phrasebankRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{ languageId: string; lessonId: string; text: string; translation?: string | null }>(c);
  if (!body.languageId?.trim() || !body.lessonId?.trim() || !body.text?.trim()) {
    return c.json({ error: "languageId, lessonId, and text are required" }, 400);
  }
  await db
    .insert(phraseBank)
    .values({
      userId,
      languageId: body.languageId.trim(),
      lessonId: body.lessonId.trim(),
      text: body.text.trim(),
      translation: body.translation?.trim() || null,
      source: "bookmark",
    })
    .onConflictDoNothing();
  return c.json({ saved: true }, 201);
});

// POST /api/phrasebank/bank-lesson — auto-bank a completed lesson's lines
phrasebankRouter.post("/bank-lesson", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{ lessonId: string }>(c);
  if (!body.lessonId?.trim()) return c.json({ error: "lessonId is required" }, 400);

  const [lesson] = await db
    .select({ id: lessons.id, languageId: courses.languageId })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, body.lessonId.trim()))
    .limit(1);
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);

  const segs = await db
    .select({ text: transcriptSegments.text, translation: transcriptSegments.translation })
    .from(transcriptSegments)
    .where(eq(transcriptSegments.lessonId, lesson.id))
    .orderBy(asc(transcriptSegments.order));

  // Placeholders and stage directions are not language; skip them.
  const lines = segs.filter((s) => s.text.trim() && !s.text.includes("[["));
  if (lines.length === 0) return c.json({ banked: 0 });

  await db
    .insert(phraseBank)
    .values(
      lines.map((s) => ({
        userId,
        languageId: lesson.languageId,
        lessonId: lesson.id,
        text: s.text.trim(),
        translation: s.translation?.trim() || null,
        source: "completion",
      }))
    )
    .onConflictDoNothing(); // bookmarked lines keep their bookmark row + schedule

  return c.json({ banked: lines.length });
});

// POST /api/phrasebank/:id/review — record outcome, advance the SM-2 schedule
phrasebankRouter.post("/:id/review", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await parseJson<{ confidence: Rating }>(c);
  if (!Object.keys(RATING_QUALITY).includes(body.confidence)) {
    return c.json({ error: "confidence must be 'again', 'hard', 'good', or 'easy'" }, 400);
  }

  const [entry] = await db
    .select()
    .from(phraseBank)
    .where(and(eq(phraseBank.id, id), eq(phraseBank.userId, userId)))
    .limit(1);
  if (!entry) return c.json({ error: "Phrase not found in bank" }, 404);

  const sm2 = applySM2(RATING_QUALITY[body.confidence], entry.reviewCount, entry.easeFactor, entry.interval);
  const now = new Date();
  const nextReviewAt = nextReviewDate(body.confidence, sm2.interval, now);

  await db
    .update(phraseBank)
    .set({
      reviewCount: sm2.repetitions,
      lastReviewedAt: now,
      nextReviewAt,
      easeFactor: sm2.easeFactor,
      interval: sm2.interval,
    })
    .where(eq(phraseBank.id, id));

  const [xpResult] = await Promise.all([
    awardXP(userId, 5, "word_review").catch(() => null), // same XP source as word reviews
    updateStreak(userId).catch(() => null),
    incrementDailyChallenge(userId, "review_words").catch(() => {}),
  ]);

  return c.json({
    nextReviewAt: nextReviewAt.toISOString(),
    xpEarned: 5,
    totalPoints: xpResult?.totalPoints,
    leveledUp: xpResult?.leveledUp ?? false,
    newLevel: xpResult?.newLevel,
  });
});

// DELETE /api/phrasebank/:id — remove a saved line
phrasebankRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  await db.delete(phraseBank).where(and(eq(phraseBank.id, id), eq(phraseBank.userId, userId)));
  return c.json({ deleted: true });
});

// ── The review-session composer ──────────────────────────────────────────────

const MODES = ["recall", "cloze", "reorder"] as const;
const MAX_PER_LESSON = 3;

export type SessionItem =
  | { kind: "phrase"; mode: (typeof MODES)[number]; id: string; lessonId: string; text: string; translation: string | null }
  | { kind: "word"; id: string; word: string; english: string };

/**
 * GET /api/phrasebank/session?languageId=&count=
 *
 * Composes one interleaved review session:
 *  - due phrases first (nextReviewAt <= now or never reviewed), capped at
 *    MAX_PER_LESSON per lesson so one lesson can't flood the session;
 *  - due words from the word bank fill the remainder;
 *  - exercise modes rotate per phrase (recall → cloze → reorder), with
 *    single-word lines pinned to recall (nothing to blank or reorder);
 *  - final order interleaves the two kinds rather than blocking them.
 */
phrasebankRouter.get("/session", async (c) => {
  const userId = c.get("userId");
  const languageId = c.req.query("languageId");
  const count = Math.min(Math.max(parseInt(c.req.query("count") ?? "12", 10) || 12, 1), 30);
  if (!languageId) return c.json({ error: "languageId is required" }, 400);

  const now = new Date();

  const duePhrases = await db
    .select()
    .from(phraseBank)
    .where(
      and(
        eq(phraseBank.userId, userId),
        eq(phraseBank.languageId, languageId),
        or(isNull(phraseBank.nextReviewAt), lte(phraseBank.nextReviewAt, now))
      )
    )
    .orderBy(asc(phraseBank.nextReviewAt))
    .limit(count * 4); // headroom for the per-lesson cap

  // Diversity constraint 1: cap per lesson.
  const perLesson = new Map<string, number>();
  const pickedPhrases: typeof duePhrases = [];
  for (const p of duePhrases) {
    const n = perLesson.get(p.lessonId) ?? 0;
    if (n >= MAX_PER_LESSON) continue;
    perLesson.set(p.lessonId, n + 1);
    pickedPhrases.push(p);
    if (pickedPhrases.length >= count) break;
  }

  // Fill the remainder with due words (the existing word bank).
  const wordSlots = Math.max(0, count - pickedPhrases.length);
  let words: { id: string; word: string; english: string }[] = [];
  if (wordSlots > 0) {
    const dueWords = await db
      .select({ dictionaryEntryId: wordBank.dictionaryEntryId })
      .from(wordBank)
      .where(and(eq(wordBank.userId, userId), or(isNull(wordBank.nextReviewAt), lte(wordBank.nextReviewAt, now))))
      .orderBy(asc(wordBank.nextReviewAt))
      .limit(wordSlots * 2);
    if (dueWords.length > 0) {
      const ids = dueWords.map((w) => w.dictionaryEntryId);
      const entries = await db
        .select({ id: dictionaryEntries.id, word: dictionaryEntries.word, english: dictionaryEntries.english })
        .from(dictionaryEntries)
        .where(
          and(
            inArray(dictionaryEntries.id, ids),
            eq(dictionaryEntries.languageId, languageId),
            eq(dictionaryEntries.isActive, true)
          )
        )
        .limit(wordSlots);
      words = entries;
    }
  }

  // Diversity constraint 2: rotate exercise modes; single-word lines → recall.
  const phraseItems: SessionItem[] = pickedPhrases.map((p, i) => ({
    kind: "phrase",
    mode: p.text.trim().split(/\s+/).length < 2 ? "recall" : MODES[i % MODES.length],
    id: p.id,
    lessonId: p.lessonId,
    text: p.text,
    translation: p.translation,
  }));
  const wordItems: SessionItem[] = words.map((w) => ({ kind: "word", id: w.id, word: w.word, english: w.english }));

  // Diversity constraint 3: interleave kinds instead of blocking them.
  const session: SessionItem[] = [];
  const a = [...phraseItems];
  const b = [...wordItems];
  while (a.length || b.length) {
    if (a.length) session.push(a.shift()!);
    if (b.length) session.push(b.shift()!);
    if (a.length) session.push(a.shift()!);
  }

  const [{ n: totalDuePhrases }] = (await db
    .select({ n: sql<number>`count(*)::int` })
    .from(phraseBank)
    .where(
      and(
        eq(phraseBank.userId, userId),
        eq(phraseBank.languageId, languageId),
        or(isNull(phraseBank.nextReviewAt), lte(phraseBank.nextReviewAt, now))
      )
    )) as { n: number }[];

  return c.json({ items: session.slice(0, count), totalDuePhrases });
});
