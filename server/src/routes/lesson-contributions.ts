import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import {
    courses,
    feedItems,
    lessonContributions,
    lessonContributionSegments,
    lessons,
    transcriptSegments,
    users,
} from "../db/schema.js";
import { adminMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";

const VALID_REVIEW_ACTIONS = ["approve", "reject"] as const;

interface SegmentInput {
  text: string;
  translation?: string;
  startTime?: number;
  endTime?: number;
  order: number;
}

export const lessonContributionsRouter = new Hono<AuthEnv>();
lessonContributionsRouter.use("*", authMiddleware);

// POST /api/lesson-contributions
lessonContributionsRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const formData = await c.req.formData();

  const languageId = (formData.get("languageId") as string) ?? "";
  const courseId = (formData.get("courseId") as string) || undefined;
  const title = (formData.get("title") as string) ?? "";
  const description = (formData.get("description") as string) ?? "";
  const durationStr = formData.get("duration") as string | null;
  const duration = durationStr ? parseInt(durationStr, 10) : undefined;
  const segmentsJson = (formData.get("segments") as string) ?? "[]";

  if (!languageId || !title?.trim() || !description?.trim()) {
    return c.json({ error: "languageId, title, and description are required" }, 400);
  }

  let segments: SegmentInput[] = [];
  try {
    segments = JSON.parse(segmentsJson);
  } catch {
    return c.json({ error: "Invalid segments JSON" }, 400);
  }

  const audioFile = formData.get("audio") as File | null;
  if (!audioFile) {
    return c.json({ error: "Audio file is required" }, 400);
  }

  let audioUrl: string;
  try {
    const blob = await put(
      `lesson-contributions/${userId}/${Date.now()}-${audioFile.name}`,
      audioFile,
      { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
    );
    audioUrl = blob.url;
  } catch {
    return c.json({ error: "Failed to upload audio file" }, 500);
  }

  const [contribution] = await db
    .insert(lessonContributions)
    .values({
      userId,
      languageId,
      courseId: courseId || null,
      title: title.trim(),
      description: description.trim(),
      audioUrl,
      duration: duration && !isNaN(duration) ? duration : null,
    })
    .returning();

  if (segments.length > 0) {
    // Validate segments: sorted by startTime, no overlaps, endTime >= startTime
    const timedSegs = segments.filter(
      (s) => s.startTime != null && s.endTime != null
    );

    if (timedSegs.length > 0) {
      for (const seg of timedSegs) {
        if (seg.endTime! < seg.startTime!) {
          return c.json(
            { error: `Segment "${seg.text.slice(0, 20)}..." has endTime before startTime` },
            400
          );
        }
        if (duration != null && seg.endTime! > duration) {
          return c.json(
            { error: `Segment endTime ${seg.endTime} exceeds lesson duration ${duration}` },
            400
          );
        }
      }

      const sorted = [...timedSegs].sort((a, b) => a.startTime! - b.startTime!);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startTime! < sorted[i - 1].endTime!) {
          return c.json(
            {
              error: `Segments overlap: "${sorted[i - 1].text.slice(0, 20)}..." and "${sorted[i].text.slice(0, 20)}..."`,
            },
            400
          );
        }
      }
    }

    await db.insert(lessonContributionSegments).values(
      segments.map((seg) => ({
        lessonContributionId: contribution.id,
        text: seg.text,
        translation: seg.translation || null,
        startTime: seg.startTime ?? null,
        endTime: seg.endTime ?? null,
        order: seg.order,
      }))
    );
  }

  const [user] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db.insert(feedItems).values({
    userId,
    type: "contribution",
    title: `New lesson: ${title.trim()}`,
    description: `Submitted a lesson contribution for ${languageId}`,
    userName: user?.name ?? "User",
    userAvatarUrl: user?.avatarUrl,
    audioUrl,
  });

  return c.json(contribution, 201);
});

