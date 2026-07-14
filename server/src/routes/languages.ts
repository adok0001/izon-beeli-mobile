import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { courses, culturalContent, dictionaryEntries, languages } from "../db/schema.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

export const languagesRouter = new Hono();

// GET /api/languages
languagesRouter.get("/", async (c) => {
  const result = await db
    .select()
    .from(languages)
    .orderBy(asc(languages.region), asc(languages.name));

  return c.json(result);
});

// ── Admin write routes ────────────────────────────────────────────────────────
// Languages are structural, not editorial content, so there is no draft/publish
// workflow here — just admin-only CRUD on the catalogue itself.

export const languagesAdminRouter = new Hono();
languagesAdminRouter.use("*", authMiddleware, adminMiddleware);

// POST /api/languages/admin — create a language
languagesAdminRouter.post("/", async (c) => {
  const body = await c.req.json<{
    id: string;
    name: string;
    nativeName: string;
    region: string;
    isActive?: boolean;
  }>();

  const id = body.id?.trim();
  if (!id || !body.name?.trim() || !body.nativeName?.trim() || !body.region?.trim()) {
    return c.json({ error: "id, name, nativeName, and region are required" }, 400);
  }

  const [existing] = await db.select({ id: languages.id }).from(languages).where(eq(languages.id, id)).limit(1);
  if (existing) return c.json({ error: "A language with this id already exists" }, 409);

  const [created] = await db
    .insert(languages)
    .values({
      id,
      name: body.name.trim(),
      nativeName: body.nativeName.trim(),
      region: body.region.trim(),
      isActive: body.isActive ?? true,
    })
    .returning();

  return c.json(created, 201);
});

// PATCH /api/languages/admin/:id — update a language
languagesAdminRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select().from(languages).where(eq(languages.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const body = await c.req.json<
    Partial<{ name: string; nativeName: string; region: string; isActive: boolean }>
  >();
  const updates: Record<string, unknown> = {};
  for (const key of ["name", "nativeName", "region"] as const) {
    if (body[key] !== undefined) updates[key] = body[key]?.trim();
  }
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (Object.keys(updates).length === 0) return c.json(existing);

  const [updated] = await db.update(languages).set(updates).where(eq(languages.id, id)).returning();
  return c.json(updated);
});

// DELETE /api/languages/admin/:id
languagesAdminRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select({ id: languages.id }).from(languages).where(eq(languages.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  // Deleting a language that still owns content would orphan every course,
  // lesson, transcript and culture note beneath it — the entire library for that
  // language, from one click. Refuse, and say what is in the way.
  const blockers: string[] = [];
  for (const [label, rows] of [
    ["course", await db.select({ id: courses.id }).from(courses).where(eq(courses.languageId, id)).limit(1)],
    ["culture note", await db.select({ id: culturalContent.id }).from(culturalContent).where(eq(culturalContent.languageId, id)).limit(1)],
    ["dictionary entry", await db.select({ id: dictionaryEntries.id }).from(dictionaryEntries).where(eq(dictionaryEntries.languageId, id)).limit(1)],
  ] as const) {
    if (rows.length > 0) blockers.push(label);
  }

  if (blockers.length > 0) {
    return c.json(
      { error: `This language still has content (${blockers.join(", ")}). Delete or reassign it before removing the language.` },
      409,
    );
  }

  await db.delete(languages).where(eq(languages.id, id));
  return c.json({ success: true });
});
