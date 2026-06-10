/**
 * Educator / Reviewer panel routes
 *
 * All routes require `authMiddleware` + `reviewerMiddleware`.
 * Admins see all languages; reviewers are scoped to their `reviewerLanguages`.
 */
import { put } from "@vercel/blob";
import { and, count, eq, inArray, isNull, notInArray } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import {
  contributions,
  courses,
  dictionaryEntries,
  englishWordbank,
  feedItems,
  languages,
  lessonContributions,
  lessonContributionSegments,
  lessons,
  scenarios,
  sentenceTemplates,
  storyArcs,
  storyChapters,
  transcriptSegments,
  users,
} from "../db/schema.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";
import { computeCoverage } from "../lib/dictionary-coverage.js";
import { stubForCourse, stubForLanguage } from "../lib/lesson-stubs.js";

export const educatorRouter = new Hono<AuthEnv>();
educatorRouter.use("*", authMiddleware);
educatorRouter.use("*", reviewerMiddleware);

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Return a Drizzle language-filter condition, or undefined (no filter) for admins. */
function langFilter(
  table: { languageId: PgColumn },
  langs: string[],
) {
  return langs.length > 0 ? inArray(table.languageId, langs) : undefined;
}

function isAudioUpload(file: File): boolean {
  if (file.type.toLowerCase().startsWith("audio/")) return true;
  return /\.(mp3|wav|m4a|aac|ogg|oga|webm|mp4|mpeg)$/i.test(file.name);
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

  const where = (table: { languageId: PgColumn }) =>
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

// ─── DELETE /educator/contributions/:id ──────────────────────────────────────

educatorRouter.delete("/contributions/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [existing] = await db
    .select({ status: contributions.status, languageId: contributions.languageId })
    .from(contributions)
    .where(eq(contributions.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) return c.json({ error: "Forbidden" }, 403);
  if (existing.status === "approved") return c.json({ error: "Approved contributions cannot be deleted" }, 409);

  await db.delete(feedItems).where(eq(feedItems.contributionId, id));
  await db.delete(contributions).where(eq(contributions.id, id));
  return c.json({ deleted: true });
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
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();
  const { action, note } = await c.req.json<{ action: "approve" | "reject"; note?: string }>();

  if (action !== "approve" && action !== "reject") {
    return c.json({ error: "action must be approve or reject" }, 400);
  }

  const [contribution] = await db
    .select()
    .from(lessonContributions)
    .where(eq(lessonContributions.id, id))
    .limit(1);

  if (!contribution) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(contribution.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  if (contribution.status === "approved") {
    return c.json({ error: "Already approved" }, 409);
  }

  if (action === "reject") {
    const [updated] = await db
      .update(lessonContributions)
      .set({ status: "rejected", reviewNote: note?.trim() || null, reviewedBy: reviewerId, reviewedAt: new Date() })
      .where(eq(lessonContributions.id, id))
      .returning({ id: lessonContributions.id, status: lessonContributions.status });
    return c.json(updated);
  }

  // Approval: create actual lesson + copy segments into transcript_segments
  let courseId = contribution.courseId;
  if (!courseId) {
    const [firstCourse] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.languageId, contribution.languageId))
      .limit(1);
    courseId = firstCourse?.id ?? null;
  }
  if (!courseId) {
    return c.json({ error: "No course found for this language — assign a courseId first" }, 400);
  }

  const lessonId = `lesson-contrib-${randomUUID()}`;

  await db.insert(lessons).values({
    id: lessonId,
    courseId,
    type: contribution.type ?? "lesson",
    title: contribution.title,
    description: contribution.description,
    audioUrl: contribution.audioUrl,
    duration: contribution.duration,
    order: 999,
    artist: contribution.artist,
    genre: contribution.genre,
  });

  const segs = await db
    .select()
    .from(lessonContributionSegments)
    .where(eq(lessonContributionSegments.lessonContributionId, id))
    .orderBy(lessonContributionSegments.order);

  if (segs.length > 0) {
    await db.insert(transcriptSegments).values(
      segs.map((seg) => ({
        lessonId,
        text: seg.text,
        translation: seg.translation,
        startTime: seg.startTime ?? 0,
        endTime: seg.endTime ?? 0,
        order: seg.order,
      }))
    );
  }

  const [course] = await db
    .select({ lessonsCount: courses.lessonsCount })
    .from(courses).where(eq(courses.id, courseId)).limit(1);
  if (course) {
    await db.update(courses).set({ lessonsCount: course.lessonsCount + 1 }).where(eq(courses.id, courseId));
  }

  const [updated] = await db
    .update(lessonContributions)
    .set({ status: "approved", reviewNote: note?.trim() || null, reviewedBy: reviewerId, reviewedAt: new Date() })
    .where(eq(lessonContributions.id, id))
    .returning({ id: lessonContributions.id, status: lessonContributions.status });

  return c.json({ ...updated, lessonId });
});

