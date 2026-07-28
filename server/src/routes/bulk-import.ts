import { Hono, type Context } from "hono";
import { sql, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { isDictionaryCategory } from "../lib/dictionary-categories.js";
import { parseJson } from "../lib/http.js";
import { slugify } from "../lib/slug.js";
import { db } from "../db/index.js";
import {
  dictionaryEntries,
  sentenceTemplates,
  proverbs,
  scenarios,
  culturalContent,
  culturalKeyTerms,
  quizQuestions,
  courses,
} from "../db/schema.js";
import { buildLessonGroup, insertLessonGroups, type LessonGroupInput } from "./lesson-import.js";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";
import { parseMap, project, type TranslationMap } from "../lib/translations.js";

/**
 * Registry-driven bulk importer. One generic `POST /import/:type` handler feeds a
 * table-specific config. Access mirrors the four-eyes model via reviewerMiddleware
 * (admin OR reviewer). Role decides the row status on INSERT:
 *   admin    → published (+ publishedBy/publishedAt)
 *   reviewer → in_review (staged for a second pair of eyes)
 * On CONFLICT we update only content columns, leaving the existing workflow state
 * (status/authorship) untouched — re-importing never silently republishes or
 * downgrades a row.
 */

type Entry = Record<string, unknown>;

type StatusValues = {
  status: "published" | "in_review";
  createdBy: string;
  publishedBy: string | null;
  publishedAt: Date | null;
};

type Ctx = { languageId: string; status: StatusValues };

interface ImporterConfig {
  /** Return an error string, or null when the entry is valid. */
  validate: (entry: Entry, index: number) => string | null;
  /** Compact row shown in the dry-run preview. */
  preview: (entry: Entry) => Record<string, unknown>;
  /** Persist validated entries; returns the number of rows processed. */
  insert: (entries: Entry[], ctx: Ctx) => Promise<number>;
}

// ─── coercion helpers ─────────────────────────────────────────────────────────
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const opt = (v: unknown): string | null => {
  const t = str(v);
  return t.length > 0 ? t : null;
};
const strArray = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : undefined;

/**
 * Collect a translatable field into its map. Three input shapes are accepted, in
 * precedence order:
 *   `<field>Translations`  a JSON object — how JSON imports carry the full map
 *   `<field>:<lang>`       one spreadsheet column per language ("meaning:pcm")
 *   `<field>`              the bare column, taken as English
 * The per-column form is what CSV templates use: spreadsheets can't hold JSON
 * comfortably, and one column per language stays readable and diffable.
 */
function mapOf(entry: Entry, field: string): TranslationMap | undefined {
  const explicit = parseMap(entry[`${field}Translations`]);
  if (explicit) return explicit;
  const out: TranslationMap = {};
  const en = str(entry[field]);
  if (en) out.en = en;
  for (const [key, value] of Object.entries(entry)) {
    const [name, lang] = key.split(":");
    if (name !== field || !lang) continue;
    const text = str(value);
    if (text) out[lang.trim()] = text;
  }
  return Object.keys(out).length ? out : undefined;
}

/** The `<field>` / `<field>Translations` column pair for an insert row. */
function mapPair(entry: Entry, field: string, mapKey: string) {
  const map = mapOf(entry, field);
  return { [field]: map ? project(map) : null, [mapKey]: map ?? null };
}

function statusValues(isAdmin: boolean, userId: string): StatusValues {
  return isAdmin
    ? { status: "published", createdBy: userId, publishedBy: userId, publishedAt: new Date() }
    : { status: "in_review", createdBy: userId, publishedBy: null, publishedAt: null };
}

function idOf(entry: Entry, index: number): string {
  return str(entry.id) || `row-${index + 1}`;
}

/** Run `fn` over `items` in fixed-size batches, summing the returned counts. */
async function inBatches<T>(items: T[], size: number, fn: (batch: T[]) => Promise<number>): Promise<number> {
  let total = 0;
  for (let i = 0; i < items.length; i += size) {
    total += await fn(items.slice(i, i + size));
  }
  return total;
}
const BATCH = 500;

// ─── dictionary ───────────────────────────────────────────────────────────────
const dictionaryImporter: ImporterConfig = {
  validate: (e, i) => {
    if (!str(e.id)) return `Row ${i}: missing id (dictionary entries require an explicit id)`;
    if (!str(e.word)) return `Row ${i}: missing word`;
    if (!str(e.english)) return `Row ${i}: missing english`;
    if (!isDictionaryCategory(str(e.category))) return `Row ${i} (${str(e.id)}): invalid category "${str(e.category)}"`;
    return null;
  },
  preview: (e) => ({ id: str(e.id), word: str(e.word), english: str(e.english), category: str(e.category) }),
  insert: (entries, ctx) => {
    const rows = entries.map((e) => ({
      id: str(e.id),
      languageId: ctx.languageId,
      word: str(e.word),
      ...(mapPair(e, "english", "translations") as { english: string; translations: TranslationMap | null }),
      category: str(e.category),
      pronunciation: opt(e.pronunciation),
      example: opt(e.example),
      ...mapPair(e, "exampleTranslation", "exampleTranslations"),
      audioUrl: opt(e.audioUrl),
      synonyms: strArray(e.synonyms),
      antonyms: strArray(e.antonyms),
      semanticDomain: opt(e.semanticDomain),
      dialectalVariants: Array.isArray(e.dialectalVariants) ? e.dialectalVariants : undefined,
      ...ctx.status,
    }));
    return inBatches(rows, BATCH, (batch) =>
      db.insert(dictionaryEntries).values(batch).onConflictDoUpdate({
        target: dictionaryEntries.id,
        set: {
          word: sql`excluded.word`,
          english: sql`excluded.english`,
          translations: sql`excluded.translations`,
          category: sql`excluded.category`,
          pronunciation: sql`excluded.pronunciation`,
          example: sql`excluded.example`,
          exampleTranslation: sql`excluded.example_translation`,
          exampleTranslations: sql`excluded.example_translations`,
          audioUrl: sql`excluded.audio_url`,
          synonyms: sql`excluded.synonyms`,
          antonyms: sql`excluded.antonyms`,
          semanticDomain: sql`excluded.semantic_domain`,
          dialectalVariants: sql`excluded.dialectal_variants`,
        },
      }).returning({ id: dictionaryEntries.id }).then((r) => r.length)
    );
  },
};

// ─── sentence templates ───────────────────────────────────────────────────────
const sentenceImporter: ImporterConfig = {
  validate: (e, i) => {
    if (!str(e.sentence)) return `Row ${i}: missing sentence`;
    if (!str(e.answer)) return `Row ${i}: missing answer`;
    if (!str(e.englishSentence)) return `Row ${i}: missing englishSentence`;
    const kind = str(e.kind) || "blank";
    if (kind !== "blank" && kind !== "equivalent") return `Row ${i}: kind must be "blank" or "equivalent"`;
    if (kind === "blank" && !str(e.sentence).toLowerCase().includes(str(e.answer).toLowerCase())) {
      return `Row ${i}: answer "${str(e.answer)}" must appear inside the sentence for kind "blank" (use "equivalent" otherwise)`;
    }
    return null;
  },
  preview: (e) => ({ sentence: str(e.sentence), answer: str(e.answer), english: str(e.englishSentence) }),
  insert: (entries, ctx) => {
    const rows = entries.map((e) => ({
      id: str(e.id) || `s-${ctx.languageId}-${randomUUID().slice(0, 8)}`,
      languageId: ctx.languageId,
      sentence: str(e.sentence),
      answer: str(e.answer),
      englishSentence: str(e.englishSentence),
      kind: (str(e.kind) || "blank") as "blank" | "equivalent",
      literalTranslation: opt(e.literalTranslation),
      ...ctx.status,
    }));
    return inBatches(rows, BATCH, (batch) =>
      db.insert(sentenceTemplates).values(batch).onConflictDoUpdate({
        target: sentenceTemplates.id,
        set: {
          sentence: sql`excluded.sentence`,
          answer: sql`excluded.answer`,
          englishSentence: sql`excluded.english_sentence`,
          kind: sql`excluded.kind`,
          literalTranslation: sql`excluded.literal_translation`,
        },
      }).returning({ id: sentenceTemplates.id }).then((r) => r.length)
    );
  },
};

// ─── proverbs ─────────────────────────────────────────────────────────────────
const proverbImporter: ImporterConfig = {
  validate: (e, i) => {
    if (!str(e.text)) return `Row ${i}: missing text`;
    if (!str(e.translation)) return `Row ${i}: missing translation`;
    if (!str(e.meaning)) return `Row ${i}: missing meaning`;
    return null;
  },
  preview: (e) => ({ text: str(e.text), translation: str(e.translation), meaning: str(e.meaning) }),
  insert: (entries, ctx) => {
    const rows = entries.map((e) => ({
      id: str(e.id) || randomUUID(),
      languageId: ctx.languageId,
      text: str(e.text),
      ...(mapPair(e, "translation", "translations") as { translation: string; translations: TranslationMap | null }),
      ...(mapPair(e, "meaning", "meaningTranslations") as { meaning: string; meaningTranslations: TranslationMap | null }),
      literal: opt(e.literal),
      context: opt(e.context),
      tags: strArray(e.tags) ?? null,
      ...ctx.status,
    }));
    return inBatches(rows, BATCH, (batch) =>
      db.insert(proverbs).values(batch).onConflictDoUpdate({
        target: proverbs.id,
        set: {
          text: sql`excluded.text`,
          translation: sql`excluded.translation`,
          translations: sql`excluded.translations`,
          meaning: sql`excluded.meaning`,
          meaningTranslations: sql`excluded.meaning_translations`,
          literal: sql`excluded.literal`,
          context: sql`excluded.context`,
          tags: sql`excluded.tags`,
        },
      }).returning({ id: proverbs.id }).then((r) => r.length)
    );
  },
};

// ─── scenarios ────────────────────────────────────────────────────────────────
type Turn = { text?: unknown; translation?: unknown; audioUrl?: unknown };
const scenarioImporter: ImporterConfig = {
  validate: (e, i) => {
    if (!str(e.situation)) return `Row ${i}: missing situation`;
    if (!Array.isArray(e.turns) || e.turns.length === 0) return `Row ${i}: turns[] is required`;
    for (const t of e.turns as Turn[]) {
      if (!str(t?.text) || !str(t?.translation)) return `Row ${i}: each turn needs text and translation`;
    }
    return null;
  },
  preview: (e) => ({ situation: str(e.situation), turns: (e.turns as unknown[]).length }),
  insert: (entries, ctx) => {
    const rows = entries.map((e) => ({
      id: str(e.id) || randomUUID(),
      languageId: ctx.languageId,
      situation: str(e.situation),
      turns: JSON.stringify(e.turns),
      ...ctx.status,
    }));
    return inBatches(rows, BATCH, (batch) =>
      db.insert(scenarios).values(batch).onConflictDoUpdate({
        target: scenarios.id,
        set: {
          situation: sql`excluded.situation`,
          turns: sql`excluded.turns`,
          updatedAt: sql`now()`,
        },
      }).returning({ id: scenarios.id }).then((r) => r.length)
    );
  },
};

// ─── cultural content (+ key terms child rows) ────────────────────────────────
type CulturalInsert = typeof culturalContent.$inferInsert;
type KeyTerm = { word?: unknown; english?: unknown };
const culturalImporter: ImporterConfig = {
  validate: (e, i) => {
    if (!str(e.category)) return `Row ${i}: missing category`;
    if (!str(e.title)) return `Row ${i}: missing title`;
    if (!str(e.description)) return `Row ${i}: missing description`;
    return null;
  },
  preview: (e) => ({ title: str(e.title), category: str(e.category) }),
  insert: async (entries, ctx) => {
    const resolved = entries.map((e) => ({ id: str(e.id) || randomUUID(), entry: e }));
    const rows = resolved.map(({ id, entry: e }) => ({
      id,
      languageId: ctx.languageId,
      category: str(e.category),
      ...(mapPair(e, "title", "titleTranslations") as { title: string; titleTranslations: TranslationMap | null }),
      ...(mapPair(e, "description", "descriptionTranslations") as { description: string; descriptionTranslations: TranslationMap | null }),
      featured: e.featured === true,
      headword: (e.headword && typeof e.headword === "object" ? e.headword : null) as CulturalInsert["headword"],
      applications: (Array.isArray(e.applications) ? e.applications : null) as CulturalInsert["applications"],
      heroBands: (Array.isArray(e.heroBands) ? e.heroBands : null) as CulturalInsert["heroBands"],
      ...ctx.status,
    }));
    const count = await inBatches(rows, BATCH, (batch) =>
      db.insert(culturalContent).values(batch).onConflictDoUpdate({
        target: culturalContent.id,
        set: {
          category: sql`excluded.category`,
          title: sql`excluded.title`,
          titleTranslations: sql`excluded.title_translations`,
          description: sql`excluded.description`,
          descriptionTranslations: sql`excluded.description_translations`,
          featured: sql`excluded.featured`,
          headword: sql`excluded.headword`,
          applications: sql`excluded.applications`,
          heroBands: sql`excluded.hero_bands`,
        },
      }).returning({ id: culturalContent.id }).then((r) => r.length)
    );
    // Replace key terms for any entry that supplied them (mirrors the single PATCH).
    for (const { id, entry } of resolved) {
      if (!Array.isArray(entry.keyTerms)) continue;
      const terms = (entry.keyTerms as KeyTerm[])
        .filter((t) => str(t?.word) && str(t?.english))
        .map((t, i) => ({ culturalContentId: id, word: str(t.word), english: str(t.english), order: i }));
      await db.delete(culturalKeyTerms).where(eq(culturalKeyTerms.culturalContentId, id));
      if (terms.length > 0) await db.insert(culturalKeyTerms).values(terms);
    }
    return count;
  },
};

// ─── quiz questions ───────────────────────────────────────────────────────────
const QUIZ_QUESTION_TYPES = new Set(["word-to-english", "english-to-word", "fill-in-the-blank", "listening"]);
const quizImporter: ImporterConfig = {
  validate: (e, i) => {
    if (!QUIZ_QUESTION_TYPES.has(str(e.type))) return `Row ${i}: type must be one of ${[...QUIZ_QUESTION_TYPES].join(", ")}`;
    if (!str(e.prompt)) return `Row ${i}: missing prompt`;
    if (!str(e.answer)) return `Row ${i}: missing answer`;
    return null;
  },
  preview: (e) => ({ type: str(e.type), prompt: str(e.prompt), answer: str(e.answer) }),
  insert: (entries, ctx) => {
    const rows = entries.map((e) => ({
      id: str(e.id) || `quiz-${randomUUID()}`,
      languageId: ctx.languageId,
      type: str(e.type),
      prompt: str(e.prompt),
      answer: str(e.answer),
      options: strArray(e.options) ?? [],
      audioUrl: opt(e.audioUrl),
      explanation: opt(e.explanation),
      lessonId: opt(e.lessonId),
      sceneId: opt(e.sceneId),
      ...ctx.status,
    }));
    return inBatches(rows, BATCH, (batch) =>
      db.insert(quizQuestions).values(batch).onConflictDoUpdate({
        target: quizQuestions.id,
        set: {
          type: sql`excluded.type`,
          prompt: sql`excluded.prompt`,
          answer: sql`excluded.answer`,
          options: sql`excluded.options`,
          audioUrl: sql`excluded.audio_url`,
          explanation: sql`excluded.explanation`,
          lessonId: sql`excluded.lesson_id`,
          sceneId: sql`excluded.scene_id`,
        },
      }).returning({ id: quizQuestions.id }).then((r) => r.length)
    );
  },
};

export const IMPORTERS: Record<string, ImporterConfig> = {
  dictionary: dictionaryImporter,
  sentences: sentenceImporter,
  proverbs: proverbImporter,
  scenarios: scenarioImporter,
  cultural: culturalImporter,
  quiz: quizImporter,
};

// ─── unified CSV ────────────────────────────────────────────────────────────────
/**
 * One spreadsheet, many content types. Each row of the unified CSV carries a
 * `type` column that routes it to a per-type importer above. Only the flat,
 * one-row-per-item types are reachable this way — scenarios (multi-turn) and
 * cultural content (child key terms) don't flatten to a grid and keep their
 * JSON-only path. This mapper is the whole contract: unified column → the field
 * name each `ImporterConfig` already expects, so validation/insert are unchanged.
 * The `type` token (singular, educator-facing) maps to the plural importer key.
 */

type Mapped = { importerType: string; entry: Entry };

/** Map a unified row to `{ importerType, entry }`, or return an error string. */
export function mapUnifiedRow(row: Entry, languageId: string): Mapped | { error: string } {
  const withId = (extra: Entry): Entry => (opt(row.id) ? { id: str(row.id), ...extra } : extra);

  switch (str(row.type).toLowerCase()) {
    case "dictionary":
      // Dictionary upserts by id; synthesize a stable one from the word so a
      // re-imported sheet updates rather than duplicates.
      return { importerType: "dictionary", entry: {
        id: opt(row.id) ?? `${languageId}-${slugify(str(row.text))}`,
        word: str(row.text), english: str(row.english), category: str(row.category),
        pronunciation: str(row.pronunciation), example: str(row.example),
        exampleTranslation: str(row.example_english),
      } };
    case "sentence": {
      // `kind` is derived, not asked for: a fill-in-the-blank when the answer
      // appears in the sentence, an equivalent-phrase drill otherwise.
      const sentence = str(row.text), answer = str(row.answer);
      const drill = answer && sentence.toLowerCase().includes(answer.toLowerCase()) ? "blank" : "equivalent";
      return { importerType: "sentences", entry: withId({ sentence, answer, englishSentence: str(row.english), kind: drill }) };
    }
    case "proverb":
      return { importerType: "proverbs", entry: withId({ text: str(row.text), translation: str(row.english), meaning: str(row.meaning) }) };
    case "quiz":
      return { importerType: "quiz", entry: withId({
        type: str(row.category), prompt: str(row.text), answer: str(row.english),
        options: str(row.options).split("|").map((o) => o.trim()).filter(Boolean),
      }) };
    default:
      return { error: `unknown type "${str(row.type)}" (use dictionary, sentence, proverb, or quiz)` };
  }
}

// ─── router ───────────────────────────────────────────────────────────────────
export const bulkImportRouter = new Hono<AuthEnv>();
bulkImportRouter.use("*", authMiddleware);
bulkImportRouter.use("*", reviewerMiddleware);

type ImportRequest = {
  languageId: string;
  entries: unknown[];
  dryRun: boolean;
  isAdmin: boolean;
  userId: string;
  /** Only the lessons route uses this — the course the sheet's lessons land in. */
  courseId?: string;
};

/**
 * Shared front door for both import routes: parses the body and enforces the
 * security-relevant contract (a valid languageId, a non-empty batch, the
 * reviewer's per-language scope, and the role batch cap) in one place so the two
 * handlers can't drift. Returns a ready `Response` on rejection.
 */
async function readImportRequest(c: Context<AuthEnv>): Promise<ImportRequest | Response> {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const userId = c.get("userId");

  const body = await parseJson<{ languageId: string; entries: unknown[]; dryRun?: boolean; courseId?: string }>(c);
  if (!body.languageId || typeof body.languageId !== "string") {
    return c.json({ error: "languageId is required" }, 400);
  }
  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return c.json({ error: "entries must be a non-empty array" }, 400);
  }
  if (!isAdmin && !reviewerLanguages.includes(body.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }
  const cap = isAdmin ? 5000 : 100;
  if (body.entries.length > cap) {
    return c.json({ error: `Maximum ${cap} entries per import batch for your role` }, 400);
  }
  return {
    languageId: body.languageId,
    entries: body.entries,
    dryRun: body.dryRun ?? false,
    isAdmin,
    userId,
    courseId: typeof body.courseId === "string" ? body.courseId : undefined,
  };
}

// POST /api/import/lessons   body: { languageId, courseId, entries[], dryRun? }
// One course (chosen in the UI); each entry is one full lesson — `{ meta, segments }`
// parsed from one uploaded file, so several files import as several lessons.
// Registered before "/:type" so the param route can't grab it.
bulkImportRouter.post("/lessons", async (c) => {
  const req = await readImportRequest(c);
  if (req instanceof Response) return req;

  const courseId = req.courseId;
  if (!courseId) return c.json({ error: "courseId is required (pick a course to import into)" }, 400);
  const [course] = await db
    .select({ id: courses.id, languageId: courses.languageId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!course) return c.json({ error: `Course "${courseId}" not found` }, 404);
  if (course.languageId !== req.languageId) {
    return c.json({ error: "That course belongs to a different language" }, 400);
  }

  const errors: { id: string; reason: string }[] = [];
  const groups: LessonGroupInput[] = [];
  req.entries.forEach((raw, i) => {
    const file = (raw && typeof raw === "object" ? raw : {}) as { meta?: unknown; segments?: unknown };
    const { group, errors: fileErrors } = buildLessonGroup(file, courseId, i);
    if (group) groups.push(group);
    errors.push(...fileErrors);
  });

  const resultStatus = req.isAdmin ? "published" : "in_review";

  if (req.dryRun) {
    return c.json({
      dryRun: true,
      total: groups.length,
      valid: groups.length,
      errors,
      resultStatus,
      preview: groups.slice(0, 5).map((g) => ({ title: g.title, lines: g.segments.length })),
    });
  }
  if (groups.length === 0) {
    return c.json({ inserted: 0, skipped: errors.length, errors, resultStatus });
  }

  const inserted = await insertLessonGroups(groups, { courseId, status: statusValues(req.isAdmin, req.userId) });
  return c.json({ inserted, skipped: errors.length, errors, resultStatus });
});

// POST /api/import/unified   body: { languageId, entries[], dryRun? }
// One CSV, mixed content: each row's `type` column routes it to a per-type
// importer. Registered before "/:type" so it isn't swallowed by the param route.
bulkImportRouter.post("/unified", async (c) => {
  const req = await readImportRequest(c);
  if (req instanceof Response) return req;

  const errors: { id: string; reason: string }[] = [];
  const grouped: Record<string, Entry[]> = {};
  const preview: Record<string, unknown>[] = [];

  req.entries.forEach((raw, i) => {
    const row = (raw && typeof raw === "object" ? raw : {}) as Entry;
    const mapped = mapUnifiedRow(row, req.languageId);
    if ("error" in mapped) {
      errors.push({ id: idOf(row, i), reason: `Row ${i + 1}: ${mapped.error}` });
      return;
    }
    const config = IMPORTERS[mapped.importerType]!;
    const err = config.validate(mapped.entry, i + 1);
    if (err) {
      errors.push({ id: idOf(row, i), reason: err });
      return;
    }
    (grouped[mapped.importerType] ??= []).push(mapped.entry);
    if (preview.length < 5) preview.push({ type: str(row.type), ...config.preview(mapped.entry) });
  });

  const valid = Object.values(grouped).reduce((n, rows) => n + rows.length, 0);
  const resultStatus = req.isAdmin ? "published" : "in_review";

  if (req.dryRun) {
    return c.json({ dryRun: true, total: req.entries.length, valid, errors, resultStatus, preview });
  }
  if (valid === 0) {
    return c.json({ inserted: 0, skipped: errors.length, errors, resultStatus });
  }

  // Each importer type targets an independent table; the stateless neon-http
  // driver has no shared connection to serialize on, so insert them concurrently.
  const ctx: Ctx = { languageId: req.languageId, status: statusValues(req.isAdmin, req.userId) };
  const counts = await Promise.all(
    Object.entries(grouped).map(([importerType, rows]) => IMPORTERS[importerType]!.insert(rows, ctx)),
  );
  const inserted = counts.reduce((a, b) => a + b, 0);
  return c.json({ inserted, skipped: errors.length, errors, resultStatus });
});

// POST /api/import/:type   body: { languageId, entries[], dryRun? }
bulkImportRouter.post("/:type", async (c) => {
  const type = c.req.param("type");
  const config = IMPORTERS[type];
  if (!config) {
    return c.json({ error: `Unknown import type "${type}". Supported: ${Object.keys(IMPORTERS).join(", ")}` }, 404);
  }

  const req = await readImportRequest(c);
  if (req instanceof Response) return req;

  const errors: { id: string; reason: string }[] = [];
  const valid: Entry[] = [];
  req.entries.forEach((raw, i) => {
    const entry = (raw && typeof raw === "object" ? raw : {}) as Entry;
    const err = config.validate(entry, i + 1);
    if (err) errors.push({ id: idOf(entry, i), reason: err });
    else valid.push(entry);
  });

  const resultStatus = req.isAdmin ? "published" : "in_review";

  if (req.dryRun) {
    return c.json({
      dryRun: true,
      total: req.entries.length,
      valid: valid.length,
      errors,
      resultStatus,
      preview: valid.slice(0, 5).map(config.preview),
    });
  }

  if (valid.length === 0) {
    return c.json({ inserted: 0, skipped: errors.length, errors, resultStatus });
  }

  const inserted = await config.insert(valid, {
    languageId: req.languageId,
    status: statusValues(req.isAdmin, req.userId),
  });

  return c.json({ inserted, skipped: errors.length, errors, resultStatus });
});
