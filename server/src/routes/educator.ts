/**
 * Educator / Reviewer panel routes
 *
 * All routes require `authMiddleware` + `reviewerMiddleware`.
 * Admins see all languages; reviewers are scoped to their `reviewerLanguages`.
 */
import { put } from "@vercel/blob";
import { and, count, eq, inArray, isNull, notInArray } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import {
  contributions,
  dictionaryEntries,
  languages,
  lessonContributions,
  users,
} from "../db/schema.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";

export const educatorRouter = new Hono<AuthEnv>();
educatorRouter.use("*", authMiddleware);
educatorRouter.use("*", reviewerMiddleware);

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Return a Drizzle language-filter condition, or undefined (no filter) for admins. */
function langFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: { languageId: any },
  langs: string[],
) {
  return langs.length > 0 ? inArray(table.languageId, langs) : undefined;
}

// ─── GET /educator/me ─────────────────────────────────────────────────────────

educatorRouter.get("/me", async (c) => {
  const userId = c.get("userId");
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const [user] = await db
    .select({ name: users.name, email: users.email, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Fetch full language objects so the UI can show names
  const allLangs = await db.select().from(languages);
  const scopedLangs = isAdmin ? allLangs : allLangs.filter((l) => reviewerLanguages.includes(l.id));

  return c.json({ ...user, isAdmin, reviewerLanguages, languages: scopedLangs });
});

// ─── GET /educator/stats ──────────────────────────────────────────────────────

educatorRouter.get("/stats", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where = (table: { languageId: any }) =>
    langFilter(table, isAdmin ? [] : reviewerLanguages);

  const [
    [dictCount],
    [pendingContribCount],
    [approvedContribCount],
    [pendingLessonCount],
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(dictionaryEntries)
      .where(where(dictionaryEntries) ?? isNull(dictionaryEntries.languageId)),
    db
      .select({ value: count() })
      .from(contributions)
      .where(
        and(
          eq(contributions.status, "submitted"),
          where(contributions) ?? undefined,
        )
      ),
    db
      .select({ value: count() })
      .from(contributions)
      .where(
        and(
          eq(contributions.status, "approved"),
          where(contributions) ?? undefined,
        )
      ),
    db
      .select({ value: count() })
      .from(lessonContributions)
      .where(
        and(
          eq(lessonContributions.status, "submitted"),
          where(lessonContributions) ?? undefined,
        )
      ),
  ]);

  return c.json({
    dictionaryEntries: dictCount?.value ?? 0,
    pendingContributions: pendingContribCount?.value ?? 0,
    approvedContributions: approvedContribCount?.value ?? 0,
    pendingLessons: pendingLessonCount?.value ?? 0,
  });
});

// ─── GET /educator/contributions ─────────────────────────────────────────────

educatorRouter.get("/contributions", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const statusFilter = c.req.query("status") ?? "submitted";

  const rows = await db
    .select({
      id: contributions.id,
      type: contributions.type,
      languageId: contributions.languageId,
      word: contributions.word,
      english: contributions.english,
      category: contributions.category,
      pronunciation: contributions.pronunciation,
      example: contributions.example,
      exampleTranslation: contributions.exampleTranslation,
      audioUrl: contributions.audioUrl,
      imageUrl: contributions.imageUrl,
      status: contributions.status,
      reviewNote: contributions.reviewNote,
      dictionaryEntryId: contributions.dictionaryEntryId,
      createdAt: contributions.createdAt,
      submitterName: users.name,
    })
    .from(contributions)
    .leftJoin(users, eq(contributions.userId, users.id))
    .where(
      and(
        eq(contributions.status, statusFilter as "submitted" | "approved" | "rejected"),
        !isAdmin && reviewerLanguages.length > 0
          ? inArray(contributions.languageId, reviewerLanguages)
          : undefined,
      )
    )
    .orderBy(contributions.createdAt);

  return c.json(rows);
});

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Apply an approved entry-contribution back to the parent dictionary entry. */
async function applyEntryContribution(
  type: string,
  entryId: string,
  contrib: { audioUrl: string | null; imageUrl: string | null; english: string | null },
) {
  if (type === "entry_audio" && contrib.audioUrl) {
    await db.update(dictionaryEntries).set({ audioUrl: contrib.audioUrl }).where(eq(dictionaryEntries.id, entryId));
    return;
  }
  if (type === "entry_image" && contrib.imageUrl) {
    await db.update(dictionaryEntries).set({ imageUrl: contrib.imageUrl }).where(eq(dictionaryEntries.id, entryId));
    return;
  }
  if (type === "entry_meaning" && contrib.english) {
    const [entry] = await db.select({ english: dictionaryEntries.english }).from(dictionaryEntries).where(eq(dictionaryEntries.id, entryId)).limit(1);
    if (entry) {
      const merged = entry.english.includes(contrib.english) ? entry.english : `${entry.english}; ${contrib.english}`;
      await db.update(dictionaryEntries).set({ english: merged }).where(eq(dictionaryEntries.id, entryId));
    }
  }
}

// ─── POST /educator/contributions/:id/review ─────────────────────────────────

