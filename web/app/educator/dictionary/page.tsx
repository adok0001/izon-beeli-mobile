"use client";

import { LanguageSelector } from "@/components/ui/language-selector";
import { LocalizedTextInput, type LocalizedText, toLocalizedText } from "@/components/ui/localized-text-input";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BookText, CheckCircle2, ChevronDown, Edit2, FileJson, ImageIcon, Mic, Plus, Search, Trash2, Upload, Volume2, X, XCircle } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface DictEntry {
  id: string;
  languageId: string;
  word: string;
  english: string;
  french: string | null;
  /** Full gloss map; english/french are the legacy flat projection for the table. */
  translations?: LocalizedText;
  exampleTranslations?: LocalizedText;
  category: string;
  pronunciation: string | null;
  example: string | null;
  exampleTranslation: string | null;
  exampleTranslationFr: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  _source?: "contribution";
}

interface ScopedLanguage {
  id: string;
  name: string;
  nativeName: string;
}

interface EducatorMe {
  languages: ScopedLanguage[];
  isAdmin: boolean;
}

interface CoverageReport {
  languageId: string;
  lessonCount: number;
  distinctWords: number;
  coveredWords: number;
  missing: { word: string; count: number; lessons: { id: string; title: string }[] }[];
}

const CATEGORIES = [
  "greetings", "numbers", "family", "pronouns", "time", "verbs", "body",
  "market", "occupations", "nouns", "phrases", "food", "possessives",
  "ordinals", "commands", "animals", "phonetics", "money", "proverbs",
] as const;

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

type EntryForm = Omit<DictEntry, "id" | "translations" | "exampleTranslations" | "_source"> & {
  translations: LocalizedText;
  exampleTranslations: LocalizedText;
};

const EMPTY_FORM: EntryForm = {
  languageId: "",
  word: "",
  english: "",
  french: "",
  translations: {},
  exampleTranslations: {},
  category: "nouns",
  pronunciation: "",
  example: "",
  exampleTranslation: "",
  exampleTranslationFr: "",
  audioUrl: null,
  imageUrl: null,
};

