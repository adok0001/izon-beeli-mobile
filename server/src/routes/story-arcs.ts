import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { storyArcs, storyChapters } from "../db/schema.js";

export const storyArcsRouter = new Hono();

// GET /story-arcs — all arc summaries (public, for mobile to know which courses have a story)
storyArcsRouter.get("/", async (c) => {
  const arcs = await db
    .select({ id: storyArcs.id, courseId: storyArcs.courseId, title: storyArcs.title })
    .from(storyArcs)
    .orderBy(storyArcs.courseId);
  return c.json(arcs);
});

// GET /story-arcs/:courseId — full arc with chapters (public)
storyArcsRouter.get("/:courseId", async (c) => {
  const { courseId } = c.req.param();

  const [arc] = await db
    .select()
    .from(storyArcs)
    .where(eq(storyArcs.courseId, courseId))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);

  const chapters = await db
    .select()
    .from(storyChapters)
    .where(eq(storyChapters.storyArcId, arc.id))
    .orderBy(storyChapters.order);

  return c.json({ ...arc, chapters });
});