educatorRouter.post("/contributions/:id/review", async (c) => {
  const reviewerId = c.get("userId");
  const { id } = c.req.param();
  const { action, note } = await c.req.json<{ action: "approve" | "reject"; note?: string }>();

  if (action !== "approve" && action !== "reject") {
    return c.json({ error: "action must be approve or reject" }, 400);
  }

  const [existing] = await db.select().from(contributions).where(eq(contributions.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.status === "approved") return c.json({ error: "Already approved" }, 409);

  if (action === "approve" && existing.dictionaryEntryId) {
    await applyEntryContribution(existing.type, existing.dictionaryEntryId, existing);
  }

  const [updated] = await db
    .update(contributions)
    .set({
      status: action === "approve" ? "approved" : "rejected",
      reviewNote: note?.trim() || null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(contributions.id, id))
    .returning({ id: contributions.id, status: contributions.status });

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// ─── PATCH /educator/contributions/:id ───────────────────────────────────────

educatorRouter.patch("/contributions/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    word?: string;
    english?: string;
    pronunciation?: string | null;
    example?: string | null;
    exampleTranslation?: string | null;
    category?: string;
  }>();

  const [existing] = await db.select({ id: contributions.id }).from(contributions).where(eq(contributions.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (body.word?.trim()) updates.word = body.word.trim();
  if (body.english?.trim()) updates.english = body.english.trim();
  if ("pronunciation" in body) updates.pronunciation = body.pronunciation?.trim() || null;
  if ("example" in body) updates.example = body.example?.trim() || null;
  if ("exampleTranslation" in body) updates.exampleTranslation = body.exampleTranslation?.trim() || null;
  if (body.category) updates.category = body.category;

  if (Object.keys(updates).length === 0) return c.json({ error: "Nothing to update" }, 400);

  const [updated] = await db.update(contributions).set(updates).where(eq(contributions.id, id)).returning();
  return c.json(updated);
});

// ─── GET /educator/lesson-contributions ──────────────────────────────────────

educatorRouter.get("/lesson-contributions", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const statusFilter = c.req.query("status") ?? "submitted";

  const rows = await db
    .select({
      id: lessonContributions.id,
      languageId: lessonContributions.languageId,
      title: lessonContributions.title,
      description: lessonContributions.description,
      audioUrl: lessonContributions.audioUrl,
      type: lessonContributions.type,
      status: lessonContributions.status,
      reviewNote: lessonContributions.reviewNote,
      createdAt: lessonContributions.createdAt,
      submitterName: users.name,
    })
    .from(lessonContributions)
    .leftJoin(users, eq(lessonContributions.userId, users.id))
    .where(
      and(
        eq(lessonContributions.status, statusFilter as "submitted" | "approved" | "rejected"),
        !isAdmin && reviewerLanguages.length > 0
          ? inArray(lessonContributions.languageId, reviewerLanguages)
          : undefined,
      )
    )
    .orderBy(lessonContributions.createdAt);

  return c.json(rows);
});

// ─── POST /educator/lesson-contributions/:id/review ───────────────────────────

educatorRouter.post("/lesson-contributions/:id/review", async (c) => {
  const reviewerId = c.get("userId");
  const { id } = c.req.param();
  const { action, note } = await c.req.json<{ action: "approve" | "reject"; note?: string }>();

  if (action !== "approve" && action !== "reject") {
    return c.json({ error: "action must be approve or reject" }, 400);
  }

  const [updated] = await db
    .update(lessonContributions)
    .set({
      status: action === "approve" ? "approved" : "rejected",
      reviewNote: note?.trim() || null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(lessonContributions.id, id))
    .returning({ id: lessonContributions.id, status: lessonContributions.status });

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// ─── DICTIONARY CRUD ──────────────────────────────────────────────────────────

// GET /educator/dictionary
educatorRouter.get("/dictionary", async (c) => {
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
    _source: "contribution" as const,
  }));

  return c.json([...rows, ...mapped]);
});

const VALID_CATEGORIES = [
  "noun", "verb", "adjective", "adverb", "pronoun",
  "greeting", "phrase", "number", "color", "body",
  "food", "family", "nature", "animal", "place", "other",
] as const;

// POST /educator/dictionary
educatorRouter.post("/dictionary", async (c) => {
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

  const { languageId, word, english, category } = fields;

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

  if (audioFile?.size) {
    const blob = await put(`educator/audio/${languageId}/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    audioUrl = blob.url;
  }
  if (imageFile?.size) {
    const blob = await put(`educator/images/${languageId}/${Date.now()}-${imageFile.name}`, imageFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    imageUrl = blob.url;
  }

  const id = `edu-${randomUUID()}`;
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

// PATCH /educator/dictionary/:id
educatorRouter.patch("/dictionary/:id", async (c) => {
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

  const updates: Record<string, string | null> = {};
  for (const key of ["word", "english", "french", "category", "pronunciation", "example", "exampleTranslation", "exampleTranslationFr"] as const) {
    if (key in fields) updates[key] = fields[key]?.trim() || null;
  }
  if ("audioUrl" in fields) updates.audioUrl = fields.audioUrl?.trim() || null;
  if ("imageUrl" in fields) updates.imageUrl = fields.imageUrl?.trim() || null;

  if (audioFile?.size) {
    const blob = await put(`educator/audio/${existing.languageId}/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    updates.audioUrl = blob.url;
  }
  if (imageFile?.size) {
    const blob = await put(`educator/images/${existing.languageId}/${Date.now()}-${imageFile.name}`, imageFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    updates.imageUrl = blob.url;
  }

  const [updated] = await db
    .update(dictionaryEntries)
    .set(updates)
    .where(eq(dictionaryEntries.id, id))
    .returning();

  return c.json(updated);
});

// DELETE /educator/dictionary/:id
educatorRouter.delete("/dictionary/:id", async (c) => {
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
