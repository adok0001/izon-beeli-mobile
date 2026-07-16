import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { appConfig } from "../db/schema.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

/**
 * Admin feature-flag / config editor over the `app_config` key-value store.
 * Mounted at /api/admin/config. Replaces the previous single inline PATCH so
 * the Studio has a real surface: list every flag, upsert one, delete one.
 */
export const appConfigAdminRouter = new Hono();
appConfigAdminRouter.use("*", authMiddleware, adminMiddleware);

// GET /api/admin/config — list all config keys/values
appConfigAdminRouter.get("/", async (c) => {
  const rows = await db.select().from(appConfig).orderBy(asc(appConfig.key));
  return c.json(rows);
});

// PATCH /api/admin/config — upsert a config value (create or update a flag)
appConfigAdminRouter.patch("/", async (c) => {
  const body = await parseJson<{ key: string; value: string }>(c);
  const key = body.key?.trim();
  if (!key || typeof body.value !== "string") {
    return c.json({ error: "key and value are required" }, 400);
  }
  await db
    .insert(appConfig)
    .values({ key, value: body.value })
    .onConflictDoUpdate({ target: appConfig.key, set: { value: body.value } });
  return c.json({ ok: true, key, value: body.value });
});

// DELETE /api/admin/config/:key — remove a config key
appConfigAdminRouter.delete("/:key", async (c) => {
  const key = c.req.param("key");
  const [existing] = await db.select({ key: appConfig.key }).from(appConfig).where(eq(appConfig.key, key)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(appConfig).where(eq(appConfig.key, key));
  return c.json({ success: true });
});
