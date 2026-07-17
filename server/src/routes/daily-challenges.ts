import { Hono } from "hono";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { challengeTypeEnum, dailyChallenges, dailyChallengeTemplates } from "../db/schema.js";
import { adminMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { getOrCreateTodayChallenges } from "../lib/daily-challenge.js";
import { flatToMap, parseMap } from "./educator/_shared.js";
import { randomInt } from "node:crypto";

export const dailyChallengesRouter = new Hono<AuthEnv>();

dailyChallengesRouter.use("*", authMiddleware);

// GET /api/daily-challenges/today
dailyChallengesRouter.get("/today", async (c) => {
  const userId = c.get("userId");
  const challenges = await getOrCreateTodayChallenges(userId);
  return c.json(challenges);
});

// POST /api/daily-challenges/today/refresh
dailyChallengesRouter.post("/today/refresh", async (c) => {
  const userId = c.get("userId");
  const today = new Date().toISOString().slice(0, 10);

  const existing = await db
    .select()
    .from(dailyChallenges)
    .where(and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today)));

  if (existing.length > 0 && existing.every((r) => r.completed)) {
    return c.json({ error: "All challenges already completed" }, 409);
  }

  // Delete only the incomplete challenges so completed ones are preserved
  const incompleteIds = existing.filter((r) => !r.completed).map((r) => r.id);
  if (incompleteIds.length > 0) {
    await db.delete(dailyChallenges).where(inArray(dailyChallenges.id, incompleteIds));
  }

  const seed = randomInt(1_000_000);
  const challenges = await getOrCreateTodayChallenges(userId, seed);
  return c.json(challenges);
});

// GET /api/daily-challenges/history - last 7 days
dailyChallengesRouter.get("/history", async (c) => {
  const userId = c.get("userId");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(dailyChallenges)
    .where(
      and(
        eq(dailyChallenges.userId, userId),
        gte(dailyChallenges.date, cutoffDate)
      )
    )
    .orderBy(dailyChallenges.date);

  return c.json(rows);
});

// ---- Admin router — requires Clerk auth + isAdmin ----
export const dailyChallengeTemplatesAdminRouter = new Hono<AuthEnv>();

dailyChallengeTemplatesAdminRouter.use("*", authMiddleware, adminMiddleware);

const CHALLENGE_TYPES = challengeTypeEnum.enumValues;
type ChallengeType = (typeof CHALLENGE_TYPES)[number];

function isChallengeType(value: unknown): value is ChallengeType {
  return typeof value === "string" && (CHALLENGE_TYPES as readonly string[]).includes(value);
}

// GET /api/daily-challenges/admin — all templates (active + inactive)
dailyChallengeTemplatesAdminRouter.get("/", async (c) => {
  const rows = await db
    .select()
    .from(dailyChallengeTemplates)
    .orderBy(desc(dailyChallengeTemplates.createdAt));

  return c.json(rows);
});

