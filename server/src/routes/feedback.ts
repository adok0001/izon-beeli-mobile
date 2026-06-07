import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { feedback, users } from "../db/schema.js";
import { adminMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";

const VALID_CATEGORIES = ["bug", "suggestion", "other"] as const;

export const feedbackRouter = new Hono<AuthEnv>();

feedbackRouter.use("*", authMiddleware);

feedbackRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    category: string;
    message: string;
    platform?: string;
    osVersion?: string;
    appVersion?: string;
  }>();

  const { category, message, platform, osVersion, appVersion } = body;

  if (!category || !(VALID_CATEGORIES as readonly string[]).includes(category)) {
    return c.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      400
    );
  }

  if (!message?.trim() || message.trim().length > 2000) {
    return c.json(
      { error: "message must be non-empty and at most 2000 characters" },
      400
    );
  }

  await db.insert(feedback).values({
    userId,
    category: category as (typeof VALID_CATEGORIES)[number],
    message: message.trim(),
    platform: platform || null,
    osVersion: osVersion || null,
    appVersion: appVersion || null,
  });

  return c.json({ success: true }, 201);
});

// ── Admin: list all feedback ───────────────────────────────────────────────────

export const feedbackAdminRouter = new Hono<AuthEnv>();
feedbackAdminRouter.use("*", authMiddleware);
feedbackAdminRouter.use("*", adminMiddleware);

// GET /api/feedback/admin?limit=100&offset=0
feedbackAdminRouter.get("/", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 100), 200);
  const offset = Number(c.req.query("offset") ?? 0);

  const rows = await db
    .select({
      id: feedback.id,
      category: feedback.category,
      message: feedback.message,
      platform: feedback.platform,
      osVersion: feedback.osVersion,
      appVersion: feedback.appVersion,
      createdAt: feedback.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.userId, users.id))
    .orderBy(desc(feedback.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json(rows);
});

// DELETE /api/feedback/admin/:id
feedbackAdminRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await db.delete(feedback).where(eq(feedback.id, id)).returning({ id: feedback.id });
  if (deleted.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ success: true });
});
