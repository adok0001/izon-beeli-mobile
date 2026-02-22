import { Hono } from "hono";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { culturalContent, culturalKeyTerms } from "../db/schema.js";

export const culturalRouter = new Hono();

// GET /api/cultural?languageId=
culturalRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  const content = await db
    .select()
    .from(culturalContent)
    .where(eq(culturalContent.languageId, languageId));

  if (content.length === 0) {
    return c.json([]);
  }

  const contentIds = content.map((c) => c.id);
  const keyTerms = await db
    .select()
    .from(culturalKeyTerms)
    .where(inArray(culturalKeyTerms.culturalContentId, contentIds))
    .orderBy(asc(culturalKeyTerms.order));

  // Group key terms by culturalContentId
  const termsByContentId = new Map<string, { word: string; english: string }[]>();
  for (const term of keyTerms) {
    const list = termsByContentId.get(term.culturalContentId) ?? [];
    list.push({ word: term.word, english: term.english });
    termsByContentId.set(term.culturalContentId, list);
  }

  return c.json(
    content.map((item) => ({
      ...item,
      keyTerms: termsByContentId.get(item.id) ?? [],
    }))
  );
});
