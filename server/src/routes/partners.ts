import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { contentPartners } from "../db/schema.js";
import { AuthEnv, adminMiddleware, authMiddleware } from "../middleware/auth.js";

export const partnersRouter = new Hono();
export const partnersAdminRouter = new Hono<AuthEnv>();

// GET /api/partners — public, active partners only
partnersRouter.get("/", async (c) => {
  const rows = await db
    .select()
    .from(contentPartners)
    .where(eq(contentPartners.isActive, true))
    .orderBy(contentPartners.name);
  return c.json(rows);
});

// Admin partner management (admin only). Unlike the public list, these return
// every partner regardless of active/published state so the studio can edit them.
partnersAdminRouter.use("*", authMiddleware, adminMiddleware);

// GET /api/partners/admin — all partners
partnersAdminRouter.get("/", async (c) => {
  const rows = await db.select().from(contentPartners).orderBy(contentPartners.name);
  return c.json(rows);
});

partnersAdminRouter.post("/", async (c) => {
  const body = await c.req.json<{
    id: string;
    name: string;
    type: string;
    region?: string;
    url?: string;
    logoUrl?: string;
    languageIds?: string[];
  }>();

  if (!body.id || !body.name || !body.type) {
    return c.json({ error: "id, name, and type are required" }, 400);
  }

  const [partner] = await db
    .insert(contentPartners)
    .values({
      id: body.id,
      name: body.name,
      type: body.type,
      region: body.region,
      url: body.url,
      logoUrl: body.logoUrl,
      languageIds: body.languageIds ?? [],
      isActive: true,
      status: "draft",
      createdBy: c.get("userId"),
    })
    .onConflictDoUpdate({
      target: contentPartners.id,
      set: {
        name: body.name,
        type: body.type,
        region: body.region,
        url: body.url,
        logoUrl: body.logoUrl,
        languageIds: body.languageIds ?? [],
        updatedBy: c.get("userId"),
      },
    })
    .returning();

  return c.json(partner, 201);
});

// PATCH /api/partners/admin/:id — update partner fields
partnersAdminRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select().from(contentPartners).where(eq(contentPartners.id, id)).limit(1);
  if (!existing) return c.json({ error: "Partner not found" }, 404);

  const body = await c.req.json<Partial<{
    name: string;
    type: string;
    region: string | null;
    url: string | null;
    logoUrl: string | null;
    languageIds: string[];
    isActive: boolean;
  }>>();

  const updates: Record<string, unknown> = { updatedBy: c.get("userId") };
  for (const key of ["name", "type", "region", "url", "logoUrl", "languageIds", "isActive"] as const) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const [updated] = await db
    .update(contentPartners)
    .set(updates)
    .where(eq(contentPartners.id, id))
    .returning();

  return c.json(updated);
});

// DELETE /api/partners/admin/:id
partnersAdminRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select().from(contentPartners).where(eq(contentPartners.id, id)).limit(1);
  if (!existing) return c.json({ error: "Partner not found" }, 404);
  await db.delete(contentPartners).where(eq(contentPartners.id, id));
  return c.json({ success: true });
});

// PATCH /api/partners/admin/:id/toggle — activate/deactivate
partnersAdminRouter.patch("/:id/toggle", async (c) => {
  const id = c.req.param("id");
  const current = await db.select().from(contentPartners).where(eq(contentPartners.id, id)).limit(1);
  if (!current.length) return c.json({ error: "Partner not found" }, 404);

  const [updated] = await db
    .update(contentPartners)
    .set({ isActive: !current[0].isActive })
    .where(eq(contentPartners.id, id))
    .returning();

  return c.json(updated);
});
