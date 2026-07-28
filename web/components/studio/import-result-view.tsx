"use client";

import { cn } from "@/lib/utils";
import {
  describeImportResult,
  type EditDiffRow,
  type ImportResult,
  type ResultStat,
} from "@mobile/lib/import-result";
import { AlertTriangle, Plus } from "lucide-react";
import { useState } from "react";

const TONE: Record<ResultStat["tone"], string> = {
  success: "text-green-600 dark:text-green-400",
  warning: "text-amber-500",
  error: "text-red-500",
  muted: "text-neutral-500",
};

/**
 * The dry-run/confirm result card shared by every Studio import panel (unified
 * content, lessons, dictionary edit). Panels differ only in how they build
 * entries and which endpoint they hit; the presentation is identical, so it
 * lives here and the copy lives in `describeImportResult`, shared with the
 * mobile renderer.
 *
 * Edit results arrive as `diff`, never as `preview` — the preview renderer walks
 * a row's values positionally and would print an `EditDiffRow` as
 * `[object Object]`.
 */
export function ImportResultView({
  result,
  running,
  unit,
  confirmLabel = "Import",
  onConfirm,
  onCancel,
}: Readonly<{
  result: ImportResult;
  running: boolean;
  /** Plural noun for the confirm button, e.g. "rows" or "lessons". */
  unit: string;
  /** Verb on the confirm button — "Import" for inserts, "Apply" for edits. */
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}>) {
  // Tracked against the result it was given for, not as a bare boolean: a
  // second dry run must re-ask before published words leave the app.
  const [ackFor, setAckFor] = useState<ImportResult | null>(null);
  const summary = describeImportResult(result, unit, confirmLabel);
  const locked = summary.needsAcknowledgement && ackFor !== result;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{summary.title}</span>
        <div className="flex items-center gap-4 text-xs">
          {summary.stats.map((stat) => (
            <span key={stat.label} className={cn("font-medium", TONE[stat.tone])}>{stat.label}</span>
          ))}
        </div>
      </div>

      {(result.preview?.length || result.diff?.length) && (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {result.preview?.map((row, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-4 text-sm">
              {Object.values(row).map((v, j) => (
                <span key={j} className={j === 0
                  ? "font-semibold text-neutral-900 dark:text-white truncate max-w-[10rem]"
                  : "text-neutral-500 dark:text-neutral-400 truncate flex-1"}>
                  {String(v)}
                </span>
              ))}
            </div>
          ))}
          {result.diff?.map((row) => <DiffRow key={row.id} row={row} />)}
          {summary.overflow > 0 && (
            <div className="px-4 py-2 text-xs text-neutral-400 dark:text-neutral-500">
              …and {summary.overflow} more {unit}
            </div>
          )}
        </div>
      )}

      {summary.warning && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/15 border-t border-amber-200 dark:border-amber-900/40">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{summary.warning.title}</p>
              <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">{summary.warning.body}</p>
            </div>
          </div>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="px-4 py-3 bg-red-50/50 dark:bg-red-900/10 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-xs font-semibold text-red-600 dark:text-red-400">{result.errors.length} errors</span>
          <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {result.errors.slice(0, 8).map((e, i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-400">{e.reason}</li>
            ))}
          </ul>
        </div>
      )}

      {result.dryRun && onConfirm && (
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          {locked ? (
            <button
              onClick={() => setAckFor(result)}
              className="px-4 py-2 rounded-lg border border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              I understand — let me apply these
            </button>
          ) : (
            <button
              onClick={onConfirm}
              disabled={running || summary.affected === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {summary.confirmLabel}
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel} className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">Cancel</button>
          )}
        </div>
      )}
    </div>
  );
}

/** One changed entry: the word, then each field's before → after. */
function DiffRow({ row }: Readonly<{ row: EditDiffRow }>) {
  return (
    <div className="px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-neutral-900 dark:text-white">{row.word}</span>
        {row.unpublishes && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            un-publishes
          </span>
        )}
      </div>
      <ul className="mt-1 space-y-0.5">
        {row.changes.map((change) => (
          <li key={change.field} className="text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{change.field}</span>{" "}
            <span className="line-through">{change.before ?? "—"}</span> → {change.after ?? "—"}
          </li>
        ))}
      </ul>
    </div>
  );
}
