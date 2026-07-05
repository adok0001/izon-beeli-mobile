import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../db/index.js";
import { scenarios } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";

export const educatorScenariosRouter = new Hono<AuthEnv>();

// ─── Scenarios CRUD ───────────────────────────────────────────────────────────

// GET /educator/scenarios?languageId=
educatorScenariosRouter.get("/scenarios", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId required" }, 400);
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  const rows = await db
    .select()
    .from(scenarios)
    .where(eq(scenarios.languageId, languageId));
  return c.json(rows.map((r) => ({ ...r, turns: JSON.parse(r.turns) })));
});

// POST /educator/scenarios
educatorScenariosRouter.post("/scenarios", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const body = await c.req.json<{
    languageId: string;
    situation: string;
    turns: { text: string; translation: string; audioUrl?: string }[];
  }>();

  if (!body.languageId || !body.situation?.trim() || !Array.isArray(body.turns) || body.turns.length === 0) {
    return c.json({ error: "languageId, situation, and turns[] are required" }, 400);
  }
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(body.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  for (const turn of body.turns) {
    if (!turn.text?.trim() || !turn.translation?.trim()) {
      return c.json({ error: "Each turn requires text and translation" }, 400);
    }
  }

  const [row] = await db
    .insert(scenarios)
    .values({
      languageId: body.languageId,
      situation: body.situation.trim(),
      turns: JSON.stringify(body.turns),
      status: "draft",
      createdBy: c.get("userId"),
    })
    .returning();

  return c.json({ ...row, turns: JSON.parse(row.turns) }, 201);
});

// PATCH /educator/scenarios/:id
educatorScenariosRouter.patch("/scenarios/:id", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const id = c.req.param("id");
  const [existing] = await db
    .select({ languageId: scenarios.languageId })
    .from(scenarios)
    .where(eq(scenarios.id, id))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }

  const body = await c.req.json<{
    situation?: string;
    turns?: { text: string; translation: string; audioUrl?: string }[];
    status?: string;
  }>();

  if (body.turns) {
    for (const turn of body.turns) {
      if (!turn.text?.trim() || !turn.translation?.trim()) {
        return c.json({ error: "Each turn requires text and translation" }, 400);
      }
    }
  }

  // Going live only happens through the four-eyes publish endpoint.
  const statusTransition =
    body.status !== undefined && ["draft", "in_review", "archived"].includes(body.status)
      ? { status: body.status as "draft" | "in_review" | "archived" }
      : {};

  const [row] = await db
    .update(scenarios)
    .set({
      ...(body.situation ? { situation: body.situation.trim() } : {}),
      ...(body.turns ? { turns: JSON.stringify(body.turns) } : {}),
      ...statusTransition,
      updatedAt: new Date(),
      updatedBy: c.get("userId"),
    })
    .where(eq(scenarios.id, id))
    .returning();

  return c.json({ ...row, turns: JSON.parse(row.turns) });
});

// DELETE /educator/scenarios/:id
educatorScenariosRouter.delete("/scenarios/:id", async (c) => {
  const reviewerLanguages = (c.get("reviewerLanguages") ?? []) as string[];
  const id = c.req.param("id");
  const [existing] = await db
    .select({ languageId: scenarios.languageId })
    .from(scenarios)
    .where(eq(scenarios.id, id))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (reviewerLanguages.length > 0 && !reviewerLanguages.includes(existing.languageId)) {
    return c.json({ error: "Not authorised for this language" }, 403);
  }
  await db.delete(scenarios).where(eq(scenarios.id, id));
  return c.json({ success: true });
});
