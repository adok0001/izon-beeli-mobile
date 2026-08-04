import { Hono } from "hono";
import { and, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { auditLog, dictionaryEntries } from "../db/schema.js";
import { AuthEnv } from "../middleware/auth.js";
import { withTranslations } from "../lib/dictionary-translations.js";
import { isDictionaryCategory } from "../lib/dictionary-categories.js";
import { TONE_ERROR, isWordTone } from "../lib/word-tones.js";
import { GLOSS_LOCALES } from "./educator/dictionary.js";
import type { TranslationMap } from "../lib/translations.js";
import {
  diffFields,
  lengthError,
  mergeGlossMap,
  mergeRequired,
  mergeScalar,
  projectMap,
  type EditCells,
  type FieldDiff,
} from "../lib/edit-merge.js";
import { readImportRequest, roleCap } from "./import-request.js";

/**
 * Bulk **edit** — correcting dictionary rows that already exist, as opposed to
 * `bulk-import.ts`, which only ever adds them.
 *
 * Matching is by `id`. An unknown id is an error, never an insert, and that is
 * a property of the SQL rather than of a JS pre-check: the write is an explicit
 * `UPDATE … FROM (VALUES …)`, which cannot create a row. The
 * `d.language_id = $lang` predicate covers "unknown id" and "id belonging to
 * another language" in the same clause.
 *
 * Deliberately *not* built on the importer's `onConflictDoUpdate`:
 *   - its SET list omits `status` / `createdBy` / `publishedBy` / `publishedAt`
 *     so imports never silently republish — which makes the un-publish rule
 *     below unreachable through it;
 *   - it never writes `updatedBy`, which every other Studio write path sets;
 *   - two rows with one id in a single `values(batch)` raise PG 21000, a hard
 *     500 that aborts the whole chunk (neon-http has no transactions);
 *   - and an upsert is an INSERT, so "cannot create rows" would be a claim
 *     about our JS, not about the statement.
 */

export const bulkEditRouter = new Hono<AuthEnv>();

/** Rows per statement — matches the importer's own batch size. */
const UPDATE_BATCH = 500;
/** How many changed rows the dry run shows. */
const DIFF_LIMIT = 20;

/** Columns an edit sheet may carry, in export order (mirrors `mobile/lib/edit-import.ts`). */
function editColumns(): string[] {
  const gloss = (field: string) => [field, ...GLOSS_LOCALES.filter((l) => l !== "en").map((l) => `${field}:${l}`)];
  return [
    "id",
    "word",
    ...gloss("english"),
    "category",
    "pronunciation",
    "tone",
    "example",
    ...gloss("exampleTranslation"),
    "semanticDomain",
    "status", // read-only: exported for context, ignored on the way back in
  ];
}

type Row = typeof dictionaryEntries.$inferSelect;

/** Flatten a stored row into the sheet's cells. */
function toExportRow(raw: Row): Record<string, string> {
  const row = withTranslations(raw);
  const out: Record<string, string> = {
    id: row.id,
    word: row.word,
    category: row.category,
    pronunciation: row.pronunciation ?? "",
    tone: row.tone ?? "",
    example: row.example ?? "",
    semanticDomain: row.semanticDomain ?? "",
    status: row.status,
  };
  for (const locale of GLOSS_LOCALES) {
    out[locale === "en" ? "english" : `english:${locale}`] = row.translations?.[locale] ?? "";
    out[locale === "en" ? "exampleTranslation" : `exampleTranslation:${locale}`] =
      row.exampleTranslations?.[locale] ?? "";
  }
  return out;
}

// GET /api/import/export?languageId=&type=dictionary&category=&status=&limit=
//
// Returns JSON, not text/csv: `apiFetch` ends in an unconditional `res.json()`
// and cannot fetch a non-JSON body. The client serializes with the shared
// `buildEditCsv`, so the CSV writer exists in exactly one place.
//
// Reads `dictionary_entries` directly. `GET /educator/dictionary` merges in
// approved `contributions` rows whose ids come from another table entirely —
// every one of them would come back "unknown id" on re-upload.
bulkEditRouter.get("/export", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const type = c.req.query("type") ?? "dictionary";
  if (type !== "dictionary") {
    return c.json({ error: `Export is only available for dictionary entries (got "${type}")` }, 400);
  }

  const languageId = c.req.query("languageId");
  if (!languageId) return c.json({ error: "languageId is required" }, 400);
  if (!isAdmin && !reviewerLanguages.includes(languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }

  // Cap the export at what the same role is allowed to upload back — an export
  // bigger than the import cap is un-uploadable, which is a worse failure than
  // being told to narrow the filter.
  const cap = roleCap(isAdmin);
  const requested = Number(c.req.query("limit"));
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, cap) : cap;

  // An explicit id list (the Studio checkbox picker) is a stronger filter than
  // category/status — a caller who already knows exactly which rows they want
  // isn't also narrowing by category, so ids wins outright rather than ANDing.
  const idsParam = c.req.query("ids");
  const ids = idsParam ? idsParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
  const category = c.req.query("category");
  const status = c.req.query("status");
  const where = ids?.length
    ? and(eq(dictionaryEntries.languageId, languageId), inArray(dictionaryEntries.id, ids))
    : and(
        eq(dictionaryEntries.languageId, languageId),
        category ? eq(dictionaryEntries.category, category) : undefined,
        status ? eq(dictionaryEntries.status, status as Row["status"]) : undefined,
      );

  // `count(*) over ()` is evaluated before LIMIT, so the full match count rides
  // along on the page itself — one round trip and one scan instead of two.
  const rows = await db
    .select({ ...getTableColumns(dictionaryEntries), total: sql<number>`count(*) over ()::int` })
    .from(dictionaryEntries)
    .where(where)
    .orderBy(dictionaryEntries.word)
    .limit(limit);

  const totalCount = rows[0]?.total ?? 0;
  return c.json({
    columns: editColumns(),
    rows: rows.map(toExportRow),
    rowCount: rows.length,
    totalCount,
    truncated: totalCount > rows.length,
    cap,
  });
});