// GET /api/lesson-contributions/pending
lessonContributionsRouter.get("/pending", async (c) => {
  const contributions = await db
    .select({
      id: lessonContributions.id,
      userId: lessonContributions.userId,
      languageId: lessonContributions.languageId,
      courseId: lessonContributions.courseId,
      title: lessonContributions.title,
      description: lessonContributions.description,
      audioUrl: lessonContributions.audioUrl,
      duration: lessonContributions.duration,
      status: lessonContributions.status,
      createdAt: lessonContributions.createdAt,
      userName: users.name,
    })
    .from(lessonContributions)
    .leftJoin(users, eq(lessonContributions.userId, users.id))
    .where(eq(lessonContributions.status, "submitted"))
    .orderBy(desc(lessonContributions.createdAt));

  // Fetch segments for all contributions
  const ids = contributions.map((c) => c.id);
  let segmentRows: (typeof lessonContributionSegments.$inferSelect)[] = [];
  if (ids.length > 0) {
    segmentRows = await db
      .select()
      .from(lessonContributionSegments)
      .where(inArray(lessonContributionSegments.lessonContributionId, ids))
      .orderBy(lessonContributionSegments.order);
  }

  // Attach segments to each contribution
  const segmentsByContrib = segmentRows.reduce<Record<string, typeof segmentRows>>((acc, seg) => {
    if (!acc[seg.lessonContributionId]) acc[seg.lessonContributionId] = [];
    acc[seg.lessonContributionId].push(seg);
    return acc;
  }, {});

  const result = contributions.map((contrib) => ({
    ...contrib,
    segments: segmentsByContrib[contrib.id] ?? [],
  }));

  return c.json(result);
});

// PATCH /api/lesson-contributions/:id/review (admin only)
lessonContributionsRouter.patch("/:id/review", adminMiddleware, async (c) => {
  const reviewerId = c.get("userId");
  const { id } = c.req.param();
  const body = await c.req.json<{ action: string; note?: string }>();
  const action = body.action;

  if (!VALID_REVIEW_ACTIONS.includes(action as any)) {
    return c.json({ error: "action must be 'approve' or 'reject'" }, 400);
  }

  const [contribution] = await db
    .select()
    .from(lessonContributions)
    .where(eq(lessonContributions.id, id))
    .limit(1);

  if (!contribution) {
    return c.json({ error: "Lesson contribution not found" }, 404);
  }

  if (contribution.status === "approved") {
    return c.json({ error: "Lesson contribution already approved" }, 409);
  }

  if (action === "reject") {
    const [updated] = await db
      .update(lessonContributions)
      .set({
        status: "rejected",
        reviewNote: body.note?.trim() || null,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(lessonContributions.id, id))
      .returning();
    return c.json(updated);
  }

  // Approve: create lesson + transcript segments
  const lessonId = `lesson-contrib-${randomUUID()}`;

  // Resolve courseId — use contribution's courseId or a default fallback course for the language
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
    return c.json({ error: "No course available for this language. Assign a courseId first." }, 400);
  }

  await db.insert(lessons).values({
    id: lessonId,
    courseId,
    title: contribution.title,
    description: contribution.description,
    audioUrl: contribution.audioUrl,
    duration: contribution.duration,
    order: 999,
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
        startTime: seg.startTime ?? 0,
        endTime: seg.endTime ?? 0,
        text: seg.text,
        translation: seg.translation,
        order: seg.order,
      }))
    );
  }

  // Increment course lessonsCount
  const [course] = await db
    .select({ lessonsCount: courses.lessonsCount })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (course) {
    await db
      .update(courses)
      .set({ lessonsCount: course.lessonsCount + 1 })
      .where(eq(courses.id, courseId));
  }

  const [updated] = await db
    .update(lessonContributions)
    .set({
      status: "approved",
      reviewNote: body.note?.trim() || null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(lessonContributions.id, id))
    .returning();

  return c.json({ ...updated, lessonId });
});