function FileUploadField({
  label, accept, existingUrl, file, onFile, onClear, icon: Icon, previewType,
}: Readonly<{
  label: string; accept: string; existingUrl: string | null;
  file: File | null; onFile: (f: File) => void; onClear: () => void;
  icon: React.ElementType; previewType: "audio" | "image";
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : existingUrl;
  return (
    <div>
      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">{label}</label>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-3 space-y-2">
        {previewUrl && previewType === "audio" && (
          <audio controls src={previewUrl} className="w-full h-8" />
        )}
        {previewUrl && previewType === "image" && (
          <div className="relative w-full h-28 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <Image src={previewUrl} alt="preview" fill className="object-cover" unoptimized />
          </div>
        )}
        {previewUrl && !file && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{previewUrl}</p>}
        {file && <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium truncate">↑ {file.name}</p>}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <Upload className="h-3 w-3" />{file ?? existingUrl ? "Replace" : "Upload"}
          </button>
          {previewUrl && (
            <button type="button" onClick={onClear}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <X className="h-3 w-3" /> Remove
            </button>
          )}
          {!previewUrl && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
              <Icon className="h-3 w-3" /> No {previewType}
            </span>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}

function EntryModal({
  initial, defaultLanguageId, prefillWord, languages, onSave, onClose, saving,
}: Readonly<{
  initial?: DictEntry; defaultLanguageId: string; prefillWord?: string; languages: ScopedLanguage[];
  onSave: (data: EntryForm, audioFile: File | null, imageFile: File | null) => void;
  onClose: () => void; saving: boolean;
}>) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EntryForm>(() => {
    const base = initial
      ? { ...initial }
      : { ...EMPTY_FORM, languageId: defaultLanguageId, word: prefillWord ?? "" };
    return {
      ...base,
      // Prefer the full map; synthesize from legacy flat english/french for older entries.
      translations: initial?.translations ?? toLocalizedText(initial?.english, initial?.french),
      exampleTranslations:
        initial?.exampleTranslations ?? toLocalizedText(initial?.exampleTranslation, initial?.exampleTranslationFr),
    };
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const set = (key: keyof EntryForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const enrichedLanguages = languages.map(
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.nativeName, region: "Other" },
  );

  const isValid = form.word.trim() && form.translations.en?.trim() && form.languageId.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {initial ? t("admin.dictionary.editEntry") : t("admin.dictionary.newEntry")}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldLanguage")} *</label>
              <LanguageSelector
                value={form.languageId}
                onChange={(v) => setForm((f) => ({ ...f, languageId: v }))}
                languages={enrichedLanguages}
                allowCustom={true}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldCategory")} *</label>
              <select className={fieldCls} value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldWord")} *</label>
              <input className={fieldCls} value={form.word} onChange={set("word")} placeholder="Native word" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldPronunciation")}</label>
              <input className={fieldCls} value={form.pronunciation ?? ""} onChange={set("pronunciation")} placeholder="Phonetic pronunciation" />
            </div>
          </div>
          <LocalizedTextInput
            label={t("admin.dictionary.fieldMeaning")}
            value={form.translations}
            onChange={(v) => setForm((f) => ({ ...f, translations: v }))}
            required
          />
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldExample")}</label>
            <textarea className={cn(fieldCls, "resize-none")} rows={2} value={form.example ?? ""} onChange={set("example")} placeholder="Example sentence" />
          </div>
          <LocalizedTextInput
            label={t("admin.dictionary.fieldExampleTranslation")}
            value={form.exampleTranslations}
            onChange={(v) => setForm((f) => ({ ...f, exampleTranslations: v }))}
            multiline
          />
          <div className="grid grid-cols-2 gap-3">
            <FileUploadField label={t("admin.dictionary.fieldAudio")} accept="audio/*" existingUrl={form.audioUrl}
              file={audioFile} onFile={setAudioFile} onClear={() => { setAudioFile(null); setForm((f) => ({ ...f, audioUrl: null })); }}
              icon={Mic} previewType="audio" />
            <FileUploadField label={t("admin.dictionary.fieldImage")} accept="image/*" existingUrl={form.imageUrl}
              file={imageFile} onFile={setImageFile} onClear={() => { setImageFile(null); setForm((f) => ({ ...f, imageUrl: null })); }}
              icon={ImageIcon} previewType="image" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-neutral-200 dark:border-neutral-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            {t("admin.courses.cancel")}
          </button>
          <button onClick={() => onSave(form, audioFile, imageFile)} disabled={!isValid || saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition-colors">
            {saving ? t("admin.courses.saving") : t("admin.courses.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContribEditModal({
  id,
  draft: initial,
  onSave,
  onClose,
  saving,
}: Readonly<{
  id: string;
  draft: Partial<DictEntry>;
  onSave: (id: string, data: Partial<DictEntry>) => void;
  onClose: () => void;
  saving: boolean;
}>) {
  const [draft, setDraft] = useState({ ...initial });
  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Edit Contributed Entry</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Word *</label>
              <input className={fieldCls} value={draft.word ?? ""} onChange={set("word")} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">English *</label>
              <input className={fieldCls} value={draft.english ?? ""} onChange={set("english")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Pronunciation</label>
              <input className={fieldCls} value={draft.pronunciation ?? ""} onChange={set("pronunciation")} placeholder="Phonetic" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Category</label>
              <select className={fieldCls} value={draft.category ?? "nouns"} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Example sentence</label>
            <input className={fieldCls} value={draft.example ?? ""} onChange={set("example")} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Example translation</label>
            <input className={fieldCls} value={draft.exampleTranslation ?? ""} onChange={set("exampleTranslation")} />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-neutral-200 dark:border-neutral-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(id, { ...draft, pronunciation: draft.pronunciation || null, example: draft.example || null, exampleTranslation: draft.exampleTranslation || null })}
            disabled={!draft.word?.trim() || !draft.english?.trim() || saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CoveragePanel({ coverage, onAddWord }: Readonly<{
  coverage: CoverageReport | undefined;
  onAddWord: (word: string) => void;
}>) {
  const [open, setOpen] = useState(false);
  if (!coverage || coverage.distinctWords === 0) return null;

  const pct = Math.round((coverage.coveredWords / coverage.distinctWords) * 100);
  const complete = coverage.missing.length === 0;

  return (
    <div className={cn(
      "mb-5 rounded-xl border overflow-hidden",
      complete
        ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10"
        : "border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10"
    )}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        disabled={complete}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {complete
            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {complete
                ? "All lesson transcript words have dictionary entries"
                : `${coverage.missing.length} lesson transcript words missing from the dictionary`}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {coverage.coveredWords}/{coverage.distinctWords} transcript words covered ({pct}%) across {coverage.lessonCount} lessons
            </p>
          </div>
        </div>
        {!complete && (
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} />
        )}
      </button>
      {open && !complete && (
        <div className="px-4 pb-4 max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <tbody>
              {coverage.missing.map((m) => (
                <tr key={m.word} className="border-t border-amber-100 dark:border-amber-900/40">
                  <td className="py-1.5 pr-3 font-semibold text-neutral-900 dark:text-white whitespace-nowrap">{m.word}</td>
                  <td className="py-1.5 pr-3 text-xs text-neutral-400 whitespace-nowrap">×{m.count}</td>
                  <td className="py-1.5 pr-3 text-xs text-neutral-500 dark:text-neutral-400">
                    {m.lessons.map((l) => l.title).join(", ")}
                  </td>
                  <td className="py-1.5 text-right">
                    <button
                      onClick={() => onAddWord(m.word)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add entry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Import Panel ──────────────────────────────────────────────────────────────

interface ImportResult {
  dryRun?: boolean;
  total?: number;
  valid?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  errors: { id: string; reason: string }[];
  preview?: { id: string; word: string; english: string; category: string }[];
}

function ImportPanel({ languageId }: Readonly<{ languageId: string }>) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parsed, setParsed] = useState<unknown[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const reset = () => { setResult(null); setParsed(null); setFileName(null); };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown[];
      if (!Array.isArray(data)) { toast.error("JSON must be an array of entries"); return; }
      setParsed(data);
      // Auto dry-run
      setRunning(true);
      const token = await getToken();
      const res = await apiFetch<ImportResult>("/admin/dictionary/import", {
        method: "POST",
        body: JSON.stringify({ languageId, entries: data, dryRun: true }),
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
      const res = await apiFetch<ImportResult>("/admin/dictionary/import", {
        method: "POST",
        body: JSON.stringify({ languageId, entries: parsed }),
        token: token ?? undefined,
      });
      setResult(res);
      void queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      toast.success(`Import complete — ${res.inserted} entries added`);
      setParsed(null);
    } catch (e) {
      toast.error("Import failed", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const downloadErrors = () => {
    if (!result?.errors.length) return;
    const blob = new Blob([JSON.stringify(result.errors, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "import-errors.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Bulk Import</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Upload a JSON array of dictionary entries in Beeli format. A dry-run preview runs automatically before you confirm.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { reset(); fileRef.current?.click(); }}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> {fileName ? "Replace file" : "Choose JSON file"}
          </button>
          {fileName && <span className="text-xs text-neutral-500 truncate max-w-xs">{fileName}</span>}
        </div>
        <input ref={fileRef} type="file" accept=".json" className="hidden"
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
                : <><span className="text-green-600 dark:text-green-400 font-medium">{result.inserted} inserted</span>
                   {result.skipped && result.skipped > 0 && <span className="text-amber-500 font-medium">{result.skipped} skipped</span>}</>
              }
            </div>
          </div>

          {result.preview && result.preview.length > 0 && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {result.preview.map((row) => (
                <div key={row.id} className="px-4 py-2.5 flex items-center gap-4 text-sm">
                  <span className="font-semibold text-neutral-900 dark:text-white w-32 truncate">{row.word}</span>
                  <span className="text-neutral-500 dark:text-neutral-400 flex-1 truncate">{row.english}</span>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">{row.category}</span>
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
                <Plus className="h-4 w-4" /> Import {result.valid} entries
              </button>
              <button onClick={reset} className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type SortKey = "word" | "english" | "category" | "audio" | "image";

function SortIcon({ col, sortKey, sortDir }: Readonly<{ col: SortKey; sortKey: SortKey; sortDir: "asc" | "desc" }>) {
  if (sortKey !== col) return <span className="ml-1 inline-block opacity-40">↕</span>;
  return <span className="ml-1 inline-block">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

export default function EducatorDictionaryPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"entries" | "import">("entries");
  const [modal, setModal] = useState<{ mode: "create"; prefillWord?: string } | { mode: "edit"; entry: DictEntry } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("word");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expandedAudio, setExpandedAudio] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [editingContrib, setEditingContrib] = useState<{ id: string; draft: Partial<DictEntry> } | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Get educator's scoped languages
  const { data: me } = useQuery<EducatorMe>({
    queryKey: ["educator", "me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorMe>("/educator/me", { token: token ?? undefined });
    },
    staleTime: 60_000,
  });

  const languages = me?.languages ?? [];
  const effectiveLanguage = selectedLanguage || languages[0]?.id || "";
  const enrichedLanguages = languages.map(
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.name, region: "Other" },
  );

  const { data: entries = [], isLoading } = useQuery<DictEntry[]>({
    queryKey: ["educator", "dictionary", effectiveLanguage],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DictEntry[]>(`/educator/dictionary?languageId=${effectiveLanguage}`, { token: token ?? undefined });
    },
    enabled: !!effectiveLanguage,
    staleTime: 30_000,
  });

  const { data: coverage } = useQuery<CoverageReport>({
    queryKey: ["educator", "coverage", effectiveLanguage],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<CoverageReport>(`/educator/dictionary-coverage?languageId=${effectiveLanguage}`, { token: token ?? undefined });
    },
    enabled: !!effectiveLanguage,
    staleTime: 60_000,
  });

  const buildBody = (data: EntryForm, audioFile: File | null, imageFile: File | null, isMultipart: boolean) => {
    // Send the translation maps; the server derives the flat english/french columns.
    const { translations, exampleTranslations } = data;
    const rest: Record<string, unknown> = { ...data };
    for (const k of ["translations", "exampleTranslations", "english", "french", "exampleTranslation", "exampleTranslationFr"]) {
      delete rest[k];
    }
    if (isMultipart) {
      const fd = new FormData();
      Object.entries(rest).forEach(([k, v]) => { if (v != null && v !== "") fd.append(k, String(v)); });
      fd.append("translations", JSON.stringify(translations));
      fd.append("exampleTranslations", JSON.stringify(exampleTranslations));
      if (audioFile) fd.append("audio", audioFile);
      if (imageFile) fd.append("image", imageFile);
      return fd;
    }
    return JSON.stringify({ ...rest, translations, exampleTranslations });
  };

  const createEntry = useMutation({
    mutationFn: async ({ data, audioFile, imageFile }: { data: EntryForm; audioFile: File | null; imageFile: File | null }) => {
      const token = await getToken();
      const isMultipart = !!(audioFile ?? imageFile);
      return apiFetch("/educator/dictionary", { method: "POST", body: buildBody(data, audioFile, imageFile, isMultipart), token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      void queryClient.invalidateQueries({ queryKey: ["educator", "stats"] });
      void queryClient.invalidateQueries({ queryKey: ["educator", "coverage"] });
      toast.success("Entry created");
      setModal(null);
    },
    onError: (e: Error) => toast.error("Failed to create entry", { description: e.message }),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, data, audioFile, imageFile }: { id: string; data: EntryForm; audioFile: File | null; imageFile: File | null }) => {
      const token = await getToken();
      const isMultipart = !!(audioFile ?? imageFile);
      return apiFetch(`/educator/dictionary/${id}`, { method: "PATCH", body: buildBody(data, audioFile, imageFile, isMultipart), token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      toast.success("Entry updated");
      setModal(null);
    },
    onError: (e: Error) => toast.error("Failed to update entry", { description: e.message }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/dictionary/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      void queryClient.invalidateQueries({ queryKey: ["educator", "stats"] });
      void queryClient.invalidateQueries({ queryKey: ["educator", "coverage"] });
      toast.success("Entry deleted");
    },
    onError: (e: Error) => toast.error("Failed to delete entry", { description: e.message }),
  });

  const editContrib = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DictEntry> }) => {
      const token = await getToken();
      return apiFetch(`/educator/contributions/${id}`, { method: "PATCH", body: JSON.stringify(data), token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      toast.success("Contribution updated");
    },
    onError: (e: Error) => toast.error("Failed to update contribution", { description: e.message }),
  });

  const reviewContrib = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      const token = await getToken();
      return apiFetch(`/educator/contributions/${id}/review`, { method: "POST", body: JSON.stringify({ action }), token: token ?? undefined });
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      void queryClient.invalidateQueries({ queryKey: ["educator", "stats"] });
      void queryClient.invalidateQueries({ queryKey: ["educator", "coverage"] });
      toast.success(variables.action === "approve" ? "Contribution approved" : "Contribution rejected");
    },
    onError: (e: Error) => toast.error("Failed to review contribution", { description: e.message }),
  });

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const base = entries.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (!q) return true;
      return e.word.toLowerCase().includes(q) || e.english.toLowerCase().includes(q);
    });
    return [...base].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "audio") cmp = (a.audioUrl ? 1 : 0) - (b.audioUrl ? 1 : 0);
      else if (sortKey === "image") cmp = (a.imageUrl ? 1 : 0) - (b.imageUrl ? 1 : 0);
      else cmp = (a[sortKey] ?? "").localeCompare(b[sortKey] ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [entries, categoryFilter, q, sortKey, sortDir]);

  const usedCategories = [...new Set(entries.map((e) => e.category))].sort((a, b) => a.localeCompare(b));
  const isSaving = createEntry.isPending || updateEntry.isPending;

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">{t("admin.dictionary.title")}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("admin.dictionary.totalCount", { count: entries.length })}
            </p>
            {entries.length > 0 && (() => {
              const withAudio = entries.filter((e) => e.audioUrl).length;
              const pct = Math.round((withAudio / entries.length) * 100);
              return (
                <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
                  <Mic className="h-3 w-3" />
                  {withAudio} with audio ({pct}%)
                </span>
              );
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm">
            <button
              onClick={() => setView("entries")}
              className={cn("px-3 py-1.5 font-medium transition-colors", view === "entries" ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200")}
            >
              Entries
            </button>
            <button
              onClick={() => setView("import")}
              className={cn("px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5", view === "import" ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200")}
            >
              <FileJson className="h-3.5 w-3.5" /> Import
            </button>
          </div>
          {view === "entries" && (
            <button
              onClick={() => setModal({ mode: "create" })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />{t("admin.dictionary.newEntry")}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {languages.length > 1 && (
          <LanguageSelector
            value={effectiveLanguage}
            onChange={(v) => { setSelectedLanguage(v); setCategoryFilter("all"); }}
            languages={enrichedLanguages}
            allowCustom={false}
            className="w-52"
          />
        )}
        {languages.length === 1 && (
          <span className="px-3 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
            {languages[0].name}
          </span>
        )}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.dictionary.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
      </div>

      {usedCategories.length > 0 && (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          <button onClick={() => setCategoryFilter("all")}
            className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              categoryFilter === "all" ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200"
            )}>All</button>
          {usedCategories.map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
              className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize",
                categoryFilter === cat ? "bg-brand-600 text-white" : "text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200"
              )}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {view === "import" ? (
        <ImportPanel languageId={effectiveLanguage} />
      ) : (
      <>
      <CoveragePanel coverage={coverage} onAddWord={(word) => setModal({ mode: "create", prefillWord: word })} />

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
              <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">
                <button onClick={() => toggleSort("word")} className="group flex items-center hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {t("admin.dictionary.colWord")}<SortIcon col="word" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">
                <button onClick={() => toggleSort("english")} className="group flex items-center hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {t("admin.dictionary.colEnglish")}<SortIcon col="english" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">
                <button onClick={() => toggleSort("category")} className="group flex items-center hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {t("admin.dictionary.colCategory")}<SortIcon col="category" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden lg:table-cell">{t("admin.dictionary.colPronunciation")}</th>
              <th className="px-4 py-3 text-center font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">
                <button onClick={() => toggleSort("audio")} className="group flex items-center justify-center w-full hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  <Mic className="h-3.5 w-3.5" /><SortIcon col="audio" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">
                <button onClick={() => toggleSort("image")} className="group flex items-center justify-center w-full hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  <ImageIcon className="h-3.5 w-3.5" /><SortIcon col="image" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 8 }, (_, i) => (
              <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800">
                <td colSpan={7} className="px-4 py-3">
                  <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <BookText className="h-8 w-8 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">
                    {entries.length === 0 ? t("admin.dictionary.noEntries") : t("admin.dictionary.noResults")}
                  </p>
                </td>
              </tr>
            )}
            {filtered.map((entry) => {
              const isDeleting = deleteEntry.isPending && deleteEntry.variables === entry.id;
              const isContrib = entry._source === "contribution";
              return (
                <React.Fragment key={entry.id}>
                  <tr className={cn("border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors", isDeleting && "opacity-40")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-neutral-900 dark:text-white">{entry.word}</p>
                        {isContrib && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border border-brand-300 dark:border-brand-700">
                            Contrib
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{entry.english}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">{entry.category}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs hidden lg:table-cell">{entry.pronunciation ?? "—"}</td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {entry.audioUrl ? (
                        <button
                          onClick={() => setExpandedAudio(expandedAudio === entry.id ? null : entry.id)}
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                            expandedAudio === entry.id
                              ? "bg-teal-600 text-white"
                              : "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-800/40"
                          )}
                          title="Play audio"
                        >
                          <Volume2 className="h-3 w-3" />
                        </button>
                      ) : <span className="text-neutral-300 dark:text-neutral-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {entry.imageUrl ? (
                        <button
                          onClick={() => setExpandedImage(expandedImage === entry.id ? null : entry.id)}
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                            expandedImage === entry.id
                              ? "bg-violet-600 text-white"
                              : "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-800/40"
                          )}
                          title="View image"
                        >
                          <ImageIcon className="h-3 w-3" />
                        </button>
                      ) : <span className="text-neutral-300 dark:text-neutral-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {isContrib ? (
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setEditingContrib({ id: entry.id, draft: { word: entry.word, english: entry.english, pronunciation: entry.pronunciation, example: entry.example, exampleTranslation: entry.exampleTranslation, category: entry.category } })}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { if (globalThis.confirm("Reject this contribution?")) reviewContrib.mutate({ id: entry.id, action: "reject" }); }}
                            disabled={reviewContrib.isPending}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => reviewContrib.mutate({ id: entry.id, action: "approve" })}
                            disabled={reviewContrib.isPending}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setModal({ mode: "edit", entry })}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { if (globalThis.confirm(t("admin.dictionary.deleteConfirm"))) deleteEntry.mutate(entry.id); }}
                            disabled={deleteEntry.isPending}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedAudio === entry.id && entry.audioUrl && (
                    <tr className="bg-teal-50/50 dark:bg-teal-900/10">
                      <td colSpan={7} className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <audio controls autoPlay className="flex-1 h-8" src={entry.audioUrl} />
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedImage === entry.id && entry.imageUrl && (
                    <tr className="bg-violet-50/50 dark:bg-violet-900/10">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-violet-200 dark:border-violet-800">
                          <Image src={entry.imageUrl} alt={entry.word} fill className="object-cover" unoptimized />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      </>
      )}

      {modal && (
        <EntryModal
          initial={modal.mode === "edit" ? modal.entry : undefined}
          prefillWord={modal.mode === "create" ? modal.prefillWord : undefined}
          defaultLanguageId={effectiveLanguage}
          languages={languages}
          onSave={(data, audioFile, imageFile) => {
            if (modal.mode === "edit") {
              updateEntry.mutate({ id: modal.entry.id, data, audioFile, imageFile });
            } else {
              createEntry.mutate({ data, audioFile, imageFile });
            }
          }}
          onClose={() => setModal(null)}
          saving={isSaving}
        />
      )}

      {editingContrib && (
        <ContribEditModal
          id={editingContrib.id}
          draft={editingContrib.draft}
          onSave={(id, data) => { editContrib.mutate({ id, data }); setEditingContrib(null); }}
          onClose={() => setEditingContrib(null)}
          saving={editContrib.isPending}
        />
      )}
    </div>
  );
}
