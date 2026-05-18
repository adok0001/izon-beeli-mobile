"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CheckCircle2,
    ClipboardList,
    Edit2,
    ImageIcon,
    MessageSquare,
    Mic,
    Trash2,
    Volume2,
    X,
    XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PendingContribution {
  id: string;
  word: string;
  english: string;
  category: string;
  languageId: string;
  pronunciation?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
  type: string;
  status: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  submitterName?: string | null;
  createdAt: string;
}

interface PendingLesson {
  id: string;
  title: string;
  description: string;
  languageId: string;
  audioUrl: string;
  type: string;
  status: string;
  reviewNote?: string | null;
  submitterName?: string | null;
  createdAt: string;
}

const CATEGORIES = [
  "greetings", "numbers", "family", "pronouns", "time", "verbs", "body",
  "market", "occupations", "nouns", "phrases", "food", "possessives",
  "ordinals", "commands", "animals", "phonetics", "money", "proverbs",
] as const;

function TypeBadge({ type }: Readonly<{ type: string }>) {
  const styles: Record<string, string> = {
    word: "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    phrase: "text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
    audio: "text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    entry_audio: "text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    entry_meaning: "text-teal-700 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400",
  };
  const hasAudio = type === "audio" || type === "entry_audio";
  const label = type.replace("entry_", "");
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1", styles[type] ?? "text-neutral-600 bg-neutral-100")}>
      {hasAudio ? <Mic className="h-2.5 w-2.5" /> : null}
      {label}
    </span>
  );
}