// ─── merge ────────────────────────────────────────────────────────────────────

/** The column values one sheet row resolves to. */
interface MergedValues {
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
  semanticDomain: string | null;
}

interface MergedRow extends MergedValues {
  changes: FieldDiff[];
  unpublish: boolean;
}

/**
 * Merge one sheet row onto its stored row. Gloss maps merge per locale against
 * the row's own hydrated map, so a sheet that only fills `english:fr` keeps the
 * other glosses and never lets French reach the NOT NULL `english` column.
 */
function mergeRow(
  current: Row,
  cells: EditCells,
  unpublishable: boolean,
): { row: MergedRow } | { error: string } {
  const hydrated = withTranslations(current);

  const word = mergeRequired(hydrated.word, cells.word, "word");
  if ("error" in word) return word;
  const category = mergeRequired(hydrated.category, cells.category, "category");
  if ("error" in category) return category;
  if (!isDictionaryCategory(category.value)) {
    return { error: `invalid category "${category.value}"` };
  }

  const glossMap = mergeGlossMap(hydrated.translations ?? {}, cells, "english", GLOSS_LOCALES);
  const gloss = projectMap(glossMap);
  if (!gloss.flat) return { error: `"english" is required and cannot be cleared` };

  const exampleMap = mergeGlossMap(hydrated.exampleTranslations ?? {}, cells, "exampleTranslation", GLOSS_LOCALES);
  const example = projectMap(exampleMap);

  // Tone is optional, so a blank or cleared (`--`) cell is a legitimate "not
  // recorded" — only a value that is present and unknown is an error. `?? null`
  // covers a stored row read before the column existed.
  const tone = mergeScalar(hydrated.tone ?? null, cells.tone);
  if (tone !== null && !isWordTone(tone)) return { error: TONE_ERROR };

  const merged: MergedValues = {
    id: current.id,
    word: word.value,
    english: gloss.flat,
    translations: gloss.map,
    category: category.value,
    pronunciation: mergeScalar(hydrated.pronunciation, cells.pronunciation),
    tone,
    example: mergeScalar(hydrated.example, cells.example),
    exampleTranslation: example.flat,
    exampleTranslations: example.map,
    semanticDomain: mergeScalar(hydrated.semanticDomain, cells.semanticDomain),
  };

  // Length guards run here, not at the database: a 22001 mid-batch would leave
  // a partially applied edit behind, since neon-http gives us no transaction.
  for (const [field, value] of Object.entries(merged)) {
    if (typeof value === "string" || value === null) {
      const err = lengthError(field, value);
      if (err) return { error: err };
    }
  }

  const { id: _id, ...after } = merged;
  const changes = diffFields(
    {
      word: hydrated.word,
      english: hydrated.english,
      translations: hydrated.translations,
      category: hydrated.category,
      pronunciation: hydrated.pronunciation,
      tone: hydrated.tone,
      example: hydrated.example,
      exampleTranslation: hydrated.exampleTranslation,
      exampleTranslations: hydrated.exampleTranslations,
      semanticDomain: hydrated.semanticDomain,
    },
    after,
  );

  return {
    row: {
      ...merged,
      changes,
      // An all-blank row must never un-publish anything: no change, no
      // status flip. This is the single most important guard in the feature.
      unpublish: unpublishable && changes.length > 0 && current.status === "published",
    },
  };
}

