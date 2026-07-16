import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { canDoChecks, lessons } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

/**
 * Can-do self-checks — the reflective Movement-completion moment. When a
 * learner finishes a Movement's lessons, the app shows its can-do statements
 * as "Can you now …?" and records an honest self-rating. Never a blocker:
 * ratings surface on the profile, the next Unit stays open regardless.
 */
export const canDoRouter = new Hono<AuthEnv>();

canDoRouter.use("*", authMiddleware);

const RATINGS = ["yes", "mostly", "not_yet"] as const;

// GET /api/can-do/course/:courseId — the course's can-do statements + the user's ratings
canDoRouter.get("/course/:courseId", async (c) => {
  const userId = c.get("userId");
  const { courseId } = c.req.param();

  const rows = await db
    .select({ lessonId: lessons.id, canDo: lessons.canDo, canDoFr: lessons.canDoFr, order: lessons.order })
    .from(lessons)
    .where(and(eq(lessons.courseId, courseId), isNotNull(lessons.canDo), eq(lessons.isActive, true)))
    .orderBy(lessons.order);

  if (rows.length === 0) return c.json({ items: [] });

  const ratings = await db
    .select({ lessonId: canDoChecks.lessonId, rating: canDoChecks.rating })
    .from(canDoChecks)
    .where(and(eq(canDoChecks.userId, userId), inArray(canDoChecks.lessonId, rows.map((r) => r.lessonId))));
  const ratingByLesson = new Map(ratings.map((r) => [r.lessonId, r.rating]));

  return c.json({
    items: rows.map((r) => ({
      lessonId: r.lessonId,
      canDo: r.canDo,
      canDoFr: r.canDoFr,
      rating: ratingByLesson.get(r.lessonId) ?? null,
    })),
  });
});

// POST /api/can-do/:lessonId — record (or update) a self-rating
canDoRouter.post("/:lessonId", async (c) => {
  const userId = c.get("userId");
  const { lessonId } = c.req.param();
  const body = await parseJson<{ rating: (typeof RATINGS)[number] }>(c);
  if (!RATINGS.includes(body.rating)) {
    return c.json({ error: `rating must be one of: ${RATINGS.join(", ")}` }, 400);
  }

  const [lesson] = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);

  await db
    .insert(canDoChecks)
    .values({ userId, lessonId, rating: body.rating })
    .onConflictDoUpdate({
      target: [canDoChecks.userId, canDoChecks.lessonId],
      set: { rating: body.rating, ratedAt: new Date() },
    });

  return c.json({ saved: true });
});

// GET /api/can-do/mine — all of the user's ratings (profile résumé)
canDoRouter.get("/mine", async (c) => {
  const userId = c.get("userId");
  const rows = await db
    .select({ lessonId: canDoChecks.lessonId, rating: canDoChecks.rating, ratedAt: canDoChecks.ratedAt })
    .from(canDoChecks)
    .where(eq(canDoChecks.userId, userId));
  return c.json(rows);
});
