"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Download, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ErrorMsg, fieldCls, LanguagePicker, StepHeader, CATEGORIES, type Category } from "../_components/shared";
import { useForm } from "../_components/use-form";

interface BulkRow {
  id: number;
  word: string;
  english: string;
  category: Category;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
}

let rowIdSeq = 1;
function newRow(): BulkRow {
  return { id: rowIdSeq++, word: "", english: "", category: "other", pronunciation: "", example: "", exampleTranslation: "" };
}

function parseCsv(text: string): BulkRow[] {
  const lines = text.trim().split("\n");
  const header = lines[0]?.toLowerCase().split(",").map((h) => h.trim()) ?? [];
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const get = (col: string) => vals[header.indexOf(col)] ?? "";
    const cat = get("category") as Category;
    return {
      id: rowIdSeq++,
      word: get("word"),
      english: get("english"),
      category: CATEGORIES.includes(cat) ? cat : "other",
      pronunciation: get("pronunciation"),
      example: get("example"),
      exampleTranslation: get("exampletranslation"),
    };
  }).filter((r) => r.word && r.english);
}

interface BulkState {
  step: number;
  langId: string;
  rows: BulkRow[];
  error: string | null;
}

export function BulkFlow({ onDone }: Readonly<{ onDone: () => void }>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();
  const qc = useQueryClient();

  const [state, set] = useForm<BulkState>({
    step: 1,
    langId: selectedLanguageId,
    rows: [newRow()],
    error: null,
  });
  const { step, langId, rows, error } = state;

  function updateRow(id: number, field: keyof BulkRow, value: string) {
    set({ rows: rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)) });
  }

  function addRow() { set({ rows: [...rows, newRow()] }); }
  function removeRow(id: number) { set({ rows: rows.filter((r) => r.id !== id) }); }

  function downloadExampleCsv() {
    const header = "word,english,category,pronunciation,example,exampleTranslation";
    const exampleRows = [
      `àmà,water,other,ah-mah,Àmà bí egé,The water is cold`,
      `bení,house,other,beh-nee,Bení mí,My house`,
      `ọgụ,fish,food,oh-goo,Ọgụ dọ ẹma,The fish is good`,
    ].join("\n");
    const blob = new Blob([`${header}\n${exampleRows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vocabulary-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCsv(ev.target?.result as string);
      if (parsed.length) set({ rows: parsed });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const submit = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const words = rows
        .filter((r) => r.word.trim() && r.english.trim())
        .map((r) => ({
          languageId: langId,
          word: r.word.trim(),
          english: r.english.trim(),
          category: r.category,
          pronunciation: r.pronunciation.trim() || undefined,
          example: r.example.trim() || undefined,
          exampleTranslation: r.exampleTranslation.trim() || undefined,
        }));
      return apiFetch("/contributions/bulk", {
        method: "POST",
        body: JSON.stringify({ words }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dictionary"] });
      onDone();
    },
    onError: (err: Error) => set({ error: err.message }),
  });

  if (step === 1) {
    return (
      <div>
        <StepHeader step={1} total={2} title={t("contribute.chooseLanguage")} onBack={onDone} />
        <LanguagePicker value={langId} onChange={(v) => set({ langId: v })} />
        <button
          onClick={() => set({ step: 2 })}
          disabled={!langId}
          className="mt-6 w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const validCount = rows.filter((r) => r.word.trim() && r.english.trim()).length;

  return (
    <div>
      <StepHeader step={2} total={2} title={t("contribute.addWords")} onBack={() => set({ step: 1 })} />

      {/* CSV import / download */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t("contribute.validWordsReady", { count: validCount })}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadExampleCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:border-brand-400 transition-colors"
            title={t("contribute.exampleCsv")}
          >
            <Download className="h-3.5 w-3.5" />
            {t("contribute.exampleCsv")}
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer hover:border-brand-400 transition-colors">
            <Upload className="h-3.5 w-3.5" />
            {t("contribute.importCsv")}
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleCsv} />
          </label>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_auto_1fr_1fr_1fr_32px] gap-1.5 mb-1 px-1">
        {[
          t("contribute.wordColHeader"),
          t("contribute.englishColHeader"),
          t("contribute.catColHeader"),
          t("contribute.pronunciationShort"),
          t("contribute.exampleColHeader"),
          t("contribute.translationColHeader"),
          "",
        ].map((h, i) => (
          <span key={i} className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[1fr_1fr_auto_1fr_1fr_1fr_32px] gap-1.5 items-center">
            <input
              className={cn(fieldCls, "py-1.5")}
              value={row.word}
              onChange={(e) => updateRow(row.id, "word", e.target.value)}
              placeholder={t("contribute.wordPlaceholder")}
            />
            <input
              className={cn(fieldCls, "py-1.5")}
              value={row.english}
              onChange={(e) => updateRow(row.id, "english", e.target.value)}
              placeholder={t("contribute.translationPlaceholder")}
            />
            <select
              className={cn(fieldCls, "py-1.5 w-28")}
              value={row.category}
              onChange={(e) => updateRow(row.id, "category", e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className={cn(fieldCls, "py-1.5")}
              value={row.pronunciation}
              onChange={(e) => updateRow(row.id, "pronunciation", e.target.value)}
              placeholder={t("contribute.pronunciationShort")}
            />
            <input
              className={cn(fieldCls, "py-1.5")}
              value={row.example}
              onChange={(e) => updateRow(row.id, "example", e.target.value)}
              placeholder={t("contribute.exampleColHeader")}
            />
            <input
              className={cn(fieldCls, "py-1.5")}
              value={row.exampleTranslation}
              onChange={(e) => updateRow(row.id, "exampleTranslation", e.target.value)}
              placeholder={t("contribute.translationColHeader")}
            />
            <button
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              className="p-1 rounded text-neutral-300 hover:text-red-500 disabled:opacity-30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="mt-2 flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> {t("contribute.addRow")}
      </button>

      <ErrorMsg msg={error} />

      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending || validCount === 0}
        className="mt-6 w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {submit.isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("contribute.submitting")}</>
          : t("contribute.submitWordsForReview", { count: validCount })}
      </button>
    </div>
  );
}
