import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "../db/index.js";
import { users, appConfig } from "../db/schema.js";
import type { AuthEnv } from "./auth.js";

/**
 * Returns true if the global plus_enabled flag is on.
 * When the flag is off, Plus features are free for everyone.
 */
export async function isPlusGloballyEnabled(): Promise<boolean> {
  const [row] = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, "plus_enabled"))
    .limit(1);
  return row?.value === "true";
}

/**
 * Soft gate: if plus is globally enabled, requires the user to have planTier = "plus".
 * If plus is globally disabled, always passes through (features stay free).
 */
export const plusGate = createMiddleware<AuthEnv>(async (c, next) => {
  const enabled = await isPlusGloballyEnabled();
  if (!enabled) return next();

  const userId = c.get("userId");
  const [user] = await db
    .select({ planTier: users.planTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.planTier !== "plus") {
    return c.json({ error: "plus_subscription_required" }, 402);
  }

  await next();
});
