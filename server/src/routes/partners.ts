import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { contentPartners } from "../db/schema.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

export const partnersRouter = new Hono();
export const partnersAdminRouter = new Hono();

// GET /api/partners — public, active partners only
partnersRouter.get("/", async (c) => {
  const rows = await db
    .select()
    .from(contentPartners)
    .where(eq(contentPartners.isActive, true))
    .orderBy(contentPartners.name);
  return c.json(rows);
});

// POST /api/partners/admin — create partner (admin only)
partnersAdminRouter.use("*", authMiddleware, adminMiddleware);

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
      },
    })
    .returning();

  return c.json(partner, 201);
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
