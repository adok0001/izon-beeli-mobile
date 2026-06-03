import { and, asc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { appConfig, courses, dictionaryEntries, lessons, proverbs } from "../db/schema.js";
import { adminMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";

// ---- AppConfig key helpers ----

const WOTD_KEY = (lang: string) => `wotd_override_${lang}`;
const POTM_KEY = (lang: string) => `potm_override_${lang}`;
const SOTW_KEY = (lang: string) => `sotw_override_${lang}`;

// ---- Resolver helpers (exported for use in cron) ----

export async function resolveWotd(languageId: string) {
  const [override] = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, WOTD_KEY(languageId)))
    .limit(1);

  if (override?.value) {
    const [entry] = await db
      .select()
      .from(dictionaryEntries)
      .where(and(eq(dictionaryEntries.id, override.value), eq(dictionaryEntries.languageId, languageId)))
      .limit(1);
    if (entry) return { entry, isOverride: true };
  }

  const entries = await db
    .select()
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId))
    .orderBy(asc(dictionaryEntries.id));

  if (entries.length === 0) return null;
  const index = Math.floor(Date.now() / 86_400_000) % entries.length;
  return { entry: entries[index], isOverride: false };
}

export async function resolvePotm(languageId: string) {
  const [override] = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, POTM_KEY(languageId)))
    .limit(1);

  if (override?.value) {
    const [proverb] = await db
      .select()
      .from(proverbs)
      .where(and(eq(proverbs.id, override.value), eq(proverbs.languageId, languageId)))
      .limit(1);
    if (proverb) return { proverb, isOverride: true };
  }

  const all = await db
    .select()
    .from(proverbs)
    .where(eq(proverbs.languageId, languageId))
    .orderBy(asc(proverbs.id));

  if (all.length === 0) return null;
  // months since Unix epoch
  const now = new Date();
  const monthsSinceEpoch = now.getFullYear() * 12 + now.getMonth();
  return { proverb: all[monthsSinceEpoch % all.length], isOverride: false };
}

export async function resolveSotw(languageId: string) {
  const [override] = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, SOTW_KEY(languageId)))
    .limit(1);

  if (override?.value) {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.id, override.value), eq(lessons.type, "song")))
      .limit(1);
    if (lesson) return { lesson, isOverride: true };
  }

  const langCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.languageId, languageId));

  if (langCourses.length === 0) return null;

  const courseIds = langCourses.map((c) => c.id);
  const songs = await db
    .select()
    .from(lessons)
    .where(and(inArray(lessons.courseId, courseIds), eq(lessons.type, "song"), eq(lessons.isActive, true)))
    .orderBy(asc(lessons.id));

  if (songs.length === 0) return null;
  const weeksSinceEpoch = Math.floor(Date.now() / (86_400_000 * 7));
  return { lesson: songs[weeksSinceEpoch % songs.length], isOverride: false };
}

// ---- Public router ----

export const dailyContentRouter = new Hono();

dailyContentRouter.get("/wotd", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  const result = await resolveWotd(languageId);
  return c.json(result ?? { entry: null, isOverride: false });
});

dailyContentRouter.get("/potm", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  const result = await resolvePotm(languageId);
  return c.json(result ?? { proverb: null, isOverride: false });
});

dailyContentRouter.get("/sotw", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  const result = await resolveSotw(languageId);
  return c.json(result ?? { lesson: null, isOverride: false });
});

// ---- Admin router ----

export const dailyContentAdminRouter = new Hono<AuthEnv>();
dailyContentAdminRouter.use("*", authMiddleware, adminMiddleware);

// Word of the Day
dailyContentAdminRouter.get("/wotd", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  const [row] = await db.select({ value: appConfig.value }).from(appConfig).where(eq(appConfig.key, WOTD_KEY(languageId))).limit(1);
  const result = await resolveWotd(languageId);
  return c.json({ overrideId: row?.value ?? null, entry: result?.entry ?? null, isOverride: result?.isOverride ?? false });
});

dailyContentAdminRouter.put("/wotd", async (c) => {
  const { languageId, entryId } = await c.req.json<{ languageId: string; entryId: string }>();
  if (!languageId || !entryId) return c.json({ error: "languageId and entryId required" }, 400);
  const [entry] = await db.select({ id: dictionaryEntries.id }).from(dictionaryEntries).where(and(eq(dictionaryEntries.id, entryId), eq(dictionaryEntries.languageId, languageId))).limit(1);
  if (!entry) return c.json({ error: "Entry not found for this language" }, 404);
  await db.insert(appConfig).values({ key: WOTD_KEY(languageId), value: entryId }).onConflictDoUpdate({ target: appConfig.key, set: { value: entryId } });
  return c.json({ ok: true });
});

dailyContentAdminRouter.delete("/wotd", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  await db.delete(appConfig).where(eq(appConfig.key, WOTD_KEY(languageId)));
  return c.json({ ok: true });
});

// Proverb of the Month
dailyContentAdminRouter.get("/potm", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  const [row] = await db.select({ value: appConfig.value }).from(appConfig).where(eq(appConfig.key, POTM_KEY(languageId))).limit(1);
  const result = await resolvePotm(languageId);
  return c.json({ overrideId: row?.value ?? null, proverb: result?.proverb ?? null, isOverride: result?.isOverride ?? false });
});

dailyContentAdminRouter.put("/potm", async (c) => {
  const { languageId, proverbId } = await c.req.json<{ languageId: string; proverbId: string }>();
  if (!languageId || !proverbId) return c.json({ error: "languageId and proverbId required" }, 400);
  const [proverb] = await db.select({ id: proverbs.id }).from(proverbs).where(and(eq(proverbs.id, proverbId), eq(proverbs.languageId, languageId))).limit(1);
  if (!proverb) return c.json({ error: "Proverb not found for this language" }, 404);
  await db.insert(appConfig).values({ key: POTM_KEY(languageId), value: proverbId }).onConflictDoUpdate({ target: appConfig.key, set: { value: proverbId } });
  return c.json({ ok: true });
});

dailyContentAdminRouter.delete("/potm", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  await db.delete(appConfig).where(eq(appConfig.key, POTM_KEY(languageId)));
  return c.json({ ok: true });
});

// Song of the Week
dailyContentAdminRouter.get("/sotw", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  const [row] = await db.select({ value: appConfig.value }).from(appConfig).where(eq(appConfig.key, SOTW_KEY(languageId))).limit(1);
  const result = await resolveSotw(languageId);
  return c.json({ overrideId: row?.value ?? null, lesson: result?.lesson ?? null, isOverride: result?.isOverride ?? false });
});

dailyContentAdminRouter.put("/sotw", async (c) => {
  const { languageId, lessonId } = await c.req.json<{ languageId: string; lessonId: string }>();
  if (!languageId || !lessonId) return c.json({ error: "languageId and lessonId required" }, 400);
  const [lesson] = await db.select({ id: lessons.id }).from(lessons).where(and(eq(lessons.id, lessonId), eq(lessons.type, "song"))).limit(1);
  if (!lesson) return c.json({ error: "Song not found" }, 404);
  await db.insert(appConfig).values({ key: SOTW_KEY(languageId), value: lessonId }).onConflictDoUpdate({ target: appConfig.key, set: { value: lessonId } });
  return c.json({ ok: true });
});

dailyContentAdminRouter.delete("/sotw", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  await db.delete(appConfig).where(eq(appConfig.key, SOTW_KEY(languageId)));
  return c.json({ ok: true });
});