// ─── DELETE /educator/lesson-contributions/:id ────────────────────────────────

educatorRouter.delete("/lesson-contributions/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [existing] = await db
    .select({ status: lessonContributions.status, languageId: lessonContributions.languageId })
    .from(lessonContributions)
    .where(eq(lessonContributions.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) return c.json({ error: "Forbidden" }, 403);
  if (existing.status === "approved") return c.json({ error: "Approved lesson contributions cannot be deleted" }, 409);

  await db.delete(lessonContributionSegments).where(eq(lessonContributionSegments.lessonContributionId, id));
  await db.delete(lessonContributions).where(eq(lessonContributions.id, id));
  return c.json({ deleted: true });
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
  let exampleAudioUrl = fields.exampleAudioUrl?.trim() || null;

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
  const exampleAudioFile = isMultipart ? (await c.req.formData()).get("exampleAudio") as File | null : null;
  if (exampleAudioFile?.size) {
    const blob = await put(`educator/audio/${languageId}/example-${Date.now()}-${exampleAudioFile.name}`, exampleAudioFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    exampleAudioUrl = blob.url;
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
      exampleAudioUrl,
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
  if ("exampleAudioUrl" in fields) updates.exampleAudioUrl = fields.exampleAudioUrl?.trim() || null;

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
  const patchExampleAudioFile = isMultipart ? (await c.req.formData()).get("exampleAudio") as File | null : null;
  if (patchExampleAudioFile?.size) {
    const blob = await put(`educator/audio/${existing.languageId}/example-${Date.now()}-${patchExampleAudioFile.name}`, patchExampleAudioFile, {
      access: "public", token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    updates.exampleAudioUrl = blob.url;
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

// GET /educator/dictionary-coverage?languageId=xx
// Transcript words in the language's lessons that have no dictionary entry.
educatorRouter.get("/dictionary-coverage", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const languageId = c.req.query("languageId") ?? (isAdmin ? "" : reviewerLanguages[0]);

  if (!languageId) return c.json({ error: "languageId is required" }, 400);
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

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
  return c.json({ languageId, lessonCount: lessonRows.length, ...report });
});

// ─── LESSONS CRUD ─────────────────────────────────────────────────────────────

// GET /educator/courses — available courses in educator's language scope
educatorRouter.get("/courses", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const rows = await db
    .select({ id: courses.id, title: courses.title, description: courses.description, languageId: courses.languageId, level: courses.level, order: courses.order, isActive: courses.isActive })
    .from(courses)
    .where(!isAdmin && reviewerLanguages.length > 0 ? inArray(courses.languageId, reviewerLanguages) : undefined)
    .orderBy(courses.languageId, courses.order);

  return c.json(rows);
});

// PATCH /educator/courses/:id
educatorRouter.patch("/courses/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const courseId = c.req.param("id");
  const { isActive } = await c.req.json<{ isActive: boolean }>();

  const [course] = await db.select({ languageId: courses.languageId }).from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(course.languageId)) return c.json({ error: "Forbidden" }, 403);

  await db.update(courses).set({ isActive }).where(eq(courses.id, courseId));
  return c.json({ ok: true });
});

// GET /educator/lessons
educatorRouter.get("/lessons", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const rows = await db
    .select({
      id: lessons.id,
      courseId: lessons.courseId,
      courseTitle: courses.title,
      languageId: courses.languageId,
      title: lessons.title,
      description: lessons.description,
      type: lessons.type,
      audioUrl: lessons.audioUrl,
      duration: lessons.duration,
      order: lessons.order,
      artist: lessons.artist,
      genre: lessons.genre,
      isActive: lessons.isActive,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(!isAdmin && reviewerLanguages.length > 0 ? inArray(courses.languageId, reviewerLanguages) : undefined)
    .orderBy(courses.languageId, lessons.order);

  return c.json(rows);
});

// POST /educator/lessons — create a lesson directly (bypasses contribution review)
educatorRouter.post("/lessons", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const formData = await c.req.formData();
  const languageId = (formData.get("languageId") as string)?.trim() ?? "";
  const courseId = (formData.get("courseId") as string) || null;
  const title = (formData.get("title") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() ?? "";
  const type = (formData.get("type") as string) || "lesson";
  const artist = (formData.get("artist") as string)?.trim() || null;
  const genre = (formData.get("genre") as string)?.trim() || null;
  const durationStr = formData.get("duration") as string | null;
  const duration = durationStr ? parseInt(durationStr, 10) : null;
  const orderStr = formData.get("order") as string | null;
  const order = orderStr ? parseInt(orderStr, 10) : 999;
  const segmentsJson = (formData.get("segments") as string) ?? "[]";

  if (!languageId || !title || !description) {
    return c.json({ error: "languageId, title, and description are required" }, 400);
  }
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  let segments: { text: string; translation?: string; startTime?: number; endTime?: number; order: number }[] = [];
  try { segments = JSON.parse(segmentsJson); } catch { /* no segments */ }

  // Resolve courseId
  let resolvedCourseId = courseId;
  if (!resolvedCourseId) {
    const [firstCourse] = await db.select({ id: courses.id }).from(courses)
      .where(eq(courses.languageId, languageId)).limit(1);
    resolvedCourseId = firstCourse?.id ?? null;
  }
  if (!resolvedCourseId) {
    return c.json({ error: "No course found for this language. Create a course first." }, 400);
  }

  let audioUrl: string | null = null;
  const audioFile = formData.get("audio") as File | null;
  if (audioFile?.size) {
    try {
      const blob = await put(
        `educator-lessons/${Date.now()}-${audioFile.name}`,
        audioFile,
        { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
      );
      audioUrl = blob.url;
    } catch {
      return c.json({ error: "Failed to upload audio" }, 500);
    }
  }

  const lessonId = `edu-${randomUUID()}`;

  await db.insert(lessons).values({
    id: lessonId,
    courseId: resolvedCourseId,
    type,
    title,
    description,
    audioUrl,
    duration: duration && !isNaN(duration) ? duration : null,
    order: isNaN(order) ? 999 : order,
    artist,
    genre,
  });

  if (segments.length > 0) {
    await db.insert(transcriptSegments).values(
      segments.map((seg) => ({
        lessonId,
        text: seg.text,
        translation: seg.translation || null,
        startTime: seg.startTime ?? 0,
        endTime: seg.endTime ?? 0,
        order: seg.order,
      }))
    );
  }

  const [course] = await db.select({ lessonsCount: courses.lessonsCount })
    .from(courses).where(eq(courses.id, resolvedCourseId)).limit(1);
  if (course) {
    await db.update(courses).set({ lessonsCount: course.lessonsCount + 1 })
      .where(eq(courses.id, resolvedCourseId));
  }

  return c.json({ id: lessonId }, 201);
});

// PATCH /educator/lessons/:id
educatorRouter.patch("/lessons/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [existing] = await db
    .select({ languageId: courses.languageId })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json<{
    title?: string; description?: string; type?: string;
    artist?: string | null; genre?: string | null; order?: number; isActive?: boolean;
  }>();

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.type !== undefined) updates.type = body.type;
  if (body.artist !== undefined) updates.artist = body.artist?.trim() || null;
  if (body.genre !== undefined) updates.genre = body.genre?.trim() || null;
  if (body.order !== undefined) updates.order = body.order;
  if (body.isActive !== undefined) updates.isActive = body.isActive;

  await db.update(lessons).set(updates).where(eq(lessons.id, id));
  return c.json({ success: true });
});

// GET /educator/lessons/:id — lesson detail with transcript segments
educatorRouter.get("/lessons/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [lesson] = await db
    .select({
      id: lessons.id,
      courseId: lessons.courseId,
      courseTitle: courses.title,
      languageId: courses.languageId,
      title: lessons.title,
      description: lessons.description,
      type: lessons.type,
      audioUrl: lessons.audioUrl,
      duration: lessons.duration,
      order: lessons.order,
      artist: lessons.artist,
      genre: lessons.genre,
      isActive: lessons.isActive,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(lesson.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const segs = await db
    .select()
    .from(transcriptSegments)
    .where(eq(transcriptSegments.lessonId, id))
    .orderBy(transcriptSegments.order);

  return c.json({ ...lesson, segments: segs });
});

// PUT /educator/lessons/:id/segments — replace all transcript segments
educatorRouter.put("/lessons/:id/segments", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [lesson] = await db
    .select({ languageId: courses.languageId })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(lesson.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const { segments } = await c.req.json<{
    segments: { text: string; translation?: string; startTime: number; endTime: number; order: number }[];
  }>();

  for (const seg of segments) {
    if (!seg.text?.trim()) return c.json({ error: "Every segment must have text" }, 400);
    if (seg.endTime < seg.startTime) {
      return c.json({ error: `Segment "${seg.text.slice(0, 30)}" has endTime before startTime` }, 400);
    }
  }

  await db.delete(transcriptSegments).where(eq(transcriptSegments.lessonId, id));

  if (segments.length > 0) {
    await db.insert(transcriptSegments).values(
      segments.map((seg, i) => ({
        lessonId: id,
        text: seg.text.trim(),
        translation: seg.translation?.trim() || null,
        startTime: seg.startTime,
        endTime: seg.endTime,
        order: seg.order ?? i,
      }))
    );
  }

  return c.json({ success: true, count: segments.length });
});

// POST /educator/lessons/:id/audio — replace audio file
educatorRouter.post("/lessons/:id/audio", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [lesson] = await db
    .select({ languageId: courses.languageId })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(lesson.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const formData = await c.req.formData();
  const audioFile = formData.get("audio") as File | null;
  const durationStr = formData.get("duration") as string | null;

  if (!audioFile?.size) return c.json({ error: "audio file is required" }, 400);
  if (!isAudioUpload(audioFile)) return c.json({ error: "Only audio files are allowed" }, 400);

  try {
    const blob = await put(
      `educator-lessons/${id}/${Date.now()}-${audioFile.name}`,
      audioFile,
      { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
    );
    await db.update(lessons).set({
      audioUrl: blob.url,
      ...(durationStr ? { duration: parseInt(durationStr, 10) } : {}),
    }).where(eq(lessons.id, id));
    return c.json({ audioUrl: blob.url });
  } catch {
    return c.json({ error: "Failed to upload audio" }, 500);
  }
});

// DELETE /educator/lessons/:id
educatorRouter.delete("/lessons/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [existing] = await db
    .select({ languageId: courses.languageId, courseId: lessons.courseId })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db.delete(transcriptSegments).where(eq(transcriptSegments.lessonId, id));
  await db.delete(lessons).where(eq(lessons.id, id));

  const [course] = await db.select({ lessonsCount: courses.lessonsCount })
    .from(courses).where(eq(courses.id, existing.courseId)).limit(1);
  if (course && course.lessonsCount > 0) {
    await db.update(courses).set({ lessonsCount: course.lessonsCount - 1 })
      .where(eq(courses.id, existing.courseId));
  }

  return c.json({ deleted: true });
});

// ─── POST /educator/generate-stubs ───────────────────────────────────────────
// Seeds template courses + lessons for a language that has no content yet.
// All generated lessons start as isActive=false so educators review before publish.

educatorRouter.post("/generate-stubs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const { languageId, courseType } = await c.req.json<{ languageId: string; courseType?: string }>();
  if (!languageId?.trim()) return c.json({ error: "languageId is required" }, 400);

  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const [lang] = await db
    .select({ id: languages.id, nativeName: languages.nativeName })
    .from(languages)
    .where(eq(languages.id, languageId))
    .limit(1);
  if (!lang) return c.json({ error: "Unknown language" }, 400);

  // ── Per-course seed ────────────────────────────────────────────────────────
  if (courseType) {
    const stub = stubForCourse(lang, courseType);
    if (!stub) return c.json({ error: "Unknown course type" }, 400);

    const { course, lessons: stubLessons } = stub;

    // Block only if this specific course already has lessons
    const [existingLesson] = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.courseId, course.id))
      .limit(1);
    if (existingLesson) {
      return c.json({ error: "This course already has lessons." }, 409);
    }

    await db.insert(courses).values({
      id: course.id,
      languageId: course.languageId,
      title: course.title,
      titleFr: course.titleFr ?? null,
      description: course.description,
      descriptionFr: course.descriptionFr ?? null,
      level: course.level,
      lessonsCount: course.lessonsCount,
      order: course.order,
      courseType: course.courseType ?? null,
    }).onConflictDoNothing();

    for (const lesson of stubLessons) {
      const { segments, ...lessonData } = lesson;
      await db.insert(lessons).values({
        id: lessonData.id, courseId: lessonData.courseId, type: lessonData.type,
        title: lessonData.title, titleFr: lessonData.titleFr,
        description: lessonData.description, descriptionFr: lessonData.descriptionFr,
        audioUrl: null, duration: null, order: lessonData.order,
        artist: lessonData.artist, genre: lessonData.genre, isActive: false,
      }).onConflictDoNothing();

      if (segments.length > 0) {
        await db.insert(transcriptSegments).values(
          segments.map((seg) => ({
            lessonId: lessonData.id, startTime: seg.startTime, endTime: seg.endTime,
            text: seg.text, translation: seg.translation, translationFr: seg.translationFr,
            order: seg.order,
          }))
        ).onConflictDoNothing();
      }
    }

    return c.json({ courses: 1, lessons: stubLessons.length });
  }

  // ── Full language seed (no courseType) ────────────────────────────────────
  // Block if any courses already exist — use the per-course path for add-ons
  const [existing] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.languageId, languageId))
    .limit(1);
  if (existing) {
    return c.json({ error: "Content already exists for this language. Use per-course generation to add missing courses." }, 409);
  }

  const { courses: stubCourses, lessons: stubLessons } = stubForLanguage(lang);

  for (const course of stubCourses) {
    await db.insert(courses).values({
      id: course.id,
      languageId: course.languageId,
      title: course.title,
      titleFr: course.titleFr ?? null,
      description: course.description,
      descriptionFr: course.descriptionFr ?? null,
      level: course.level,
      lessonsCount: course.lessonsCount,
      order: course.order,
      courseType: course.courseType ?? null,
    }).onConflictDoNothing();
  }

  for (const lesson of stubLessons) {
    const { segments, ...lessonData } = lesson;
    await db.insert(lessons).values({
      id: lessonData.id, courseId: lessonData.courseId, type: lessonData.type,
      title: lessonData.title, titleFr: lessonData.titleFr,
      description: lessonData.description, descriptionFr: lessonData.descriptionFr,
      audioUrl: null, duration: null, order: lessonData.order,
      artist: lessonData.artist, genre: lessonData.genre, isActive: false,
    }).onConflictDoNothing();

    if (segments.length > 0) {
      await db.insert(transcriptSegments).values(
        segments.map((seg) => ({
          lessonId: lessonData.id, startTime: seg.startTime, endTime: seg.endTime,
          text: seg.text, translation: seg.translation, translationFr: seg.translationFr,
          order: seg.order,
        }))
      ).onConflictDoNothing();
    }
  }

  return c.json({ courses: stubCourses.length, lessons: stubLessons.length });
});

