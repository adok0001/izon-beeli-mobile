import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import {
  activities,
  auditLog,
  contentPartners,
  contentVersions,
  courses,
  culturalContent,
  cultureItems,
  dictionaryEntries,
  etymologyEntries,
  lessons,
  proverbs,
  quizQuestions,
  scenarios,
  sentenceTemplates,
  storyArcs,
  storyChapters,
} from "../db/schema.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";

/**
 * POST /content/:entityType/:id/publish
 *
 * The one guarded entry point that flips Beeli Studio content live: sets
 * status='published', stamps publishedBy/publishedAt, and records a
 * content_versions snapshot + audit_log row. Both shells (web and mobile)
 * call this same endpoint so the four-eyes rule can't be bypassed by editing
 * a row directly.
 *
 * Directly language-scoped entities resolve scope from their own row;
 * lessons and story arcs resolve it via their course; interactive stories are
 * scoped via their own `language` column (aliased to languageId below, since
 * the column predates this workflow and wasn't named to match); content
 * partners are an operational catalogue with no language scope (admin-only
 * publish). Film stories live in `cultureItems` (folded from interactive
 * stories) and publish scoped by their own `language` column under the
 * `interactive_stories` entity value. scripts/scriptCharacters carry the same
 * workflow columns but aren't registered here yet — they need a scoping
 * decision before they can reuse this guard.
 */
export const contentPublishRouter = new Hono<AuthEnv>();
contentPublishRouter.use("*", authMiddleware);
contentPublishRouter.use("*", reviewerMiddleware);

export const ENTITY_TYPES = [
  "dictionary_entries",
  "proverbs",
  "etymology_entries",
  "cultural_content",
  "sentence_templates",
  "scenarios",
  "activities",
  "courses",
  "lessons",
  "story_arcs",
  "content_partners",
  "quiz_questions",
  "interactive_stories",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export function isEntityType(value: string): value is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(value);
}

/**
 * Entities that expose the Studio active/inactive visibility toggle. Distinct
 * from ENTITY_TYPES (the publishable set): `story_chapters` toggles but never
 * publishes, and `courses`/`lessons`/`content_partners` already have their own
 * dedicated toggles elsewhere, so they're excluded here. `interactive_stories`
 * and `culture_items` both resolve to the `culture_items` table.
 */
export const ACTIVE_TOGGLE_TYPES = [
  "dictionary_entries",
  "proverbs",
  "etymology_entries",
  "cultural_content",
  "sentence_templates",
  "scenarios",
  "activities",
  "story_arcs",
  "story_chapters",
  "quiz_questions",
  "interactive_stories",
  "culture_items",
] as const;
export type ActiveToggleType = (typeof ACTIVE_TOGGLE_TYPES)[number];

export function isActiveToggleType(value: string): value is ActiveToggleType {
  return (ACTIVE_TOGGLE_TYPES as readonly string[]).includes(value);
}

export type Actor = {
  userId: string;
  isAdmin: boolean;
  reviewerLanguages: string[];
  reviewerRole: string | null;
};

type PublishResult =
  | { ok: true; row: unknown }
  | { ok: false; status: 403 | 404; error: string };

/**
 * The four-eyes rule, enforced once here rather than per entity: a
 * teacher-role reviewer can never publish their own draft — only a
 * professor, elder, or admin can. Everyone stays scoped to their assigned
 * languages regardless of role.
 */
function assertCanPublish(
  row: { languageId: string | null; createdBy: string | null },
  actor: Actor
): { ok: true } | { ok: false; status: 403; error: string } {
  if (actor.isAdmin) return { ok: true };

  if (!row.languageId) {
    return { ok: false, status: 403, error: "Forbidden: only admins can publish language-agnostic content" };
  }
  if (!actor.reviewerLanguages.includes(row.languageId)) {
    return { ok: false, status: 403, error: "Forbidden: not assigned to this language" };
  }

  if (actor.reviewerRole === "teacher" && row.createdBy === actor.userId) {
    return {
      ok: false,
      status: 403,
      error: "Forbidden: teachers cannot publish their own submissions — a professor or elder must publish it",
    };
  }

  return { ok: true };
}

