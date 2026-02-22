import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { dictionaryEntries, contributions, users } from "../db/schema.js";

export const dictionaryRouter = new Hono();

// GET /api/dictionary?languageId=&category= (optional)
// Merges dictionary_entries (static) + approved contributions
dictionaryRouter.get("/", async (c) => {
  const languageId = c.req.query("languageId");
  const category = c.req.query("category");

  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid languageId query param required" }, 400);
  }

  const conditions = category
    ? and(
        eq(dictionaryEntries.languageId, languageId),
        eq(dictionaryEntries.category, category)
      )
    : eq(dictionaryEntries.languageId, languageId);

  const staticEntries = await db
    .select()
    .from(dictionaryEntries)
    .where(conditions)
    .orderBy(asc(dictionaryEntries.word));

  // Also merge approved contributions for this language
  const contribConditions = category
    ? and(
        eq(contributions.languageId, languageId),
        eq(contributions.status, "approved"),
        eq(contributions.category, category)
      )
    : and(
        eq(contributions.languageId, languageId),
        eq(contributions.status, "approved")
      );

  const approvedContribs = await db
    .select({
      id: contributions.id,
      word: contributions.word,
      english: contributions.english,
      category: contributions.category,
      languageId: contributions.languageId,
      pronunciation: contributions.pronunciation,
      example: contributions.example,
      exampleTranslation: contributions.exampleTranslation,
      audioUrl: contributions.audioUrl,
      contributorId: contributions.userId,
      contributorName: users.name,
    })
    .from(contributions)
    .leftJoin(users, eq(contributions.userId, users.id))
    .where(contribConditions)
    .orderBy(contributions.word);

  return c.json([...staticEntries, ...approvedContribs]);
});
