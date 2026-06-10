import { and, avg, count, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { appConfig, dictionaryEntries, quizResults, users } from "../db/schema.js";
import { adminMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const quizAdminRouter = new Hono<AuthEnv>();
quizAdminRouter.use("*", authMiddleware, adminMiddleware);

const QUIZ_CONFIG_DEFAULTS: Record<string, string> = {
  "quiz.xp_multiplier": "0.3",
  "quiz.max_question_count": "20",
  "quiz.min_vocabulary_count": "4",
};

// GET /api/quiz/admin/analytics?languageId=
quizAdminRouter.get("/analytics", async (c) => {
  const languageId = c.req.query("languageId");

  const conditions = [];
  if (languageId) conditions.push(eq(quizResults.languageId, languageId));
  const where = conditions.length ? and(...conditions) : undefined;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyConditions = [gte(quizResults.createdAt, thirtyDaysAgo)];
  if (languageId) dailyConditions.push(eq(quizResults.languageId, languageId));

  const [[stats], byLanguage, daily] = await Promise.all([
    db
      .select({
        total: count(),
        avgAccuracy: avg(quizResults.accuracy),
        avgDurationMs: avg(quizResults.durationMs),
        avgQuestions: avg(quizResults.questionCount),
      })
      .from(quizResults)
      .where(where),

    languageId
      ? []
      : db
          .select({
            languageId: quizResults.languageId,
            total: count(),
            avgAccuracy: avg(quizResults.accuracy),
          })
          .from(quizResults)
          .groupBy(quizResults.languageId)
          .orderBy(desc(count())),

    db
      .select({
        date: sql<string>`DATE(${quizResults.createdAt})`.as("date"),
        attempts: count(),
      })
      .from(quizResults)
      .where(and(...dailyConditions))
      .groupBy(sql`DATE(${quizResults.createdAt})`)
      .orderBy(sql`DATE(${quizResults.createdAt})`),
  ]);

  return c.json({ stats, byLanguage, daily });
});

// GET /api/quiz/admin/results?languageId=&page=&limit=
quizAdminRouter.get("/results", async (c) => {
  const languageId = c.req.query("languageId");
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "25", 10)));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (languageId) conditions.push(eq(quizResults.languageId, languageId));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: quizResults.id,
        userId: quizResults.userId,
        userName: users.name,
        userEmail: users.email,
        languageId: quizResults.languageId,
        score: quizResults.score,
        accuracy: quizResults.accuracy,
        durationMs: quizResults.durationMs,
        questionCount: quizResults.questionCount,
        createdAt: quizResults.createdAt,
      })
      .from(quizResults)
      .innerJoin(users, eq(quizResults.userId, users.id))
      .where(where)
      .orderBy(desc(quizResults.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(quizResults).where(where),
  ]);

  return c.json({
    results: rows,
    total: Number(total.value),
    page,
    limit,
    totalPages: Math.ceil(Number(total.value) / limit),
  });
});

// DELETE /api/quiz/admin/results/:id
quizAdminRouter.delete("/results/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(quizResults).where(eq(quizResults.id, id));
  return c.json({ ok: true });
});

// GET /api/quiz/admin/media-coverage — per-language audio/image fill rates
quizAdminRouter.get("/media-coverage", async (c) => {
  const rows = await db
    .select({
      languageId: dictionaryEntries.languageId,
      total: count(),
      withAudio: count(dictionaryEntries.audioUrl),
      withImage: count(dictionaryEntries.imageUrl),
      withExampleAudio: count(dictionaryEntries.exampleAudioUrl),
    })
    .from(dictionaryEntries)
    .groupBy(dictionaryEntries.languageId);

  return c.json(
    rows.map((r) => ({
      languageId: r.languageId,
      total: r.total,
      audio: { count: r.withAudio, pct: r.total > 0 ? Math.round((r.withAudio / r.total) * 100) : 0 },
      image: { count: r.withImage, pct: r.total > 0 ? Math.round((r.withImage / r.total) * 100) : 0 },
      exampleAudio: { count: r.withExampleAudio, pct: r.total > 0 ? Math.round((r.withExampleAudio / r.total) * 100) : 0 },
    }))
  );
});

// GET /api/quiz/admin/config
quizAdminRouter.get("/config", async (c) => {
  const keys = Object.keys(QUIZ_CONFIG_DEFAULTS);
  const rows = await db
    .select({ key: appConfig.key, value: appConfig.value })
    .from(appConfig)
    .where(inArray(appConfig.key, keys));

  const config = { ...QUIZ_CONFIG_DEFAULTS };
  for (const row of rows) config[row.key] = row.value;

  return c.json(config);
});
