import { and, asc, eq, ilike, or } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { dictionaryEntries, englishWordbank } from "../db/schema.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

export const englishWordbankRouter = new Hono();

// GET /api/english-wordbank?search=&category=&limit=
// Returns English wordbank entries with Ịzọn (and future language) translations
englishWordbankRouter.get("/", async (c) => {
  const search = c.req.query("search")?.trim();
  const category = c.req.query("category");
  const limitParam = c.req.query("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 100, 500) : 100;

  const conditions = [
    search
      ? or(
          ilike(englishWordbank.word, `%${search}%`),
        )
      : undefined,
    category ? eq(englishWordbank.category, category) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const entries = await db
    .select()
    .from(englishWordbank)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(englishWordbank.word))
    .limit(limit);

  if (entries.length === 0) return c.json([]);

  const entryIds = entries.map((e) => e.id);

  // Fetch all dictionary translations linked to these wordbank entries
  const translations = await db
    .select({
      englishWordId: dictionaryEntries.englishWordId,
      languageId: dictionaryEntries.languageId,
      word: dictionaryEntries.word,
      pronunciation: dictionaryEntries.pronunciation,
      audioUrl: dictionaryEntries.audioUrl,
    })
    .from(dictionaryEntries)
    .where(
      or(
        ...entryIds.map((id) => eq(dictionaryEntries.englishWordId, id))
      )
    );

  // Group translations by englishWordId
  const byWordId = new Map<string, typeof translations>();
  for (const t of translations) {
    if (!t.englishWordId) continue;
    if (!byWordId.has(t.englishWordId)) byWordId.set(t.englishWordId, []);
    byWordId.get(t.englishWordId)!.push(t);
  }

  const result = entries.map((entry) => {
    const trans = byWordId.get(entry.id) ?? [];
    const byLang: Record<string, { word: string; pronunciation?: string | null; audioUrl?: string | null }[]> = {};
    for (const t of trans) {
      if (!byLang[t.languageId]) byLang[t.languageId] = [];
      byLang[t.languageId].push({ word: t.word, pronunciation: t.pronunciation, audioUrl: t.audioUrl });
    }
    return { ...entry, translations: byLang };
  });

  return c.json(result);
});

// ── Admin write routes ────────────────────────────────────────────────────────
// The English wordbank is a reference table (the target words that language
// entries translate), so it carries no editorial workflow — just admin CRUD.

export const englishWordbankAdminRouter = new Hono();
englishWordbankAdminRouter.use("*", authMiddleware, adminMiddleware);

// POST /api/english-wordbank/admin — create a word
englishWordbankAdminRouter.post("/", async (c) => {
  const body = await c.req.json<{
    id: string;
    word: string;
    definition?: string | null;
    category: string;
    posType?: string | null;
  }>();

  const id = body.id?.trim();
  if (!id || !body.word?.trim() || !body.category?.trim()) {
    return c.json({ error: "id, word, and category are required" }, 400);
  }

  const [existing] = await db.select({ id: englishWordbank.id }).from(englishWordbank).where(eq(englishWordbank.id, id)).limit(1);
  if (existing) return c.json({ error: "A wordbank entry with this id already exists" }, 409);

  const [created] = await db
    .insert(englishWordbank)
    .values({
      id,
      word: body.word.trim(),
      definition: body.definition ?? null,
      category: body.category.trim(),
      posType: body.posType ?? null,
    })
    .returning();

  return c.json(created, 201);
});

// PATCH /api/english-wordbank/admin/:id
englishWordbankAdminRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select().from(englishWordbank).where(eq(englishWordbank.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const body = await c.req.json<Partial<{ word: string; definition: string | null; category: string; posType: string | null }>>();
  const updates: Record<string, unknown> = {};
  if (body.word !== undefined) updates.word = body.word.trim();
  if (body.category !== undefined) updates.category = body.category.trim();
  if (body.definition !== undefined) updates.definition = body.definition;
  if (body.posType !== undefined) updates.posType = body.posType;
  if (Object.keys(updates).length === 0) return c.json(existing);

  const [updated] = await db.update(englishWordbank).set(updates).where(eq(englishWordbank.id, id)).returning();
  return c.json(updated);
});

// DELETE /api/english-wordbank/admin/:id
englishWordbankAdminRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select({ id: englishWordbank.id }).from(englishWordbank).where(eq(englishWordbank.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(englishWordbank).where(eq(englishWordbank.id, id));
  return c.json({ success: true });
});
