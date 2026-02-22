import { Hono } from "hono";
import { asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { languages } from "../db/schema.js";

export const languagesRouter = new Hono();

// GET /api/languages
languagesRouter.get("/", async (c) => {
  const result = await db
    .select()
    .from(languages)
    .orderBy(asc(languages.region), asc(languages.name));

  return c.json(result);
});
