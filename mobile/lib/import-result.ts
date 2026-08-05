/**
 * The Studio import/edit result contract, shared by both clients.
 *
 * Web imports this directly (`@mobile/lib/import-result`) — the shape used to be
 * hand-copied into `web/lib/import-types.ts` and kept in sync by comment, which
 * is exactly how the un-publish warning below would drift.
 */

export interface FieldDiff {
  field: string;
  before: string | null;
  after: string | null;
}

export interface EditDiffRow {
  id: string;
  word: string;
  changes: FieldDiff[];
  /** True when applying this row un-publishes it pending admin approval. */
  unpublishes: boolean;
}

/**
 * Returned by `/import/unified`, `/import/:type` and `/import/edit`, for both
 * the dry run and the real run.
 *
 * Edit mode fills `mode`/`updated`/`unchanged`/`unpublished`/`diff` and leaves
 * `preview` undefined. That separation is load-bearing: both result renderers
 * walk `preview` rows with `Object.values(row)` positionally, so an
 * `EditDiffRow` sent down that path would render as `[object Object]`.
 */
export interface ImportResult {
  dryRun?: boolean;
  total?: number;
  valid?: number;
  inserted?: number;
  skipped?: number;
  resultStatus?: "published" | "in_review";
  errors: { id: string; reason: string }[];
  preview?: Record<string, unknown>[];
  mode?: "insert" | "edit";
  updated?: number;
  unchanged?: number;
  unpublished?: number;
  /** Edit mode only — capped server-side. */
  diff?: EditDiffRow[];
}

/**
 * What an export endpoint hands back — plain values, serialized client-side.
 * Shared by `GET /import/export` (the id-matched dictionary edit sheet) and
 * `GET /import/content-export` (the unified content sheet).
 */
export interface CsvExport {
  columns: string[];
  rows: Record<string, string>[];
  rowCount: number;
  totalCount: number;
  /** True when the filter matched more rows than the role may upload back. */
  truncated: boolean;
  cap: number;
}

export interface ResultStat {
  label: string;
  tone: "success" | "warning" | "error" | "muted";
}

export interface ResultSummary {
  title: string;
  stats: ResultStat[];
  /** Rows the server didn't send, as a trailing "…and N more" line. */
  overflow: number;
  /** The un-publish warning, when there is one. */
  warning?: { title: string; body: string };
  /** How many rows the confirm button will act on. */
  affected: number;
  /** True when the confirm button must be unlocked by a second, explicit tap. */
  needsAcknowledgement: boolean;
  confirmLabel: string;
}

/**
 * Everything both renderers need to describe a result, including the copy.
 *
 * The un-publish warning is the reason this is shared rather than written twice:
 * it is the only thing standing between an educator and published words quietly
 * leaving the app, and a safety message maintained in two places drifts.
 */
export function describeImportResult(
  result: ImportResult,
  unit: string,
  confirmLabel: string,
): ResultSummary {
  const isEdit = result.mode === "edit";
  const unpublished = result.unpublished ?? 0;
  const affected = isEdit ? result.updated ?? 0 : result.valid ?? 0;
  const shown = (isEdit ? result.diff?.length : result.preview?.length) ?? 0;
  const total = isEdit ? affected : result.total ?? 0;

  const stats: ResultStat[] = [];
  if (isEdit) {
    stats.push({ label: `${result.updated ?? 0} ${result.dryRun ? "to change" : "changed"}`, tone: "success" });
    if (result.unchanged) stats.push({ label: `${result.unchanged} unchanged`, tone: "muted" });
    if (result.errors.length) stats.push({ label: `${result.errors.length} errors`, tone: "error" });
  } else if (result.dryRun) {
    stats.push({ label: `${result.valid} valid`, tone: "success" });
    if (result.errors.length) stats.push({ label: `${result.errors.length} errors`, tone: "error" });
  } else {
    stats.push({ label: `${result.inserted} added`, tone: "success" });
    if (result.skipped) stats.push({ label: `${result.skipped} skipped`, tone: "warning" });
  }

  const one = unpublished === 1;
  return {
    title: result.dryRun ? "Preview" : isEdit ? "Changes applied" : "Imported",
    stats,
    overflow: Math.max(0, total - shown),
    warning: unpublished > 0
      ? {
          title: `${unpublished} published ${one ? "word disappears" : "words will disappear"} from the app`,
          body: `Editing a published word sends it back for review. Learners stop seeing ${
            one ? "it" : "them"
          } until an admin approves the change.`,
        }
      : undefined,
    affected,
    needsAcknowledgement: result.dryRun === true && unpublished > 0,
    confirmLabel: `${confirmLabel} ${affected} ${unit}`,
  };
}
