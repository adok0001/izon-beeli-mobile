import { Hono, type Context } from "hono";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { parseJson } from "../lib/http.js";
import { db } from "../db/index.js";
import {
  dictionaryEntries,
  dictionaryExamples,
  dictionarySenses,
  sentenceTemplates,
  sentences,
  transcriptSegments,
} from "../db/schema.js";
import { normalizeSentence, sentenceId } from "../lib/slug.js";
import { project, resolveMap, type TranslationMap } from "../lib/translations.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";

/**
 * Per-sense usage examples, for Studio.
 *
 * `dictionary_entries.example` holds one example for the whole headword, which is
 * why the app can only show a sentence under the first sense — everything past it
 * renders an empty slot. These routes give each sense its own examples, pointing
 * into the shared `sentences` corpus rather than copying text.
 *
 * Mounted at its own `/dictionary-senses` prefix rather than under
 * `/dictionary/admin`. That prefix already hosts an admin-only router, and two
 * routers sharing a prefix means relying on middleware fall-through to decide
 * whether `adminMiddleware` runs before this router is reached — which would lock
 * out exactly the reviewers this is for. Educators curate content for their own
 * languages, so these routes take `reviewerMiddleware` and scope every write to
 * the entry's language.
 */
export const dictionarySensesRouter = new Hono<AuthEnv>();
dictionarySensesRouter.use("*", authMiddleware);
dictionarySensesRouter.use("*", reviewerMiddleware);

/** Reviewers are scoped to their assigned languages; admins are not. */
async function authorizeEntry(c: Context<AuthEnv>, entryId: string) {
  const [entry] = await db
    .select({ id: dictionaryEntries.id, languageId: dictionaryEntries.languageId })
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.id, entryId))
    .limit(1);
  if (!entry) return { error: c.json({ error: "Entry not found" }, 404) };
  if (!c.get("isAdmin") && !c.get("reviewerLanguages").includes(entry.languageId)) {
    return { error: c.json({ error: "Forbidden: not assigned to this language" }, 403) };
  }
  return { entry };
}

/** The entry a sense belongs to, so a sense id alone can be authorized. */
async function authorizeSense(c: Context<AuthEnv>, senseId: string) {
  const [sense] = await db
    .select({ id: dictionarySenses.id, entryId: dictionarySenses.entryId })
    .from(dictionarySenses)
    .where(eq(dictionarySenses.id, senseId))
    .limit(1);
  if (!sense) return { error: c.json({ error: "Sense not found" }, 404) };
  const auth = await authorizeEntry(c, sense.entryId);
  if (auth.error) return { error: auth.error };
  return { sense, entry: auth.entry! };
}

/**
 * Find the corpus row for a sentence, or create it.
 *
 * Looks up by normalized TEXT before falling back to the hashed id, and that
 * order matters. `sentenceId()` hashes the text, but `sentences.text` is mutable:
 * correcting a shared sentence has to change it everywhere at once (the whole
 * point of the corpus — one sentence, one correction, one recording), and an
 * in-place update necessarily leaves the id derived from the text as it was when
 * created. So the id is a surrogate seeded from content, not a live checksum, and
 * a text lookup is what reliably finds an already-edited row. Without it,
 * re-adding a corrected sentence would silently mint a duplicate.
 */
async function findOrCreateSentence(
  languageId: string,
  text: string,
  translations: TranslationMap | undefined,
  userId: string,
): Promise<string> {
  const normalized = normalizeSentence(text);
  const [existing] = await db
    .select({ id: sentences.id })
    .from(sentences)
    .where(and(eq(sentences.languageId, languageId), eq(sentences.text, normalized)))
    .limit(1);
  if (existing) return existing.id;

  const id = sentenceId(languageId, normalized);
  await db
    .insert(sentences)
    .values({
      id,
      languageId,
      text: normalized,
      translation: translations ? project(translations) : null,
      translations,
      createdBy: userId,
    })
    .onConflictDoNothing();
  return id;
}

