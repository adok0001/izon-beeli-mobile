import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { quizQuestions } from "../db/schema.js";
import { selectQuizQuestions } from "../lib/content-selectors.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";

const QUESTION_TYPES = ["word-to-english", "english-to-word", "fill-in-the-blank", "listening"];

export const quizBankRouter = new Hono();

// GET /api/quiz-bank?languageId= — public, published questions only
quizBankRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }
  return c.json(await selectQuizQuestions(languageId));
});

// ── Educator / Admin write routes ─────────────────────────────────────────────

export const quizBankAdminRouter = new Hono<AuthEnv>();
quizBankAdminRouter.use("*", authMiddleware);
quizBankAdminRouter.use("*", reviewerMiddleware);

// GET /api/quiz-bank/admin?languageId= — all questions (any status) for editing
quizBankAdminRouter.get("/", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }
  const rows = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.languageId, languageId))
    .orderBy(quizQuestions.createdAt);
  return c.json(rows);
});

// POST /api/quiz-bank/admin
quizBankAdminRouter.post("/", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const body = await parseJson<{
    languageId: string;
    type: string;
    prompt: string;
    answer: string;
    options?: string[];
    audioUrl?: string | null;
    explanation?: string | null;
  }>(c);

  const { languageId, type, prompt, answer } = body;
  if (!languageId || !type || !prompt?.trim() || !answer?.trim()) {
    return c.json({ error: "languageId, type, prompt, and answer are required" }, 400);
  }
  if (!QUESTION_TYPES.includes(type)) {
    return c.json({ error: `type must be one of: ${QUESTION_TYPES.join(", ")}` }, 400);
  }
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const [inserted] = await db
    .insert(quizQuestions)
    .values({
      id: `quiz-${randomUUID()}`,
      languageId,
      type,
      prompt: prompt.trim(),
      answer: answer.trim(),
      options: body.options ?? [],
      audioUrl: body.audioUrl ?? null,
      explanation: body.explanation ?? null,
      status: "draft",
      createdBy: c.get("userId"),
    })
    .returning();

  return c.json(inserted, 201);
});

// PATCH /api/quiz-bank/admin/:id
quizBankAdminRouter.patch("/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const id = c.req.param("id");

  const [existing] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const body = await parseJson<Partial<{
    type: string;
    prompt: string;
    answer: string;
    options: string[];
    audioUrl: string | null;
    explanation: string | null;
    status: string;
  }>>(c);

  if (body.type !== undefined && !QUESTION_TYPES.includes(body.type)) {
    return c.json({ error: `type must be one of: ${QUESTION_TYPES.join(", ")}` }, 400);
  }

  // Whitelist columns — going live only happens through the four-eyes endpoint.
  const updates: Record<string, unknown> = { updatedBy: c.get("userId"), updatedAt: new Date() };
  for (const key of ["type", "prompt", "answer", "options", "audioUrl", "explanation"] as const) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (body.status !== undefined && ["draft", "in_review", "archived"].includes(body.status)) {
    updates.status = body.status;
  }

  const [updated] = await db.update(quizQuestions).set(updates).where(eq(quizQuestions.id, id)).returning();
  return c.json(updated);
});

// DELETE /api/quiz-bank/admin/:id
quizBankAdminRouter.delete("/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const id = c.req.param("id");

  const [existing] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
  return c.json({ success: true });
});
