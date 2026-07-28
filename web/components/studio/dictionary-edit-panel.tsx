"use client";

import { apiFetch } from "@/lib/api";
import { ImportResultView } from "@/components/studio/import-result-view";
import type { ImportResult } from "@/lib/import-types";
import { download } from "@/lib/utils";
import { buildEditCsv, EDIT_FIELD_GUIDE, parseEditCsv } from "@mobile/lib/edit-import";
import type { DictionaryExport } from "@mobile/lib/import-result";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "@mobile/lib/dictionary";
import { useAuth } from "@clerk/nextjs";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Correct dictionary rows that already exist: export a slice, edit it in a
 * spreadsheet, upload the same sheet back.
 *
 * Rows are matched on `id`, and an id that isn't already in this language is an
 * error — this panel structurally cannot create a word. A blank cell leaves its
 * field alone (a round-tripped export is mostly cells nobody touched); `--`
 * clears it.
 *
 * The older `ImportPanel` on the dictionary page is left alone deliberately:
 * it's an insert path that happens to accept ids, and teaching one component two
 * opposite blank-cell meanings is how this gets confusing.
 */
export function DictionaryEditPanel({ languageId }: Readonly<{ languageId: string }>) {
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const reset = () => { setResult(null); setRows(null); setFileName(null); };

  const post = (entries: unknown[], dryRun: boolean) =>
    getToken().then((token) =>
      apiFetch<ImportResult>("/import/edit", {
        method: "POST",
        body: JSON.stringify({ languageId, entries, dryRun }),
        token: token ?? undefined,
      }),
    );

  const exportCsv = async () => {
    setRunning(true);
    try {
      const query = new URLSearchParams({ languageId, type: "dictionary" });
      if (category) query.set("category", category);
      const token = await getToken();
      const data = await apiFetch<DictionaryExport>(`/import/export?${query}`, { token: token ?? undefined });
      if (data.rowCount === 0) { toast.error("Nothing to export for that filter"); return; }
      download(`beeli-${languageId}-${category || "dictionary"}.csv`, buildEditCsv(data.rows, data.columns), "text/csv");
      if (data.truncated) {
        toast.warning(`${data.totalCount} words match`, {
          description: `You can upload ${data.cap} at a time, so only the first ${data.rowCount} are in this file. Pick a category to narrow it.`,
        });
      }
    } catch (e) {
      toast.error("Export failed", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const parsed = parseEditCsv(await file.text());
      if (parsed.length === 0) { toast.error("No rows found — every row needs its `id` column"); return; }
      setRows(parsed);
      setRunning(true);
      setResult(await post(parsed, true));
    } catch (e) {
      toast.error("Failed to read file", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const confirm = async () => {
    if (!rows) return;
    setRunning(true);
    try {
      const res = await post(rows, false);
      setResult(res);
      const pending = res.unpublished ? ` ${res.unpublished} went back for review.` : "";
      toast.success(`Updated ${res.updated} words.${pending}`);
      setRows(null);
    } catch (e) {
      toast.error("Update failed", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">1 · Export the words to fix</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Pick a category — an export bigger than one upload can carry is cut short, and the whole
          dictionary is far bigger than that.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-2 py-2 text-neutral-900 dark:text-white"
          >
            <option value="">All categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <button
            onClick={() => void exportCsv()}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">2 · Upload the corrected sheet</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Rows are matched on <code>id</code>. An id that isn’t already in this language is an error, so
          this never creates a word by accident — use Content import to add one.
        </p>

        <ul className="mb-4 space-y-1.5">
          {EDIT_FIELD_GUIDE.map((g) => (
            <li key={g.label} className="text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{g.label}</span> — {g.uses}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { reset(); fileRef.current?.click(); }}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> {fileName ? "Replace file" : "Upload edited CSV"}
          </button>
          {fileName && <span className="text-xs text-neutral-500 truncate max-w-xs">{fileName}</span>}
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
      </div>

      {running && (
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Processing…
        </div>
      )}

      {result && (
        <ImportResultView
          result={result}
          running={running}
          unit="words"
          confirmLabel="Apply"
          onConfirm={rows ? () => void confirm() : undefined}
          onCancel={reset}
        />
      )}
    </div>
  );
}
