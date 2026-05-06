import { put } from "@vercel/blob";
import { and, asc, eq, ilike, notInArray, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { contributions, dictionaryEntries, users } from "../db/schema.js";
import { adminMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const dictionaryRouter = new Hono();

// GET /api/dictionary?languageId=&category=&search= (all optional except languageId)
// Merges dictionary_entries (static) + approved contributions
dictionaryRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  const category = c.req.query("category");
  const search = c.req.query("search")?.trim();

  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  const entryConditions = [
    eq(dictionaryEntries.languageId, languageId),
    category ? eq(dictionaryEntries.category, category) : undefined,
    search
      ? or(
          ilike(dictionaryEntries.word, search),
          ilike(dictionaryEntries.word, `${search}-%`),
          ilike(dictionaryEntries.word, `%${search}%`)
        )
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const limitParam = c.req.query("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 500, 500) : undefined;

  const staticQuery = db
    .select()
    .from(dictionaryEntries)
    .where(and(...entryConditions))
    .orderBy(
      search
        ? sql`LOWER(${dictionaryEntries.word}) = LOWER(${search}) DESC`
        : asc(dictionaryEntries.word),
      asc(dictionaryEntries.word)
    );

  const staticEntries = limit ? await staticQuery.limit(limit) : await staticQuery;

  // Also merge approved contributions for this language
  const contribConditions = [
    eq(contributions.languageId, languageId),
    eq(contributions.status, "approved"),
    category ? eq(contributions.category, category) : undefined,
    search
      ? or(
          ilike(contributions.word, search),
          ilike(contributions.word, `${search}-%`),
          ilike(contributions.word, `%${search}%`)
        )
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const approvedContribs = await db
    .select({
      id: contributions.id,
      word: contributions.word,
      english: contributions.english,
      category: contributions.category,
      languageId: contributions.languageId,
      pronunciation: contributions.pronunciation,
      example: contributions.example,
      exampleTranslation: contributions.exampleTranslation,
      audioUrl: contributions.audioUrl,
      contributorId: contributions.userId,
      contributorName: users.name,
    })
    .from(contributions)
    .leftJoin(users, eq(contributions.userId, users.id))
    .where(and(...contribConditions))
    .orderBy(contributions.word);

  const merged = [...staticEntries, ...approvedContribs];
  return c.json(limit ? merged.slice(0, limit) : merged);
});

// ── Admin CRUD ─────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  "greetings", "numbers", "family", "pronouns", "time", "verbs", "body",
  "market", "occupations", "nouns", "phrases", "food", "possessives",
  "ordinals", "commands", "animals", "phonetics", "money", "proverbs",
] as const;

export const dictionaryAdminRouter = new Hono<AuthEnv>();
dictionaryAdminRouter.use("*", authMiddleware);
dictionaryAdminRouter.use("*", adminMiddleware);

// GET /api/dictionary/admin?languageId=&category=&search=&limit=500&offset=0
dictionaryAdminRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  const category = c.req.query("category");
  const search = c.req.query("search")?.trim();
  const limit = Math.min(Number(c.req.query("limit") ?? 500), 500);
  const offset = Number(c.req.query("offset") ?? 0);

  const conditions = [
    languageId ? eq(dictionaryEntries.languageId, languageId) : undefined,
    category ? eq(dictionaryEntries.category, category) : undefined,
    search
      ? or(
          ilike(dictionaryEntries.word, `%${search}%`),
          ilike(dictionaryEntries.english, `%${search}%`)
        )
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const staticRows = await db
    .select()
    .from(dictionaryEntries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(dictionaryEntries.languageId), asc(dictionaryEntries.word))
    .limit(limit)
    .offset(offset);

  // Also include approved word/phrase contributions (not tied to an existing entry)
  const contribConditions = [
    eq(contributions.status, "approved"),
    languageId ? eq(contributions.languageId, languageId) : undefined,
    category ? eq(contributions.category, category) : undefined,
    notInArray(contributions.type, ["entry_audio", "entry_image", "entry_meaning"]),
    search
      ? or(
          ilike(contributions.word, `%${search}%`),
          ilike(contributions.english, `%${search}%`)
        )
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const contribRows = await db
    .select({
      id: contributions.id,
      word: contributions.word,
      english: contributions.english,
      category: contributions.category,
      languageId: contributions.languageId,
      pronunciation: contributions.pronunciation,
      example: contributions.example,
      exampleTranslation: contributions.exampleTranslation,
      audioUrl: contributions.audioUrl,
      imageUrl: contributions.imageUrl,
      isContribution: contributions.id, // presence signals it came from contributions
    })
    .from(contributions)
    .where(and(...contribConditions))
    .orderBy(asc(contributions.word));

  const mapped = contribRows.map(({ isContribution, ...row }) => ({
    ...row,
    notes: null,
    _source: "contribution" as const,
  }));

  return c.json([...staticRows, ...mapped]);
});

// POST /api/dictionary/admin (supports multipart/form-data OR application/json)
dictionaryAdminRouter.post("/", async (c) => {
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

  const { languageId, word, english, category } = fields;

  if (!languageId?.trim() || !word?.trim() || !english?.trim()) {
    return c.json({ error: "languageId, word, and english are required" }, 400);
  }
  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return c.json({ error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` }, 400);
  }

  let audioUrl = fields.audioUrl?.trim() || null;
  let imageUrl = fields.imageUrl?.trim() || null;

  if (audioFile?.size) {
    const blob = await put(`dictionary/audio/${languageId}/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    audioUrl = blob.url;
  }
  if (imageFile?.size) {
    const blob = await put(`dictionary/images/${languageId}/${Date.now()}-${imageFile.name}`, imageFile, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    imageUrl = blob.url;
  }

  const id = `admin-${randomUUID()}`;
  const [inserted] = await db
    .insert(dictionaryEntries)
    .values({
      id,
      languageId: languageId.trim(),
      word: word.trim(),
      english: english.trim(),
      french: fields.french?.trim() || null,
      category: category as (typeof VALID_CATEGORIES)[number],
      pronunciation: fields.pronunciation?.trim() || null,
      example: fields.example?.trim() || null,
      exampleTranslation: fields.exampleTranslation?.trim() || null,
      exampleTranslationFr: fields.exampleTranslationFr?.trim() || null,
      audioUrl,
      imageUrl,
    })
    .returning();

  return c.json(inserted, 201);
});

// PATCH /api/dictionary/admin/:id (supports multipart/form-data OR application/json)
dictionaryAdminRouter.patch("/:id", async (c) => {
  const { id } = c.req.param();
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

  const updates: Record<string, string | null> = {};
  for (const key of ["word", "english", "french", "category", "pronunciation", "example", "exampleTranslation", "exampleTranslationFr"] as const) {
    if (key in fields) updates[key] = fields[key]?.trim() || null;
  }

  // Explicit URL overrides take priority; file uploads win if provided
  if ("audioUrl" in fields) updates.audioUrl = fields.audioUrl?.trim() || null;
  if ("imageUrl" in fields) updates.imageUrl = fields.imageUrl?.trim() || null;

  if (audioFile?.size) {
    const [existing] = await db.select({ languageId: dictionaryEntries.languageId }).from(dictionaryEntries).where(eq(dictionaryEntries.id, id)).limit(1);
    const blob = await put(`dictionary/audio/${existing?.languageId ?? "unknown"}/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    updates.audioUrl = blob.url;
  }
  if (imageFile?.size) {
    const [existing] = await db.select({ languageId: dictionaryEntries.languageId }).from(dictionaryEntries).where(eq(dictionaryEntries.id, id)).limit(1);
    const blob = await put(`dictionary/images/${existing?.languageId ?? "unknown"}/${Date.now()}-${imageFile.name}`, imageFile, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    updates.imageUrl = blob.url;
  }

  const [updated] = await db
    .update(dictionaryEntries)
    .set(updates)
    .where(eq(dictionaryEntries.id, id))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/dictionary/admin/:id
dictionaryAdminRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();
  const deleted = await db
    .delete(dictionaryEntries)
    .where(eq(dictionaryEntries.id, id))
    .returning({ id: dictionaryEntries.id });
  if (deleted.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});