// ─── write ────────────────────────────────────────────────────────────────────

/** Split rows into fixed-size chunks. */
function chunk<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/**
 * Apply merged rows. One explicit UPDATE per chunk — provably incapable of
 * inserting — with every VALUES column cast so Postgres never has to infer a
 * type from a NULL parameter.
 *
 * Chunks run concurrently: the duplicate-id guard proves no two of them touch
 * the same row, and the stateless neon-http driver has no shared connection to
 * serialize on (the same reason `/import/unified` fans out its inserts).
 */
async function applyEdits(rows: MergedRow[], languageId: string, actorId: string): Promise<number> {
  const counts = await Promise.all(chunk(rows, UPDATE_BATCH).map(async (batch) => {
    const values = sql.join(
      batch.map(
        (r) => sql`(
          ${r.id}::varchar, ${r.word}::varchar, ${r.english}::varchar,
          ${r.translations === null ? null : JSON.stringify(r.translations)}::jsonb,
          ${r.category}::varchar, ${r.pronunciation}::varchar, ${r.tone}::varchar,
          ${r.example}::text,
          ${r.exampleTranslation}::text,
          ${r.exampleTranslations === null ? null : JSON.stringify(r.exampleTranslations)}::jsonb,
          ${r.semanticDomain}::varchar, ${r.unpublish}::boolean
        )`,
      ),
      sql`, `,
    );

    const result = await db.execute(sql`
      UPDATE dictionary_entries AS d SET
        word = v.word,
        english = v.english,
        translations = v.translations,
        category = v.category,
        pronunciation = v.pronunciation,
        tone = v.tone,
        example = v.example,
        example_translation = v.example_translation,
        example_translations = v.example_translations,
        semantic_domain = v.semantic_domain,
        updated_by = ${actorId}::uuid,
        status = CASE WHEN v.unpublish THEN 'in_review'::content_status ELSE d.status END,
        published_by = CASE WHEN v.unpublish THEN NULL ELSE d.published_by END,
        published_at = CASE WHEN v.unpublish THEN NULL ELSE d.published_at END
      FROM (VALUES ${values}) AS v(
        id, word, english, translations, category, pronunciation, tone,
        example, example_translation, example_translations, semantic_domain, unpublish
      )
      WHERE d.id = v.id AND d.language_id = ${languageId}
      RETURNING d.id
    `);
    // neon-http hands back a bare array; the pg driver wraps it in `{ rows }`.
    const returned = result as unknown as { rows?: unknown[] } | unknown[];
    return Array.isArray(returned) ? returned.length : (returned.rows?.length ?? 0);
  }));
  return counts.reduce((a, b) => a + b, 0);
}

/** `audit_log.before` is the rollback material for an edit — one row per change. */
async function recordEdits(rows: MergedRow[], stored: Map<string, Row>, actorId: string): Promise<void> {
  const entries = rows.map(({ id, changes: _changes, unpublish, ...after }) => ({
    actorId,
    action: unpublish ? "edit_unpublish" : "edit",
    entityType: "dictionary_entries",
    entityId: id,
    before: stored.get(id) ?? null,
    after,
  }));
  await Promise.all(chunk(entries, UPDATE_BATCH).map((batch) => db.insert(auditLog).values(batch)));
}