// POST /api/daily-challenges/admin/create
dailyChallengeTemplatesAdminRouter.post("/create", async (c) => {
  const body = await parseJson<{
    challengeType: string;
    title: string;
    titleFr?: string;
    titleTranslations?: unknown;
    description: string;
    descriptionFr?: string;
    descriptionTranslations?: unknown;
    xpReward: number;
    targetCasual: number;
    targetSteady: number;
    targetIntensive: number;
    active?: boolean;
  }>(c);

  // Prefer the full translations map; fall back to legacy flat title/titleFr.
  const titleMap = parseMap(body.titleTranslations) ?? flatToMap(body.title, body.titleFr);
  const descriptionMap = parseMap(body.descriptionTranslations) ?? flatToMap(body.description, body.descriptionFr);
  const title = titleMap?.en;
  const description = descriptionMap?.en;

  if (
    !isChallengeType(body.challengeType) ||
    !title?.trim() ||
    !description?.trim() ||
    !body.xpReward ||
    !body.targetCasual ||
    !body.targetSteady ||
    !body.targetIntensive
  ) {
    return c.json(
      {
        error:
          "challengeType, title (English), description (English), xpReward, targetCasual, targetSteady, and targetIntensive are required",
      },
      400
    );
  }

  if (title.length > 2000 || description.length > 2000) {
    return c.json({ error: "Field length exceeded" }, 400);
  }

  for (const [field, value] of [
    ["xpReward", body.xpReward],
    ["targetCasual", body.targetCasual],
    ["targetSteady", body.targetSteady],
    ["targetIntensive", body.targetIntensive],
  ] as const) {
    if (!Number.isInteger(value) || value < 1 || value > 1000) {
      return c.json({ error: `${field} must be an integer between 1 and 1000` }, 400);
    }
  }

  const [template] = await db
    .insert(dailyChallengeTemplates)
    .values({
      challengeType: body.challengeType,
      title: title.trim(),
      titleFr: titleMap?.fr ?? null,
      titleTranslations: titleMap ?? null,
      description: description.trim(),
      descriptionFr: descriptionMap?.fr ?? null,
      descriptionTranslations: descriptionMap ?? null,
      xpReward: body.xpReward,
      targetCasual: body.targetCasual,
      targetSteady: body.targetSteady,
      targetIntensive: body.targetIntensive,
      active: body.active ?? true,
    })
    .returning();

  return c.json(template, 201);
});

// PATCH /api/daily-challenges/admin/:id
dailyChallengeTemplatesAdminRouter.patch("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await parseJson<{
    challengeType?: string;
    title?: string;
    titleFr?: string | null;
    titleTranslations?: unknown;
    description?: string;
    descriptionFr?: string | null;
    descriptionTranslations?: unknown;
    xpReward?: number;
    targetCasual?: number;
    targetSteady?: number;
    targetIntensive?: number;
    active?: boolean;
  }>(c);

  if (body.challengeType !== undefined && !isChallengeType(body.challengeType)) {
    return c.json({ error: "Invalid challengeType" }, 400);
  }

  for (const field of ["xpReward", "targetCasual", "targetSteady", "targetIntensive"] as const) {
    const value = body[field];
    if (value != null && (!Number.isInteger(value) || value < 1 || value > 1000)) {
      return c.json({ error: `${field} must be an integer between 1 and 1000` }, 400);
    }
  }

  const titleMap = body.titleTranslations !== undefined || body.title !== undefined || body.titleFr !== undefined
    ? parseMap(body.titleTranslations) ?? flatToMap(body.title, body.titleFr)
    : undefined;
  const descriptionMap = body.descriptionTranslations !== undefined || body.description !== undefined || body.descriptionFr !== undefined
    ? parseMap(body.descriptionTranslations) ?? flatToMap(body.description, body.descriptionFr)
    : undefined;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.challengeType) updates.challengeType = body.challengeType;
  if (titleMap?.en?.trim()) {
    updates.title = titleMap.en.trim();
    updates.titleFr = titleMap.fr ?? null;
    updates.titleTranslations = titleMap;
  }
  if (descriptionMap?.en?.trim()) {
    updates.description = descriptionMap.en.trim();
    updates.descriptionFr = descriptionMap.fr ?? null;
    updates.descriptionTranslations = descriptionMap;
  }
  if (body.xpReward != null) updates.xpReward = body.xpReward;
  if (body.targetCasual != null) updates.targetCasual = body.targetCasual;
  if (body.targetSteady != null) updates.targetSteady = body.targetSteady;
  if (body.targetIntensive != null) updates.targetIntensive = body.targetIntensive;
  if (body.active !== undefined) updates.active = body.active;

  const [updated] = await db
    .update(dailyChallengeTemplates)
    .set(updates)
    .where(eq(dailyChallengeTemplates.id, id))
    .returning();

  if (!updated) return c.json({ error: "Template not found" }, 404);
  return c.json(updated);
});

// DELETE /api/daily-challenges/admin/:id — deactivate (soft delete)
dailyChallengeTemplatesAdminRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();

  const [updated] = await db
    .update(dailyChallengeTemplates)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(dailyChallengeTemplates.id, id))
    .returning();

  if (!updated) return c.json({ error: "Template not found" }, 404);
  return c.json({ deactivated: true, id: updated.id });
});
