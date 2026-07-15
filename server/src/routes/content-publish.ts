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
