import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { proverbs } from "../db/schema.js";
import { selectProverbs } from "../lib/content-selectors.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";

export const proverbsRouter = new Hono();

// GET /api/proverbs?languageId=
proverbsRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  return c.json(await selectProverbs(languageId));
});

// ── Educator / Admin write routes ─────────────────────────────────────────────

export const proverbsAdminRouter = new Hono<AuthEnv>();
proverbsAdminRouter.use("*", authMiddleware);
proverbsAdminRouter.use("*", reviewerMiddleware);

// GET /api/proverbs/admin?languageId= — all proverbs (any status) for editing
proverbsAdminRouter.get("/", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }
  const rows = await db
    .select()
    .from(proverbs)
    .where(eq(proverbs.languageId, languageId))
    .orderBy(proverbs.text);
  return c.json(rows);
});

// POST /api/proverbs/admin
proverbsAdminRouter.post("/", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const body = await c.req.json<{
    languageId: string;
    text: string;
    translation: string;
    translationFr?: string;
    meaning: string;
    meaningFr?: string;
    literal?: string;
    context?: string;
    tags?: string[];
  }>();

  const { languageId, text, translation, meaning } = body;
  if (!languageId || !text || !translation || !meaning) {
    return c.json({ error: "languageId, text, translation, and meaning are required" }, 400);
  }
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const [inserted] = await db
    .insert(proverbs)
    .values({
      id: randomUUID(),
      languageId,
      text,
      translation,
      translationFr: body.translationFr ?? null,
      meaning,
      meaningFr: body.meaningFr ?? null,
      literal: body.literal ?? null,
      context: body.context ?? null,
      tags: body.tags ?? null,
      status: "draft",
      createdBy: c.get("userId"),
    })
    .returning();

  return c.json(inserted, 201);
});

// PATCH /api/proverbs/admin/:id
proverbsAdminRouter.patch("/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const id = c.req.param("id");

  const [existing] = await db.select().from(proverbs).where(eq(proverbs.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const body = await c.req.json<Partial<{
    text: string;
    translation: string;
    translationFr: string | null;
    meaning: string;
    meaningFr: string | null;
    literal: string | null;
    context: string | null;
    tags: string[] | null;
    status: string;
  }>>();

  // Whitelist columns so a PATCH can't stamp publish fields or set
  // status='published' directly — that must go through the four-eyes endpoint.
  const updates: Record<string, unknown> = { updatedBy: c.get("userId") };
  for (const key of ["text", "translation", "translationFr", "meaning", "meaningFr", "literal", "context", "tags"] as const) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (body.status !== undefined && ["draft", "in_review", "archived"].includes(body.status)) {
    updates.status = body.status;
  }

  const [updated] = await db
    .update(proverbs)
    .set(updates)
    .where(eq(proverbs.id, id))
    .returning();

  return c.json(updated);
});

// DELETE /api/proverbs/admin/:id
proverbsAdminRouter.delete("/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const id = c.req.param("id");

  const [existing] = await db.select().from(proverbs).where(eq(proverbs.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  await db.delete(proverbs).where(eq(proverbs.id, id));
  return c.json({ success: true });
});
