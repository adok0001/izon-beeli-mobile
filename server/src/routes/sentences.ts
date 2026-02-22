import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sentenceTemplates } from "../db/schema.js";

export const sentencesRouter = new Hono();

// GET /api/sentences?languageId=
sentencesRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  const result = await db
    .select()
    .from(sentenceTemplates)
    .where(eq(sentenceTemplates.languageId, languageId));

  return c.json(result);
});
