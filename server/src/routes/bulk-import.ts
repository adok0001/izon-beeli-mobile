import { Hono } from "hono";
import { sql, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { isDictionaryCategory } from "../lib/dictionary-categories.js";
import { TONE_ERROR, isValidToneInput, normalizeTone } from "../lib/word-tones.js";
import { headwordId } from "../lib/slug.js";
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
import { readImportRequest } from "./import-request.js";
import { bulkEditRouter } from "./bulk-edit.js";
import { contentExportRouter } from "./content-export.js";
import { lessonExportRouter } from "./lesson-export.js";

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

/**
 * Tracks the ids claimed so far in one request, so a repeat becomes a per-row
 * error instead of a failed insert.
 *
 * `onConflictDoUpdate` cannot absorb this. Postgres raises 21000 — "ON CONFLICT
 * DO UPDATE command cannot affect row a second time" — for any statement whose
 * own rows collide on the arbiter index, and nothing here caught it: the request
 * 500'd with no row identified, and since `inBatches` commits BATCH rows at a
 * time with no enclosing transaction (neon-http has none), earlier chunks had
 * already landed. Duplicates that straddled a chunk boundary didn't even raise —
 * the later row silently overwrote the earlier one, so whether an educator got a
 * crash or lost a definition depended on where in the sheet the rows fell.
 *
 * Rows with no id are skipped: those get one at insert time (`randomUUID`) and
 * can't collide. `scope` separates content types in the unified sheet, where a
 * proverb and a dictionary entry land in different tables and may legitimately
 * carry the same id.
 */
function idTracker(): (id: string, rowNumber: number, scope?: string) => string | null {
  const claimed = new Map<string, number>();
  return (id, rowNumber, scope = "") => {
    if (!id) return null;
    const key = `${scope} ${id}`;
    const first = claimed.get(key);
    if (first !== undefined) {
      return `Row ${rowNumber}: duplicate id "${id}" (row ${first} already uses it) — one row would overwrite the other. If these are senses of the same word, put them in ONE row separated by semicolons ("old; ancient; former"). If they are different words that happen to share a spelling, add an "id" column and give each its own id.`;
    }
    claimed.set(key, rowNumber);
    return null;
  };
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
/**
 * Keep a column the CSV can't carry instead of nulling it on conflict.
 *
 * Drizzle emits `default` (→ NULL) for an `undefined` value, so a plain
 * `excluded.<col>` in the SET list wipes every column the unified sheet has no
 * header for. `coalesce` falls back to the row already in the table, which
 * costs no extra round trip and — unlike reading the rows first — has no
 * read-then-write race.
 *
 * Every importer reachable from the unified sheet needs this, not just the
 * dictionary: `GET /import/content-export` makes "export, edit, re-upload" a
 * routine action, and each such column is one an educator would silently lose
 * on the way back in — a proverb's `literal`, a quiz question's `lessonId`.
 * The trade is that an import can set these fields but never clear one;
 * clearing stays an editor job, as it already was for `tone`.
 */
const keepIfAbsent = (table: string, column: string) =>
  sql.raw(`coalesce(excluded.${column}, ${table}.${column})`);

/**
 * Length guard for the varchar-bounded columns.
 *
 * Overflow is a live risk rather than a theoretical one: the way to record
 * several senses of a word is to put them in one `english` field separated by
 * semicolons, so the field grows with the lexicography. The longest Izon gloss
 * is already 498 of the 500 characters available, and 39 entries sit within 20.
 * Without this check Postgres raises 22001 and the whole batch 500s with no row
 * named — the same shape of failure duplicate ids used to cause.
 */
function tooLong(value: string, max: number, field: string, row: number): string | null {
  return value.length > max
    ? `Row ${row}: ${field} is ${value.length} characters, over the ${max} limit. Trim it, or move the long tail into the example column (which has no limit).`
    : null;
}

const dictionaryImporter: ImporterConfig = {
  validate: (e, i) => {
    if (!str(e.id)) return `Row ${i}: missing id (dictionary entries require an explicit id)`;
    if (!str(e.word)) return `Row ${i}: missing word`;
    if (!str(e.english)) return `Row ${i}: missing english`;
    if (!isDictionaryCategory(str(e.category))) return `Row ${i} (${str(e.id)}): invalid category "${str(e.category)}"`;
    // Tone is optional — a sheet with no tone column, or a blank cell, is fine.
    if (!isValidToneInput(e.tone)) return `Row ${i} (${str(e.id)}): ${TONE_ERROR}`;
    return (
      tooLong(str(e.id), 64, "id", i) ??
      tooLong(str(e.word), 500, "word", i) ??
      tooLong(str(e.english), 500, "english", i) ??
      tooLong(str(e.pronunciation), 500, "pronunciation", i)
    );
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
      tone: normalizeTone(e.tone),
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
          // `tone` is optional and most sheets predate the column, so a re-import
          // must not null out a tone somebody recorded in Studio. An import can
          // therefore set a tone but never clear one — clearing is an editor job.
          tone: keepIfAbsent("dictionary_entries", "tone"),
          // No unified-CSV column carries these — keep what's already stored.
          audioUrl: keepIfAbsent("dictionary_entries", "audio_url"),
          synonyms: keepIfAbsent("dictionary_entries", "synonyms"),
          antonyms: keepIfAbsent("dictionary_entries", "antonyms"),
          semanticDomain: keepIfAbsent("dictionary_entries", "semantic_domain"),
          dialectalVariants: keepIfAbsent("dictionary_entries", "dialectal_variants"),
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
          // No unified-CSV column carries this — keep what's already stored.
          literalTranslation: keepIfAbsent("sentence_templates", "literal_translation"),
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
          // No unified-CSV column carries these — keep what's already stored.
          literal: keepIfAbsent("proverbs", "literal"),
          context: keepIfAbsent("proverbs", "context"),
          tags: keepIfAbsent("proverbs", "tags"),
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
          // No unified-CSV column carries these — keep what's already stored.
          // `lessonId`/`sceneId` are the worst of them: wiping one unlinks a
          // question from the lesson it tests.
          audioUrl: keepIfAbsent("quiz_questions", "audio_url"),
          explanation: keepIfAbsent("quiz_questions", "explanation"),
          lessonId: keepIfAbsent("quiz_questions", "lesson_id"),
          sceneId: keepIfAbsent("quiz_questions", "scene_id"),
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
/**
 * Carry `<column>:<lang>` sidecars across the unified column names into the
 * per-type field names `mapOf` looks for.
 *
 * `mapUnifiedRow` rebuilds each row as a fresh entry with fixed field names, so
 * anything not named explicitly is dropped — which silently discarded every
 * `english:fr` an educator put in a unified sheet, even though the per-type
 * importers have supported the form all along. The unified column and the target
 * field are not always the same word (`example_english` → `exampleTranslation`,
 * a proverb's `english` → `translation`), hence the mapping.
 */
function carryLocales(row: Entry, cols: Record<string, string>): Entry {
  const out: Entry = {};
  for (const [key, value] of Object.entries(row)) {
    const [name, lang] = key.split(":");
    if (!lang) continue;
    const field = cols[name];
    if (field) out[`${field}:${lang.trim()}`] = value;
  }
  return out;
}

export function mapUnifiedRow(row: Entry, languageId: string): Mapped | { error: string } {
  const withId = (extra: Entry): Entry => (opt(row.id) ? { id: str(row.id), ...extra } : extra);

  switch (str(row.type).toLowerCase()) {
    case "dictionary":
      // Dictionary upserts by id; synthesize a stable one from the headword so a
      // re-imported sheet updates rather than duplicates. See `headwordId` for
      // why the readable slug alone can't be the identity.
      return { importerType: "dictionary", entry: {
        id: opt(row.id) ?? headwordId(languageId, str(row.text)),
        word: str(row.text), english: str(row.english), category: str(row.category),
        pronunciation: str(row.pronunciation), tone: str(row.tone), example: str(row.example),
        exampleTranslation: str(row.example_english),
        ...carryLocales(row, { english: "english", example_english: "exampleTranslation" }),
      } };
    case "sentence": {
      // `kind` is derived rather than asked for: a fill-in-the-blank when the
      // answer appears in the sentence, an equivalent-phrase drill otherwise.
      // Derived only as a *default*, though — an export carries the stored kind,
      // and an "equivalent" drill whose answer happens to appear in its sentence
      // would flip to "blank" on re-upload if the column were ignored.
      const sentence = str(row.text), answer = str(row.answer);
      const drill = str(row.kind)
        || (answer && sentence.toLowerCase().includes(answer.toLowerCase()) ? "blank" : "equivalent");
      return { importerType: "sentences", entry: withId({ sentence, answer, englishSentence: str(row.english), kind: drill }) };
    }
    case "proverb":
      return { importerType: "proverbs", entry: withId({
        text: str(row.text), translation: str(row.english), meaning: str(row.meaning),
        ...carryLocales(row, { english: "translation", meaning: "meaning" }),
      }) };
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

// Edit mode (`GET /export`, `POST /edit`) and the unified content export
// (`GET /content-export`). Both registered before the "/:type" catch-all below
// so the param route can't swallow their paths.
bulkImportRouter.route("/", bulkEditRouter);
bulkImportRouter.route("/", contentExportRouter);
bulkImportRouter.route("/", lessonExportRouter);

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
  const claimId = idTracker();
  req.entries.forEach((raw, i) => {
    const file = (raw && typeof raw === "object" ? raw : {}) as { meta?: unknown; segments?: unknown };
    const { group, errors: fileErrors } = buildLessonGroup(file, courseId, i);
    errors.push(...fileErrors);
    if (!group) return;
    // Lesson ids come from `${courseId}-${slugify(title)}`, so two uploaded files
    // whose titles differ only in case or punctuation land on one id.
    const duplicate = claimId(group.id, i + 1);
    if (duplicate) errors.push({ id: group.id, reason: duplicate });
    else groups.push(group);
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

  const { inserted, repositioned } = await insertLessonGroups(groups, {
    courseId,
    status: statusValues(req.isAdmin, req.userId),
  });
  // Surfaced rather than silent: a check whose segment is gone was moved to the
  // end of its lesson, and an educator needs to know to reposition it.
  return c.json({
    inserted,
    skipped: errors.length,
    errors,
    resultStatus,
    ...(repositioned > 0 ? { repositionedChecks: repositioned } : {}),
  });
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
  const claimId = idTracker();

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
    const duplicate = claimId(str(mapped.entry.id), i + 1, mapped.importerType);
    if (duplicate) {
      errors.push({ id: idOf(mapped.entry, i), reason: duplicate });
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
  const claimId = idTracker();
  req.entries.forEach((raw, i) => {
    const entry = (raw && typeof raw === "object" ? raw : {}) as Entry;
    const err = config.validate(entry, i + 1) ?? claimId(str(entry.id), i + 1);
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
