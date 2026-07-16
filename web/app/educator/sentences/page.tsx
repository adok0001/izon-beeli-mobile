"use client";

import { LanguageSelector } from "@/components/ui/language-selector";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImportSection } from "@/components/studio/import-panel";
import { IMPORT_TYPES } from "@/lib/import-types";
import { Edit2, MessageSquareDiff, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SentenceRow {
  id: string;
  languageId: string;
  sentence: string;
  answer: string;
  englishSentence: string;
  kind: "blank" | "equivalent";
  literalTranslation: string | null;
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

type SentenceForm = Omit<SentenceRow, "id">;

const EMPTY_FORM: SentenceForm = {
  languageId: "",
  sentence: "",
  answer: "",
  englishSentence: "",
  kind: "blank",
  literalTranslation: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

/** Render the cloze sentence with the answer word replaced by a styled blank. */
function ClozePreview({ sentence, answer, kind }: { sentence: string; answer: string; kind: "blank" | "equivalent" }) {
  if (!sentence) return null;

  if (kind === "equivalent") {
    return (
      <span className="text-sm text-neutral-700 dark:text-neutral-300">
        {sentence}
        {answer && (
          <span className="ml-2 text-xs text-brand-500 dark:text-brand-400 font-medium">
            ≈ &ldquo;{answer}&rdquo;
          </span>
        )}
      </span>
    );
  }

  if (!answer || !sentence.toLowerCase().includes(answer.toLowerCase())) {
    return <span className="text-sm text-neutral-700 dark:text-neutral-300">{sentence}</span>;
  }

  const idx = sentence.toLowerCase().indexOf(answer.toLowerCase());
  const before = sentence.slice(0, idx);
  const matched = sentence.slice(idx, idx + answer.length);
  const after = sentence.slice(idx + answer.length);

  return (
    <span className="text-sm text-neutral-700 dark:text-neutral-300">
      {before}
      <span className="inline-block px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-semibold border-b-2 border-brand-400 dark:border-brand-500">
        {matched}
      </span>
      {after}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function SentenceModal({
  initial,
  defaultLanguageId,
  languages,
  onSave,
  onClose,
  saving,
}: Readonly<{
  initial?: SentenceRow;
  defaultLanguageId: string;
  languages: ScopedLanguage[];
  onSave: (data: SentenceForm & { id?: string }) => void;
  onClose: () => void;
  saving: boolean;
}>) {
  const { t } = useTranslation();
  const [form, setForm] = useState<SentenceForm>(
    initial
      ? { languageId: initial.languageId, sentence: initial.sentence, answer: initial.answer, englishSentence: initial.englishSentence, kind: initial.kind, literalTranslation: initial.literalTranslation }
      : { ...EMPTY_FORM, languageId: defaultLanguageId }
  );

  const set = (key: keyof SentenceForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const enrichedLanguages = languages.map(
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.nativeName, region: "Other" }
  );

  const answerInSentence =
    form.kind === "equivalent" ||
    (!!form.answer.trim() && form.sentence.toLowerCase().includes(form.answer.trim().toLowerCase()));

  const isValid =
    form.languageId.trim() &&
    form.sentence.trim() &&
    form.answer.trim() &&
    form.englishSentence.trim() &&
    answerInSentence;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {initial ? t("educator.sentences.editEntry") : t("educator.sentences.newEntry")}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                {t("educator.sentences.fieldLanguage")} *
              </label>
              <LanguageSelector
                value={form.languageId}
                onChange={(v) => setForm((f) => ({ ...f, languageId: v }))}
                languages={enrichedLanguages}
                allowCustom={true}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                {t("educator.sentences.fieldKind")}
              </label>
              <div className="flex gap-2 mt-1">
                {(["blank", "equivalent"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, kind: k }))}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      form.kind === k
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-brand-400"
                    )}
                  >
                    {k === "blank" ? t("educator.sentences.kindBlank") : t("educator.sentences.kindEquivalent")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
              {t("educator.sentences.fieldSentence")} *
            </label>
            <textarea
              className={cn(fieldCls, "resize-none")}
              rows={2}
              value={form.sentence}
              onChange={set("sentence")}
              placeholder={t("educator.sentences.sentencePlaceholder")}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
              {t("educator.sentences.fieldAnswer")} *
            </label>
            <input
              className={cn(
                fieldCls,
                form.answer && !answerInSentence && form.kind === "blank"
                  ? "border-red-400 focus:ring-red-400/40"
                  : ""
              )}
              value={form.answer}
              onChange={set("answer")}
              placeholder={t("educator.sentences.answerPlaceholder")}
            />
            {form.answer && !answerInSentence && form.kind === "blank" && (
              <p className="text-xs text-red-500 mt-1">{t("educator.sentences.answerNotFound")}</p>
            )}
          </div>

          {form.sentence && form.answer && (
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5">
                {t("educator.sentences.preview")}
              </p>
              <ClozePreview sentence={form.sentence} answer={form.answer} kind={form.kind} />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
              {t("educator.sentences.fieldEnglish")} *
            </label>
            <input
              className={fieldCls}
              value={form.englishSentence}
              onChange={set("englishSentence")}
              placeholder={t("educator.sentences.englishPlaceholder")}
            />
          </div>

          {form.kind === "equivalent" && (
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                {t("educator.sentences.fieldLiteral")}
              </label>
              <input
                className={fieldCls}
                value={form.literalTranslation ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, literalTranslation: e.target.value || null }))}
                placeholder={t("educator.sentences.literalPlaceholder")}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {t("admin.courses.cancel")}
          </button>
          <button
            onClick={() => onSave({ ...form, id: initial?.id })}
            disabled={!isValid || saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            {saving ? t("admin.courses.saving") : t("admin.courses.save")}
          </button>

        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EducatorSentencesPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "blank" | "equivalent">("all");
  const [modal, setModal] = useState<
    { mode: "create" } | { mode: "edit"; entry: SentenceRow } | null
  >(null);

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

  const { data: rows = [], isLoading } = useQuery<SentenceRow[]>({
    queryKey: ["educator", "sentences", effectiveLanguage],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<SentenceRow[]>(`/educator/sentences?languageId=${effectiveLanguage}`, { token: token ?? undefined });
    },
    enabled: !!effectiveLanguage,
    staleTime: 30_000,
  });

  const createSentence = useMutation({
    mutationFn: async (data: SentenceForm & { id?: string }) => {
      const token = await getToken();
      return apiFetch("/educator/sentences", {
        method: "POST",
        body: JSON.stringify(data),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "sentences"] });
      toast.success(t("educator.sentences.created"));
      setModal(null);
    },
    onError: (e: Error) => toast.error(t("educator.sentences.createError"), { description: e.message }),
  });

  const deleteSentence = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/sentences/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["educator", "sentences"] });
      toast.success(t("educator.sentences.deleted"));
    },
    onError: (e: Error) => toast.error(t("educator.sentences.deleteError"), { description: e.message }),
  });

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        r.sentence.toLowerCase().includes(q) ||
        r.answer.toLowerCase().includes(q) ||
        r.englishSentence.toLowerCase().includes(q)
      );
    });
  }, [rows, kindFilter, q]);

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            {t("educator.sentences.title")}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("educator.sentences.subtitle", { count: rows.length })}
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("educator.sentences.newEntry")}
        </button>
      </div>

      <ImportSection
        {...IMPORT_TYPES.sentences}
        languageId={effectiveLanguage}
        onImported={() => void queryClient.invalidateQueries({ queryKey: ["educator", "sentences"] })}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {languages.length > 1 && (
          <LanguageSelector
            value={effectiveLanguage}
            onChange={(v) => setSelectedLanguage(v)}
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
            placeholder={t("educator.sentences.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "blank", "equivalent"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize",
                kindFilter === k
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  : "text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200"
              )}
            >
              {k === "all" ? t("educator.sentences.filterAll") : k === "blank" ? t("educator.sentences.kindBlank") : t("educator.sentences.kindEquivalent")}
            </button>
          ))}
        </div>
      </div>

      {/* Sentence list */}
      <div className="space-y-2">
        {isLoading &&
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-pulse" />
          ))}

        {!isLoading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <MessageSquareDiff className="h-8 w-8 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              {rows.length === 0 ? t("educator.sentences.noEntries") : t("educator.sentences.noResults")}
            </p>
          </div>
        )}

        {filtered.map((row) => {
          const isDeleting = deleteSentence.isPending && deleteSentence.variables === row.id;
          return (
            <div
              key={row.id}
              className={cn(
                "group bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3.5 flex items-start gap-4 transition-opacity",
                isDeleting && "opacity-40"
              )}
            >
              {/* Kind badge */}
              <span
                className={cn(
                  "mt-0.5 shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border",
                  row.kind === "blank"
                    ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800"
                    : "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800"
                )}
              >
                {row.kind}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <ClozePreview sentence={row.sentence} answer={row.answer} kind={row.kind} />
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                  {row.englishSentence}
                  {row.literalTranslation && (
                    <span className="ml-2 italic">({row.literalTranslation})</span>
                  )}
                </p>
                <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-1 font-mono">{row.id}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setModal({ mode: "edit", entry: row })}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  title={t("educator.sentences.edit")}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (globalThis.confirm(t("educator.sentences.deleteConfirm"))) {
                      deleteSentence.mutate(row.id);
                    }
                  }}
                  disabled={deleteSentence.isPending}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={t("educator.sentences.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <SentenceModal
          initial={modal.mode === "edit" ? modal.entry : undefined}
          defaultLanguageId={effectiveLanguage}
          languages={languages}
          onSave={(data) => createSentence.mutate(data)}
          onClose={() => setModal(null)}
          saving={createSentence.isPending}
        />
      )}
    </div>
  );
}
