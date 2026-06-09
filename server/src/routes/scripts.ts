import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { scriptCharacters, scripts } from "../db/schema.js";

export const scriptsRouter = new Hono();

// GET /api/scripts?languageId=
scriptsRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");

  const result = await db
    .select()
    .from(scripts)
    .where(
      and(
        languageId ? eq(scripts.languageId, languageId) : undefined,
        eq(scripts.isActive, true)
      )
    )
    .orderBy(asc(scripts.languageId), asc(scripts.name));

  return c.json(result);
});

// GET /api/scripts/:scriptId/characters
scriptsRouter.get("/:scriptId/characters", async (c) => {
  const scriptId = c.req.param("scriptId");

  const result = await db
    .select()
    .from(scriptCharacters)
    .where(and(eq(scriptCharacters.scriptId, scriptId), eq(scriptCharacters.isActive, true)))
    .orderBy(asc(scriptCharacters.displayOrder));

  return c.json(result);
});
