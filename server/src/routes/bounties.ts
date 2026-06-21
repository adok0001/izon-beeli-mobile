import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { bounties, contributions, users } from "../db/schema.js";
import { professorMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";

const submissionSelectFields = {
  id: contributions.id,
  word: contributions.word,
  english: contributions.english,
  category: contributions.category,
  languageId: contributions.languageId,
  type: contributions.type,
  status: contributions.status,
  audioUrl: contributions.audioUrl,
  imageUrl: contributions.imageUrl,
  userId: contributions.userId,
  submitterName: users.name,
  bountyId: contributions.bountyId,
  bountyXpAwarded: contributions.bountyXpAwarded,
  createdAt: contributions.createdAt,
};

const bountySelectFields = {
  id: bounties.id,
  title: bounties.title,
  description: bounties.description,
  languageId: bounties.languageId,
  category: bounties.category,
  contributionType: bounties.contributionType,
  targetCount: bounties.targetCount,
  currentCount: bounties.currentCount,
  xpReward: bounties.xpReward,
  status: bounties.status,
  expiresAt: bounties.expiresAt,
  createdBy: bounties.createdBy,
  createdAt: bounties.createdAt,
  createdByName: users.name,
};

function withProgress<T extends { targetCount: number; currentCount: number }>(
  b: T
) {
  return {
    ...b,
    progressPercent:
      b.targetCount > 0
        ? Math.min(100, Math.round((b.currentCount / b.targetCount) * 100))
        : 0,
  };
}

// ---- Public router ----
export const bountiesRouter = new Hono();

// GET /api/bounties — list active, non-expired bounties with creator name
bountiesRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  const category = c.req.query("category");

  const conditions = [eq(bounties.status, "active")];
  if (languageId) conditions.push(eq(bounties.languageId, languageId));
  if (category) conditions.push(eq(bounties.category, category));

  const rows = await db
    .select(bountySelectFields)
    .from(bounties)
    .leftJoin(users, eq(bounties.createdBy, users.id))
    .where(
      and(
        ...conditions,
        sql`(${bounties.expiresAt} IS NULL OR ${bounties.expiresAt} > NOW())`
      )
    )
    .orderBy(desc(bounties.xpReward));

  return c.json(rows.map(withProgress));
});

// GET /api/bounties/:id — single bounty with creator name
bountiesRouter.get("/:id", async (c) => {
  const { id } = c.req.param();
  const [bounty] = await db
    .select(bountySelectFields)
    .from(bounties)
    .leftJoin(users, eq(bounties.createdBy, users.id))
    .where(eq(bounties.id, id))
    .limit(1);

  if (!bounty) return c.json({ error: "Bounty not found" }, 404);
  return c.json(withProgress(bounty));
});

// ---- Admin router — requires Clerk auth + isAdmin ----
export const bountiesAdminRouter = new Hono<AuthEnv>();

bountiesAdminRouter.use("*", authMiddleware);
bountiesAdminRouter.use("*", professorMiddleware);

// GET /api/bounties/admin — all bounties (all statuses) for management
bountiesAdminRouter.get("/", async (c) => {
  const rows = await db
    .select(bountySelectFields)
    .from(bounties)
    .leftJoin(users, eq(bounties.createdBy, users.id))
    .orderBy(desc(bounties.createdAt));

  return c.json(rows.map(withProgress));
});

// GET /api/bounties/admin/:id/submissions — contributions targeting this bounty.
// `pending` = submitted contributions awaiting review. `credited` = approved.
bountiesAdminRouter.get("/:id/submissions", async (c) => {
  const { id } = c.req.param();

  const [bounty] = await db
    .select({ id: bounties.id })
    .from(bounties)
    .where(eq(bounties.id, id))
    .limit(1);

  if (!bounty) return c.json({ error: "Bounty not found" }, 404);

  const byStatus = (status: "submitted" | "approved") =>
    db
      .select(submissionSelectFields)
      .from(contributions)
      .leftJoin(users, eq(contributions.userId, users.id))
      .where(and(eq(contributions.bountyId, id), eq(contributions.status, status)))
      .orderBy(desc(contributions.createdAt));

  const [pending, credited] = await Promise.all([byStatus("submitted"), byStatus("approved")]);

  return c.json({ bountyId: id, pending, credited });
});

