import { Hono } from "hono";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { dictionaryEntries, proverbs, quizQuestions, sentenceTemplates } from "../db/schema.js";
import { AuthEnv } from "../middleware/auth.js";
import type { TranslationMap } from "../lib/translations.js";
import { GLOSS_LOCALES } from "./educator/dictionary.js";
import { roleCap } from "./import-request.js";

/**
 * Content **export** — the missing half of the unified content import.
 *
 * `POST /import/unified` has always been able to put dictionary words, sentence
 * drills, proverbs and quiz questions in; nothing could get them back out. Only
 * the dictionary had an export at all (`GET /import/export`, in `bulk-edit.ts`,
 * and that one serves the id-matched *edit* sheet with its own `--` cell
 * semantics). So three of the four content types were write-only: no offline
 * backup, no bulk correction, nothing to hand a collaborator.
 *
 * This serves the same rows in the **unified sheet's own shape**, so what comes
 * out is something `mapUnifiedRow` can read straight back in. Two consequences
 * that shape every decision below:
 *
 *   - Every column `mapUnifiedRow` reads for a type is exported, including the
 *     ones the blank template omits (`id`, `tone`, a sentence's `kind`). An
 *     export is a superset of the template, never a subset — a missing column
 *     is a field that silently reverts on the way back in.
 *   - Translatable fields export one column per locale (`english`, `english:fr`,
 *     …). The importer rebuilds the whole gloss map from those columns and
 *     overwrites what is stored, so an export that dropped French would delete
 *     French on re-upload.
 *
 * Columns the unified sheet genuinely cannot carry (a proverb's `literal`, a
 * quiz question's `lessonId`) are protected on the importer side instead — see
 * `keepIfAbsent` in `bulk-import.ts`.
 *
 * Like the edit export, this returns JSON rather than `text/csv`: `apiFetch`
 * ends in an unconditional `res.json()` and cannot read a non-JSON body. Both
 * clients serialize with the shared `toCsv`.
 */

export const contentExportRouter = new Hono<AuthEnv>();

/** The row types the unified sheet routes — mirrors `UNIFIED_ROW_TYPES` client-side. */
const EXPORT_TYPES = ["dictionary", "sentence", "proverb", "quiz"] as const;
type ExportType = (typeof EXPORT_TYPES)[number];

function isExportType(value: string): value is ExportType {
  return (EXPORT_TYPES as readonly string[]).includes(value);
}

/** A translatable field's columns: the bare name is English, `field:xx` the rest. */
function gloss(field: string): string[] {
  return [field, ...GLOSS_LOCALES.filter((l) => l !== "en").map((l) => `${field}:${l}`)];
}

/**
 * Write a translatable field's per-locale cells. The bare column falls back to
 * the flat DB column so rows written before the map existed still export their
 * English.
 */
function glossCells(
  out: Record<string, string>,
  field: string,
  map: TranslationMap | null,
  flat: string | null,
): void {
  for (const locale of GLOSS_LOCALES) {
    const key = locale === "en" ? field : `${field}:${locale}`;
    out[key] = (locale === "en" ? map?.en ?? flat : map?.[locale]) ?? "";
  }
}

/** One page of a type's rows, plus the full match count for truncation reporting. */
type Page = { rows: Record<string, string>[]; totalCount: number };

interface ExportSpec<Row> {
  /** Sheet columns, in order. */
  columns: string[];
  /**
   * Flatten one stored row into sheet cells. Pure, and kept separate from
   * `read`, so the round-trip test can hand each one back to `mapUnifiedRow`
   * without a database — that test is the only thing keeping the two aligned.
   */
  toRow: (row: Row) => Record<string, string>;
  /** Read one capped page, ordered by the type's headline text. */
  read: (languageId: string, status: string | undefined, limit: number) => Promise<Page>;
}

/** `count(*) over ()` is evaluated before LIMIT, so the total rides along on the page. */
const TOTAL = sql<number>`count(*) over ()::int`;

/** Assemble a page from rows that each carry the windowed total. */
function page<T extends { total: number }>(rows: T[], toRow: (row: T) => Record<string, string>): Page {
  return { totalCount: rows[0]?.total ?? 0, rows: rows.map(toRow) };
}

// ─── dictionary ───────────────────────────────────────────────────────────────

type DictionaryRow = {
  id: string;
  word: string;
  english: string;
  translations: TranslationMap | null;
  category: string;
  pronunciation: string | null;
  tone: string | null;
  example: string | null;
  exampleTranslation: string | null;
  exampleTranslations: TranslationMap | null;
};

const dictionarySpec: ExportSpec<DictionaryRow> = {
  columns: [
    "type", "id", "text", ...gloss("english"),
    "category", "pronunciation", "tone", "example", ...gloss("example_english"),
  ],
  toRow: (r) => {
    const out: Record<string, string> = {
      type: "dictionary",
      id: r.id,
      text: r.word,
      category: r.category,
      pronunciation: r.pronunciation ?? "",
      tone: r.tone ?? "",
      example: r.example ?? "",
    };
    glossCells(out, "english", r.translations, r.english);
    glossCells(out, "example_english", r.exampleTranslations, r.exampleTranslation);
    return out;
  },
  read: async (languageId, status, limit) => {
    const rows = await db
      .select({
        id: dictionaryEntries.id,
        word: dictionaryEntries.word,
        english: dictionaryEntries.english,
        translations: dictionaryEntries.translations,
        category: dictionaryEntries.category,
        pronunciation: dictionaryEntries.pronunciation,
        tone: dictionaryEntries.tone,
        example: dictionaryEntries.example,
        exampleTranslation: dictionaryEntries.exampleTranslation,
        exampleTranslations: dictionaryEntries.exampleTranslations,
        total: TOTAL,
      })
      .from(dictionaryEntries)
      .where(and(
        eq(dictionaryEntries.languageId, languageId),
        status ? eq(dictionaryEntries.status, status as "published") : undefined,
      ))
      .orderBy(dictionaryEntries.word)
      .limit(limit);
    return page(rows, dictionarySpec.toRow);
  },
};