type IdScan =
  | { duplicateError: string }
  | { ids: string[]; errors: { id: string; reason: string }[] };

/**
 * Read the `id` off every row.
 *
 * A sheet listing one id twice is rejected outright rather than last-wins: two
 * rows for one id in a single statement is a PG 21000, and silently picking one
 * hides a real editing mistake.
 */
function scanIds(cells: EditCells[]): IdScan {
  const errors: { id: string; reason: string }[] = [];
  const seen = new Map<string, number[]>();
  cells.forEach((row, i) => {
    const id = (row.id ?? "").trim();
    if (!id) {
      errors.push({ id: `row-${i + 1}`, reason: `Row ${i + 1}: missing id (edit mode matches on id and never inserts)` });
      return;
    }
    const lines = seen.get(id);
    if (lines) lines.push(i + 1);
    else seen.set(id, [i + 1]);
  });

  const duplicates = [...seen].filter(([, lines]) => lines.length > 1);
  if (duplicates.length > 0) {
    return {
      duplicateError: `The sheet lists the same id more than once: ${duplicates
        .map(([id, lines]) => `"${id}" (rows ${lines.join(", ")})`)
        .join("; ")}`,
    };
  }
  return { ids: [...seen.keys()], errors };
}

// POST /api/import/edit   body: { languageId, entries[], dryRun? }
bulkEditRouter.post("/edit", async (c) => {
  const req = await readImportRequest(c);
  if (req instanceof Response) return req;

  const cells = req.entries.map((raw) => (raw && typeof raw === "object" ? raw : {}) as EditCells);
  const scan = scanIds(cells);
  if ("duplicateError" in scan) return c.json({ error: scan.duplicateError }, 400);
  const { ids, errors } = scan;

  const stored = ids.length
    ? await db
        .select()
        .from(dictionaryEntries)
        .where(and(inArray(dictionaryEntries.id, ids), eq(dictionaryEntries.languageId, req.languageId)))
    : [];
  const byId = new Map(stored.map((r) => [r.id, r]));

  // A reviewer's edit un-publishes the row until an admin approves it again.
  const unpublishable = !req.isAdmin;

  const merged: MergedRow[] = [];
  let unchanged = 0;
  cells.forEach((row, i) => {
    const id = (row.id ?? "").trim();
    if (!id) return; // already reported by scanIds
    const current = byId.get(id);
    if (!current) {
      errors.push({
        id,
        reason: `Row ${i + 1}: no ${req.languageId} entry with id "${id}" — edit mode never creates rows. Use Content import to add a word.`,
      });
      return;
    }
    const result = mergeRow(current, row, unpublishable);
    if ("error" in result) {
      errors.push({ id, reason: `Row ${i + 1} (${id}): ${result.error}` });
      return;
    }
    if (result.row.changes.length === 0) unchanged++;
    else merged.push(result.row);
  });

  const unpublished = merged.filter((r) => r.unpublish).length;
  const diff = merged.slice(0, DIFF_LIMIT).map((r) => ({
    id: r.id,
    word: r.word,
    changes: r.changes,
    unpublishes: r.unpublish,
  }));

  // Everything above is a SELECT. The write lives past this return, so a dry
  // run is structurally read-only rather than read-only by inspection.
  if (req.dryRun) {
    return c.json({
      dryRun: true,
      mode: "edit",
      total: req.entries.length,
      valid: merged.length,
      updated: merged.length,
      unchanged,
      unpublished,
      diff,
      errors,
      resultStatus: req.isAdmin ? "published" : "in_review",
    });
  }

  // Both are no-ops on an empty list, so a sheet with nothing to change falls
  // through to the same response shape as one that changed something.
  const updated = await applyEdits(merged, req.languageId, req.userId);
  await recordEdits(merged, byId, req.userId);

  return c.json({
    mode: "edit",
    updated,
    unchanged,
    unpublished,
    diff,
    inserted: 0,
    skipped: errors.length,
    errors,
    resultStatus: req.isAdmin ? "published" : "in_review",
  });
});
