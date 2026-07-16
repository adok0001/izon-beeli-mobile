import { eq, inArray } from "drizzle-orm";
import { parseJson } from "../../lib/http.js";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../../db/index.js";
import { courses, lessons, storyArcCast, storyArcs, storyChapters } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorStoryArcsRouter = new Hono<AuthEnv>();

// ─── Story Arcs ───────────────────────────────────────────────────────────────

function canAccessLanguage(isAdmin: boolean, reviewerLanguages: string[], languageId: string | null) {
  return isAdmin || (languageId != null && reviewerLanguages.includes(languageId));
}

// GET /educator/story-arcs — arcs within the educator's language scope
educatorStoryArcsRouter.get("/story-arcs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const rows = await db
    .select({
      id: storyArcs.id,
      courseId: storyArcs.courseId,
      languageId: storyArcs.languageId,
      title: storyArcs.title,
      description: storyArcs.description,
      updatedAt: storyArcs.updatedAt,
      status: storyArcs.status,
      createdBy: storyArcs.createdBy,
    })
    .from(storyArcs)
    .orderBy(storyArcs.courseId);

  const visible = rows.filter((r) => canAccessLanguage(isAdmin, reviewerLanguages, r.languageId));

  return c.json(visible);
});

// GET /educator/story-arcs/:courseId — arc with chapters for a specific course
/**
 * Categorical accents a cast avatar can be tinted with. Mirrors the `AccentHue`
 * union in mobile/constants/accent-colors.ts — an unknown hue would fall back to
 * a default tint, so reject it at the door rather than store it.
 */
const CAST_HUES = [
  "rose", "purple", "blue", "teal", "indigo",
  "orange", "green", "amber", "sky", "pink", "fuchsia",
] as const;

/** Everything the arc editor needs: the season's own fields, its cast, its chapters. */
const ARC_COLUMNS = {
  id: storyArcs.id,
  courseId: storyArcs.courseId,
  languageId: storyArcs.languageId,
  title: storyArcs.title,
  description: storyArcs.description,
  nativeTitle: storyArcs.nativeTitle,
  logline: storyArcs.logline,
} as const;

async function arcDetail(arc: { id: string; languageId: string | null }) {
  const [chapters, cast] = await Promise.all([
    db.select().from(storyChapters).where(eq(storyChapters.storyArcId, arc.id)).orderBy(storyChapters.order),
    db
      .select({
        castId: storyArcCast.castId,
        name: storyArcCast.name,
        role: storyArcCast.role,
        hue: storyArcCast.hue,
      })
      .from(storyArcCast)
      .where(eq(storyArcCast.storyArcId, arc.id))
      .orderBy(storyArcCast.order),
  ]);
  return { ...arc, chapters, cast };
}

// GET /educator/story-arcs/arc/:id — load a season by its own id.
//
// Registered before "/:courseId" so the extra path segment keeps them distinct.
// This is the only way to open a STANDALONE season (courseId null) — a
// cross-course narrative like a podcast has no owning course to look it up by,
// which is why the editor used to refuse them outright.
educatorStoryArcsRouter.get("/story-arcs/arc/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db.select(ARC_COLUMNS).from(storyArcs).where(eq(storyArcs.id, id)).limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json(await arcDetail(arc));
});

educatorStoryArcsRouter.get("/story-arcs/:courseId", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { courseId } = c.req.param();

  const [arc] = await db
    .select(ARC_COLUMNS)
    .from(storyArcs)
    .where(eq(storyArcs.courseId, courseId))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json(await arcDetail(arc));
});

// POST /educator/story-arcs — create a story arc, either bound to a course or standalone
educatorStoryArcsRouter.post("/story-arcs", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const body = await parseJson<{
    courseId?: string;
    languageId?: string;
    title: string;
    description: string;
    nativeTitle?: string;
    logline?: string;
  }>(c);
  const { courseId, title, description } = body;

  if (!title?.trim() || !description?.trim()) {
    return c.json({ error: "title and description are required" }, 400);
  }

  let languageId = body.languageId ?? null;

  if (courseId) {
    const [course] = await db.select({ languageId: courses.languageId }).from(courses)
      .where(eq(courses.id, courseId)).limit(1);
    if (!course) return c.json({ error: "Course not found" }, 404);
    languageId = course.languageId;
  }

  if (!languageId) {
    return c.json({ error: "languageId is required when courseId is not set" }, 400);
  }
  if (!canAccessLanguage(isAdmin, reviewerLanguages, languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = `story-arc-${randomUUID()}`;
  await db.insert(storyArcs).values({
    id,
    courseId: courseId ?? null,
    languageId,
    title: title.trim(),
    description: description.trim(),
    nativeTitle: body.nativeTitle?.trim() || null,
    logline: body.logline?.trim() || null,
    status: "draft",
    createdBy: c.get("userId"),
  });

  return c.json({ id }, 201);
});

// PUT /educator/story-arcs/:id — update arc title and description
educatorStoryArcsRouter.put("/story-arcs/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: storyArcs.languageId })
    .from(storyArcs)
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await parseJson<{
    title?: string;
    description?: string;
    status?: string;
    nativeTitle?: string | null;
    logline?: string | null;
  }>(c);
  const updates: Record<string, unknown> = { updatedAt: new Date(), updatedBy: c.get("userId") };
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  // Season "bible" fields — the target-language title (e.g. "Bou Mie") and the
  // one-line hook shown on the Series screen. Empty string clears them.
  if (body.nativeTitle !== undefined) updates.nativeTitle = body.nativeTitle?.trim() || null;
  if (body.logline !== undefined) updates.logline = body.logline?.trim() || null;
  // Editors may move an arc between draft/in_review/archived; going live only
  // happens through POST /content/story_arcs/:id/publish (four-eyes guard).
  if (body.status !== undefined && ["draft", "in_review", "archived"].includes(body.status)) {
    updates.status = body.status;
  }

  await db.update(storyArcs).set(updates).where(eq(storyArcs.id, id));
  return c.json({ success: true });
});

