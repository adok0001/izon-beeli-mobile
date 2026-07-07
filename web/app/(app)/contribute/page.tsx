"use client";

import { LanguageSelector } from "@/components/ui/language-selector";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/nextjs";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BookOpen,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    FileText,
    Gift,
    Loader2,
    Mic,
    Music,
    Plus,
    Search,
    Shield,
    Trash2,
    Upload,
    X,
    XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type BountyTarget = { id: string; languageId: string; category?: string };

// ── Types ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "greetings", "family", "numbers", "food", "body", "animals",
  "nature", "colors", "time", "verbs", "adjectives", "other",
] as const;
type Category = (typeof CATEGORIES)[number];

interface Course { id: string; title: string; languageId: string; }
interface Bounty { id: string; title: string; description: string; languageId: string; category?: string; reward: number; progressPercent: number; }

// ── Shared helpers ─────────────────────────────────────────────────────────────

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

function Label({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
      {children}
    </label>
  );
}

function StepHeader({ step, total, title, onBack }: Readonly<{ step: number; total: number; title: string; onBack: () => void }>) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <p className="text-xs text-neutral-400 mb-0.5">{t("contribute.stepOf", { step, total })}</p>
        <h2 className="font-bold text-neutral-900 dark:text-white">{title}</h2>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn("h-1.5 w-6 rounded-full", i < step ? "bg-amber-500" : "bg-neutral-200 dark:bg-neutral-700")}
          />
        ))}
      </div>
    </div>
  );
}

function LanguagePicker({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Label>{t("contribute.languageRequired")}</Label>
      <LanguageSelector
        value={value}
        onChange={onChange}
        allowCustom={true}
        className="w-full"
      />
    </div>
  );
}

function ErrorMsg({ msg }: Readonly<{ msg: string | null }>) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 dark:text-red-400 mt-1">{msg}</p>;
}