/**
 * Scope guard for the active/inactive toggle. Same language scoping as
 * publishing, but WITHOUT the four-eyes teacher rule: hiding/showing a row is
 * reversible and doesn't move content live, so a teacher may toggle their own
 * work. Language-agnostic rows stay admin-only.
 */
function assertCanToggleActive(
  row: { languageId: string | null },
  actor: Actor
): { ok: true } | { ok: false; status: 403; error: string } {
  if (actor.isAdmin) return { ok: true };
  if (!row.languageId) {
    return { ok: false, status: 403, error: "Forbidden: only admins can toggle language-agnostic content" };
  }
  if (!actor.reviewerLanguages.includes(row.languageId)) {
    return { ok: false, status: 403, error: "Forbidden: not assigned to this language" };
  }
  return { ok: true };
}

/** Snapshot the published row and log the action. Shared regardless of entity. */
async function recordPublish(
  entityType: EntityType,
  entityId: string,
  actorId: string,
  before: unknown,
  after: unknown
) {
  const [{ maxVersion }] = await db
    .select({ maxVersion: sql<number>`coalesce(max(${contentVersions.version}), 0)::int` })
    .from(contentVersions)
    .where(and(eq(contentVersions.entityType, entityType), eq(contentVersions.entityId, entityId)));

  await db.insert(contentVersions).values({
    entityType,
    entityId,
    version: maxVersion + 1,
    snapshot: after,
    createdBy: actorId,
  });

  await db.insert(auditLog).values({
    actorId,
    action: "publish",
    entityType,
    entityId,
    before,
    after,
  });
}

const NOT_FOUND: PublishResult = { ok: false, status: 404, error: "Not found" };

