import { count, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { contentPartners, dictionaryEntries } from "../db/schema.js";

export const publicStatsRouter = new Hono();

const LANGUAGE_TARGETS: Record<string, number> = {
  yoruba: 22000,
  efik: 14000,
  hausa: 10000,
  oromo: 5000,
  akan: 5000,
  ndebele: 2000,
};

// Simple in-process cache (5 minutes)
let cache: { data: unknown; expiresAt: number } | null = null;

publicStatsRouter.get("/", async (c) => {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return c.json(cache.data);
  }

  const [totalRow] = await db.select({ count: count() }).from(dictionaryEntries);
  const totalEntries = totalRow?.count ?? 0;

  const byLang = await db
    .select({
      languageId: dictionaryEntries.languageId,
      total: count(),
      withAudio: sql<number>`count(*) filter (where ${dictionaryEntries.audioUrl} is not null)`,
    })
    .from(dictionaryEntries)
    .groupBy(dictionaryEntries.languageId);

  const totalLanguages = byLang.length;

  const [partnerRow] = await db
    .select({ count: count() })
    .from(contentPartners)
    .where(eq(contentPartners.isActive, true));
  const partnerCount = partnerRow?.count ?? 0;

  const entriesByLanguage = byLang.map((row) => {
    const audioCount = Number(row.withAudio);
    return {
      languageId: row.languageId,
      count: row.total,
      audioCount,
      audioPercent: row.total > 0 ? Math.round((audioCount / row.total) * 100) : 0,
    };
  });

  const targetLanguageIds = Object.keys(LANGUAGE_TARGETS);
  const targetLanguages = targetLanguageIds.map((langId) => {
    const found = byLang.find((r) => r.languageId === langId);
    const entryCount = found?.total ?? 0;
    const target = LANGUAGE_TARGETS[langId]!;
    return {
      languageId: langId,
      count: entryCount,
      target,
      percent: Math.min(100, Math.round((entryCount / target) * 100)),
    };
  });

  const data = {
    totalEntries,
    totalLanguages,
    entriesByLanguage,
    partnerCount,
    targetLanguages,
  };

  cache = { data, expiresAt: now + 5 * 60 * 1000 };
  return c.json(data);
});
