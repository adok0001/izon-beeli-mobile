"use client";

import { LanguageSelector } from "@/components/ui/language-selector";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookText, CheckCircle2, Edit2, ImageIcon, Mic, Plus, Search, Trash2, Upload, Volume2, X, XCircle } from "lucide-react";
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

const CATEGORIES = [
  "greetings", "numbers", "family", "pronouns", "time", "verbs", "body",
  "market", "occupations", "nouns", "phrases", "food", "possessives",
  "ordinals", "commands", "animals", "phonetics", "money", "proverbs",
] as const;

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

type EntryForm = Omit<DictEntry, "id">;

const EMPTY_FORM: EntryForm = {
  languageId: "",
  word: "",
  english: "",
  french: "",
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
  initial, defaultLanguageId, languages, onSave, onClose, saving,
}: Readonly<{
  initial?: DictEntry; defaultLanguageId: string; languages: ScopedLanguage[];
  onSave: (data: EntryForm, audioFile: File | null, imageFile: File | null) => void;
  onClose: () => void; saving: boolean;
}>) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EntryForm>(
    initial ? { ...initial } : { ...EMPTY_FORM, languageId: defaultLanguageId }
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const set = (key: keyof EntryForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const enrichedLanguages = languages.map(
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.nativeName, region: "Other" },
  );

  const isValid = form.word.trim() && form.english.trim() && form.languageId.trim();

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
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldEnglish")} *</label>
              <input className={fieldCls} value={form.english} onChange={set("english")} placeholder="English translation" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldFrench")}</label>
              <input className={fieldCls} value={form.french ?? ""} onChange={set("french")} placeholder="French translation" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldPronunciation")}</label>
              <input className={fieldCls} value={form.pronunciation ?? ""} onChange={set("pronunciation")} placeholder="Phonetic pronunciation" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldExample")}</label>
            <textarea className={cn(fieldCls, "resize-none")} rows={2} value={form.example ?? ""} onChange={set("example")} placeholder="Example sentence" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldExampleEn")}</label>
              <textarea className={cn(fieldCls, "resize-none")} rows={2} value={form.exampleTranslation ?? ""} onChange={set("exampleTranslation")} placeholder="English translation" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">{t("admin.dictionary.fieldExampleFr")}</label>
              <textarea className={cn(fieldCls, "resize-none")} rows={2} value={form.exampleTranslationFr ?? ""} onChange={set("exampleTranslationFr")} placeholder="French translation" />
            </div>
          </div>
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
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; entry: DictEntry } | null>(null);
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

  const buildBody = (data: EntryForm, audioFile: File | null, imageFile: File | null, isMultipart: boolean) => {
    if (isMultipart) {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v != null && v !== "") fd.append(k, String(v)); });
      if (audioFile) fd.append("audio", audioFile);
      if (imageFile) fd.append("image", imageFile);
      return fd;
    }
    return JSON.stringify(data);
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
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("admin.dictionary.totalCount", { count: entries.length })}
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />{t("admin.dictionary.newEntry")}
        </button>
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

      {modal && (
        <EntryModal
          initial={modal.mode === "edit" ? modal.entry : undefined}
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