// ─── Story Arcs ───────────────────────────────────────────────────────────────

// GET /educator/story-arcs — arcs within the educator's language scope
educatorRouter.get("/story-arcs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const rows = await db
    .select({
      id: storyArcs.id,
      courseId: storyArcs.courseId,
      title: storyArcs.title,
      description: storyArcs.description,
      updatedAt: storyArcs.updatedAt,
    })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(!isAdmin && reviewerLanguages.length > 0 ? inArray(courses.languageId, reviewerLanguages) : undefined)
    .orderBy(courses.languageId, storyArcs.courseId);

  return c.json(rows);
});

// GET /educator/story-arcs/:courseId — arc with chapters for a specific course
educatorRouter.get("/story-arcs/:courseId", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { courseId } = c.req.param();

  const [arc] = await db
    .select({
      id: storyArcs.id,
      courseId: storyArcs.courseId,
      title: storyArcs.title,
      description: storyArcs.description,
      languageId: courses.languageId,
    })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.courseId, courseId))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const chapters = await db
    .select()
    .from(storyChapters)
    .where(eq(storyChapters.storyArcId, arc.id))
    .orderBy(storyChapters.order);

  return c.json({ id: arc.id, courseId: arc.courseId, title: arc.title, description: arc.description, chapters });
});

