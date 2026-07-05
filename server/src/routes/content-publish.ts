import { and, eq, lte, ne, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import {
  activities,
  auditLog,
  contentPartners,
  contentVersions,
  courses,
  culturalContent,
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
 * lessons and story arcs resolve it via their course; content partners are an
 * operational catalogue with no language scope (admin-only publish). scripts/
 * scriptCharacters/interactiveStories/cultureItems carry the same workflow
 * columns but aren't registered here yet — they need a scoping decision before
 * they can reuse this guard.
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

/** Every table listed here shares `id`, `status`, `publishAt`, `createdBy`,
 * `updatedBy` columns (Phase 2) — used by schedule-publish/unschedule-publish
 * and the scheduled-publish cron, which don't need the entity-specific
 * language-scope resolution `publishEntity`'s switch does. */
const ALL_ENTITY_TABLES = [
  { entityType: "dictionary_entries", table: dictionaryEntries },
  { entityType: "proverbs", table: proverbs },
  { entityType: "etymology_entries", table: etymologyEntries },
  { entityType: "cultural_content", table: culturalContent },
  { entityType: "sentence_templates", table: sentenceTemplates },
  { entityType: "scenarios", table: scenarios },
  { entityType: "activities", table: activities },
  { entityType: "courses", table: courses },
  { entityType: "lessons", table: lessons },
  { entityType: "story_arcs", table: storyArcs },
  { entityType: "content_partners", table: contentPartners },
  { entityType: "quiz_questions", table: quizQuestions },
] as const;

function tableFor(entityType: EntityType) {
  return ALL_ENTITY_TABLES.find((e) => e.entityType === entityType)!.table;
}

/** The subset of ALL_ENTITY_TABLES with a direct `languageId` column — excludes
 * lessons/story_arcs (course-scoped) and content_partners (no language scope),
 * which findRowScope already special-cases before falling through to this. */
const DIRECT_LANGUAGE_TABLES = [
  { entityType: "dictionary_entries", table: dictionaryEntries },
  { entityType: "proverbs", table: proverbs },
  { entityType: "etymology_entries", table: etymologyEntries },
  { entityType: "cultural_content", table: culturalContent },
  { entityType: "sentence_templates", table: sentenceTemplates },
  { entityType: "scenarios", table: scenarios },
  { entityType: "activities", table: activities },
  { entityType: "courses", table: courses },
  { entityType: "quiz_questions", table: quizQuestions },
] as const;

function directLanguageTableFor(entityType: EntityType) {
  return DIRECT_LANGUAGE_TABLES.find((e) => e.entityType === entityType)!.table;
}

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

  if (row.languageId && !actor.reviewerLanguages.includes(row.languageId)) {
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
      // Story arcs aren't language-scoped directly — resolve it via the course.
      const [course] = await db
        .select({ languageId: courses.languageId })
        .from(courses)
        .where(eq(courses.id, row.courseId))
        .limit(1);
      const guard = assertCanPublish({ languageId: course?.languageId ?? null, createdBy: row.createdBy }, actor);
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

type RowScope =
  | { adminOnly: true }
  | { adminOnly: false; languageId: string | null; createdBy: string | null; updatedBy: string | null };

/** Resolves the same language-scope + createdBy context `publishEntity`'s
 * switch derives per case, but without needing the full row — used by
 * schedule/unschedule so they enforce the identical four-eyes guard. */
async function findRowScope(entityType: EntityType, id: string): Promise<RowScope | null> {
  if (entityType === "content_partners") {
    const [row] = await db.select({ id: contentPartners.id }).from(contentPartners).where(eq(contentPartners.id, id)).limit(1);
    return row ? { adminOnly: true } : null;
  }

  if (entityType === "lessons" || entityType === "story_arcs") {
    const table = entityType === "lessons" ? lessons : storyArcs;
    const [row] = await db.select().from(table).where(eq(table.id, id)).limit(1);
    if (!row) return null;
    const [course] = await db
      .select({ languageId: courses.languageId })
      .from(courses)
      .where(eq(courses.id, row.courseId))
      .limit(1);
    return { adminOnly: false, languageId: course?.languageId ?? null, createdBy: row.createdBy, updatedBy: row.updatedBy };
  }

  const table = directLanguageTableFor(entityType);
  const [row] = await db
    .select({ languageId: table.languageId, createdBy: table.createdBy, updatedBy: table.updatedBy })
    .from(table)
    .where(eq(table.id, id))
    .limit(1);
  if (!row) return null;
  return { adminOnly: false, languageId: row.languageId, createdBy: row.createdBy, updatedBy: row.updatedBy };
}

async function setPublishAt(entityType: EntityType, id: string, publishAt: Date | null, actorId: string) {
  const table = tableFor(entityType);
  await db.update(table).set({ publishAt, updatedBy: actorId }).where(eq(table.id, id));
}

async function assertScheduleGuard(entityType: EntityType, id: string, actor: Actor): Promise<PublishResult | { ok: true }> {
  const scope = await findRowScope(entityType, id);
  if (!scope) return NOT_FOUND;
  if (scope.adminOnly) {
    if (!actor.isAdmin) return { ok: false, status: 403, error: "Forbidden: only admins can schedule partners" };
    return { ok: true };
  }
  const guard = assertCanPublish(scope, actor);
  if (!guard.ok) return guard;
  return { ok: true };
}

// POST /content/:entityType/:id/schedule-publish { publishAt: isoString }
// Guarded by the same four-eyes rule as immediate publish — checked once,
// here, at schedule time. The cron that flips status later doesn't re-check
// it (see publishDueScheduled), since setting publishAt already proved the
// actor was allowed to publish.
contentPublishRouter.post("/:entityType/:id/schedule-publish", async (c) => {
  const entityType = c.req.param("entityType");
  const id = c.req.param("id");
  if (!isEntityType(entityType)) {
    return c.json({ error: `Unknown or unpublishable entityType: ${entityType}` }, 400);
  }

  const body = await c.req.json<{ publishAt?: string }>().catch(() => ({}) as { publishAt?: string });
  const publishAt = body.publishAt ? new Date(body.publishAt) : null;
  if (!publishAt || Number.isNaN(publishAt.getTime())) {
    return c.json({ error: "publishAt must be a valid ISO date string" }, 400);
  }

  const actor: Actor = {
    userId: c.get("userId"),
    isAdmin: c.get("isAdmin"),
    reviewerLanguages: c.get("reviewerLanguages"),
    reviewerRole: c.get("reviewerRole"),
  };

  const guard = await assertScheduleGuard(entityType, id, actor);
  if (!guard.ok) return c.json({ error: guard.error }, guard.status);

  await setPublishAt(entityType, id, publishAt, actor.userId);
  await db.insert(auditLog).values({
    actorId: actor.userId,
    action: "schedule_publish",
    entityType,
    entityId: id,
    after: { publishAt: publishAt.toISOString() },
  });

  return c.json({ ok: true, publishAt: publishAt.toISOString() });
});

// POST /content/:entityType/:id/unschedule-publish
contentPublishRouter.post("/:entityType/:id/unschedule-publish", async (c) => {
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

  const guard = await assertScheduleGuard(entityType, id, actor);
  if (!guard.ok) return c.json({ error: guard.error }, guard.status);

  await setPublishAt(entityType, id, null, actor.userId);
  await db.insert(auditLog).values({
    actorId: actor.userId,
    action: "unschedule_publish",
    entityType,
    entityId: id,
  });

  return c.json({ ok: true });
});

/**
 * Called by the /api/internal/publish-scheduled cron. For every row whose
 * publishAt has arrived and isn't published yet, publish it as the person who
 * scheduled it (the guard already ran once, at schedule time — see
 * schedule-publish above) — so this never re-checks the four-eyes rule.
 * Rows with no createdBy/updatedBy (should not happen in practice) are
 * skipped rather than risking an actorId that fails the users FK.
 */
export async function publishDueScheduled(): Promise<{ entityType: EntityType; id: string; result: PublishResult }[]> {
  const now = new Date();
  const results: { entityType: EntityType; id: string; result: PublishResult }[] = [];

  for (const { entityType, table } of ALL_ENTITY_TABLES) {
    const dueRows = await db
      .select({ id: table.id, createdBy: table.createdBy, updatedBy: table.updatedBy })
      .from(table)
      .where(and(lte(table.publishAt, now), ne(table.status, "published")));

    for (const row of dueRows) {
      const actorId = row.updatedBy ?? row.createdBy;
      if (!actorId) continue;
      const actor: Actor = { userId: actorId, isAdmin: true, reviewerLanguages: [], reviewerRole: null };
      const result = await publishEntity(entityType, row.id, actor);
      results.push({ entityType, id: row.id, result });
    }
  }

  return results;
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