function ContributionCard({
  item,
  onAction,
  onEdit,
  onDelete,
  busy,
}: Readonly<{
  item: PendingContribution;
  onAction: (id: string, action: "approve" | "reject", note?: string) => void;
  onEdit: (id: string, updates: Partial<PendingContribution>) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}>) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [draft, setDraft] = useState({
    word: item.word,
    english: item.english,
    pronunciation: item.pronunciation ?? "",
    example: item.example ?? "",
    exampleTranslation: item.exampleTranslation ?? "",
    category: item.category,
  });
  const { t } = useTranslation();

  const fieldCls = "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-neutral-900 dark:text-white text-lg">{item.word}</p>
            <TypeBadge type={item.type} />
            <span className="text-xs text-neutral-400 capitalize">{item.languageId}</span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.english}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-xs text-neutral-400">{item.submitterName ?? "Unknown"}</p>
            <p className="text-xs text-neutral-300 dark:text-neutral-600">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => { setEditing((v) => !v); }}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              editing
                ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                : "text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
            )}
            title="Edit before approving"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            disabled={busy}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            title="Delete contribution"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inline edit mode */}
      {editing && (
        <div className="mb-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Edit before approving</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Word</label>
              <input className={fieldCls} value={draft.word} onChange={(e) => setDraft((d) => ({ ...d, word: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">English</label>
              <input className={fieldCls} value={draft.english} onChange={(e) => setDraft((d) => ({ ...d, english: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Pronunciation</label>
              <input className={fieldCls} value={draft.pronunciation} onChange={(e) => setDraft((d) => ({ ...d, pronunciation: e.target.value }))} placeholder="Phonetic" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Category</label>
              <select className={fieldCls} value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Example sentence</label>
            <input className={fieldCls} value={draft.example} onChange={(e) => setDraft((d) => ({ ...d, example: e.target.value }))} placeholder="Example in native language" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Example translation</label>
            <input className={fieldCls} value={draft.exampleTranslation} onChange={(e) => setDraft((d) => ({ ...d, exampleTranslation: e.target.value }))} placeholder="English translation" />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="h-3 w-3" /> Discard
            </button>
            <button
              onClick={() => { onEdit(item.id, { ...draft, pronunciation: draft.pronunciation || null, example: draft.example || null, exampleTranslation: draft.exampleTranslation || null }); setEditing(false); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              Save edits
            </button>
          </div>
        </div>
      )}

      {/* Details grid */}
      {!editing && (
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          {item.category && (
            <div>
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{t("admin.review.fieldCategory")}</span>
              <p className="text-neutral-700 dark:text-neutral-300">{item.category}</p>
            </div>
          )}
          {item.pronunciation && (
            <div>
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{t("admin.review.fieldPronunciation")}</span>
              <p className="text-neutral-700 dark:text-neutral-300 font-mono">{item.pronunciation}</p>
            </div>
          )}
          {item.example && (
            <div className="col-span-2">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{t("admin.review.fieldExample")}</span>
              <p className="text-neutral-700 dark:text-neutral-300 italic">{item.example}</p>
              {item.exampleTranslation && (
                <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">{item.exampleTranslation}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Audio */}
      {item.audioUrl && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
          <Volume2 className="h-4 w-4 text-brand-500 shrink-0" />
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls className="flex-1 h-8" src={item.audioUrl} />
        </div>
      )}

      {/* Image */}
      {item.imageUrl && (
        <div className="mb-3">
          <button
            onClick={() => setShowImage((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {showImage ? "Hide image" : "View image"}
          </button>
          {showImage && (
            <div className="mt-2 relative w-full max-w-xs h-40 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
              <Image src={item.imageUrl} alt={item.word} fill className="object-cover" unoptimized />
            </div>
          )}
        </div>
      )}

      {/* Review note */}
      {showNote && (
        <div className="mb-3">
          <textarea
            rows={2}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder={t("admin.review.notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}
      <div className="flex items-center gap-2 justify-between">
        <button
          onClick={() => setShowNote((v) => !v)}
          className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {showNote ? t("admin.review.hideNote") : t("admin.review.addNote")}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onAction(item.id, "reject", note)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-4 w-4" /> {t("admin.review.reject")}
          </button>
          <button
            onClick={() => onAction(item.id, "approve", note)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> {t("admin.review.approve")}
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonCard({
  item,
  onAction,
  onDelete,
  busy,
}: Readonly<{
  item: PendingLesson;
  onAction: (id: string, action: "approve" | "reject", note?: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}>) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-neutral-900 dark:text-white">{item.title}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">{item.type}</span>
            <span className="text-xs text-neutral-400 capitalize">{item.languageId}</span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-xs text-neutral-400">{item.submitterName ?? "Unknown"}</p>
            <p className="text-xs text-neutral-300 dark:text-neutral-600">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => onDelete(item.id)}
            disabled={busy}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            title="Delete lesson contribution"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
        <Volume2 className="h-4 w-4 text-brand-500 shrink-0" />
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls className="flex-1 h-8" src={item.audioUrl} />
      </div>
      {showNote && (
        <div className="mb-3">
          <textarea
            rows={2}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder={t("admin.review.notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}
      <div className="flex items-center gap-2 justify-between">
        <button
          onClick={() => setShowNote((v) => !v)}
          className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {showNote ? t("admin.review.hideNote") : t("admin.review.addNote")}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onAction(item.id, "reject", note)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-4 w-4" /> {t("admin.review.reject")}
          </button>
          <button
            onClick={() => onAction(item.id, "approve", note)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> {t("admin.review.approve")}
          </button>
        </div>
      </div>
    </div>
  );
}

type Tab = "contributions" | "lessons";

export default function EducatorReviewPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("contributions");

  const { data: contributions = [], isLoading: loadingContribs } = useQuery<PendingContribution[]>({
    queryKey: ["educator", "contributions", "submitted"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<PendingContribution[]>("/educator/contributions?status=submitted", { token: token ?? undefined });
    },
    staleTime: 15_000,
  });

  const { data: lessons = [], isLoading: loadingLessons } = useQuery<PendingLesson[]>({
    queryKey: ["educator", "lesson-contributions", "submitted"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<PendingLesson[]>("/educator/lesson-contributions?status=submitted", { token: token ?? undefined });
    },
    staleTime: 15_000,
  });

  const reviewContrib = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: "approve" | "reject"; note?: string }) => {
      const token = await getToken();
      return apiFetch(`/educator/contributions/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ action, note }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator", "contributions"] });
      void qc.invalidateQueries({ queryKey: ["educator", "stats"] });
    },
  });

  const editContrib = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PendingContribution> }) => {
      const token = await getToken();
      return apiFetch(`/educator/contributions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator", "contributions"] });
    },
  });

  const reviewLesson = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: "approve" | "reject"; note?: string }) => {
      const token = await getToken();
      return apiFetch(`/educator/lesson-contributions/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ action, note }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator", "lesson-contributions"] });
      void qc.invalidateQueries({ queryKey: ["educator", "stats"] });
    },
  });

  const deleteContrib = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/contributions/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator", "contributions"] });
      void qc.invalidateQueries({ queryKey: ["educator", "stats"] });
    },
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/lesson-contributions/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator", "lesson-contributions"] });
      void qc.invalidateQueries({ queryKey: ["educator", "stats"] });
    },
  });

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "contributions", label: t("educator.review.tabContributions"), count: contributions.length },
    { id: "lessons", label: t("educator.review.tabLessons"), count: lessons.length },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
          {t("educator.review.title")}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("educator.review.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === id
                ? "bg-brand-600 text-white"
                : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            )}
          >
            {label}
            {count > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-bold",
                tab === id ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contributions tab */}
      {tab === "contributions" && (
        <>
          {loadingContribs && (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 h-40 animate-pulse" />
              ))}
            </div>
          )}
          {!loadingContribs && contributions.length === 0 && (
            <div className="text-center py-20">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
              <p className="font-semibold text-neutral-500 dark:text-neutral-400">{t("admin.review.allCaughtUp")}</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">{t("admin.review.noPending")}</p>
            </div>
          )}
          <div className="space-y-4">
            {contributions.map((item) => (
              <ContributionCard
                key={item.id}
                item={item}
                onAction={(id, action, note) => reviewContrib.mutate({ id, action, note })}
                onEdit={(id, updates) => editContrib.mutate({ id, updates })}
                onDelete={(id) => deleteContrib.mutate(id)}
                busy={reviewContrib.isPending || editContrib.isPending || deleteContrib.isPending}
              />
            ))}
          </div>
        </>
      )}

      {/* Lessons tab */}
      {tab === "lessons" && (
        <>
          {loadingLessons && (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 h-40 animate-pulse" />
              ))}
            </div>
          )}
          {!loadingLessons && lessons.length === 0 && (
            <div className="text-center py-20">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
              <p className="font-semibold text-neutral-500 dark:text-neutral-400">{t("admin.review.allCaughtUp")}</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">{t("admin.review.noPending")}</p>
            </div>
          )}
          <div className="space-y-4">
            {lessons.map((item) => (
              <LessonCard
                key={item.id}
                item={item}
                onAction={(id, action, note) => reviewLesson.mutate({ id, action, note })}
                onDelete={(id) => deleteLesson.mutate(id)}
                busy={reviewLesson.isPending || deleteLesson.isPending}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
