"use client";

import { apiFetch } from "@/lib/api";
import { parseCsv } from "@/lib/parse-csv";
import type { ImportTypeConfig } from "@/lib/import-types";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { ChevronDown, Download, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ImportResult {
  dryRun?: boolean;
  total?: number;
  valid?: number;
  inserted?: number;
  skipped?: number;
  resultStatus?: "published" | "in_review";
  errors: { id: string; reason: string }[];
  preview?: Record<string, unknown>[];
}

interface ImportPanelProps extends ImportTypeConfig {
  languageId: string;
  /** Called after a successful (non-dry-run) import so the page can refetch. */
  onImported?: () => void;
}

/** Build entry objects from a flat CSV using the type's column map. */
function csvToEntries(text: string, config: ImportTypeConfig, languageId: string): Record<string, string>[] {
  return parseCsv(text)
    .map((row) => {
      const entry: Record<string, string> = {};
      for (const col of config.csvColumns ?? []) {
        if (row[col] !== undefined && row[col] !== "") entry[col] = row[col];
      }
      if (config.synthesizeId) entry.id = config.synthesizeId(row, languageId);
      return entry;
    })
    .filter((e) => Object.keys(e).length > 0);
}

function download(name: string, contents: string, mime: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Collapsible wrapper: a "Bulk import" disclosure that reveals <ImportPanel />.
 * Lets an editor page add bulk import with a single-line insertion without
 * restructuring its existing layout.
 */
export function ImportSection(props: Readonly<ImportPanelProps>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
      >
        <Upload className="h-4 w-4" /> Bulk import {props.label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-4"><ImportPanel {...props} /></div>}
    </div>
  );
}

export function ImportPanel({ languageId, onImported, ...config }: Readonly<ImportPanelProps>) {
  const { type, label, jsonOnly, sampleJson, sampleCsv } = config;
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parsed, setParsed] = useState<unknown[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const accept = jsonOnly ? ".json" : ".json,.csv";
  const reset = () => { setResult(null); setParsed(null); setFileName(null); };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const text = await file.text();
      let entries: unknown[];
      if (file.name.toLowerCase().endsWith(".csv") && !jsonOnly) {
        entries = csvToEntries(text, config, languageId);
      } else {
        const data = JSON.parse(text) as unknown;
        if (!Array.isArray(data)) { toast.error("JSON must be an array of entries"); return; }
        entries = data;
      }
      if (entries.length === 0) { toast.error("No rows found in file"); return; }
      setParsed(entries);
      setRunning(true);
      const token = await getToken();
      const res = await apiFetch<ImportResult>(`/import/${type}`, {
        method: "POST",
        body: JSON.stringify({ languageId, entries, dryRun: true }),
        token: token ?? undefined,
      });
      setResult(res);
    } catch (e) {
      toast.error("Failed to parse file", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const confirm = async () => {
    if (!parsed) return;
    setRunning(true);
    try {
      const token = await getToken();
      const res = await apiFetch<ImportResult>(`/import/${type}`, {
        method: "POST",
        body: JSON.stringify({ languageId, entries: parsed }),
        token: token ?? undefined,
      });
      setResult(res);
      onImported?.();
      const where = res.resultStatus === "in_review" ? "staged for review" : "published live";
      toast.success(`Imported ${res.inserted} ${label} — ${where}`);
      setParsed(null);
    } catch (e) {
      toast.error("Import failed", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const downloadErrors = () => {
    if (!result?.errors.length) return;
    download("import-errors.json", JSON.stringify(result.errors, null, 2), "application/json");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Bulk import {label}</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Upload {jsonOnly ? "a JSON array" : "a JSON array or CSV"} of {label}. A dry-run preview runs automatically before you
          confirm. Admins publish live; reviewers stage entries for review.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { reset(); fileRef.current?.click(); }}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> {fileName ? "Replace file" : `Choose ${jsonOnly ? "JSON" : "JSON/CSV"} file`}
          </button>
          {fileName && <span className="text-xs text-neutral-500 truncate max-w-xs">{fileName}</span>}
          <span className="flex-1" />
          <button onClick={() => download(`${type}-example.json`, sampleJson, "application/json")}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            <Download className="h-3.5 w-3.5" /> Example JSON
          </button>
          {!jsonOnly && sampleCsv && (
            <button onClick={() => download(`${type}-example.csv`, sampleCsv, "text/csv")}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
              <Download className="h-3.5 w-3.5" /> Example CSV
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
      </div>

      {running && (
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Processing…
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              {result.dryRun ? "Dry-run preview" : "Import result"}
            </span>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              {result.dryRun
                ? <><span className="text-green-600 dark:text-green-400 font-medium">{result.valid} valid</span>
                   {result.errors.length > 0 && <span className="text-red-500 font-medium">{result.errors.length} errors</span>}</>
                : <><span className="text-green-600 dark:text-green-400 font-medium">{result.inserted} imported</span>
                   {result.skipped ? <span className="text-amber-500 font-medium">{result.skipped} skipped</span> : null}</>
              }
            </div>
          </div>

          {result.preview && result.preview.length > 0 && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {result.preview.map((row, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-4 text-sm">
                  {Object.values(row).map((v, j) => (
                    <span key={j} className={j === 0
                      ? "font-semibold text-neutral-900 dark:text-white truncate max-w-[12rem]"
                      : "text-neutral-500 dark:text-neutral-400 truncate flex-1"}>
                      {String(v)}
                    </span>
                  ))}
                </div>
              ))}
              {(result.total ?? 0) > 5 && (
                <div className="px-4 py-2 text-xs text-neutral-400 dark:text-neutral-500">
                  …and {(result.total ?? 0) - 5} more entries
                </div>
              )}
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="px-4 py-3 bg-red-50/50 dark:bg-red-900/10 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">{result.errors.length} errors</span>
                <button onClick={downloadErrors} className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline">
                  Download errors JSON
                </button>
              </div>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400">{e.reason}</li>
                ))}
              </ul>
            </div>
          )}

          {result.dryRun && parsed && (
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
              <button
                onClick={() => void confirm()}
                disabled={running || (result.valid ?? 0) === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Import {result.valid} {label}
              </button>
              <button onClick={reset} className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
