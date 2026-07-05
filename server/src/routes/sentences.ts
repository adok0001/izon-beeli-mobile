import { Hono } from "hono";
import { selectSentences } from "../lib/content-selectors.js";

export const sentencesRouter = new Hono();

// GET /api/sentences?languageId=
sentencesRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  return c.json(await selectSentences(languageId));
});
