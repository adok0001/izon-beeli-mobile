"use client";

import { apiFetch } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { JournalEntry } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LanguageSelector } from "@/components/ui/language-selector";
import { Globe2, NotebookPen, Pencil, Plus, Trash2, X } from "lucide-react";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const LANG_NAME: Record<string, string> = Object.fromEntries(LANGUAGES.map((l) => [l.id, l.name]));

interface WebJournalEntry extends JournalEntry {
  languageId?: string | null;
  isPublic?: boolean;
}

// ── Entry card ────────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  onEdit,
  onDelete,
  onTogglePublic,
  isTogglingPublic,
}: Readonly<{
  entry: WebJournalEntry;
  onEdit: (e: WebJournalEntry) => void;
  onDelete: (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
  isTogglingPublic: boolean;
}>) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
              {entry.title}
            </h3>
            {entry.languageId && (
              <span className="shrink-0 text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-full px-2 py-0.5 font-medium">
                {LANG_NAME[entry.languageId] ?? entry.languageId}
              </span>
            )}
            {entry.isPublic && (
              <span className="shrink-0 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
                <Globe2 className="h-3 w-3" />
                Public
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
            {entry.content}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            {formatDate(entry.createdAt)}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {!entry.isPublic && (
            <button
              onClick={() => onTogglePublic(entry.id, true)}
              disabled={isTogglingPublic}
              title="Post to Feed"
              className="p-1.5 text-neutral-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded disabled:opacity-50"
            >
              <Globe2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors rounded"
            aria-label={t("common.edit")}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded"
            aria-label={t("common.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Entry modal ────────────────────────────────────────────────────────────────

function EntryModal({
  entry,
  onClose,
}: Readonly<{
  entry: Partial<WebJournalEntry> | null;
  onClose: () => void;
}>) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const isEdit = !!entry?.id;

  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [languageId, setLanguageId] = useState(entry?.languageId ?? "");
  const [isPublic, setIsPublic] = useState(entry?.isPublic ?? false);

  const save = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const body = {
        title,
        content,
        languageId: languageId || undefined,
        isPublic,
      };
      if (isEdit) {
        return apiFetch(`/journal/${entry!.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          token: token ?? undefined,
        });
      }
      return apiFetch("/journal", {
        method: "POST",
        body: JSON.stringify(body),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["journal"] });
      if (isPublic) void qc.invalidateQueries({ queryKey: ["feed"] });
      onClose();
    },
  });

  const inputCls = "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900 dark:text-white">
            {isEdit ? t("journal.editEntry") : t("journal.newEntry")}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
              {t("journal.titleLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("journal.entryTitlePlaceholder")}
              className={inputCls}
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
              {t("journal.contentLabel")}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("journal.contentPlaceholder")}
              rows={6}
              className={cn(inputCls, "resize-none")}
            />
          </div>

          {/* Language */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
              Language (optional)
            </label>
            <LanguageSelector
              value={languageId}
              onChange={setLanguageId}
              placeholder="None"
              allowCustom={true}
            />
          </div>

          {/* Post to feed toggle */}
          <label className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Post to Feed</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Share this entry with the community</p>
              </div>
            </div>
            <div
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                isPublic ? "bg-green-500" : "bg-neutral-200 dark:bg-neutral-700"
              )}
              onClick={() => setIsPublic((v) => !v)}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                  isPublic ? "translate-x-5" : "translate-x-0"
                )}
              />
            </div>
          </label>

          {isPublic && (
            <p className="text-xs text-green-600 dark:text-green-400 -mt-2">
              This entry will appear in the community feed once saved.
            </p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!title.trim() || save.isPending}
            className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {save.isPending ? t("common.saveInProgress") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [modalEntry, setModalEntry] = useState<Partial<WebJournalEntry> | null>(null);
  const [filterLang, setFilterLang] = useState("all");

  const { data: entries = [], isLoading } = useQuery<WebJournalEntry[]>({
    queryKey: ["journal"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<WebJournalEntry[]>("/journal", { token: token ?? undefined });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/journal/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["journal"] }),
  });

  const togglePublic = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const token = await getToken();
      return apiFetch(`/journal/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["journal"] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  // Collect languages used across entries for the filter bar
  const usedLangs = Array.from(new Set(entries.map((e) => e.languageId).filter(Boolean))) as string[];

  const filtered = filterLang === "all"
    ? entries
    : entries.filter((e) => e.languageId === filterLang);

  let entriesContent: React.ReactNode;

  if (isLoading) {
    const skeletons = ["s1", "s2", "s3", "s4"];
    entriesContent = (
      <div className="space-y-3">
        {skeletons.map((k) => (
          <div key={k} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  } else if (filtered.length === 0) {
    entriesContent = (
      <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
        <NotebookPen className="mx-auto mb-3 h-10 w-10" />
        <p className="font-medium">{t("journal.emptyTitle")}</p>
        <p className="text-sm mt-1">{t("journal.emptyDescription")}</p>
      </div>
    );
  } else {
    entriesContent = (
      <div className="space-y-3">
        {filtered.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={setModalEntry}
            onDelete={(id) => deleteEntry.mutate(id)}
            onTogglePublic={(id, isPublic) => togglePublic.mutate({ id, isPublic })}
            isTogglingPublic={togglePublic.isPending}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("journal.title")}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t("journal.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setModalEntry({})}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("journal.newEntry")}
        </button>
      </div>

      {/* Language filter pills — only show when there are multiple languages */}
      {usedLangs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {["all", ...usedLangs].map((lang) => (
            <button
              key={lang}
              onClick={() => setFilterLang(lang)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                filterLang === lang
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-brand-400"
              )}
            >
              {lang === "all" ? "All" : (LANG_NAME[lang] ?? lang)}
            </button>
          ))}
        </div>
      )}

      {entriesContent}

      {modalEntry !== null && (
        <EntryModal entry={modalEntry} onClose={() => setModalEntry(null)} />
      )}
    </div>
  );
}
