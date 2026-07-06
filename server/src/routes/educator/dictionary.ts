import { put } from "@vercel/blob";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import {
  contributions,
  courses,
  dictionaryEntries,
  englishWordbank,
  lessons,
  transcriptSegments,
} from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";
import { computeCoverage } from "../../lib/dictionary-coverage.js";
import { withTranslations } from "../../lib/dictionary-translations.js";
import { LexicalParseError, parseLexicalExtras } from "../../lib/lexical-extras.js";
import { recordMediaAsset } from "../upload.js";
import { VALID_CATEGORIES, flatToMap, parseMap } from "./_shared.js";

export const educatorDictionaryRouter = new Hono<AuthEnv>();

// GET /educator/dictionary
educatorDictionaryRouter.get("/dictionary", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const langQuery = c.req.query("languageId");
  const categoryQuery = c.req.query("category");

  // Language scope: admins can query any or all; reviewers limited to their list
  const effectiveLangs: string[] =
    isAdmin
      ? langQuery ? [langQuery] : []
      : langQuery && reviewerLanguages.includes(langQuery)
        ? [langQuery]
        : reviewerLanguages;

  const rows = await db
    .select()
    .from(dictionaryEntries)
    .where(
      and(
        effectiveLangs.length > 0 ? inArray(dictionaryEntries.languageId, effectiveLangs) : undefined,
        categoryQuery ? eq(dictionaryEntries.category, categoryQuery) : undefined,
      )
    )
    .orderBy(dictionaryEntries.word);

  // Also include approved word/phrase contributions (mirrors admin dictionary)
  const contribRows = await db
    .select({
      id: contributions.id,
      languageId: contributions.languageId,
      word: contributions.word,
      english: contributions.english,
      category: contributions.category,
      pronunciation: contributions.pronunciation,
      example: contributions.example,
      exampleTranslation: contributions.exampleTranslation,
      audioUrl: contributions.audioUrl,
      imageUrl: contributions.imageUrl,
    })
    .from(contributions)
    .where(
      and(
        eq(contributions.status, "approved"),
        effectiveLangs.length > 0 ? inArray(contributions.languageId, effectiveLangs) : undefined,
        notInArray(contributions.type, ["entry_audio", "entry_image", "entry_meaning"]),
        categoryQuery ? eq(contributions.category, categoryQuery) : undefined,
      )
    )
    .orderBy(contributions.word);

  const mapped = contribRows.map((r) => ({
    ...r,
    french: null,
    exampleTranslationFr: null,
    translations: { en: r.english },
    exampleTranslations: r.exampleTranslation ? { en: r.exampleTranslation } : null,
    _source: "contribution" as const,
  }));

  return c.json([...rows.map(withTranslations), ...mapped]);
});

