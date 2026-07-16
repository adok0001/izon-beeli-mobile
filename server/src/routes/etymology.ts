import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { etymologyEntries } from "../db/schema.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";

interface EtymologyNode {
  era: string;
  form: string;
  language: string;
  note: string;
}

function parseRow(row: typeof etymologyEntries.$inferSelect) {
  return { ...row, trail: JSON.parse(row.trail) as EtymologyNode[] };
}

export const etymologyRouter = new Hono();

// GET /etymology?languageId=  (omit for all)
etymologyRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (languageId && languageId.length > 64) {
    return c.json({ error: "languageId too long" }, 400);
  }

  // Learner read: hide entries an editor has deactivated.
  const rows = languageId
    ? await db
        .select()
        .from(etymologyEntries)
        .where(and(eq(etymologyEntries.languageId, languageId), eq(etymologyEntries.isActive, true)))
    : await db.select().from(etymologyEntries).where(eq(etymologyEntries.isActive, true));

  return c.json(rows.map(parseRow));
});

// ── Educator / Admin write routes ─────────────────────────────────────────────

export const etymologyAdminRouter = new Hono<AuthEnv>();
etymologyAdminRouter.use("*", authMiddleware);
etymologyAdminRouter.use("*", reviewerMiddleware);

// GET /etymology/admin?languageId= — editor list. Unlike the public read, this
// returns inactive entries too so Studio can see and re-activate hidden rows.
etymologyAdminRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (languageId && languageId.length > 64) {
    return c.json({ error: "languageId too long" }, 400);
  }
  const rows = languageId
    ? await db.select().from(etymologyEntries).where(eq(etymologyEntries.languageId, languageId))
    : await db.select().from(etymologyEntries);
  return c.json(rows.map(parseRow));
});

// POST /etymology/admin
etymologyAdminRouter.post("/", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const body = await parseJson<{
    languageId: string;
    word: string;
    english: string;
    trail: EtymologyNode[];
  }>(c);

  const { languageId, word, english, trail } = body;
  if (!languageId || !word || !english || !Array.isArray(trail) || trail.length === 0) {
    return c.json({ error: "languageId, word, english, and a non-empty trail are required" }, 400);
  }
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const [inserted] = await db
    .insert(etymologyEntries)
    .values({ id: randomUUID(), languageId, word, english, trail: JSON.stringify(trail) })
    .returning();

  return c.json(parseRow(inserted), 201);
});

// PATCH /etymology/admin/:id
etymologyAdminRouter.patch("/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const id = c.req.param("id");

  const [existing] = await db.select().from(etymologyEntries).where(eq(etymologyEntries.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const body = await parseJson<Partial<{ word: string; english: string; trail: EtymologyNode[] }>>(c);
  const updates: Partial<typeof etymologyEntries.$inferInsert> = {};
  if (body.word !== undefined) updates.word = body.word;
  if (body.english !== undefined) updates.english = body.english;
  if (body.trail !== undefined) updates.trail = JSON.stringify(body.trail);

  const [updated] = await db.update(etymologyEntries).set(updates).where(eq(etymologyEntries.id, id)).returning();
  return c.json(parseRow(updated));
});

// DELETE /etymology/admin/:id
etymologyAdminRouter.delete("/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const id = c.req.param("id");

  const [existing] = await db.select().from(etymologyEntries).where(eq(etymologyEntries.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  await db.delete(etymologyEntries).where(eq(etymologyEntries.id, id));
  return c.json({ success: true });
});