// POST /educator/story-arcs — create a story arc for a course
educatorRouter.post("/story-arcs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const body = await c.req.json<{ courseId: string; title: string; description: string }>();
  const { courseId, title, description } = body;

  if (!courseId || !title?.trim() || !description?.trim()) {
    return c.json({ error: "courseId, title, and description are required" }, 400);
  }

  const [course] = await db.select({ languageId: courses.languageId }).from(courses)
    .where(eq(courses.id, courseId)).limit(1);
  if (!course) return c.json({ error: "Course not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(course.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = `story-arc-${randomUUID()}`;
  await db.insert(storyArcs).values({ id, courseId, title: title.trim(), description: description.trim() });

  return c.json({ id }, 201);
});

// PUT /educator/story-arcs/:id — update arc title and description
educatorRouter.put("/story-arcs/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ courseId: storyArcs.courseId, languageId: courses.languageId })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json<{ title?: string; description?: string }>();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();

  await db.update(storyArcs).set(updates).where(eq(storyArcs.id, id));
  return c.json({ success: true });
});

// DELETE /educator/story-arcs/:id — delete arc and all its chapters
educatorRouter.delete("/story-arcs/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: courses.languageId })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db.delete(storyChapters).where(eq(storyChapters.storyArcId, id));
  await db.delete(storyArcs).where(eq(storyArcs.id, id));

  return c.json({ success: true });
});

