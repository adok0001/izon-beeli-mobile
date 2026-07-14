import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { courses, cultureItems, lessons, storyArcCast, storyArcs, storyChapters } from "../db/schema.js";

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
          style: lessons.style,
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
      // "skit" | "immersive_story" | "host_narrated" — drives the style chip.
      lessonStyle: l?.style ?? null,
      // A chapter is "playable" only when its lesson is live. Seeded podcast
      // episodes stay isActive:false until native-speaker recording lands.
      lessonIsActive: l?.isActive ?? false,
    };
  });
}

/**
 * The season "bible" the Series screen needs: recurring cast, the companion
 * courses that drill this season's world (level bands are derived from these),
 * and the films set in it.
 *
 * All of this lived in mobile's `SERIES_REGISTRY`, a bundled TS file compiled
 * into the app. Serving it here is what let that bundle be deleted.
 */
async function seasonExtras(arcId: string) {
  const [cast, companionCourses, films] = await Promise.all([
    db
      .select({
        castId: storyArcCast.castId,
        name: storyArcCast.name,
        role: storyArcCast.role,
        avatar: storyArcCast.avatar,
        hue: storyArcCast.hue,
      })
      .from(storyArcCast)
      .where(eq(storyArcCast.storyArcId, arcId))
      .orderBy(storyArcCast.order),
    db
      .select({
        id: courses.id,
        title: courses.title,
        level: courses.level,
        order: courses.order,
      })
      .from(courses)
      .where(and(eq(courses.seasonArcId, arcId), eq(courses.isActive, true)))
      .orderBy(courses.order),
    db
      .select({ id: cultureItems.id, storyId: cultureItems.interactiveStoryId, title: cultureItems.title })
      .from(cultureItems)
      .where(
        and(
          eq(cultureItems.seasonArcId, arcId),
          eq(cultureItems.type, "film"),
          eq(cultureItems.status, "published")
        )
      ),
  ]);

  return {
    cast,
    companionCourses,
    // The Series screen's "Also in this world" rail matches Discover cards on
    // the interactive story they open.
    filmStoryIds: films.map((f) => f.storyId).filter((s): s is string => !!s),
  };
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

  return c.json({
    ...arc,
    chapters: await enrichChapters(chapters),
    ...(await seasonExtras(arc.id)),
  });
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

  return c.json({
    ...arc,
    chapters: await enrichChapters(chapters),
    ...(await seasonExtras(arc.id)),
  });
});
