import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { storyArcs, storyChapters, lessons } from "../db/schema.js";

export const storyArcsRouter = new Hono();

type ChapterRow = typeof storyChapters.$inferSelect;

/**
 * Enrich chapters with the linked lesson's live state so a Series screen can
 * render level grouping, runtime, and lock badges without a second round-trip.
 * `level` is parsed from the podcast lesson's `scene` ("podcast.<level>").
 */
async function enrichChapters(chapters: ChapterRow[]) {
  const lessonIds = chapters.map((ch) => ch.lessonId);
  const rows = lessonIds.length
    ? await db
        .select({
          id: lessons.id,
          scene: lessons.scene,
          duration: lessons.duration,
          isActive: lessons.isActive,
          genre: lessons.genre,
        })
        .from(lessons)
        .where(inArray(lessons.id, lessonIds))
    : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  return chapters.map((ch) => {
    const l = byId.get(ch.lessonId);
    const level =
      l?.scene && l.scene.startsWith("podcast.")
        ? l.scene.slice("podcast.".length)
        : null;
    return {
      ...ch,
      level,
      lessonDuration: l?.duration ?? null,
      lessonGenre: l?.genre ?? null,
      // A chapter is "playable" only when its lesson is live. Seeded podcast
      // episodes stay isActive:false until native-speaker recording lands.
      lessonIsActive: l?.isActive ?? false,
    };
  });
}

// GET /story-arcs — all arc summaries (public, for mobile to know which courses have a story)
storyArcsRouter.get("/", async (c) => {
  const arcs = await db
    .select({ id: storyArcs.id, courseId: storyArcs.courseId, title: storyArcs.title })
    .from(storyArcs)
    .where(eq(storyArcs.status, "published"))
    .orderBy(storyArcs.courseId);
  return c.json(arcs);
});

// GET /story-arcs/arc/:id — full arc with enriched chapters, looked up by arc id.
// Discover cards carry the arc id as `storyId`, so this lets the Series screen
// resolve straight from a card without knowing the courseId. Registered before
// the "/:courseId" param route; the extra path segment keeps them distinct.
storyArcsRouter.get("/arc/:id", async (c) => {
  const { id } = c.req.param();

  const [arc] = await db
    .select()
    .from(storyArcs)
    .where(and(eq(storyArcs.id, id), eq(storyArcs.status, "published")))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);

  const chapters = await db
    .select()
    .from(storyChapters)
    .where(eq(storyChapters.storyArcId, arc.id))
    .orderBy(storyChapters.order);

  return c.json({ ...arc, chapters: await enrichChapters(chapters) });
});

// GET /story-arcs/:courseId — full arc with enriched chapters (public)
storyArcsRouter.get("/:courseId", async (c) => {
  const { courseId } = c.req.param();

  const [arc] = await db
    .select()
    .from(storyArcs)
    .where(and(eq(storyArcs.courseId, courseId), eq(storyArcs.status, "published")))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);

  const chapters = await db
    .select()
    .from(storyChapters)
    .where(eq(storyChapters.storyArcId, arc.id))
    .orderBy(storyChapters.order);

  return c.json({ ...arc, chapters: await enrichChapters(chapters) });
});
