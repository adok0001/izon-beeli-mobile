"use client";

import type { ImportResult } from "@/lib/import-types";
import { Plus } from "lucide-react";

/**
 * The dry-run/confirm result card shared by every Studio import panel (unified
 * content, lessons, …). Panels differ only in how they build entries and which
 * endpoint they hit; the result presentation is identical, so it lives here.
 * When `onConfirm` is provided and the result is a dry run, the confirm/cancel
 * footer is shown.
 */
export function ImportResultView({
  result,
  running,
  unit,
  onConfirm,
  onCancel,
}: Readonly<{
  result: ImportResult;
  running: boolean;
  /** Plural noun for the confirm button, e.g. "rows" or "lessons". */
  unit: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}>) {
  const shownPreview = result.preview?.length ?? 0;
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
          {result.dryRun ? "Dry-run preview" : "Import result"}
        </span>
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          {result.dryRun ? (
            <>
              <span className="text-green-600 dark:text-green-400 font-medium">{result.valid} valid</span>
              {result.errors.length > 0 && <span className="text-red-500 font-medium">{result.errors.length} errors</span>}
            </>
          ) : (
            <>
              <span className="text-green-600 dark:text-green-400 font-medium">{result.inserted} imported</span>
              {result.skipped ? <span className="text-amber-500 font-medium">{result.skipped} skipped</span> : null}
            </>
          )}
        </div>
      </div>

      {shownPreview > 0 && (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {result.preview!.map((row, i) => (
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
          {(result.total ?? 0) > shownPreview && (
            <div className="px-4 py-2 text-xs text-neutral-400 dark:text-neutral-500">
              …and {(result.total ?? 0) - shownPreview} more {unit}
            </div>
          )}
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
          <button
            onClick={onConfirm}
            disabled={running || (result.valid ?? 0) === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Import {result.valid} {unit}
          </button>
          {onCancel && (
            <button onClick={onCancel} className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">Cancel</button>
          )}
        </div>
      )}
    </div>
  );
}