function SuccessBanner({ message, onClose }: Readonly<{ message: string; onClose: () => void }>) {
  return (
    <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 mb-6">
      <div className="flex-1 text-sm text-green-800 dark:text-green-300">{message}</div>
      <button onClick={onClose} className="text-green-500 hover:text-green-700 mt-0.5">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Flow 1: Word / Phrase ─────────────────────────────────────────────────────

function WordFlow({
  onDone,
  bountyId,
  initialLangId,
  initialCategory,
}: Readonly<{
  onDone: () => void;
  bountyId?: string;
  initialLangId?: string;
  initialCategory?: Category;
}>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [langId, setLangId] = useState(initialLangId ?? selectedLanguageId);
  const [word, setWord] = useState("");
  const [english, setEnglish] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory ?? "other");
  const [pronunciation, setPronunciation] = useState("");
  const [example, setExample] = useState("");
  const [exampleTranslation, setExampleTranslation] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const body: Record<string, unknown> = {
        type: "word",
        languageId: langId,
        word: word.trim(),
        english: english.trim(),
        category,
        pronunciation: pronunciation.trim() || undefined,
        example: example.trim() || undefined,
        exampleTranslation: exampleTranslation.trim() || undefined,
        bountyId: bountyId || undefined,
      };

      if (audioFile) {
        const form = new FormData();
        Object.entries(body).forEach(([k, v]) => { if (v !== undefined) form.append(k, String(v)); });
        form.append("audio", audioFile);
        return apiFetch("/contributions", { method: "POST", body: form, token: token ?? undefined });
      }

      return apiFetch("/contributions", {
        method: "POST",
        body: JSON.stringify(body),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dictionary"] });
      onDone();
    },
    onError: (err: Error) => setError(err.message),
  });

  if (step === 1) {
    return (
      <div>
        <StepHeader step={1} total={3} title={t("contribute.chooseLanguage")} onBack={onDone} />
        <LanguagePicker value={langId} onChange={setLangId} />
        <button
          onClick={() => setStep(2)}
          disabled={!langId}
          className="mt-6 w-full py-3 rounded-xl bg-amber-500 text-[#06060e] font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <StepHeader step={2} total={3} title={t("contribute.wordMeaning")} onBack={() => setStep(1)} />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("contribute.wordRequired")}</Label>
              <input className={fieldCls} value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g. àmà" autoFocus />
            </div>
            <div>
              <Label>{t("contribute.englishMeaning")}</Label>
              <input className={fieldCls} value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="e.g. water" />
            </div>
          </div>
          <div>
            <Label>{t("contribute.category")}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors",
                    category === cat
                      ? "bg-amber-500 text-[#06060e] border-amber-500 font-bold"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-brand-400"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => setStep(3)}
          disabled={!word.trim() || !english.trim()}
          className="mt-6 w-full py-3 rounded-xl bg-amber-500 text-[#06060e] font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Step 3
  return (
    <div>
      <StepHeader step={3} total={3} title={t("contribute.detailsOptional")} onBack={() => setStep(2)} />
      <div className="space-y-4">
        <div>
          <Label>{t("contribute.pronunciationLabel")}</Label>
          <input className={fieldCls} value={pronunciation} onChange={(e) => setPronunciation(e.target.value)} placeholder="Phonetic spelling" />
        </div>
        <div>
          <Label>{t("contribute.exampleSentenceLabel")}</Label>
          <input className={fieldCls} value={example} onChange={(e) => setExample(e.target.value)} placeholder="Example in the language" />
        </div>
        <div>
          <Label>{t("contribute.exampleTranslationLabel")}</Label>
          <input className={fieldCls} value={exampleTranslation} onChange={(e) => setExampleTranslation(e.target.value)} placeholder="English translation" />
        </div>
        <div>
          <Label>{t("contribute.audioFileLabel")}</Label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 cursor-pointer hover:border-brand-400 transition-colors">
            <Upload className="h-4 w-4 text-neutral-400" />
            <span className="text-sm text-neutral-500">{audioFile ? audioFile.name : "Upload .mp3 / .m4a"}</span>
            <input type="file" accept="audio/*" className="sr-only" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <ErrorMsg msg={error} />
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {t("contribute.reviewNote")}
        </p>
      </div>
      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending}
        className="mt-6 w-full py-3 rounded-xl bg-amber-500 text-[#06060e] font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {submit.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("contribute.submitting")}</> : t("contribute.submitForReview")}
      </button>
    </div>
  );
}

// ── Flow 2: Bulk Words ─────────────────────────────────────────────────────────

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

function BulkFlow({ onDone }: Readonly<{ onDone: () => void }>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [langId, setLangId] = useState(selectedLanguageId);
  const [rows, setRows] = useState<BulkRow[]>([newRow()]);
  const [error, setError] = useState<string | null>(null);

  function updateRow(id: number, field: keyof BulkRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addRow() { setRows((prev) => [...prev, newRow()]); }
  function removeRow(id: number) { setRows((prev) => prev.filter((r) => r.id !== id)); }

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
      if (parsed.length) setRows(parsed);
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
    onError: (err: Error) => setError(err.message),
  });

  if (step === 1) {
    return (
      <div>
        <StepHeader step={1} total={2} title={t("contribute.chooseLanguage")} onBack={onDone} />
        <LanguagePicker value={langId} onChange={setLangId} />
        <button
          onClick={() => setStep(2)}
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
      <StepHeader step={2} total={2} title={t("contribute.addWords")} onBack={() => setStep(1)} />

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

// ── Flow 3: Full Lesson ────────────────────────────────────────────────────────

interface TranscriptSegment {
  id: number;
  text: string;
  translation: string;
  startTime: number;
  endTime: number;
}

let segIdSeq = 1;
function newSeg(startTime = 0): TranscriptSegment {
  return { id: segIdSeq++, text: "", translation: "", startTime, endTime: startTime + 5 };
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function LessonFlow({ onDone }: Readonly<{ onDone: () => void }>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();

  const [step, setStep] = useState(1);
  const [langId, setLangId] = useState(selectedLanguageId);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([newSeg()]);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["courses-for-contribute", langId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>(`/courses?languageId=${langId}`, { token: token ?? undefined });
    },
    enabled: !!langId && step >= 2,
  });

  function handleAudio(file: File) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
  }

  function markTime(segId: number, field: "startTime" | "endTime") {
    const currentTime = audioRef.current?.currentTime ?? 0;
    setSegments((prev) => prev.map((s) => s.id === segId ? { ...s, [field]: Number.parseFloat(currentTime.toFixed(2)) } : s));
  }

  function updateSeg(id: number, field: keyof TranscriptSegment, value: string | number) {
    setSegments((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  function addSeg() {
    const last = segments[segments.length - 1];
    setSegments((prev) => [...prev, newSeg(last ? last.endTime : 0)]);
  }

  function removeSeg(id: number) {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!audioFile) throw new Error("Audio file required");
      const token = await getToken();
      const form = new FormData();
      form.append("languageId", langId);
      if (courseId) form.append("courseId", courseId);
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("audio", audioFile);
      const segs = segments
        .filter((s) => s.text.trim())
        .map(({ text, translation, startTime, endTime }) => ({ text, translation, startTime, endTime }));
      form.append("segments", JSON.stringify(segs));
      return apiFetch("/lesson-contributions", { method: "POST", body: form, token: token ?? undefined });
    },
    onSuccess: onDone,
    onError: (err: Error) => setError(err.message),
  });

  if (step === 1) {
    return (
      <div>
        <StepHeader step={1} total={5} title={t("contribute.chooseLanguage")} onBack={onDone} />
        <LanguagePicker value={langId} onChange={setLangId} />
        <button
          onClick={() => setStep(2)}
          disabled={!langId}
          className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <StepHeader step={2} total={5} title={t("contribute.chooseCourseOptional")} onBack={() => setStep(1)} />
        <div className="space-y-2">
          <button
            onClick={() => setCourseId("")}
            className={cn(
              "w-full py-3 px-4 rounded-xl border text-sm font-medium text-left transition-colors",
              !courseId
                ? "bg-purple-600 text-white border-purple-600"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-purple-400"
            )}
          >
            {t("contribute.standaloneLesson")}
          </button>
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setCourseId(course.id)}
              className={cn(
                "w-full py-3 px-4 rounded-xl border text-sm font-medium text-left transition-colors",
                courseId === course.id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-purple-400"
              )}
            >
              {course.title}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStep(3)}
          className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        <StepHeader step={3} total={5} title={t("contribute.lessonDetails")} onBack={() => setStep(2)} />
        <div className="space-y-4">
          <div>
            <Label>{t("contribute.wordRequired")}</Label>
            <input className={fieldCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("contribute.lessonTitlePlaceholder")} autoFocus />
          </div>
          <div>
            <Label>{t("contribute.descriptionLabel")}</Label>
            <textarea
              className={cn(fieldCls, "resize-none")}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("contribute.lessonDescPlaceholder")}
            />
          </div>
        </div>
        <button
          onClick={() => setStep(4)}
          disabled={!title.trim()}
          className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div>
        <StepHeader step={4} total={5} title={t("contribute.uploadAudio")} onBack={() => setStep(3)} />
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 p-8 cursor-pointer hover:border-purple-400 transition-colors">
            <Music className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <span className="text-sm text-neutral-500">
              {audioFile ? audioFile.name : t("contribute.chooseFileFormats")}
            </span>
            <input type="file" accept="audio/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudio(f); }} />
          </label>

          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full h-10"
            />
          )}
        </div>
        <button
          onClick={() => setStep(5)}
          disabled={!audioFile}
          className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("contribute.nextAddTranscript")} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Step 5: Transcript
  return (
    <div>
      <StepHeader step={5} total={5} title={t("contribute.timedTranscript")} onBack={() => setStep(4)} />

      {audioUrl && (
        <div className="mb-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3">
          <audio ref={audioRef} src={audioUrl} controls className="w-full h-8" />
          <p className="text-xs text-neutral-400 mt-2">
            {t("contribute.addTranscriptDesc")}
          </p>
        </div>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {segments.map((seg, idx) => (
          <div key={seg.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400">{t("contribute.segmentN", { number: idx + 1 })}</span>
              {segments.length > 1 && (
                <button onClick={() => removeSeg(seg.id)} className="text-neutral-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("contribute.textLabel")}</Label>
                <input className={cn(fieldCls, "py-1.5")} value={seg.text} onChange={(e) => updateSeg(seg.id, "text", e.target.value)} placeholder="Language text" />
              </div>
              <div>
                <Label>{t("contribute.translationLabel")}</Label>
                <input className={cn(fieldCls, "py-1.5")} value={seg.translation} onChange={(e) => updateSeg(seg.id, "translation", e.target.value)} placeholder="English" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("contribute.startTimeLabel", { time: formatTime(seg.startTime) })}</Label>
                <button
                  onClick={() => markTime(seg.id, "startTime")}
                  className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  {t("contribute.markStart")}
                </button>
              </div>
              <div>
                <Label>{t("contribute.endTimeLabel", { time: formatTime(seg.endTime) })}</Label>
                <button
                  onClick={() => markTime(seg.id, "endTime")}
                  className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  {t("contribute.markEnd")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addSeg} className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline">
        <Plus className="h-3.5 w-3.5" /> {t("contribute.addSegment")}
      </button>

      <ErrorMsg msg={error} />

      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending}
        className="mt-6 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {submit.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("contribute.submitting")}</> : t("contribute.submitLesson")}
      </button>
    </div>
  );
}

// ── Flow 5: Become a Reviewer ────────────────────────────────────────────────

const REVIEWER_ROLES = [
  { id: "teacher", label: "Teacher", description: "You teach a language in a formal or informal setting." },
  { id: "professor", label: "Professor", description: "You have an academic background in linguistics or language education." },
  { id: "elder", label: "Elder / Community Leader", description: "You are a native speaker or cultural authority within your language community." },
] as const;

interface ReviewerApp {
  id: string;
  role: string;
  languages: string[];
  status: "pending" | "approved" | "rejected";
  reviewerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

function ReviewerFlow({ onBack }: Readonly<{ onBack: () => void }>) {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const [role, setRole] = useState("teacher");
  const [background, setBackground] = useState("");
  const [reason, setReason] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery<ReviewerApp | null>({
    queryKey: ["reviewer-application-me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ReviewerApp | null>("/reviewer-applications/me", { token: token ?? undefined });
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/reviewer-applications", {
        method: "POST",
        body: JSON.stringify({ role, background: background.trim(), reason: reason.trim(), languages: selectedLangs }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["reviewer-application-me"] }),
    onError: (err: Error) => setError(err.message),
  });

  function toggleLang(id: string) {
    setSelectedLangs((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);
  }

  // Header
  const header = (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div>
        <h2 className="font-bold text-neutral-900 dark:text-white">Become a Reviewer</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Help curate content for your language community</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (existing?.status === "pending") {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6 flex flex-col items-center text-center gap-3">
          <Clock className="h-10 w-10 text-amber-500" />
          <h3 className="font-bold text-neutral-900 dark:text-white">Application Under Review</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
              Your application as a <strong>{existing.role}</strong> is being reviewed. We&apos;ll notify you once a decision has been made.
            </p>
          <p className="text-xs text-neutral-400">
            Submitted {new Date(existing.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  if (existing?.status === "approved") {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-6 flex flex-col items-center text-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <h3 className="font-bold text-neutral-900 dark:text-white">You&apos;re a Reviewer!</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
            Your application was approved. You can now access the educator panel to review contributions.
          </p>
          <a
            href="/educator"
            className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Go to Educator Panel <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (existing?.status === "rejected") {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6 flex flex-col items-center text-center gap-3 mb-6">
          <XCircle className="h-10 w-10 text-red-400" />
          <h3 className="font-bold text-neutral-900 dark:text-white">Application Not Approved</h3>
          {existing.reviewerNote && (
            <p className="text-sm text-red-700 dark:text-red-300 max-w-xs">{existing.reviewerNote}</p>
          )}
          <p className="text-xs text-neutral-400">You may submit a new application below.</p>
        </div>
        {/* Fall through to form */}
        <ReviewerForm
          role={role} setRole={setRole}
          background={background} setBackground={setBackground}
          reason={reason} setReason={setReason}
          selectedLangs={selectedLangs} toggleLang={toggleLang}
          error={error}
          pending={submit.isPending}
          onSubmit={() => submit.mutate()}
        />
      </div>
    );
  }

  // No existing application
  return (
    <div>
      {header}
      <ReviewerForm
        role={role} setRole={setRole}
        background={background} setBackground={setBackground}
        reason={reason} setReason={setReason}
        selectedLangs={selectedLangs} toggleLang={toggleLang}
        error={error}
        pending={submit.isPending}
        onSubmit={() => submit.mutate()}
      />
    </div>
  );
}

function ReviewerForm({
  role, setRole,
  background, setBackground,
  reason, setReason,
  selectedLangs, toggleLang,
  error, pending, onSubmit,
}: Readonly<{
  role: string; setRole: (v: string) => void;
  background: string; setBackground: (v: string) => void;
  reason: string; setReason: (v: string) => void;
  selectedLangs: string[]; toggleLang: (id: string) => void;
  error: string | null; pending: boolean; onSubmit: () => void;
}>) {
  const [langSearch, setLangSearch] = useState("");
  const customLangName = langSearch.trim();
  const filteredLangs = LANGUAGES.filter((lang) => {
    const q = langSearch.toLowerCase();
    return !q || lang.name.toLowerCase().includes(q) || lang.nativeName.toLowerCase().includes(q) || lang.region.toLowerCase().includes(q);
  });
  const isExactMatch = LANGUAGES.some((l) => l.name.toLowerCase() === customLangName.toLowerCase() || l.id.toLowerCase() === customLangName.toLowerCase());
  const canSubmit = background.trim().length >= 20 && reason.trim().length >= 20 && selectedLangs.length > 0;
  return (
    <div className="space-y-5">
      <div>
        <Label>Your role</Label>
        <div className="grid gap-2 mt-1">
          {REVIEWER_ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={cn(
                "text-left px-4 py-3 rounded-xl border-2 transition-colors",
                role === r.id
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-700"
              )}
            >
              <span className="block text-sm font-semibold text-neutral-900 dark:text-white">{r.label}</span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{r.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Languages you can review</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
          <input
            className={cn(fieldCls, "pl-9")}
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
            placeholder="Search or type a language…"
          />
          {langSearch && (
            <button type="button" onClick={() => setLangSearch("")} className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {customLangName && !isExactMatch && (
          <button
            type="button"
            onClick={() => { toggleLang(customLangName); setLangSearch(""); }}
            className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add &quot;{customLangName}&quot;
          </button>
        )}
        {selectedLangs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedLangs.map((id) => {
              const lang = LANGUAGES.find((l) => l.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {lang?.name ?? id}
                  <button type="button" onClick={() => toggleLang(id)} className="ml-0.5 hover:text-indigo-900 dark:hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
          {filteredLangs.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => toggleLang(lang.id)}
              className={cn(
                "flex items-center justify-between text-left px-3 py-2 rounded-xl border transition-colors",
                selectedLangs.includes(lang.id)
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-700"
              )}
            >
              <span>
                <span className="block text-xs font-medium text-neutral-900 dark:text-white">{lang.name}</span>
                <span className="block text-[10px] text-neutral-400">{lang.nativeName} · {lang.region}</span>
              </span>
              {selectedLangs.includes(lang.id) && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
            </button>
          ))}
        </div>
        {selectedLangs.length === 0 && (
          <p className="text-xs text-neutral-400 mt-1">Select at least one language</p>
        )}
      </div>

      <div>
        <Label>Your background</Label>
        <textarea
          className={cn(fieldCls, "resize-none")}
          rows={3}
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder="Describe your background with this language (native speaker, teacher, researcher, etc.)"
        />
        <p className="text-xs text-neutral-400 mt-1">{background.trim().length}/3000</p>
      </div>

      <div>
        <Label>Why do you want to be a reviewer?</Label>
        <textarea
          className={cn(fieldCls, "resize-none")}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you'd like to review contributions for this language"
        />
        <p className="text-xs text-neutral-400 mt-1">{reason.trim().length}/3000</p>
      </div>

      <ErrorMsg msg={error} />

      <button
        type="button"
        onClick={onSubmit}
        disabled={pending || !canSubmit}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Application"}
      </button>
    </div>
  );
}

// ── Flow 4: Bounties ──────────────────────────────────────────────────────────

function BountiesView({ onContribute }: Readonly<{ onContribute: (target: BountyTarget) => void }>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const { data: bounties = [], isLoading } = useQuery<Bounty[]>({
    queryKey: ["bounties"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Bounty[]>("/bounties", { token: token ?? undefined });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (bounties.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
        <Gift className="mx-auto mb-3 h-10 w-10" />
        <p className="font-medium">{t("contribute.noBounties")}</p>
        <p className="text-sm mt-1">{t("contribute.noBountiesDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bounties.map((bounty) => (
        <div
          key={bounty.id}
          className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">{bounty.title}</h3>
              {bounty.description && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{bounty.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-neutral-400 capitalize">{bounty.languageId}</span>
                {bounty.category && (
                  <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full px-2 py-0.5 capitalize">{bounty.category}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">+{bounty.reward} XP</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>{t("contribute.progress")}</span>
              <span>{bounty.progressPercent}%</span>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(bounty.progressPercent, 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onContribute({ id: bounty.id, languageId: bounty.languageId, category: bounty.category ?? undefined })}
            className="w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            {t("contribute.contributeWord")}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Hub ───────────────────────────────────────────────────────────────────────

type Flow = "word" | "bulk" | "lesson" | "bounties" | "reviewer";

function ContributePageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeFlow, setActiveFlow] = useState<Flow | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bountyTarget, setBountyTarget] = useState<BountyTarget | null>(null);
  const { setLanguage } = useLanguageStore();
  const appliedParams = useRef(false);

  function handleDone(msg?: string) {
    setActiveFlow(null);
    setBountyTarget(null);
    setSuccess(msg ?? t("contribute.submittedSuccess"));
  }

  function handleBountyContribute(target: BountyTarget) {
    setLanguage(target.languageId);
    setBountyTarget(target);
    setActiveFlow("word");
  }

  // Open the word flow pre-targeted when arriving from a bounty deep link
  // (e.g. /contribute?bountyId=…&languageId=…&category=…), or jump straight
  // into a named flow (e.g. /contribute?flow=reviewer — used when Studio
  // redirects a signed-in user with no admin/reviewer access here).
  useEffect(() => {
    if (appliedParams.current) return;
    const bountyId = searchParams.get("bountyId");
    const languageId = searchParams.get("languageId");
    const flow = searchParams.get("flow");
    if (bountyId && languageId) {
      appliedParams.current = true;
      handleBountyContribute({
        id: bountyId,
        languageId,
        category: searchParams.get("category") ?? undefined,
      });
    } else if (flow && (["word", "bulk", "lesson", "bounties", "reviewer"] as const).includes(flow as Flow)) {
      appliedParams.current = true;
      setActiveFlow(flow as Flow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const hubCards = [
    {
      flow: "word" as Flow,
      icon: Mic,
      title: t("contribute.wordOrPhrase"),
      description: t("contribute.wordOrPhraseDesc"),
      colorCls: "border-brand-200 dark:border-brand-900 hover:border-brand-400",
      iconBg: "bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400",
    },
    {
      flow: "bulk" as Flow,
      icon: FileText,
      title: t("contribute.bulkWords"),
      description: t("contribute.bulkWordsDesc"),
      colorCls: "border-green-200 dark:border-green-900 hover:border-green-400",
      iconBg: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
    },
    {
      flow: "lesson" as Flow,
      icon: BookOpen,
      title: t("contribute.fullLesson"),
      description: t("contribute.fullLessonDesc"),
      colorCls: "border-purple-200 dark:border-purple-900 hover:border-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
    },
    {
      flow: "bounties" as Flow,
      icon: Gift,
      title: t("contribute.activeBounties"),
      description: t("contribute.activeBountiesDesc"),
      colorCls: "border-amber-200 dark:border-amber-900 hover:border-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    },
    {
      flow: "reviewer" as Flow,
      icon: Shield,
      title: "Become a Reviewer",
      description: "Apply to review community contributions and help maintain content quality.",
      colorCls: "border-indigo-200 dark:border-indigo-900 hover:border-indigo-400",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      {!activeFlow && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("contribute.title")}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t("contribute.hubSubtitle")}
          </p>
        </div>
      )}

      {success && <SuccessBanner message={success} onClose={() => setSuccess(null)} />}

      {/* Hub */}
      {!activeFlow && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hubCards.map(({ flow, icon: Icon, title, description, colorCls, iconBg }) => (
            <button
              key={flow}
              onClick={() => setActiveFlow(flow)}
              className={cn(
                "text-left rounded-2xl border-2 bg-white dark:bg-neutral-900 p-5 transition-all hover:shadow-md",
                colorCls
              )}
            >
              <div className={cn("inline-flex items-center justify-center rounded-xl p-3 mb-3", iconBg)}>
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="font-bold text-neutral-900 dark:text-white mb-1">{title}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Active flows */}
      {activeFlow === "word" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <WordFlow
            onDone={() => handleDone()}
            bountyId={bountyTarget?.id}
            initialLangId={bountyTarget?.languageId}
            initialCategory={bountyTarget?.category as Category | undefined}
          />
        </div>
      )}

      {activeFlow === "bulk" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 overflow-x-auto">
          <BulkFlow onDone={() => handleDone(t("contribute.submittedBulkSuccess"))} />
        </div>
      )}

      {activeFlow === "lesson" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <LessonFlow onDone={() => handleDone(t("contribute.submittedLessonSuccess"))} />
        </div>
      )}

      {activeFlow === "bounties" && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setActiveFlow(null)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-neutral-900 dark:text-white">{t("contribute.activeBounties")}</h2>
          </div>
          <BountiesView onContribute={handleBountyContribute} />
        </div>
      )}

      {activeFlow === "reviewer" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <ReviewerFlow onBack={() => setActiveFlow(null)} />
        </div>
      )}

      {/* Back to hub when in a flow */}
      {activeFlow && activeFlow !== "bounties" && activeFlow !== "reviewer" && (
        <button
          onClick={() => setActiveFlow(null)}
          className="mt-4 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          {t("contribute.backToHub")}
        </button>
      )}
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense>
      <ContributePageContent />
    </Suspense>
  );
}
