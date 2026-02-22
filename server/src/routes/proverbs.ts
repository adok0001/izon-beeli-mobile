import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { proverbs } from "../db/schema.js";

export const proverbsRouter = new Hono();

// GET /api/proverbs?languageId=
proverbsRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  const result = await db
    .select()
    .from(proverbs)
    .where(eq(proverbs.languageId, languageId));

  return c.json(result);
});
