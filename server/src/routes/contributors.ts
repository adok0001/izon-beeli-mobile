import { Hono } from "hono";
import { eq, and, count, inArray, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { contributions, users } from "../db/schema.js";

export const contributorsRouter = new Hono();

// GET /api/contributors?languageId=izon - top contributors ranked by approved count
contributorsRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");

  const conditions = [eq(contributions.status, "approved")];
  if (languageId && languageId.length <= 32) {
    conditions.push(eq(contributions.languageId, languageId));
  }

  const rows = await db
    .select({
      userId: contributions.userId,
      approvedCount: count(contributions.id),
    })
    .from(contributions)
    .where(and(...conditions))
    .groupBy(contributions.userId)
    .orderBy(desc(count(contributions.id)))
    .limit(20);

  if (rows.length === 0) return c.json([]);

  const userIds = rows.map((r) => r.userId);

  const userRows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, userIds));

  const userMap = new Map(userRows.map((u) => [u.id, u.name]));

  const result = rows.map((r) => ({
    id: r.userId,
    name: userMap.get(r.userId) ?? "Unknown",
    approvedCount: Number(r.approvedCount),
  }));

  return c.json(result);
});