/** How many places cite a sentence — the "used in N places" badge. */
async function usageOf(id: string) {
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
  return { ...usage, total: usage.dictionaryExamples + usage.drills + usage.lessonLines };
}

// GET /api/dictionary-senses?entryId= — senses with their examples
dictionarySensesRouter.get("/", async (c) => {
  const entryId = c.req.query("entryId");
  if (!entryId || entryId.length > 64) return c.json({ error: "Valid entryId query param required" }, 400);
  const auth = await authorizeEntry(c, entryId);
  if (auth.error) return auth.error;

  const rows = await db
    .select({
      senseId: dictionarySenses.id,
      order: dictionarySenses.order,
      gloss: dictionarySenses.gloss,
      note: dictionarySenses.note,
      exampleId: dictionaryExamples.id,
      exampleOrder: dictionaryExamples.order,
      needsSenseReview: dictionaryExamples.needsSenseReview,
      sentenceId: sentences.id,
      text: sentences.text,
      translation: sentences.translation,
      translations: sentences.translations,
      audioUrl: sentences.audioUrl,
    })
    .from(dictionarySenses)
    .leftJoin(dictionaryExamples, eq(dictionaryExamples.senseId, dictionarySenses.id))
    .leftJoin(sentences, eq(sentences.id, dictionaryExamples.sentenceId))
    .where(eq(dictionarySenses.entryId, auth.entry!.id))
    .orderBy(asc(dictionarySenses.order), asc(dictionaryExamples.order));

  /**
   * How many places cite each sentence, in three grouped queries rather than one
   * per example. The editor shows this beside the field *before* an edit, because
   * correcting a shared sentence corrects it everywhere at once.
   */
  const cited = [...new Set(rows.map((r) => r.sentenceId).filter((id): id is string => !!id))];
  const usage = new Map<string, number>();
  if (cited.length > 0) {
    const tally = (rows: { id: string | null; n: number }[]) => {
      for (const r of rows) if (r.id) usage.set(r.id, (usage.get(r.id) ?? 0) + r.n);
    };
    const n = sql<number>`count(*)::int`;
    const [a, b, d] = await Promise.all([
      db.select({ id: dictionaryExamples.sentenceId, n }).from(dictionaryExamples)
        .where(inArray(dictionaryExamples.sentenceId, cited)).groupBy(dictionaryExamples.sentenceId),
      db.select({ id: sentenceTemplates.sentenceId, n }).from(sentenceTemplates)
        .where(inArray(sentenceTemplates.sentenceId, cited)).groupBy(sentenceTemplates.sentenceId),
      db.select({ id: transcriptSegments.sentenceId, n }).from(transcriptSegments)
        .where(inArray(transcriptSegments.sentenceId, cited)).groupBy(transcriptSegments.sentenceId),
    ]);
    tally(a); tally(b); tally(d);
  }

  // A sense with no examples still has to appear — an empty slot is what tells
  // an educator there is something to fill in.
  const bySense = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    if (!bySense.has(r.senseId)) {
      bySense.set(r.senseId, { id: r.senseId, order: r.order, gloss: r.gloss, note: r.note, examples: [] });
    }
    if (!r.exampleId || !r.sentenceId) continue;
    (bySense.get(r.senseId)!.examples as unknown[]).push({
      id: r.exampleId,
      order: r.exampleOrder,
      needsSenseReview: r.needsSenseReview,
      sentenceId: r.sentenceId,
      text: r.text,
      translation: r.translation,
      translations: r.translations,
      audioUrl: r.audioUrl,
      /** Total citations of this sentence across dictionary, drills and lessons. */
      usedIn: usage.get(r.sentenceId) ?? 1,
    });
  }

  return c.json([...bySense.values()]);
});