// PUT /educator/story-arcs/:id/chapters — replace all chapters (bulk upsert)
educatorRouter.put("/story-arcs/:id/chapters", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: courses.languageId })
    .from(storyArcs)
    .innerJoin(courses, eq(storyArcs.courseId, courses.id))
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json<{
    chapters: { id?: string; lessonId: string; title: string; narrativeIntro: string; narrativeOutro: string; order: number }[];
  }>();

  for (const ch of body.chapters) {
    if (!ch.lessonId || !ch.title?.trim() || !ch.narrativeIntro?.trim() || !ch.narrativeOutro?.trim()) {
      return c.json({ error: "Each chapter requires lessonId, title, narrativeIntro, and narrativeOutro" }, 400);
    }
  }

  await db.delete(storyChapters).where(eq(storyChapters.storyArcId, id));

  if (body.chapters.length > 0) {
    await db.insert(storyChapters).values(
      body.chapters.map((ch, i) => ({
        id: `story-ch-${randomUUID()}`,
        storyArcId: id,
        lessonId: ch.lessonId,
        title: ch.title.trim(),
        narrativeIntro: ch.narrativeIntro.trim(),
        narrativeOutro: ch.narrativeOutro.trim(),
        order: ch.order ?? i + 1,
      }))
    );
  }

  await db.update(storyArcs).set({ updatedAt: new Date() }).where(eq(storyArcs.id, id));

  return c.json({ success: true, count: body.chapters.length });
});

