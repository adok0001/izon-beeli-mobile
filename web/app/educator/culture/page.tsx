"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LANGUAGES } from "@mobile/lib/data/languages";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Globe2,
  Plus,
  Quote,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Proverb {
  id: string;
  languageId: string;
  text: string;
  translation: string;
  translationFr?: string | null;
  meaning: string;
  meaningFr?: string | null;
  literal?: string | null;
  context?: string | null;
  tags?: string[] | null;
}

interface KeyTerm { word: string; english: string; }

interface CulturalItem {
  id: string;
  languageId: string;
  category: string;
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  imageEmoji: string;
  keyTerms?: KeyTerm[];
}

interface ScopedLanguage { id: string; name: string; nativeName: string; }
interface EducatorMe { languages: ScopedLanguage[]; isAdmin: boolean; }

const CULTURAL_CATEGORIES = [
  "colors",
  "naming_ceremonies",
  "festivals",
  "creation_myths",
  "music",
  "clothing",
  "cuisine",
  "greetings_etiquette",
] as const;

// ── Shared field style ─────────────────────────────────────────────────────────

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

// ── Tag input with live preview ───────────────────────────────────────────────

function TagInput({
  value, onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const tags = value.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="space-y-2">
      <input
        className={fieldCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="wisdom, family, patience"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline delete confirmation ────────────────────────────────────────────────

function DeleteButton({
  onConfirm, disabled,
}: Readonly<{ onConfirm: () => void; disabled: boolean }>) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => { onConfirm(); setConfirming(false); }}
          disabled={disabled}
          className="px-2 py-1 rounded-md text-[11px] font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 rounded-md text-[11px] font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={disabled}
      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

// ── Proverb Modal ─────────────────────────────────────────────────────────────

type ProverbForm = Omit<Proverb, "id">;

const EMPTY_PROVERB: ProverbForm = {
  languageId: "",
  text: "",
  translation: "",
  translationFr: "",
  meaning: "",
  meaningFr: "",
  literal: "",
  context: "",
  tags: [],
};

function ProverbModal({
  initial, defaultLanguageId, languages, onSave, onClose, saving,
}: Readonly<{
  initial?: Proverb;
  defaultLanguageId: string;
  languages: ScopedLanguage[];
  onSave: (data: ProverbForm) => void;
  onClose: () => void;
  saving: boolean;
}>) {
  const [form, setForm] = useState<ProverbForm>(
    initial ? { ...initial } : { ...EMPTY_PROVERB, languageId: defaultLanguageId }
  );
  const [tagInput, setTagInput] = useState((initial?.tags ?? []).join(", "));

  const set =
    (key: keyof ProverbForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const enrichedLanguages = languages.map(
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.nativeName, region: "Other" }
  );

  const isValid = form.languageId.trim() && form.text.trim() && form.translation.trim() && form.meaning.trim();

  const handleSave = () => {
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({ ...form, tags: tags.length > 0 ? tags : null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {initial ? "Edit Proverb" : "New Proverb"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Language *</label>
            <LanguageSelector
              value={form.languageId}
              onChange={(v) => setForm((f) => ({ ...f, languageId: v }))}
              languages={enrichedLanguages}
              allowCustom={true}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Proverb text *</label>
            <textarea className={cn(fieldCls, "resize-none")} rows={2} value={form.text} onChange={set("text")} placeholder="The proverb in the native language" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">English translation *</label>
              <input className={fieldCls} value={form.translation} onChange={set("translation")} placeholder="English" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">French translation</label>
              <input className={fieldCls} value={form.translationFr ?? ""} onChange={set("translationFr")} placeholder="Français" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Meaning / explanation *</label>
            <textarea className={cn(fieldCls, "resize-none")} rows={2} value={form.meaning} onChange={set("meaning")} placeholder="What does this proverb mean?" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Meaning (French)</label>
            <textarea className={cn(fieldCls, "resize-none")} rows={2} value={form.meaningFr ?? ""} onChange={set("meaningFr")} placeholder="Explication en français" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Literal translation</label>
              <input className={fieldCls} value={form.literal ?? ""} onChange={set("literal")} placeholder="Word-for-word meaning" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Context</label>
              <input className={fieldCls} value={form.context ?? ""} onChange={set("context")} placeholder="When / how it's used" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
              Tags <span className="font-normal text-neutral-400">(comma-separated)</span>
            </label>
            <TagInput value={tagInput} onChange={setTagInput} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-neutral-200 dark:border-neutral-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!isValid || saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition-colors">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cultural Content Modal ────────────────────────────────────────────────────

type CulturalForm = Omit<CulturalItem, "id">;

const EMPTY_CULTURAL: CulturalForm = {
  languageId: "",
  category: "festivals",
  title: "",
  titleFr: "",
  description: "",
  descriptionFr: "",
  imageEmoji: "🌍",
  keyTerms: [],
};

function CulturalModal({
  initial, defaultLanguageId, languages, onSave, onClose, saving,
}: Readonly<{
  initial?: CulturalItem;
  defaultLanguageId: string;
  languages: ScopedLanguage[];
  onSave: (data: CulturalForm) => void;
  onClose: () => void;
  saving: boolean;
}>) {
  const [form, setForm] = useState<CulturalForm>(
    initial ? { ...initial, keyTerms: initial.keyTerms ?? [] } : { ...EMPTY_CULTURAL, languageId: defaultLanguageId }
  );

  const set =
    (key: keyof CulturalForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const setTerm = (i: number, field: keyof KeyTerm, value: string) =>
    setForm((f) => {
      const terms = [...(f.keyTerms ?? [])];
      terms[i] = { ...terms[i], [field]: value };
      return { ...f, keyTerms: terms };
    });

  const addTerm = () =>
    setForm((f) => ({ ...f, keyTerms: [...(f.keyTerms ?? []), { word: "", english: "" }] }));

  const removeTerm = (i: number) =>
    setForm((f) => ({ ...f, keyTerms: (f.keyTerms ?? []).filter((_, idx) => idx !== i) }));

  const enrichedLanguages = languages.map(
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.nativeName, region: "Other" }
  );

  const isValid = form.languageId.trim() && form.title.trim() && form.description.trim() && form.category.trim() && form.imageEmoji.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {initial ? "Edit Cultural Item" : "New Cultural Item"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Language *</label>
              <LanguageSelector
                value={form.languageId}
                onChange={(v) => setForm((f) => ({ ...f, languageId: v }))}
                languages={enrichedLanguages}
                allowCustom={true}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Category *</label>
              <select className={fieldCls} value={form.category} onChange={set("category")}>
                {CULTURAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Emoji *</label>
              <input className={cn(fieldCls, "w-16 text-center text-xl")} value={form.imageEmoji} onChange={set("imageEmoji")} maxLength={8} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Title *</label>
              <input className={fieldCls} value={form.title} onChange={set("title")} placeholder="Name of the cultural item" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Title (French)</label>
            <input className={fieldCls} value={form.titleFr ?? ""} onChange={set("titleFr")} placeholder="Titre en français" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Description *</label>
            <textarea className={cn(fieldCls, "resize-none")} rows={3} value={form.description} onChange={set("description")} placeholder="Describe this cultural item" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Description (French)</label>
            <textarea className={cn(fieldCls, "resize-none")} rows={3} value={form.descriptionFr ?? ""} onChange={set("descriptionFr")} placeholder="Description en français" />
          </div>

          {/* Key terms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Key terms</label>
              <button type="button" onClick={addTerm}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
                <Plus className="h-3 w-3" /> Add term
              </button>
            </div>
            {(form.keyTerms ?? []).length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No key terms yet.</p>
            ) : (
              <div className="space-y-2">
                {(form.keyTerms ?? []).map((term, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className={cn(fieldCls, "flex-1")}
                      value={term.word}
                      onChange={(e) => setTerm(i, "word", e.target.value)}
                      placeholder="Native word"
                    />
                    <input
                      className={cn(fieldCls, "flex-1")}
                      value={term.english}
                      onChange={(e) => setTerm(i, "english", e.target.value)}
                      placeholder="English"
                    />
                    <button type="button" onClick={() => removeTerm(i)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-neutral-200 dark:border-neutral-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={!isValid || saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 transition-colors">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "proverbs" | "cultural";

export default function EducatorCulturePage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [tab, setTab] = useState<Tab>("proverbs");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proverbModal, setProverbModal] = useState<{ mode: "create" } | { mode: "edit"; item: Proverb } | null>(null);
  const [culturalModal, setCulturalModal] = useState<{ mode: "create" } | { mode: "edit"; item: CulturalItem } | null>(null);

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
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.name, region: "Other" }
  );

  const { data: proverbs = [], isLoading: proverbsLoading, isFetching: proverbsFetching } = useQuery<Proverb[]>({
    queryKey: ["educator", "proverbs", effectiveLanguage],
    queryFn: () => apiFetch<Proverb[]>(`/proverbs?languageId=${encodeURIComponent(effectiveLanguage)}`),
    enabled: !!effectiveLanguage && tab === "proverbs",
    staleTime: 30_000,
  });

  const { data: culturalItems = [], isLoading: culturalLoading, isFetching: culturalFetching } = useQuery<CulturalItem[]>({
    queryKey: ["educator", "cultural", effectiveLanguage],
    queryFn: () => apiFetch<CulturalItem[]>(`/cultural?languageId=${encodeURIComponent(effectiveLanguage)}`),
    enabled: !!effectiveLanguage && tab === "cultural",
    staleTime: 30_000,
  });

  // ── Proverb mutations ──────────────────────────────────────────────────────

  const createProverb = useMutation({
    mutationFn: async (data: ProverbForm) => {
      const token = await getToken();
      return apiFetch("/proverbs/admin", { method: "POST", body: JSON.stringify(data), token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "proverbs"] });
      setProverbModal(null);
    },
    onError: () => toast.error("Failed to save proverb. Please try again."),
  });

  const updateProverb = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProverbForm }) => {
      const token = await getToken();
      return apiFetch(`/proverbs/admin/${id}`, { method: "PATCH", body: JSON.stringify(data), token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "proverbs"] });
      setProverbModal(null);
    },
    onError: () => toast.error("Failed to update proverb. Please try again."),
  });

  const deleteProverb = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/proverbs/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["educator", "proverbs"] }),
    onError: () => toast.error("Failed to delete proverb."),
  });

  // ── Cultural mutations ─────────────────────────────────────────────────────

  const createCultural = useMutation({
    mutationFn: async (data: CulturalForm) => {
      const token = await getToken();
      return apiFetch("/cultural/admin", { method: "POST", body: JSON.stringify(data), token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "cultural"] });
      setCulturalModal(null);
    },
    onError: () => toast.error("Failed to save cultural item. Please try again."),
  });

  const updateCultural = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CulturalForm }) => {
      const token = await getToken();
      return apiFetch(`/cultural/admin/${id}`, { method: "PATCH", body: JSON.stringify(data), token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "cultural"] });
      setCulturalModal(null);
    },
    onError: () => toast.error("Failed to update cultural item. Please try again."),
  });

  const deleteCultural = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/cultural/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["educator", "cultural"] }),
    onError: () => toast.error("Failed to delete cultural item."),
  });

  // ── Filtering ──────────────────────────────────────────────────────────────

  const q = search.trim().toLowerCase();

  const filteredProverbs = useMemo(() =>
    proverbs.filter((p) =>
      !q || p.text.toLowerCase().includes(q) || p.translation.toLowerCase().includes(q)
    ), [proverbs, q]);

  const filteredCultural = useMemo(() =>
    culturalItems.filter((c) =>
      !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    ), [culturalItems, q]);

  const isProverbSaving = createProverb.isPending || updateProverb.isPending;
  const isCulturalSaving = createCultural.isPending || updateCultural.isPending;
  const isLoading = tab === "proverbs"
    ? (proverbsLoading || proverbsFetching)
    : (culturalLoading || culturalFetching);
  const totalCount = tab === "proverbs" ? proverbs.length : culturalItems.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            {t("educator.nav.culture")}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {totalCount} {tab === "proverbs" ? "proverbs" : "cultural items"}
          </p>
        </div>
        <button
          onClick={() => tab === "proverbs" ? setProverbModal({ mode: "create" }) : setCulturalModal({ mode: "create" })}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors",
            tab === "proverbs" ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"
          )}
        >
          <Plus className="h-4 w-4" />
          {tab === "proverbs" ? "New Proverb" : "New Cultural Item"}
        </button>
      </div>

      {/* Tabs + filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <button
            onClick={() => { setTab("proverbs"); setExpandedId(null); setSearch(""); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
              tab === "proverbs"
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            )}
          >
            <Quote className="h-3.5 w-3.5" /> Proverbs
          </button>
          <button
            onClick={() => { setTab("cultural"); setExpandedId(null); setSearch(""); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-neutral-200 dark:border-neutral-700",
              tab === "cultural"
                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            )}
          >
            <Globe2 className="h-3.5 w-3.5" /> Cultural
          </button>
        </div>

        {languages.length > 1 ? (
          <LanguageSelector
            value={effectiveLanguage}
            onChange={(v) => { setSelectedLanguage(v); setExpandedId(null); }}
            languages={enrichedLanguages}
            allowCustom={false}
            className="w-52"
          />
        ) : languages.length === 1 ? (
          <span className="px-3 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
            {languages[0].name}
          </span>
        ) : null}

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "proverbs" ? "Search proverbs…" : "Search cultural items…"}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
      </div>

      {/* ── Proverbs table ─────────────────────────────────────────────────── */}
      {tab === "proverbs" && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Proverb</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">Translation</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden lg:table-cell">Tags</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td colSpan={4} className="px-4 py-3">
                    <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
              {!isLoading && filteredProverbs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <Quote className="h-8 w-8 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">
                      {proverbs.length === 0 ? "No proverbs yet. Add the first one." : "No results match your search."}
                    </p>
                  </td>
                </tr>
              )}
              {filteredProverbs.map((proverb) => {
                const isOpen = expandedId === proverb.id;
                const isDeleting = deleteProverb.isPending && deleteProverb.variables === proverb.id;
                return (
                  <React.Fragment key={proverb.id}>
                    <tr
                      className={cn(
                        "border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer",
                        isDeleting && "opacity-40"
                      )}
                      onClick={() => setExpandedId(isOpen ? null : proverb.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900 dark:text-white italic line-clamp-1">
                          &ldquo;{proverb.text}&rdquo;
                        </p>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 hidden md:table-cell">
                        <p className="line-clamp-1">{proverb.translation}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {(proverb.tags ?? []).map((tag) => (
                            <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setExpandedId(isOpen ? null : proverb.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setProverbModal({ mode: "edit", item: proverb })}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <DeleteButton
                            onConfirm={() => deleteProverb.mutate(proverb.id)}
                            disabled={deleteProverb.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                        <td colSpan={4} className="px-4 py-3 space-y-1.5">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Meaning</p>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">{proverb.meaning}</p>
                          {proverb.literal && (
                            <p className="text-xs italic text-neutral-500 dark:text-neutral-400">Literal: {proverb.literal}</p>
                          )}
                          {proverb.context && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Context: {proverb.context}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Cultural content table ──────────────────────────────────────────── */}
      {tab === "cultural" && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Item</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden lg:table-cell">Key terms</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td colSpan={4} className="px-4 py-3">
                    <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
              {!isLoading && filteredCultural.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <Globe2 className="h-8 w-8 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">
                      {culturalItems.length === 0 ? "No cultural items yet. Add the first one." : "No results match your search."}
                    </p>
                  </td>
                </tr>
              )}
              {filteredCultural.map((item) => {
                const isOpen = expandedId === item.id;
                const isDeleting = deleteCultural.isPending && deleteCultural.variables === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className={cn(
                        "border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer",
                        isDeleting && "opacity-40"
                      )}
                      onClick={() => setExpandedId(isOpen ? null : item.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl leading-none">{item.imageEmoji}</span>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{item.title}</p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1 hidden sm:block">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                          {item.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">
                        {(item.keyTerms ?? []).length > 0
                          ? `${item.keyTerms!.length} term${item.keyTerms!.length === 1 ? "" : "s"}`
                          : <span className="text-neutral-300 dark:text-neutral-600">—</span>
                        }
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setExpandedId(isOpen ? null : item.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setCulturalModal({ mode: "edit", item })}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <DeleteButton
                            onConfirm={() => deleteCultural.mutate(item.id)}
                            disabled={deleteCultural.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-purple-50/50 dark:bg-purple-900/10">
                        <td colSpan={4} className="px-4 py-3 space-y-2">
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">{item.description}</p>
                          {(item.keyTerms ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {item.keyTerms!.map((term, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-xs rounded-lg bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-800 px-2 py-1">
                                  <span className="font-medium text-neutral-900 dark:text-white">{term.word}</span>
                                  <span className="text-neutral-400 dark:text-neutral-500">· {term.english}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Proverb modal */}
      {proverbModal && (
        <ProverbModal
          initial={proverbModal.mode === "edit" ? proverbModal.item : undefined}
          defaultLanguageId={effectiveLanguage}
          languages={languages}
          onSave={(data) => {
            if (proverbModal.mode === "edit") {
              updateProverb.mutate({ id: proverbModal.item.id, data });
            } else {
              createProverb.mutate(data);
            }
          }}
          onClose={() => setProverbModal(null)}
          saving={isProverbSaving}
        />
      )}

      {/* Cultural modal */}
      {culturalModal && (
        <CulturalModal
          initial={culturalModal.mode === "edit" ? culturalModal.item : undefined}
          defaultLanguageId={effectiveLanguage}
          languages={languages}
          onSave={(data) => {
            if (culturalModal.mode === "edit") {
              updateCultural.mutate({ id: culturalModal.item.id, data });
            } else {
              createCultural.mutate(data);
            }
          }}
          onClose={() => setCulturalModal(null)}
          saving={isCulturalSaving}
        />
      )}
    </div>
  );
}
