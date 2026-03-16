"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookText, ChevronDown, ChevronUp, Mic, Plus, Search, Volume2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface DictionaryWord {
  id: string;
  word: string;
  english: string;
  french?: string | null;
  category: string;
  pronunciation?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
  audioUrl?: string | null;
}

const LANGUAGES = [
  { id: "izon", name: "Izon" },
  { id: "akan", name: "Akan" },
  { id: "amharic", name: "Amharic" },
  { id: "yoruba", name: "Yoruba" },
  { id: "swahili", name: "Swahili" },
  { id: "hausa", name: "Hausa" },
  { id: "igbo", name: "Igbo" },
  { id: "oromo", name: "Oromo" },
] as const;

const CATEGORIES = [
  "greetings", "family", "numbers", "food", "body", "animals",
  "nature", "colors", "time", "verbs", "adjectives", "other",
];

// ── Word card ─────────────────────────────────────────────────────────────────

function WordCard({ word }: Readonly<{ word: DictionaryWord }>) {
  const [expanded, setExpanded] = useState(false);
  const hasExtra = !!(word.example || word.audioUrl);

  return (
    <div className="py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold text-neutral-900 dark:text-white">{word.word}</span>
            {word.pronunciation && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono italic">
                /{word.pronunciation}/
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{word.english}</p>
          {word.french && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 italic">fr: {word.french}</p>
          )}

          {/* Expandable extra content */}
          {expanded && (
            <div className="mt-2 space-y-2">
              {word.audioUrl && (
                <div className="flex items-center gap-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                  <audio controls src={word.audioUrl} className="h-7 flex-1" />
                </div>
              )}
              {word.example && (
                <div className="text-xs rounded-lg bg-neutral-50 dark:bg-neutral-800 px-3 py-2 space-y-0.5">
                  <p className="italic text-neutral-700 dark:text-neutral-300">{word.example}</p>
                  {word.exampleTranslation && (
                    <p className="text-neutral-400 dark:text-neutral-500">{word.exampleTranslation}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full px-2.5 py-0.5 capitalize">
            {word.category}
          </span>
          {word.audioUrl && (
            <span title="Has audio"><Mic className="h-3.5 w-3.5 text-brand-400" /></span>
          )}
          {hasExtra && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Contribute modal ──────────────────────────────────────────────────────────

function ContributeModal({
  languageId,
  onClose,
}: Readonly<{ languageId: string; onClose: () => void }>) {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [word, setWord] = useState("");
  const [english, setEnglish] = useState("");
  const [category, setCategory] = useState("other");
  const [pronunciation, setPronunciation] = useState("");
  const [example, setExample] = useState("");
  const [exampleTranslation, setExampleTranslation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/contributions", {
        method: "POST",
        body: JSON.stringify({
          type: "word",
          languageId,
          word: word.trim(),
          english: english.trim(),
          category,
          pronunciation: pronunciation.trim() || undefined,
          example: example.trim() || undefined,
          exampleTranslation: exampleTranslation.trim() || undefined,
        }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dictionary", languageId] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const fieldCls = "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="font-bold text-neutral-900 dark:text-white">
            {t("dictionaryPage.contributeTitle")}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                {t("dictionaryPage.fieldWord")} *
              </label>
              <input
                className={fieldCls}
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g. àmà"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                {t("dictionaryPage.fieldEnglish")} *
              </label>
              <input
                className={fieldCls}
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                placeholder="English meaning"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                {t("dictionaryPage.fieldCategory")}
              </label>
              <select className={fieldCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                {t("dictionaryPage.fieldPronunciation")}
              </label>
              <input
                className={fieldCls}
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="Phonetic spelling"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
              {t("dictionaryPage.fieldExample")}
            </label>
            <input
              className={fieldCls}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Example sentence in the language"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
              {t("dictionaryPage.fieldExampleTranslation")}
            </label>
            <input
              className={fieldCls}
              value={exampleTranslation}
              onChange={(e) => setExampleTranslation(e.target.value)}
              placeholder="English translation of the example"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}

          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {t("dictionaryPage.contributeNote")}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || !word.trim() || !english.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {submit.isPending ? t("common.saveInProgress") : t("dictionaryPage.contributeSubmit")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DictionaryPage() {
  const { getToken } = useAuth();
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [contributing, setContributing] = useState(false);

  const { data: words = [], isLoading } = useQuery<DictionaryWord[]>({
    queryKey: ["dictionary", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DictionaryWord[]>(`/dictionary?languageId=${selectedLanguageId}`, {
        token: token ?? undefined,
      });
    },
  });

  const categories = ["all", ...Array.from(new Set(words.map((w) => w.category))).sort()];

  const filtered = words.filter((w) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      w.word.toLowerCase().includes(q) ||
      w.english.toLowerCase().includes(q) ||
      (w.french ?? "").toLowerCase().includes(q);
    const matchCat = category === "all" || w.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("dictionaryPage.title")}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t("dictionaryPage.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setContributing(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t("dictionaryPage.contribute")}
        </button>
      </div>

      {/* Language pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => { setLanguage(lang.id); setCategory("all"); setSearch(""); }}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              selectedLanguageId === lang.id
                ? "bg-brand-600 text-white border-brand-600"
                : "border-neutral-200 text-neutral-600 hover:border-brand-400 dark:border-neutral-700 dark:text-neutral-400"
            )}
          >
            {lang.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("dictionaryPage.searchPlaceholder")}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors",
              category === cat
                ? "bg-brand-600 text-white border-brand-600"
                : "border-neutral-200 text-neutral-600 hover:border-brand-400 dark:border-neutral-700 dark:text-neutral-400"
            )}
          >
            {cat === "all" ? t("dictionaryPage.allCategory") : cat}
          </button>
        ))}
      </div>

      {/* Result count */}
      {!isLoading && words.length > 0 && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3">
          {filtered.length} {filtered.length === 1 ? "word" : "words"}
          {search || category !== "all" ? ` matching` : ` in ${selectedLanguageId}`}
        </p>
      )}

      {/* Word list */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4">
        {isLoading && (
          <div className="space-y-3 py-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
            <BookText className="mx-auto mb-3 h-10 w-10" />
            <p className="font-medium">{t("dictionaryPage.emptyTitle")}</p>
          </div>
        )}

        {filtered.map((word) => (
          <WordCard key={word.id} word={word} />
        ))}
      </div>

      {/* Contribute modal */}
      {contributing && (
        <ContributeModal
          languageId={selectedLanguageId}
          onClose={() => setContributing(false)}
        />
      )}
    </div>
  );
}