// DELETE /educator/story-arcs/:id — delete arc and all its chapters
educatorStoryArcsRouter.delete("/story-arcs/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: storyArcs.languageId })
    .from(storyArcs)
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db.delete(storyChapters).where(eq(storyChapters.storyArcId, id));
  await db.delete(storyArcs).where(eq(storyArcs.id, id));

  return c.json({ success: true });
});

// PUT /educator/story-arcs/:id/chapters — replace all chapters (bulk upsert)
educatorStoryArcsRouter.put("/story-arcs/:id/chapters", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: storyArcs.languageId, courseId: storyArcs.courseId })
    .from(storyArcs)
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  // Story fold-in: a course-bound arc's narrative lives ON its lessons
  // (lessons.narrative_intro/outro) and its order IS the lesson order — bulk
  // chapter writes only remain for standalone podcast seasons.
  if (arc.courseId) {
    return c.json(
      { error: "This story is bound to a course. Edit narrative and order on the course's lessons instead." },
      409,
    );
  }

  const body = await parseJson<{
    chapters: { id?: string; lessonId: string; title: string; narrativeIntro: string; narrativeOutro: string; order: number }[];
  }>(c);

  for (const ch of body.chapters) {
    if (!ch.lessonId || !ch.title?.trim() || !ch.narrativeIntro?.trim() || !ch.narrativeOutro?.trim()) {
      return c.json({ error: "Each chapter requires lessonId, title, narrativeIntro, and narrativeOutro" }, 400);
    }
  }

  // Every chapter must point at a lesson that exists. Without this the arc
  // silently stores a dangling lessonId and the season renders a chapter with
  // no episode behind it.
  const lessonIds = [...new Set(body.chapters.map((ch) => ch.lessonId))];
  if (lessonIds.length > 0) {
    const found = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(inArray(lessons.id, lessonIds));
    const foundIds = new Set(found.map((l) => l.id));
    const missing = lessonIds.filter((lessonId) => !foundIds.has(lessonId));
    if (missing.length > 0) {
      return c.json({ error: `No such lesson: ${missing.join(", ")}` }, 400);
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

// PUT /educator/story-arcs/:id/cast — replace the season's recurring cast.
//
// Replace-all, like chapters: the editor owns the whole list, so a save is the
// authoritative set rather than a diff.
educatorStoryArcsRouter.put("/story-arcs/:id/cast", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const { id } = c.req.param();

  const [arc] = await db
    .select({ languageId: storyArcs.languageId })
    .from(storyArcs)
    .where(eq(storyArcs.id, id))
    .limit(1);

  if (!arc) return c.json({ error: "Not found" }, 404);
  if (!canAccessLanguage(isAdmin, reviewerLanguages, arc.languageId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await parseJson<{
    cast: { castId: string; name: string; role: string; hue: string }[];
  }>(c);

  for (const member of body.cast) {
    if (!member.castId?.trim() || !member.name?.trim() || !member.role?.trim()) {
      return c.json({ error: "Each cast member requires castId, name, and role" }, 400);
    }
    if (!CAST_HUES.includes(member.hue as (typeof CAST_HUES)[number])) {
      return c.json({ error: `"${member.hue}" is not a valid hue` }, 400);
    }
  }

  // castId is what a transcript segment's `speaker` refers to, so a duplicate
  // would make the avatar lookup ambiguous.
  const ids = body.cast.map((m) => m.castId.trim());
  const duplicate = ids.find((castId, i) => ids.indexOf(castId) !== i);
  if (duplicate) {
    return c.json({ error: `Duplicate cast id: ${duplicate}` }, 400);
  }

  await db.delete(storyArcCast).where(eq(storyArcCast.storyArcId, id));

  if (body.cast.length > 0) {
    await db.insert(storyArcCast).values(
      body.cast.map((member, i) => ({
        storyArcId: id,
        castId: member.castId.trim(),
        name: member.name.trim(),
        role: member.role.trim(),
        hue: member.hue,
        order: i,
      }))
    );
  }

  await db.update(storyArcs).set({ updatedAt: new Date() }).where(eq(storyArcs.id, id));

  return c.json({ success: true, count: body.cast.length });
});
