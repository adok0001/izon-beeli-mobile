import { and, eq, inArray } from "drizzle-orm";
import { parseJson } from "../../lib/http.js";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import {
  contributions,
  courses,
  dictionaryEntries,
  feedItems,
  lessonContributions,
  lessonContributionSegments,
  lessons,
  transcriptSegments,
  users,
} from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorContributionsRouter = new Hono<AuthEnv>();

// ─── GET /educator/contributions ─────────────────────────────────────────────

educatorContributionsRouter.get("/contributions", async (c) => {
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

educatorContributionsRouter.post("/contributions/:id/review", async (c) => {
  const reviewerId = c.get("userId");
  const { id } = c.req.param();
  const { action, note } = await parseJson<{ action: "approve" | "reject"; note?: string }>(c);

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

educatorContributionsRouter.patch("/contributions/:id", async (c) => {
  const { id } = c.req.param();
  const body = await parseJson<{
    word?: string;
    english?: string;
    pronunciation?: string | null;
    example?: string | null;
    exampleTranslation?: string | null;
    category?: string;
  }>(c);

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

educatorContributionsRouter.delete("/contributions/:id", async (c) => {
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

educatorContributionsRouter.get("/lesson-contributions", async (c) => {
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

educatorContributionsRouter.post("/lesson-contributions/:id/review", async (c) => {
  const reviewerId = c.get("userId");
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();
  const { action, note } = await parseJson<{ action: "approve" | "reject"; note?: string }>(c);

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

educatorContributionsRouter.delete("/lesson-contributions/:id", async (c) => {
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