// POST /educator/dictionary
educatorDictionaryRouter.post("/dictionary", async (c) => {
  const userId = c.get("userId");
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const contentType = c.req.header("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  let fields: Record<string, string>;
  let audioFile: File | null = null;
  let imageFile: File | null = null;

  if (isMultipart) {
    const formData = await c.req.formData();
    fields = Object.fromEntries(
      [...formData.entries()]
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => [k, v as string])
    );
    audioFile = formData.get("audio") as File | null;
    imageFile = formData.get("image") as File | null;
  } else {
    fields = await c.req.json<Record<string, string>>();
  }

  const { languageId, word, category } = fields;

  // Prefer the full translations map; fall back to legacy flat english/french.
  const translations = parseMap((fields as Record<string, unknown>).translations)
    ?? flatToMap(fields.english, fields.french);
  const exampleTranslations = parseMap((fields as Record<string, unknown>).exampleTranslations)
    ?? flatToMap(fields.exampleTranslation, fields.exampleTranslationFr);
  const english = translations?.en;

  if (!languageId?.trim() || !word?.trim() || !english?.trim()) {
    return c.json({ error: "languageId, word, and english are required" }, 400);
  }
  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return c.json({ error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` }, 400);
  }
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  let audioUrl = fields.audioUrl?.trim() || null;
  let imageUrl = fields.imageUrl?.trim() || null;
  let exampleAudioUrl = fields.exampleAudioUrl?.trim() || null;

  if (audioFile?.size) {
    const blob = await put(`educator/audio/${languageId}/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    audioUrl = blob.url;
    await recordMediaAsset("audio", audioFile, blob, userId);
  }
  if (imageFile?.size) {
    const blob = await put(`educator/images/${languageId}/${Date.now()}-${imageFile.name}`, imageFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    imageUrl = blob.url;
    await recordMediaAsset("image", imageFile, blob, userId);
  }
  const exampleAudioFile = isMultipart ? (await c.req.formData()).get("exampleAudio") as File | null : null;
  if (exampleAudioFile?.size) {
    const blob = await put(`educator/audio/${languageId}/example-${Date.now()}-${exampleAudioFile.name}`, exampleAudioFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    exampleAudioUrl = blob.url;
    await recordMediaAsset("audio", exampleAudioFile, blob, userId);
  }

  let extras: ReturnType<typeof parseLexicalExtras>;
  try {
    extras = parseLexicalExtras(fields as Record<string, unknown>);
  } catch (e) {
    if (e instanceof LexicalParseError) return c.json({ error: e.message }, 400);
    throw e;
  }

  const id = `edu-${randomUUID()}`;
  const [inserted] = await db
    .insert(dictionaryEntries)
    .values({
      id,
      languageId: languageId.trim(),
      word: word.trim(),
      english: english.trim(),
      french: translations?.fr ?? null,
      translations: translations ?? null,
      category: category as (typeof VALID_CATEGORIES)[number],
      pronunciation: fields.pronunciation?.trim() || null,
      example: fields.example?.trim() || null,
      exampleTranslation: exampleTranslations?.en ?? null,
      exampleTranslationFr: exampleTranslations?.fr ?? null,
      exampleTranslations: exampleTranslations ?? null,
      audioUrl,
      imageUrl,
      exampleAudioUrl,
      ...extras,
      status: "draft",
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return c.json(inserted, 201);
});

const PATCHABLE_STATUSES = ["draft", "in_review", "archived"] as const;

// PATCH /educator/dictionary/:id
educatorDictionaryRouter.patch("/dictionary/:id", async (c) => {
  const userId = c.get("userId");
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  // Check ownership before update
  const [existing] = await db
    .select({ languageId: dictionaryEntries.languageId })
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const contentType = c.req.header("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  let fields: Record<string, string>;
  let audioFile: File | null = null;
  let imageFile: File | null = null;

  if (isMultipart) {
    const formData = await c.req.formData();
    fields = Object.fromEntries(
      [...formData.entries()]
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => [k, v as string])
    );
    audioFile = formData.get("audio") as File | null;
    imageFile = formData.get("image") as File | null;
  } else {
    fields = await c.req.json<Record<string, string>>();
  }

  if (fields.category && !VALID_CATEGORIES.includes(fields.category as (typeof VALID_CATEGORIES)[number])) {
    return c.json({ error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` }, 400);
  }
  if (fields.status && !PATCHABLE_STATUSES.includes(fields.status as (typeof PATCHABLE_STATUSES)[number])) {
    // "published" only happens through the guarded POST /content/dictionary_entries/:id/publish endpoint.
    return c.json({ error: `status must be one of: ${PATCHABLE_STATUSES.join(", ")}` }, 400);
  }

  const updates: Partial<typeof dictionaryEntries.$inferInsert> = { updatedBy: userId };
  if (fields.status) updates.status = fields.status as (typeof PATCHABLE_STATUSES)[number];
  for (const key of ["pronunciation", "example"] as const) {
    if (key in fields) updates[key] = fields[key]?.trim() || null;
  }
  for (const key of ["word", "category"] as const) {
    if (fields[key]?.trim()) updates[key] = fields[key].trim();
  }

  // Translations: write the jsonb map plus the derived flat english/french projection.
  const translations = parseMap((fields as Record<string, unknown>).translations);
  if (translations) {
    updates.translations = translations;
    if (translations.en?.trim()) updates.english = translations.en.trim();
    updates.french = translations.fr ?? null;
  } else {
    if ("english" in fields && fields.english?.trim()) updates.english = fields.english.trim();
    if ("french" in fields) updates.french = fields.french?.trim() || null;
  }

  const exampleTranslations = parseMap((fields as Record<string, unknown>).exampleTranslations);
  if (exampleTranslations) {
    updates.exampleTranslations = exampleTranslations;
    updates.exampleTranslation = exampleTranslations.en ?? null;
    updates.exampleTranslationFr = exampleTranslations.fr ?? null;
  } else {
    if ("exampleTranslation" in fields) updates.exampleTranslation = fields.exampleTranslation?.trim() || null;
    if ("exampleTranslationFr" in fields) updates.exampleTranslationFr = fields.exampleTranslationFr?.trim() || null;
  }

  if ("audioUrl" in fields) updates.audioUrl = fields.audioUrl?.trim() || null;
  if ("imageUrl" in fields) updates.imageUrl = fields.imageUrl?.trim() || null;
  if ("exampleAudioUrl" in fields) updates.exampleAudioUrl = fields.exampleAudioUrl?.trim() || null;

  try {
    Object.assign(updates, parseLexicalExtras(fields as Record<string, unknown>));
  } catch (e) {
    if (e instanceof LexicalParseError) return c.json({ error: e.message }, 400);
    throw e;
  }

  if (audioFile?.size) {
    const blob = await put(`educator/audio/${existing.languageId}/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    updates.audioUrl = blob.url;
    await recordMediaAsset("audio", audioFile, blob, userId);
  }
  if (imageFile?.size) {
    const blob = await put(`educator/images/${existing.languageId}/${Date.now()}-${imageFile.name}`, imageFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    updates.imageUrl = blob.url;
    await recordMediaAsset("image", imageFile, blob, userId);
  }
  const patchExampleAudioFile = isMultipart ? (await c.req.formData()).get("exampleAudio") as File | null : null;
  if (patchExampleAudioFile?.size) {
    const blob = await put(`educator/audio/${existing.languageId}/example-${Date.now()}-${patchExampleAudioFile.name}`, patchExampleAudioFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    updates.exampleAudioUrl = blob.url;
    await recordMediaAsset("audio", patchExampleAudioFile, blob, userId);
  }

  const [updated] = await db
    .update(dictionaryEntries)
    .set(updates)
    .where(eq(dictionaryEntries.id, id))
    .returning();

  return c.json(updated);
});

// DELETE /educator/dictionary/:id
educatorDictionaryRouter.delete("/dictionary/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [existing] = await db
    .select({ languageId: dictionaryEntries.languageId })
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  await db.delete(dictionaryEntries).where(eq(dictionaryEntries.id, id));
  return c.json({ deleted: true });
});

/** Shared by GET /dictionary-coverage and GET /content-health so the two never drift. */
export async function getDictionaryCoverageReport(languageId: string) {
  const lessonRows = await db
    .select({ id: lessons.id, title: lessons.title })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(courses.languageId, languageId));
  const lessonsById = new Map(lessonRows.map((l) => [l.id, l]));

  const segments = lessonRows.length
    ? await db
        .select({ lessonId: transcriptSegments.lessonId, text: transcriptSegments.text })
        .from(transcriptSegments)
        .where(inArray(transcriptSegments.lessonId, lessonRows.map((l) => l.id)))
    : [];

  const dictRows = await db
    .select({ word: dictionaryEntries.word })
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId));
  const approvedContribs = await db
    .select({ word: contributions.word })
    .from(contributions)
    .where(
      and(
        eq(contributions.status, "approved"),
        eq(contributions.languageId, languageId),
        notInArray(contributions.type, ["entry_audio", "entry_image", "entry_meaning"]),
      )
    );

  const englishRows = await db.select({ word: englishWordbank.word }).from(englishWordbank);

  const report = computeCoverage(
    segments,
    [...dictRows, ...approvedContribs].map((r) => r.word),
    lessonsById,
    englishRows.map((r) => r.word),
  );
  return { languageId, lessonCount: lessonRows.length, ...report };
}

// GET /educator/dictionary-coverage?languageId=xx
// Transcript words in the language's lessons that have no dictionary entry.
educatorDictionaryRouter.get("/dictionary-coverage", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const languageId = c.req.query("languageId") ?? (isAdmin ? "" : reviewerLanguages[0]);

  if (!languageId) return c.json({ error: "languageId is required" }, 400);
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  return c.json(await getDictionaryCoverageReport(languageId));
});

// The canonical UI/gloss locales (web/lib/ui-language.ts). Translation-queue
// scope is limited to these — `translations`/`exampleTranslations` are gloss
// maps, not per-content-language data.
export const GLOSS_LOCALES = ["en", "fr", "pcm", "ar", "pt"] as const;
export type GlossLocale = (typeof GLOSS_LOCALES)[number];

/** Per-locale gloss coverage for a language's dictionary — shared with GET /content-health. */
export async function getTranslationCoverageReport(languageId: string) {
  const rows = await db
    .select()
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId));
  const entries = rows.map(withTranslations);
  const total = entries.length;

  return GLOSS_LOCALES.map((locale) => {
    const covered = entries.filter((entry) => {
      const hasGloss = !!entry.translations?.[locale];
      const hasExampleGloss = !entry.example || !!entry.exampleTranslations?.[locale];
      return hasGloss && hasExampleGloss;
    }).length;
    return { locale, total, covered, pct: total > 0 ? Math.round((covered / total) * 100) : 0 };
  });
}

// GET /educator/translation-queue?languageId=xx&locale=fr
// Dictionary entries (any status) missing a gloss for the given locale.
educatorDictionaryRouter.get("/translation-queue", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const languageId = c.req.query("languageId") ?? (isAdmin ? "" : reviewerLanguages[0]);
  const locale = c.req.query("locale");

  if (!languageId) return c.json({ error: "languageId is required" }, 400);
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }
  if (!locale || !GLOSS_LOCALES.includes(locale as GlossLocale)) {
    return c.json({ error: `locale must be one of: ${GLOSS_LOCALES.join(", ")}` }, 400);
  }

  const rows = await db
    .select()
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId))
    .orderBy(dictionaryEntries.word);

  const missing = rows
    .map(withTranslations)
    .filter((entry) => {
      const missingGloss = !entry.translations?.[locale];
      const missingExampleGloss = !!entry.example && !entry.exampleTranslations?.[locale];
      return missingGloss || missingExampleGloss;
    });

  return c.json({ languageId, locale, total: rows.length, missing });
});
