"use client";

import { apiFetch } from "@/lib/api";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Music, BookOpen, Star, X, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

const VALID_CATEGORIES = [
  "greetings", "numbers", "family", "pronouns", "time", "verbs", "body",
  "market", "occupations", "nouns", "phrases", "food", "possessives",
  "ordinals", "commands", "animals", "phonetics", "money", "proverbs",
] as const;

type DictCategory = typeof VALID_CATEGORIES[number];

interface DictEntry { id: string; word: string; english: string; pronunciation: string | null }
interface Proverb { id: string; text: string; translation: string }
interface Song { id: string; title: string; artist: string | null; genre: string | null }

interface AdminWotd { overrideId: string | null; entry: DictEntry | null; isOverride: boolean }
interface AdminPotm { overrideId: string | null; proverb: Proverb | null; isOverride: boolean }
interface AdminSotw { overrideId: string | null; lesson: Song | null; isOverride: boolean }

type Tab = "wotd" | "potm" | "sotw";

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

function Badge({ pinned }: { pinned: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pinned ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"}`}>
      {pinned ? t("admin.dailyContent.pinned") : t("admin.dailyContent.auto")}
    </span>
  );
}

function CurrentCard({ children, onClear, isPinned }: { children: React.ReactNode; onClear: () => void; isPinned: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{t("admin.dailyContent.current")}</span>
        <div className="flex items-center gap-2">
          <Badge pinned={isPinned} />
          {isPinned && (
            <button onClick={onClear} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold transition-colors">
              <X className="h-3 w-3" /> {t("admin.dailyContent.clearOverride")}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function DailyContentAdminPage() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [languageId, setLanguageId] = useState("izon");
  const [activeTab, setActiveTab] = useState<Tab>("wotd");
  const [search, setSearch] = useState("");
  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState({ word: "", english: "", french: "", category: "nouns" as DictCategory, pronunciation: "", example: "", exampleTranslation: "", exampleTranslationFr: "" });
  async function token() { return (await getToken()) ?? undefined; }

  // ---- Admin status ----
  const { data: wotdAdmin } = useQuery<AdminWotd>({
    queryKey: ["admin-wotd", languageId],
    queryFn: async () => apiFetch(`/daily-content/admin/wotd?languageId=${encodeURIComponent(languageId)}`, { token: await token() }),
    enabled: !!languageId,
  });

  const { data: potmAdmin } = useQuery<AdminPotm>({
    queryKey: ["admin-potm", languageId],
    queryFn: async () => apiFetch(`/daily-content/admin/potm?languageId=${encodeURIComponent(languageId)}`, { token: await token() }),
    enabled: !!languageId,
  });

  const { data: sotwAdmin } = useQuery<AdminSotw>({
    queryKey: ["admin-sotw", languageId],
    queryFn: async () => apiFetch(`/daily-content/admin/sotw?languageId=${encodeURIComponent(languageId)}`, { token: await token() }),
    enabled: !!languageId,
  });

  // ---- Content lists ----
  const { data: dictEntries = [] } = useQuery<DictEntry[]>({
    queryKey: ["dictionary", languageId],
    queryFn: async () => apiFetch(`/dictionary?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId && activeTab === "wotd",
  });

  const { data: proverbsList = [] } = useQuery<Proverb[]>({
    queryKey: ["proverbs", languageId],
    queryFn: async () => apiFetch(`/proverbs?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId && activeTab === "potm",
  });

  const { data: songsList = [] } = useQuery<Song[]>({
    queryKey: ["songs", languageId],
    queryFn: async () => apiFetch(`/lessons?languageId=${encodeURIComponent(languageId)}&type=song`),
    enabled: !!languageId && activeTab === "sotw",
  });

  // ---- Filtered lists ----
  const q = search.toLowerCase();
  const filteredWords = useMemo(() => dictEntries.filter((e) => e.word.toLowerCase().includes(q) || e.english.toLowerCase().includes(q)), [dictEntries, q]);
  const filteredProverbs = useMemo(() => proverbsList.filter((p) => p.text.toLowerCase().includes(q) || p.translation.toLowerCase().includes(q)), [proverbsList, q]);
  const filteredSongs = useMemo(() => songsList.filter((s) => s.title.toLowerCase().includes(q) || (s.artist ?? "").toLowerCase().includes(q)), [songsList, q]);

  // ---- Mutations ----
  const setWotd = useMutation({
    mutationFn: async (entryId: string) => apiFetch("/daily-content/admin/wotd", { token: await token(), method: "PUT", body: JSON.stringify({ languageId: languageId, entryId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wotd", languageId] }); qc.invalidateQueries({ queryKey: ["wotd", languageId] }); },
  });
  const clearWotd = useMutation({
    mutationFn: async () => apiFetch(`/daily-content/admin/wotd?languageId=${encodeURIComponent(languageId)}`, { token: await token(), method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wotd", languageId] }); qc.invalidateQueries({ queryKey: ["wotd", languageId] }); },
  });

  const createAndPinWotd = useMutation({
    mutationFn: async () => {
      const t = await token();
      const created = await apiFetch<DictEntry>("/dictionary/admin", {
        token: t,
        method: "POST",
        body: JSON.stringify({
          languageId,
          word: newWord.word.trim(),
          english: newWord.english.trim(),
          french: newWord.french.trim() || undefined,
          category: newWord.category,
          pronunciation: newWord.pronunciation.trim() || undefined,
          example: newWord.example.trim() || undefined,
          exampleTranslation: newWord.exampleTranslation.trim() || undefined,
          exampleTranslationFr: newWord.exampleTranslationFr.trim() || undefined,
        }),
      });
      await apiFetch("/daily-content/admin/wotd", { token: t, method: "PUT", body: JSON.stringify({ languageId, entryId: created.id }) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wotd", languageId] });
      qc.invalidateQueries({ queryKey: ["wotd", languageId] });
      qc.invalidateQueries({ queryKey: ["dictionary", languageId] });
      setNewWord({ word: "", english: "", french: "", category: "nouns", pronunciation: "", example: "", exampleTranslation: "", exampleTranslationFr: "" });
      setShowAddWord(false);
    },
  });

  const setPotm = useMutation({
    mutationFn: async (proverbId: string) => apiFetch("/daily-content/admin/potm", { token: await token(), method: "PUT", body: JSON.stringify({ languageId, proverbId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-potm", languageId] }); qc.invalidateQueries({ queryKey: ["potm", languageId] }); },
  });
  const clearPotm = useMutation({
    mutationFn: async () => apiFetch(`/daily-content/admin/potm?languageId=${encodeURIComponent(languageId)}`, { token: await token(), method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-potm", languageId] }); qc.invalidateQueries({ queryKey: ["potm", languageId] }); },
  });

  const setSotw = useMutation({
    mutationFn: async (lessonId: string) => apiFetch("/daily-content/admin/sotw", { token: await token(), method: "PUT", body: JSON.stringify({ languageId, lessonId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sotw", languageId] }); qc.invalidateQueries({ queryKey: ["sotw", languageId] }); },
  });
  const clearSotw = useMutation({
    mutationFn: async () => apiFetch(`/daily-content/admin/sotw?languageId=${encodeURIComponent(languageId)}`, { token: await token(), method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sotw", languageId] }); qc.invalidateQueries({ queryKey: ["sotw", languageId] }); },
  });

  const tabs = [
    { key: "wotd" as Tab, label: t("admin.dailyContent.wotd.tab"), icon: Star },
    { key: "potm" as Tab, label: t("admin.dailyContent.potm.tab"), icon: BookOpen },
    { key: "sotw" as Tab, label: t("admin.dailyContent.sotw.tab"), icon: Music },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">{t("admin.dailyContent.title")}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("admin.dailyContent.subtitle")}</p>
      </div>

      <div className="max-w-2xl">
        {/* Language selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">{t("admin.dailyContent.language")}</label>
          <LanguageSelector value={languageId} onChange={(id) => { setLanguageId(id); setSearch(""); }} allowCustom={false} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-800">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearch(""); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${activeTab === key ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ---- Word of the Day ---- */}
        {activeTab === "wotd" && (
          <div>
            {wotdAdmin?.entry && (
              <CurrentCard isPinned={wotdAdmin.isOverride} onClear={() => clearWotd.mutate()}>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{wotdAdmin.entry.word}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{wotdAdmin.entry.english}</p>
              </CurrentCard>
            )}

            {/* Add new word form */}
            {!showAddWord ? (
              <button
                onClick={() => setShowAddWord(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 mb-4"
              >
                <Plus className="h-4 w-4" />
                {t("admin.dailyContent.wotd.addNewCta")}
              </button>
            ) : (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 mb-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{t("admin.dailyContent.wotd.addNew")}</p>
                  <button onClick={() => setShowAddWord(false)} className="text-neutral-400 hover:text-neutral-600"><X className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldWord")}</label>
                    <input className={fieldCls} value={newWord.word} onChange={(e) => setNewWord((p) => ({ ...p, word: e.target.value }))} placeholder="e.g. Àkpọ" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldEnglish")}</label>
                    <input className={fieldCls} value={newWord.english} onChange={(e) => setNewWord((p) => ({ ...p, english: e.target.value }))} placeholder="e.g. World" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldCategory")}</label>
                    <select className={fieldCls} value={newWord.category} onChange={(e) => setNewWord((p) => ({ ...p, category: e.target.value as DictCategory }))}>
                      {VALID_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldPronunciation")}</label>
                    <input className={fieldCls} value={newWord.pronunciation} onChange={(e) => setNewWord((p) => ({ ...p, pronunciation: e.target.value }))} placeholder="e.g. ah-KPO" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldFrench")}</label>
                  <input className={fieldCls} value={newWord.french} onChange={(e) => setNewWord((p) => ({ ...p, french: e.target.value }))} placeholder="e.g. Monde" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldExample")}</label>
                  <input className={fieldCls} value={newWord.example} onChange={(e) => setNewWord((p) => ({ ...p, example: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldExampleTranslation")}</label>
                    <input className={fieldCls} value={newWord.exampleTranslation} onChange={(e) => setNewWord((p) => ({ ...p, exampleTranslation: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldExampleTranslationFr")}</label>
                    <input className={fieldCls} value={newWord.exampleTranslationFr} onChange={(e) => setNewWord((p) => ({ ...p, exampleTranslationFr: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => createAndPinWotd.mutate()}
                    disabled={!newWord.word.trim() || !newWord.english.trim() || createAndPinWotd.isPending}
                    className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-700 transition-colors"
                  >
                    {createAndPinWotd.isPending ? t("admin.dailyContent.wotd.saving") : t("admin.dailyContent.wotd.saveAndPin")}
                  </button>
                  <button onClick={() => setShowAddWord(false)} className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    {t("admin.dailyContent.wotd.cancel")}
                  </button>
                </div>
              </div>
            )}

            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.dailyContent.wotd.searchPlaceholder")} className={`${fieldCls} mb-3`} />
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredWords.slice(0, 100).map((entry) => {
                const selected = wotdAdmin?.overrideId === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setWotd.mutate(entry.id)}
                    disabled={setWotd.isPending}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${selected ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" : "bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent"}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{entry.word}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{entry.english}</p>
                    </div>
                    {selected && <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Proverb of the Month ---- */}
        {activeTab === "potm" && (
          <div>
            {potmAdmin?.proverb && (
              <CurrentCard isPinned={potmAdmin.isOverride} onClear={() => clearPotm.mutate()}>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{potmAdmin.proverb.text}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 italic">{potmAdmin.proverb.translation}</p>
              </CurrentCard>
            )}
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.dailyContent.potm.searchPlaceholder")} className={`${fieldCls} mb-3`} />
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredProverbs.slice(0, 100).map((proverb) => {
                const selected = potmAdmin?.overrideId === proverb.id;
                return (
                  <button
                    key={proverb.id}
                    onClick={() => setPotm.mutate(proverb.id)}
                    disabled={setPotm.isPending}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${selected ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" : "bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent"}`}
                  >
                    <div className="flex-1 mr-3">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{proverb.text}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 italic mt-0.5">{proverb.translation}</p>
                    </div>
                    {selected && <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Song of the Week ---- */}
        {activeTab === "sotw" && (
          <div>
            {sotwAdmin?.lesson && (
              <CurrentCard isPinned={sotwAdmin.isOverride} onClear={() => clearSotw.mutate()}>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{sotwAdmin.lesson.title}</p>
                {sotwAdmin.lesson.artist && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{sotwAdmin.lesson.artist}</p>
                )}
              </CurrentCard>
            )}
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.dailyContent.sotw.searchPlaceholder")} className={`${fieldCls} mb-3`} />
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredSongs.slice(0, 100).map((song) => {
                const selected = sotwAdmin?.overrideId === song.id;
                return (
                  <button
                    key={song.id}
                    onClick={() => setSotw.mutate(song.id)}
                    disabled={setSotw.isPending}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${selected ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" : "bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent"}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{song.title}</p>
                      {song.artist && <p className="text-xs text-neutral-500 dark:text-neutral-400">{song.artist}</p>}
                    </div>
                    {selected && <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