// ─── sentence drills ──────────────────────────────────────────────────────────

type SentenceRow = {
  id: string;
  sentence: string;
  englishSentence: string;
  answer: string;
  kind: string;
};

const sentenceSpec: ExportSpec<SentenceRow> = {
  // `kind` is derived from the sentence on import, but only as a default — an
  // "equivalent" drill whose answer happens to appear in its sentence would come
  // back as "blank" without this column.
  columns: ["type", "id", "text", "english", "answer", "kind"],
  toRow: (r) => ({
    type: "sentence",
    id: r.id,
    text: r.sentence,
    english: r.englishSentence,
    answer: r.answer,
    kind: r.kind,
  }),
  read: async (languageId, status, limit) => {
    const rows = await db
      .select({
        id: sentenceTemplates.id,
        sentence: sentenceTemplates.sentence,
        englishSentence: sentenceTemplates.englishSentence,
        answer: sentenceTemplates.answer,
        kind: sentenceTemplates.kind,
        total: TOTAL,
      })
      .from(sentenceTemplates)
      .where(and(
        eq(sentenceTemplates.languageId, languageId),
        status ? eq(sentenceTemplates.status, status as "published") : undefined,
      ))
      .orderBy(sentenceTemplates.sentence)
      .limit(limit);
    return page(rows, sentenceSpec.toRow);
  },
};

// ─── proverbs ─────────────────────────────────────────────────────────────────

type ProverbRow = {
  id: string;
  text: string;
  translation: string;
  translations: TranslationMap | null;
  meaning: string;
  meaningTranslations: TranslationMap | null;
};

const proverbSpec: ExportSpec<ProverbRow> = {
  // A proverb's `english` column is its translation; `meaning` is the lesson it
  // teaches. Both are gloss maps.
  columns: ["type", "id", "text", ...gloss("english"), ...gloss("meaning")],
  toRow: (r) => {
    const out: Record<string, string> = { type: "proverb", id: r.id, text: r.text };
    glossCells(out, "english", r.translations, r.translation);
    glossCells(out, "meaning", r.meaningTranslations, r.meaning);
    return out;
  },
  read: async (languageId, status, limit) => {
    const rows = await db
      .select({
        id: proverbs.id,
        text: proverbs.text,
        translation: proverbs.translation,
        translations: proverbs.translations,
        meaning: proverbs.meaning,
        meaningTranslations: proverbs.meaningTranslations,
        total: TOTAL,
      })
      .from(proverbs)
      .where(and(
        eq(proverbs.languageId, languageId),
        status ? eq(proverbs.status, status as "published") : undefined,
      ))
      .orderBy(proverbs.text)
      .limit(limit);
    return page(rows, proverbSpec.toRow);
  },
};

// ─── quiz questions ───────────────────────────────────────────────────────────

type QuizRow = {
  id: string;
  type: string;
  prompt: string;
  answer: string;
  options: string[] | null;
};

const quizSpec: ExportSpec<QuizRow> = {
  // `category` carries the question type and `options` the choices, pipe-joined —
  // both are what `mapUnifiedRow` reads for a quiz row.
  columns: ["type", "id", "text", "english", "category", "options"],
  toRow: (r) => ({
    type: "quiz",
    id: r.id,
    text: r.prompt,
    english: r.answer,
    category: r.type,
    options: (r.options ?? []).join("|"),
  }),
  read: async (languageId, status, limit) => {
    const rows = await db
      .select({
        id: quizQuestions.id,
        type: quizQuestions.type,
        prompt: quizQuestions.prompt,
        answer: quizQuestions.answer,
        options: quizQuestions.options,
        total: TOTAL,
      })
      .from(quizQuestions)
      .where(and(
        eq(quizQuestions.languageId, languageId),
        status ? eq(quizQuestions.status, status as "published") : undefined,
      ))
      .orderBy(quizQuestions.prompt)
      .limit(limit);
    return page(rows, quizSpec.toRow);
  },
};

/** Exposed for the round-trip test, which re-reads every exported row with `mapUnifiedRow`. */
export const CONTENT_EXPORT_SPECS = {
  dictionary: dictionarySpec,
  sentence: sentenceSpec,
  proverb: proverbSpec,
  quiz: quizSpec,
};

// ─── route ────────────────────────────────────────────────────────────────────

// GET /api/import/content-export?languageId=&type=dictionary&status=&limit=
contentExportRouter.get("/content-export", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId is required" }, 400);
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  const type = c.req.query("type") ?? "";
  if (!isExportType(type)) {
    return c.json({ error: `type must be one of: ${EXPORT_TYPES.join(", ")}` }, 400);
  }

  // Cap at what the same role may upload back. An export bigger than the import
  // cap is un-uploadable, which is a worse failure than being told to narrow it.
  const cap = roleCap(isAdmin);
  const requested = Number(c.req.query("limit"));
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, cap) : cap;

  const spec = CONTENT_EXPORT_SPECS[type];
  const { rows, totalCount } = await spec.read(languageId, c.req.query("status") || undefined, limit);

  return c.json({
    columns: spec.columns,
    rows,
    rowCount: rows.length,
    totalCount,
    truncated: totalCount > rows.length,
    cap,
  });
});