// POST /api/bounties/admin/create
bountiesAdminRouter.post("/create", async (c) => {
  const createdBy = c.get("userId");

  const body = await c.req.json<{
    title: string;
    description: string;
    languageId: string;
    category?: string;
    contributionType?: "word" | "phrase" | "audio";
    targetCount: number;
    xpReward: number;
    expiresAt?: string;
  }>();

  if (
    !body.title?.trim() ||
    !body.description?.trim() ||
    !body.languageId?.trim() ||
    !body.targetCount ||
    !body.xpReward
  ) {
    return c.json(
      { error: "title, description, languageId, targetCount, and xpReward are required" },
      400
    );
  }

  if (body.title.length > 300 || body.description.length > 1000 || body.languageId.length > 32) {
    return c.json({ error: "Field length exceeded" }, 400);
  }

  if (!Number.isInteger(body.targetCount) || body.targetCount < 1 || body.targetCount > 10000) {
    return c.json({ error: "targetCount must be an integer between 1 and 10000" }, 400);
  }

  if (!Number.isInteger(body.xpReward) || body.xpReward < 1 || body.xpReward > 1000) {
    return c.json({ error: "xpReward must be an integer between 1 and 1000" }, 400);
  }

  const validTypes = ["word", "phrase", "audio"];
  if (body.contributionType && !validTypes.includes(body.contributionType)) {
    return c.json({ error: "contributionType must be word, phrase, or audio" }, 400);
  }

  const [bounty] = await db
    .insert(bounties)
    .values({
      title: body.title,
      description: body.description,
      languageId: body.languageId,
      category: body.category || null,
      contributionType: body.contributionType || null,
      targetCount: body.targetCount,
      xpReward: body.xpReward,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      createdBy,
    })
    .returning();

  return c.json(bounty, 201);
});

// PATCH /api/bounties/admin/:id — update status / fields
bountiesAdminRouter.patch("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    status?: "active" | "completed" | "cancelled";
    title?: string;
    description?: string;
    targetCount?: number;
    xpReward?: number;
    expiresAt?: string | null;
  }>();

  const validStatuses = ["active", "completed", "cancelled"];
  if (body.status && !validStatuses.includes(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }
  if (body.targetCount != null && (!Number.isInteger(body.targetCount) || body.targetCount < 1)) {
    return c.json({ error: "targetCount must be a positive integer" }, 400);
  }
  if (body.xpReward != null && (!Number.isInteger(body.xpReward) || body.xpReward < 1)) {
    return c.json({ error: "xpReward must be a positive integer" }, 400);
  }

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.title?.trim()) updates.title = body.title.trim();
  if (body.description?.trim()) updates.description = body.description.trim();
  if (body.targetCount != null) updates.targetCount = body.targetCount;
  if (body.xpReward != null) updates.xpReward = body.xpReward;
  if (body.expiresAt !== undefined) {
    updates.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  const [updated] = await db
    .update(bounties)
    .set(updates)
    .where(eq(bounties.id, id))
    .returning();

  if (!updated) return c.json({ error: "Bounty not found" }, 404);
  return c.json(updated);
});

// DELETE /api/bounties/admin/:id — cancel a bounty
bountiesAdminRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();

  const [updated] = await db
    .update(bounties)
    .set({ status: "cancelled" })
    .where(eq(bounties.id, id))
    .returning();

  if (!updated) return c.json({ error: "Bounty not found" }, 404);
  return c.json({ cancelled: true, id: updated.id });
});
