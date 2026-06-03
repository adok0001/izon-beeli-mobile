import { and, asc, eq, ilike, or } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { dictionaryEntries, englishWordbank } from "../db/schema.js";

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