async function publishEntity(entityType: EntityType, id: string, actor: Actor): Promise<PublishResult> {
  switch (entityType) {
    case "dictionary_entries": {
      const [row] = await db.select().from(dictionaryEntries).where(eq(dictionaryEntries.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(dictionaryEntries)
        .set({ status: "published", updatedBy: actor.userId, publishedBy: actor.userId, publishedAt: new Date() })
        .where(eq(dictionaryEntries.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "proverbs": {
      const [row] = await db.select().from(proverbs).where(eq(proverbs.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(proverbs)
        .set({ status: "published", updatedBy: actor.userId, publishedBy: actor.userId, publishedAt: new Date() })
        .where(eq(proverbs.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "etymology_entries": {
      const [row] = await db.select().from(etymologyEntries).where(eq(etymologyEntries.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(etymologyEntries)
        .set({ status: "published", updatedBy: actor.userId, publishedBy: actor.userId, publishedAt: new Date() })
        .where(eq(etymologyEntries.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "cultural_content": {
      const [row] = await db.select().from(culturalContent).where(eq(culturalContent.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(culturalContent)
        .set({ status: "published", updatedBy: actor.userId, publishedBy: actor.userId, publishedAt: new Date() })
        .where(eq(culturalContent.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "sentence_templates": {
      const [row] = await db.select().from(sentenceTemplates).where(eq(sentenceTemplates.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(sentenceTemplates)
        .set({ status: "published", updatedBy: actor.userId, publishedBy: actor.userId, publishedAt: new Date() })
        .where(eq(sentenceTemplates.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "scenarios": {
      const [row] = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(scenarios)
        .set({
          status: "published",
          updatedBy: actor.userId,
          publishedBy: actor.userId,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(scenarios.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "activities": {
      const [row] = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(activities)
        .set({
          status: "published",
          updatedBy: actor.userId,
          publishedBy: actor.userId,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(activities.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "courses": {
      const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(courses)
        .set({ status: "published", updatedBy: actor.userId, publishedBy: actor.userId, publishedAt: new Date() })
        .where(eq(courses.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "lessons": {
      const [row] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      // Lessons aren't language-scoped directly — resolve it via the course.
      const [course] = await db
        .select({ languageId: courses.languageId })
        .from(courses)
        .where(eq(courses.id, row.courseId))
        .limit(1);
      const guard = assertCanPublish({ languageId: course?.languageId ?? null, createdBy: row.createdBy }, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(lessons)
        .set({ status: "published", updatedBy: actor.userId, publishedBy: actor.userId, publishedAt: new Date() })
        .where(eq(lessons.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "story_arcs": {
      const [row] = await db.select().from(storyArcs).where(eq(storyArcs.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish({ languageId: row.languageId, createdBy: row.createdBy }, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(storyArcs)
        .set({
          status: "published",
          updatedBy: actor.userId,
          publishedBy: actor.userId,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(storyArcs.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "interactive_stories": {
      // Interactive stories were folded into `culture_items` (a film IS its
      // story). The entity value stays `interactive_stories` for client
      // compatibility, but it publishes the film row scoped by its `language`.
      const [row] = await db
        .select()
        .from(cultureItems)
        .where(and(eq(cultureItems.id, id), eq(cultureItems.type, "film")))
        .limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish({ languageId: row.language, createdBy: row.createdBy }, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(cultureItems)
        .set({
          status: "published",
          updatedBy: actor.userId,
          publishedBy: actor.userId,
          studioPublishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(cultureItems.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "content_partners": {
      // Partners aren't language-scoped; they're an operational catalogue, so
      // only admins publish them (reviewers never manage partners).
      if (!actor.isAdmin) {
        return { ok: false, status: 403, error: "Forbidden: only admins can publish partners" };
      }
      const [row] = await db.select().from(contentPartners).where(eq(contentPartners.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const [after] = await db
        .update(contentPartners)
        .set({ status: "published", updatedBy: actor.userId, publishedBy: actor.userId, publishedAt: new Date() })
        .where(eq(contentPartners.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }

    case "quiz_questions": {
      const [row] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, id)).limit(1);
      if (!row) return NOT_FOUND;
      const guard = assertCanPublish(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(quizQuestions)
        .set({
          status: "published",
          updatedBy: actor.userId,
          publishedBy: actor.userId,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(quizQuestions.id, id))
        .returning();
      await recordPublish(entityType, id, actor.userId, row, after);
      return { ok: true, row: after };
    }
  }
}

type ToggleResult =
  | { ok: true; row: unknown }
  | { ok: false; status: 403 | 404; error: string };

const TOGGLE_NOT_FOUND: ToggleResult = { ok: false, status: 404, error: "Not found" };

/** Log the visibility flip. No content_versions snapshot — it isn't an edit. */
async function recordActiveToggle(
  entityType: ActiveToggleType,
  entityId: string,
  actorId: string,
  before: unknown,
  after: unknown,
  isActive: boolean
) {
  await db.insert(auditLog).values({
    actorId,
    action: isActive ? "activate" : "deactivate",
    entityType,
    entityId,
    before,
    after,
  });
}

/**
 * Flip a content row's `is_active` flag. Mirrors publishEntity's per-entity
 * scope resolution, but writes only `isActive` (+ `updatedBy` where the column
 * exists) and guards with the lighter assertCanToggleActive (no four-eyes).
 */
async function setEntityActive(
  entityType: ActiveToggleType,
  id: string,
  isActive: boolean,
  actor: Actor
): Promise<ToggleResult> {
  switch (entityType) {
    case "dictionary_entries": {
      const [row] = await db.select().from(dictionaryEntries).where(eq(dictionaryEntries.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(dictionaryEntries)
        .set({ isActive, updatedBy: actor.userId })
        .where(eq(dictionaryEntries.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    case "proverbs": {
      const [row] = await db.select().from(proverbs).where(eq(proverbs.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(proverbs)
        .set({ isActive, updatedBy: actor.userId })
        .where(eq(proverbs.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    case "etymology_entries": {
      const [row] = await db.select().from(etymologyEntries).where(eq(etymologyEntries.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(etymologyEntries)
        .set({ isActive, updatedBy: actor.userId })
        .where(eq(etymologyEntries.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    case "cultural_content": {
      const [row] = await db.select().from(culturalContent).where(eq(culturalContent.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(culturalContent)
        .set({ isActive, updatedBy: actor.userId })
        .where(eq(culturalContent.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    case "sentence_templates": {
      const [row] = await db.select().from(sentenceTemplates).where(eq(sentenceTemplates.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(sentenceTemplates)
        .set({ isActive, updatedBy: actor.userId })
        .where(eq(sentenceTemplates.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    case "scenarios": {
      const [row] = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(scenarios)
        .set({ isActive, updatedBy: actor.userId, updatedAt: new Date() })
        .where(eq(scenarios.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    case "activities": {
      const [row] = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(activities)
        .set({ isActive, updatedBy: actor.userId, updatedAt: new Date() })
        .where(eq(activities.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    case "quiz_questions": {
      const [row] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive(row, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(quizQuestions)
        .set({ isActive, updatedBy: actor.userId, updatedAt: new Date() })
        .where(eq(quizQuestions.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    case "story_arcs": {
      const [row] = await db.select().from(storyArcs).where(eq(storyArcs.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive({ languageId: row.languageId }, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(storyArcs)
        .set({ isActive, updatedBy: actor.userId, updatedAt: new Date() })
        .where(eq(storyArcs.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    case "story_chapters": {
      const [row] = await db.select().from(storyChapters).where(eq(storyChapters.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      // Chapters aren't language-scoped directly — resolve it via the parent arc.
      const [arc] = await db
        .select({ languageId: storyArcs.languageId })
        .from(storyArcs)
        .where(eq(storyArcs.id, row.storyArcId))
        .limit(1);
      const guard = assertCanToggleActive({ languageId: arc?.languageId ?? null }, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(storyChapters)
        .set({ isActive })
        .where(eq(storyChapters.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }

    // Films (interactive_stories) and other culture items both live in
    // culture_items, scoped by the `language` column.
    case "interactive_stories":
    case "culture_items": {
      const [row] = await db.select().from(cultureItems).where(eq(cultureItems.id, id)).limit(1);
      if (!row) return TOGGLE_NOT_FOUND;
      const guard = assertCanToggleActive({ languageId: row.language }, actor);
      if (!guard.ok) return guard;
      const [after] = await db
        .update(cultureItems)
        .set({ isActive, updatedBy: actor.userId, updatedAt: new Date() })
        .where(eq(cultureItems.id, id))
        .returning();
      await recordActiveToggle(entityType, id, actor.userId, row, after, isActive);
      return { ok: true, row: after };
    }
  }
}

contentPublishRouter.post("/:entityType/:id/active", async (c) => {
  const entityType = c.req.param("entityType");
  const id = c.req.param("id");

  if (!isActiveToggleType(entityType)) {
    return c.json({ error: `Unknown or non-toggleable entityType: ${entityType}` }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  if (typeof body.isActive !== "boolean") {
    return c.json({ error: "Body must include a boolean `isActive`" }, 400);
  }

  const actor: Actor = {
    userId: c.get("userId"),
    isAdmin: c.get("isAdmin"),
    reviewerLanguages: c.get("reviewerLanguages"),
    reviewerRole: c.get("reviewerRole"),
  };

  const result = await setEntityActive(entityType, id, body.isActive, actor);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.row);
});

contentPublishRouter.post("/:entityType/:id/publish", async (c) => {
  const entityType = c.req.param("entityType");
  const id = c.req.param("id");

  if (!isEntityType(entityType)) {
    return c.json({ error: `Unknown or unpublishable entityType: ${entityType}` }, 400);
  }

  const actor: Actor = {
    userId: c.get("userId"),
    isAdmin: c.get("isAdmin"),
    reviewerLanguages: c.get("reviewerLanguages"),
    reviewerRole: c.get("reviewerRole"),
  };

  const result = await publishEntity(entityType, id, actor);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.row);
});
