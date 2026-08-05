"use client";

import { apiFetch } from "@/lib/api";
import { ImportResultView } from "@/components/studio/import-result-view";
import type { ImportResult } from "@/lib/import-types";
import {
  parseUnifiedCsv,
  UNIFIED_FIELD_GUIDE,
  UNIFIED_TEMPLATE_CSV,
  type UnifiedRowType,
} from "@/lib/unified-import";
import {
  buildContentCsv,
  contentExportFilename,
  CONTENT_EXPORT_GUIDE,
  CONTENT_EXPORT_TYPES,
  DEFAULT_CONTENT_EXPORT_TYPE,
} from "@mobile/lib/content-export";
import type { CsvExport } from "@mobile/lib/import-result";
import { download } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Upload one mixed-content CSV — dictionary, sentence, proverb and quiz rows in a
 * single sheet, routed by the `type` column. Runs an automatic dry-run preview
 * against POST /import/unified before the editor confirms; admins publish live,
 * reviewers stage for review.
 *
 * The export above it is the same sheet in reverse: one content type at a time,
 * in the shape this panel uploads, so what comes down can go straight back up.
 */
export function UnifiedImportPanel({ languageId }: Readonly<{ languageId: string }>) {
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [exportType, setExportType] = useState<UnifiedRowType>(DEFAULT_CONTENT_EXPORT_TYPE);

  const reset = () => { setResult(null); setRows(null); setFileName(null); };

  const exportCsv = async () => {
    setRunning(true);
    try {
      const query = new URLSearchParams({ languageId, type: exportType });
      const token = await getToken();
      const data = await apiFetch<CsvExport>(`/import/content-export?${query}`, { token: token ?? undefined });
      if (data.rowCount === 0) { toast.error("Nothing to export for that type yet"); return; }
      download(contentExportFilename(languageId, exportType), buildContentCsv(data.rows, data.columns), "text/csv");
      if (data.truncated) {
        toast.warning(`${data.totalCount} rows match`, {
          description: `You can upload ${data.cap} at a time, so only the first ${data.rowCount} are in this file.`,
        });
      }
    } catch (e) {
      toast.error("Export failed", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const post = (entries: unknown[], dryRun: boolean) =>
    getToken().then((token) =>
      apiFetch<ImportResult>("/import/unified", {
        method: "POST",
        body: JSON.stringify({ languageId, entries, dryRun }),
        token: token ?? undefined,
      }),
    );

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const parsed = parseUnifiedCsv(await file.text());
      if (parsed.length === 0) { toast.error("No rows found — every row needs a `type` column"); return; }
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
      const where = res.resultStatus === "in_review" ? "staged for review" : "published live";
      toast.success(`Imported ${res.inserted} rows — ${where}`);
      setRows(null);
    } catch (e) {
      toast.error("Import failed", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Export what’s already there</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{CONTENT_EXPORT_GUIDE}</p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value as UnifiedRowType)}
            aria-label="Content type"
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-2 py-2 text-neutral-900 dark:text-white"
          >
            {CONTENT_EXPORT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
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
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Upload content CSV</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          One sheet for dictionary words, sentences, proverbs and quiz questions — the <code>type</code> column in
          each row decides where it goes. A dry-run preview runs before you confirm.
        </p>

        <ul className="mb-4 space-y-1.5">
          {UNIFIED_FIELD_GUIDE.map((g) => (
            <li key={g.type} className="text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{g.type}</span> — {g.uses}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { reset(); fileRef.current?.click(); }}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> {fileName ? "Replace file" : "Choose CSV file"}
          </button>
          {fileName && <span className="text-xs text-neutral-500 truncate max-w-xs">{fileName}</span>}
          <span className="flex-1" />
          <button onClick={() => download("content-template.csv", UNIFIED_TEMPLATE_CSV, "text/csv")}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            <Download className="h-3.5 w-3.5" /> Download template
          </button>
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
          unit="rows"
          onConfirm={rows ? () => void confirm() : undefined}
          onCancel={reset}
        />
      )}
    </div>
  );
}
