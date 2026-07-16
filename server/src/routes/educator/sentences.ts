import { eq } from "drizzle-orm";
import { parseJson } from "../../lib/http.js";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import { sentenceTemplates } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorSentencesRouter = new Hono<AuthEnv>();

// ─── Sentence Templates CRUD ──────────────────────────────────────────────────

// GET /educator/sentences?languageId=
educatorSentencesRouter.get("/sentences", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  const rows = await db
    .select()
    .from(sentenceTemplates)
    .where(eq(sentenceTemplates.languageId, languageId));
  return c.json(rows);
});

// POST /educator/sentences
educatorSentencesRouter.post("/sentences", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const body = await parseJson<{
    id?: string;
    languageId: string;
    sentence: string;
    answer: string;
    englishSentence: string;
    kind?: "blank" | "equivalent";
    literalTranslation?: string;
  }>(c);

  if (!body.languageId || !body.sentence?.trim() || !body.answer?.trim() || !body.englishSentence?.trim()) {
    return c.json({ error: "languageId, sentence, answer, and englishSentence are required" }, 400);
  }
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(body.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }

  const kind = body.kind ?? "blank";
  // Validate: blank templates must have answer as substring of sentence
  if (kind === "blank" && !body.sentence.toLowerCase().includes(body.answer.toLowerCase())) {
    return c.json({
      error: `Answer "${body.answer}" must appear inside the sentence for kind "blank". Use kind "equivalent" for idioms where the answer is not a literal substring.`,
      field: "answer",
    }, 422);
  }

  const id = body.id ?? `s-${body.languageId}-${randomUUID().slice(0, 8)}`;
  const [row] = await db
    .insert(sentenceTemplates)
    .values({
      id,
      languageId: body.languageId,
      sentence: body.sentence.trim(),
      answer: body.answer.trim(),
      englishSentence: body.englishSentence.trim(),
      kind,
      literalTranslation: body.literalTranslation?.trim() || null,
    })
    .onConflictDoUpdate({
      target: sentenceTemplates.id,
      set: {
        sentence: body.sentence.trim(),
        answer: body.answer.trim(),
        englishSentence: body.englishSentence.trim(),
        kind,
        literalTranslation: body.literalTranslation?.trim() || null,
      },
    })
    .returning();

  return c.json(row, 201);
});

// DELETE /educator/sentences/:id
educatorSentencesRouter.delete("/sentences/:id", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const id = c.req.param("id");
  const [existing] = await db
    .select({ languageId: sentenceTemplates.languageId })
    .from(sentenceTemplates)
    .where(eq(sentenceTemplates.id, id))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  await db.delete(sentenceTemplates).where(eq(sentenceTemplates.id, id));
  return c.json({ success: true });
});