// POST /api/dictionary-senses/:senseId/examples — add an example to a sense
dictionarySensesRouter.post("/:senseId/examples", async (c) => {
  const auth = await authorizeSense(c, c.req.param("senseId"));
  if (auth.error) return auth.error;

  const body = await parseJson<{ text: string; translation?: string; translations?: TranslationMap }>(c);
  const text = body.text?.trim();
  if (!text) return c.json({ error: "text is required" }, 400);

  const id = await findOrCreateSentence(
    auth.entry.languageId,
    text,
    resolveMap(body.translations, body.translation),
    c.get("userId"),
  );

  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max("order"), -1) + 1` })
    .from(dictionaryExamples)
    .where(eq(dictionaryExamples.senseId, auth.sense.id));

  const [row] = await db
    .insert(dictionaryExamples)
    .values({ senseId: auth.sense.id, sentenceId: id, order: next })
    // Citing the same sentence twice on one sense is a no-op, not an error —
    // clearing the review flag is the only thing left to do.
    .onConflictDoUpdate({
      target: [dictionaryExamples.senseId, dictionaryExamples.sentenceId],
      set: { needsSenseReview: false },
    })
    .returning();

  return c.json({ ...row, sentenceId: id, usage: await usageOf(id) }, 201);
});

// PATCH /api/dictionary-senses/examples/:id — edit the sentence an example cites
dictionarySensesRouter.patch("/examples/:id", async (c) => {
  const [example] = await db
    .select({ id: dictionaryExamples.id, senseId: dictionaryExamples.senseId, sentenceId: dictionaryExamples.sentenceId })
    .from(dictionaryExamples)
    .where(eq(dictionaryExamples.id, c.req.param("id")))
    .limit(1);
  if (!example) return c.json({ error: "Example not found" }, 404);

  const auth = await authorizeSense(c, example.senseId);
  if (auth.error) return auth.error;

  const body = await parseJson<{
    text?: string;
    translation?: string;
    translations?: TranslationMap;
    needsSenseReview?: boolean;
  }>(c);

  const updates: Record<string, unknown> = { updatedBy: c.get("userId") };
  if (body.text?.trim()) updates.text = normalizeSentence(body.text);
  const map = resolveMap(body.translations, body.translation);
  if (map) {
    updates.translations = map;
    updates.translation = project(map);
  }

  // Edits are shared, deliberately. A sentence cited in three places is one
  // sentence: correcting it from the dictionary corrects the drill and the lesson
  // line too, which is what makes a single recording serve all three. Forking on
  // edit would decay the corpus back into per-surface copies. The caller shows
  // the usage count first so nobody is surprised by it.
  if (Object.keys(updates).length > 1) {
    await db.update(sentences).set(updates).where(eq(sentences.id, example.sentenceId));
  }

  if (body.needsSenseReview !== undefined) {
    await db
      .update(dictionaryExamples)
      .set({ needsSenseReview: body.needsSenseReview })
      .where(eq(dictionaryExamples.id, example.id));
  }

  return c.json({ id: example.id, sentenceId: example.sentenceId, usage: await usageOf(example.sentenceId) });
});

// DELETE /api/dictionary-senses/examples/:id — drop the citation, keep the sentence
dictionarySensesRouter.delete("/examples/:id", async (c) => {
  const [example] = await db
    .select({ id: dictionaryExamples.id, senseId: dictionaryExamples.senseId })
    .from(dictionaryExamples)
    .where(eq(dictionaryExamples.id, c.req.param("id")))
    .limit(1);
  if (!example) return c.json({ error: "Example not found" }, 404);

  const auth = await authorizeSense(c, example.senseId);
  if (auth.error) return auth.error;

  // Only the citation goes. The sentence stays in the corpus — it may be cited
  // elsewhere, and even when it isn't, a recorded sentence is worth keeping.
  await db.delete(dictionaryExamples).where(eq(dictionaryExamples.id, example.id));
  return c.json({ deleted: true });
});
