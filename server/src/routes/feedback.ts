import { Hono } from "hono";
import { db } from "../db/index.js";
import { feedback } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

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

  if (!category || !VALID_CATEGORIES.includes(category as any)) {
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
