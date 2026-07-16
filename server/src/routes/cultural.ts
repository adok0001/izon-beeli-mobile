import { Hono } from "hono";
import { eq, asc, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import { culturalContent, culturalKeyTerms } from "../db/schema.js";
import { selectCultural } from "../lib/content-selectors.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";

export const culturalRouter = new Hono();

// GET /api/cultural?languageId=
culturalRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  return c.json(await selectCultural(languageId));
});

// ── Educator / Admin write routes ─────────────────────────────────────────────

type KeyTermInput = { word: string; english: string };
type HeadwordInput = { word: string; gloss?: unknown; audioUrl?: string } | null;
type HeroBandInput = { label: string; sublabel?: unknown; from: string; to: string; dark?: boolean };

export const culturalAdminRouter = new Hono<AuthEnv>();
culturalAdminRouter.use("*", authMiddleware);
culturalAdminRouter.use("*", reviewerMiddleware);

// GET /api/cultural/admin?languageId= — editor list. Returns every row for the
// language (all statuses, active AND inactive) so Studio can see and re-activate
// hidden entries; the public read filters both out.
culturalAdminRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  const content = await db
    .select()
    .from(culturalContent)
    .where(eq(culturalContent.languageId, languageId));
  if (content.length === 0) return c.json([]);

  const contentIds = content.map((item) => item.id);
  const keyTerms = await db
    .select()
    .from(culturalKeyTerms)
    .where(inArray(culturalKeyTerms.culturalContentId, contentIds))
    .orderBy(asc(culturalKeyTerms.order));

  const termsByContentId = new Map<string, { word: string; english: string }[]>();
  for (const term of keyTerms) {
    const list = termsByContentId.get(term.culturalContentId) ?? [];
    list.push({ word: term.word, english: term.english });
    termsByContentId.set(term.culturalContentId, list);
  }
  return c.json(content.map((item) => ({ ...item, keyTerms: termsByContentId.get(item.id) ?? [] })));
});

// POST /api/cultural/admin
culturalAdminRouter.post("/", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const body = await parseJson<{
    languageId: string;
    category: string;
    title: string;
    titleFr?: string;
    description: string;
    descriptionFr?: string;
    keyTerms?: KeyTermInput[];
    featured?: boolean;
    headword?: HeadwordInput;
    applications?: unknown[] | null;
    heroBands?: HeroBandInput[] | null;
  }>(c);

  const { languageId, category, title, description } = body;
  if (!languageId || !category || !title || !description) {
    return c.json({ error: "languageId, category, title, and description are required" }, 400);
  }
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const id = randomUUID();
  const [inserted] = await db
    .insert(culturalContent)
    .values({
      id,
      languageId,
      category,
      title,
      titleFr: body.titleFr ?? null,
      description,
      descriptionFr: body.descriptionFr ?? null,
      featured: body.featured ?? false,
      headword: body.headword ?? null,
      applications: body.applications ?? null,
      heroBands: body.heroBands ?? null,
    })
    .returning();

  if (body.keyTerms && body.keyTerms.length > 0) {
    await db.insert(culturalKeyTerms).values(
      body.keyTerms.map((term, i) => ({
        culturalContentId: id,
        word: term.word,
        english: term.english,
        order: i,
      }))
    );
  }

  const terms = await db
    .select()
    .from(culturalKeyTerms)
    .where(eq(culturalKeyTerms.culturalContentId, id))
    .orderBy(asc(culturalKeyTerms.order));

  return c.json({ ...inserted, keyTerms: terms }, 201);
});

// PATCH /api/cultural/admin/:id
culturalAdminRouter.patch("/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const id = c.req.param("id");

  const [existing] = await db.select().from(culturalContent).where(eq(culturalContent.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const body = await parseJson<Partial<{
    category: string;
    title: string;
    titleFr: string | null;
    description: string;
    descriptionFr: string | null;
    keyTerms: KeyTermInput[];
    featured: boolean;
    headword: HeadwordInput;
    applications: unknown[] | null;
    heroBands: HeroBandInput[] | null;
  }>>(c);

  const { keyTerms, ...fields } = body;
  const [updated] = await db
    .update(culturalContent)
    .set(fields)
    .where(eq(culturalContent.id, id))
    .returning();

  if (keyTerms !== undefined) {
    await db.delete(culturalKeyTerms).where(eq(culturalKeyTerms.culturalContentId, id));
    if (keyTerms.length > 0) {
      await db.insert(culturalKeyTerms).values(
        keyTerms.map((term, i) => ({
          culturalContentId: id,
          word: term.word,
          english: term.english,
          order: i,
        }))
      );
    }
  }

  const terms = await db
    .select()
    .from(culturalKeyTerms)
    .where(eq(culturalKeyTerms.culturalContentId, id))
    .orderBy(asc(culturalKeyTerms.order));

  return c.json({ ...updated, keyTerms: terms });
});

// DELETE /api/cultural/admin/:id
culturalAdminRouter.delete("/:id", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const id = c.req.param("id");

  const [existing] = await db.select().from(culturalContent).where(eq(culturalContent.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!isAdmin && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  await db.delete(culturalKeyTerms).where(eq(culturalKeyTerms.culturalContentId, id));
  await db.delete(culturalContent).where(eq(culturalContent.id, id));
  return c.json({ success: true });
});