// ─── Sentence Templates CRUD ──────────────────────────────────────────────────

// GET /educator/sentences?languageId=
educatorRouter.get("/sentences", async (c) => {
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
educatorRouter.post("/sentences", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const body = await c.req.json<{
    id?: string;
    languageId: string;
    sentence: string;
    answer: string;
    englishSentence: string;
    kind?: "blank" | "equivalent";
    literalTranslation?: string;
  }>();

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
educatorRouter.delete("/sentences/:id", async (c) => {
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

// ─── Scenarios CRUD ───────────────────────────────────────────────────────────

// GET /educator/scenarios?languageId=
educatorRouter.get("/scenarios", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  const rows = await db
    .select()
    .from(scenarios)
    .where(eq(scenarios.languageId, languageId));
  return c.json(rows.map((r) => ({ ...r, turns: JSON.parse(r.turns) })));
});

// POST /educator/scenarios
educatorRouter.post("/scenarios", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const body = await c.req.json<{
    languageId: string;
    situation: string;
    turns: { text: string; translation: string; audioUrl?: string }[];
  }>();

  if (!body.languageId || !body.situation?.trim() || !Array.isArray(body.turns) || body.turns.length === 0) {
    return c.json({ error: "languageId, situation, and turns[] are required" }, 400);
  }
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(body.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  for (const turn of body.turns) {
    if (!turn.text?.trim() || !turn.translation?.trim()) {
      return c.json({ error: "Each turn requires text and translation" }, 400);
    }
  }

  const [row] = await db
    .insert(scenarios)
    .values({
      languageId: body.languageId,
      situation: body.situation.trim(),
      turns: JSON.stringify(body.turns),
    })
    .returning();

  return c.json({ ...row, turns: JSON.parse(row.turns) }, 201);
});

// PATCH /educator/scenarios/:id
educatorRouter.patch("/scenarios/:id", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const id = c.req.param("id");
  const [existing] = await db
    .select({ languageId: scenarios.languageId })
    .from(scenarios)
    .where(eq(scenarios.id, id))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }

  const body = await c.req.json<{
    situation?: string;
    turns?: { text: string; translation: string; audioUrl?: string }[];
  }>();

  if (body.turns) {
    for (const turn of body.turns) {
      if (!turn.text?.trim() || !turn.translation?.trim()) {
        return c.json({ error: "Each turn requires text and translation" }, 400);
      }
    }
  }

  const [row] = await db
    .update(scenarios)
    .set({
      ...(body.situation ? { situation: body.situation.trim() } : {}),
      ...(body.turns ? { turns: JSON.stringify(body.turns) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(scenarios.id, id))
    .returning();

  return c.json({ ...row, turns: JSON.parse(row.turns) });
});

// DELETE /educator/scenarios/:id
educatorRouter.delete("/scenarios/:id", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const id = c.req.param("id");
  const [existing] = await db
    .select({ languageId: scenarios.languageId })
    .from(scenarios)
    .where(eq(scenarios.id, id))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  await db.delete(scenarios).where(eq(scenarios.id, id));
  return c.json({ success: true });
});
