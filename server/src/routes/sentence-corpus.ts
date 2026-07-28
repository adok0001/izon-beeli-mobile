import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  dictionaryExamples,
  sentenceTemplates,
  sentences,
  transcriptSegments,
} from "../db/schema.js";

/**
 * The shared sentence corpus.
 *
 * Mounted at `/sentence-corpus`, not `/sentences` — that path already serves
 * `sentence_templates`, which are drills *over* sentences rather than sentences
 * themselves. Two entities under one noun is exactly the ambiguity this design
 * was written to remove, so the routes keep them apart too.
 */
export const sentenceCorpusRouter = new Hono();

/**
 * GET /api/sentence-corpus/:id/usage
 *
 * What breaks if you edit this sentence. The editor renders it as a "used in N
 * places" badge beside the field, before the edit rather than after, because a
 * shared sentence edited from the dictionary also changes the lesson using it.
 *
 * Three index scans, deliberately counted live. A denormalized counter would
 * drift the moment anything wrote around it, and this is not a hot path.
 */
sentenceCorpusRouter.get("/:id/usage", async (c) => {
  const id = c.req.param("id");
  if (!id || id.length > 64) return c.json({ error: "Valid sentence id required" }, 400);

  const [exists] = await db
    .select({ id: sentences.id })
    .from(sentences)
    .where(eq(sentences.id, id))
    .limit(1);
  if (!exists) return c.json({ error: "Sentence not found" }, 404);

  const count = sql<number>`count(*)::int`;
  const [[examples], [drills], [lines]] = await Promise.all([
    db.select({ n: count }).from(dictionaryExamples).where(eq(dictionaryExamples.sentenceId, id)),
    db.select({ n: count }).from(sentenceTemplates).where(eq(sentenceTemplates.sentenceId, id)),
    db.select({ n: count }).from(transcriptSegments).where(eq(transcriptSegments.sentenceId, id)),
  ]);

  const usage = {
    dictionaryExamples: examples?.n ?? 0,
    drills: drills?.n ?? 0,
    lessonLines: lines?.n ?? 0,
  };
  return c.json({ ...usage, total: usage.dictionaryExamples + usage.drills + usage.lessonLines });
});
