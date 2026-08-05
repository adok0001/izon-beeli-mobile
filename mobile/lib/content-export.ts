/**
 * Content **export** — the client half of `GET /import/content-export`.
 *
 * Studio could always upload a unified content sheet and never download one.
 * Only the dictionary had a way out (the id-matched *edit* sheet), which left
 * sentence drills, proverbs and quiz questions write-only: no offline backup,
 * no bulk correction, nothing to hand a collaborator.
 *
 * The sheet that comes down is the same shape `POST /import/unified` reads, so
 * the round trip is: export → fix it in a spreadsheet → upload it back. Rows
 * carry their `id`, so re-uploading updates the same rows rather than
 * duplicating them — see `mapUnifiedRow` server-side, where every importer
 * upserts on the id it is given.
 *
 * The server decides the columns (it knows which fields each type stores and
 * which gloss locales exist); this module only names the file and serializes.
 * Serialization borrows `toCsv` from `edit-import` — one CSV writer, shared —
 * but deliberately *not* `buildEditCsv`: the `--` clear sentinel is an edit-lane
 * rule, and a content sheet has no such thing to escape.
 */
import { toCsv } from "./edit-import";
import type { UnifiedRowType } from "./unified-import";

/**
 * Picker options, in the order the Studio shows them.
 *
 * Dictionary is deliberately absent even though the endpoint serves it. Edit
 * mode already exports dictionary words, with nearly the same columns and
 * strictly better rules for correcting them: blank means "leave this alone"
 * instead of "clear it", an unknown id is an error rather than a new word, and
 * it can be narrowed by category or by ticking individual entries. Offering a
 * second, weaker dictionary export beside it would be a trap, not a choice.
 *
 * These three have no edit lane at all — before this export they could only be
 * written to, never read back — which is the gap the content export exists to
 * close. The server stays generic over all four unified types (the importer
 * accepts four, so the round-trip guarantee has to cover four); which of them
 * the Studio *offers* is this list's decision.
 */
export const CONTENT_EXPORT_TYPES: { id: UnifiedRowType; label: string }[] = [
  { id: "sentence", label: "Sentence drills" },
  { id: "proverb", label: "Proverbs" },
  { id: "quiz", label: "Quiz questions" },
];

/** The type the picker opens on. */
export const DEFAULT_CONTENT_EXPORT_TYPE: UnifiedRowType = "sentence";

/** What each exported sheet is for — shown above the picker. */
export const CONTENT_EXPORT_GUIDE =
  "The sheet comes back in the same shape you upload, one type at a time, with an id column. " +
  "Correct what you need and upload it below — matching rows are updated in place, and rows you " +
  "add are created. Columns the sheet doesn't carry are left alone. For dictionary words use " +
  "Edit instead: it can correct them but never create one by accident.";

/** `beeli-izon-dictionary.csv` — language and type, so downloads don't collide. */
export function contentExportFilename(languageId: string, type: UnifiedRowType): string {
  return `beeli-${languageId}-${type}.csv`;
}

/** Serialize an export response into the downloadable sheet. */
export function buildContentCsv(rows: Record<string, string>[], columns: readonly string[]): string {
  return toCsv(rows, columns);
}
