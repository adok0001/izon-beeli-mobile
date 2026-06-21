import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { dictionaryEntries } from "../db/schema.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

export const adminImportRouter = new Hono();

adminImportRouter.use("*", authMiddleware, adminMiddleware);

const VALID_CATEGORIES = new Set([
  "greetings", "numbers", "family", "pronouns", "time", "verbs", "body",
  "market", "occupations", "nouns", "phrases", "food", "possessives",
  "ordinals", "commands", "animals", "phonetics", "money", "proverbs", "adjectives",
]);

interface ImportEntry {
  id: string;
  word: string;
  english: string;
  category: string;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string;
  audioUrl?: string;
  synonyms?: string[];
  antonyms?: string[];
  semanticDomain?: string;
  dialectalVariants?: Array<{ dialect: string; form: string; region?: string }>;
}

function validateEntry(entry: ImportEntry, index: number): string | null {
  if (!entry.id || typeof entry.id !== "string") return `Row ${index}: missing id`;
  if (!entry.word || typeof entry.word !== "string") return `Row ${index}: missing word`;
  if (!entry.english || typeof entry.english !== "string") return `Row ${index}: missing english`;
  if (!VALID_CATEGORIES.has(entry.category)) return `Row ${index} (${entry.id}): invalid category "${entry.category}"`;
  return null;
}

// POST /api/admin/dictionary/import
adminImportRouter.post("/", async (c) => {
  const body = await c.req.json<{
    languageId: string;
    entries: ImportEntry[];
    dryRun?: boolean;
  }>();

  if (!body.languageId || typeof body.languageId !== "string") {
    return c.json({ error: "languageId is required" }, 400);
  }
  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return c.json({ error: "entries must be a non-empty array" }, 400);
  }
  if (body.entries.length > 5000) {
    return c.json({ error: "Maximum 5,000 entries per import batch" }, 400);
  }

  const errors: { id: string; reason: string }[] = [];
  const valid: ImportEntry[] = [];

  for (let i = 0; i < body.entries.length; i++) {
    const entry = body.entries[i]!;
    const err = validateEntry(entry, i + 1);
    if (err) {
      errors.push({ id: entry.id ?? `row-${i + 1}`, reason: err });
    } else {
      valid.push(entry);
    }
  }

  if (body.dryRun) {
    return c.json({
      dryRun: true,
      total: body.entries.length,
      valid: valid.length,
      errors,
      preview: valid.slice(0, 5).map((e) => ({ id: e.id, word: e.word, english: e.english, category: e.category })),
    });
  }

  if (valid.length === 0) {
    return c.json({ inserted: 0, updated: 0, skipped: 0, errors });
  }

  const rows = valid.map((e) => ({
    id: e.id,
    languageId: body.languageId,
    word: e.word,
    english: e.english,
    category: e.category,
    pronunciation: e.pronunciation,
    example: e.example,
    exampleTranslation: e.exampleTranslation,
    audioUrl: e.audioUrl,
    synonyms: e.synonyms,
    antonyms: e.antonyms,
    semanticDomain: e.semanticDomain,
    dialectalVariants: e.dialectalVariants,
  }));

  // Batch in groups of 500 to avoid parameter limits
  const BATCH_SIZE = 500;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await db
      .insert(dictionaryEntries)
      .values(batch)
      .onConflictDoUpdate({
        target: dictionaryEntries.id,
        set: {
          word: sql`excluded.word`,
          english: sql`excluded.english`,
          category: sql`excluded.category`,
          pronunciation: sql`excluded.pronunciation`,
          example: sql`excluded.example`,
          exampleTranslation: sql`excluded.example_translation`,
          audioUrl: sql`excluded.audio_url`,
          synonyms: sql`excluded.synonyms`,
          antonyms: sql`excluded.antonyms`,
          semanticDomain: sql`excluded.semantic_domain`,
          dialectalVariants: sql`excluded.dialectal_variants`,
        },
      })
      .returning({ id: dictionaryEntries.id });

    // Drizzle doesn't distinguish insert vs update from onConflictDoUpdate —
    // treat all returned rows as processed. We'll compute a rough split via
    // a pre-count if needed; for now report total processed.
    inserted += result.length;
  }

  return c.json({ inserted, updated, skipped: errors.length, errors });
});
