"use client";

import { ReplicaCourseCard } from "@/components/studio/replica/replica-course-card";
import { apiFetch, ApiError } from "@/lib/api";
import { canEditContent } from "@/lib/content-workflow";
import { localizeField, unwrapLocalizedBlob } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    BookOpen,
    ChevronRight,
    Eye,
    EyeOff,
    GripVertical,
    Palette,
    Pencil,
    Play,
    Plus,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  courseId: string;
  courseTitle: string;
  languageId: string;
  title: string;
  titleFr: string | null;
  description: string;
  descriptionFr: string | null;
  type: string;
  audioUrl: string | null;
  duration: number | null;
  order: number;
  artist: string | null;
  genre: string | null;
  isActive: boolean;
}

interface Course {
  id: string;
  title: string;
  titleFr: string | null;
  description: string;
  descriptionFr: string | null;
  languageId: string;
  level: string;
  courseType: string | null;
  order: number;
}

interface EducatorMe {
  isAdmin: boolean;
  reviewerRole?: string | null;
}

const LESSON_TYPES = ["lesson", "story", "music", "pronunciation"] as const;

// ─── Story Arc Types ──────────────────────────────────────────────────────────

interface StoryChapterDraft {
  id: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  order: number;
}

interface StoryArc {
  id: string;
  courseId: string;
  title: string;
  description: string;
  chapters: StoryChapterDraft[];
}

// ─── Chapter Modal ────────────────────────────────────────────────────────────

function ChapterModal({
  chapter,
  defaultOrder,
  lessons,
  onSave,
  onClose,
}: Readonly<{
  chapter: StoryChapterDraft | null;
  defaultOrder: number;
  lessons: Lesson[];
  onSave: (ch: StoryChapterDraft) => void;
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const isNew = !chapter;
  const [lessonId, setLessonId] = useState(chapter?.lessonId ?? lessons[0]?.id ?? "");
  const [title, setTitle] = useState(chapter?.title ?? "");
  const [narrativeIntro, setNarrativeIntro] = useState(chapter?.narrativeIntro ?? "");
  const [narrativeOutro, setNarrativeOutro] = useState(chapter?.narrativeOutro ?? "");
  const [order, setOrder] = useState(String(chapter?.order ?? defaultOrder));

  const canSave = lessonId && title.trim() && narrativeIntro.trim() && narrativeOutro.trim();

  const handleSave = () => {
    onSave({
      id: chapter?.id ?? `story-ch-new-${Date.now()}`,
      lessonId,
      title: title.trim(),
      narrativeIntro: narrativeIntro.trim(),
      narrativeOutro: narrativeOutro.trim(),
      order: parseInt(order) || 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-white/[0.06]">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            {isNew ? t("educator.courseDetail.chapterModalAdd") : t("educator.courseDetail.chapterModalEdit")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
            <X className="h-4 w-4 text-neutral-500 dark:text-neutral-300" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">
              {t("educator.courseDetail.chapterLessonLabel")} <span className="text-red-400">*</span>
            </label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.order}. {localizeField(l.title, l.titleFr, uiLanguage)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">
              {t("educator.courseDetail.chapterTitleLabel")} <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("educator.courseDetail.chapterTitlePlaceholder")}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">
              {t("educator.courseDetail.chapterIntroLabel")} <span className="text-red-400">*</span>
            </label>
            <textarea
              value={narrativeIntro}
              onChange={(e) => setNarrativeIntro(e.target.value)}
              placeholder={t("educator.courseDetail.chapterIntroPlaceholder")}
              rows={4}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">
              {t("educator.courseDetail.chapterOutroLabel")} <span className="text-red-400">*</span>
            </label>
            <textarea
              value={narrativeOutro}
              onChange={(e) => setNarrativeOutro(e.target.value)}
              placeholder={t("educator.courseDetail.chapterOutroPlaceholder")}
              rows={4}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.chapterOrderLabel")}</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-24 rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
            {t("educator.courseDetail.chapterCancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isNew ? t("educator.courseDetail.chapterAdd") : t("educator.courseDetail.chapterSave")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Story Arc Section ────────────────────────────────────────────────────────

function StoryArcSection({
  courseId,
  lessons,
}: Readonly<{ courseId: string; lessons: Lesson[] }>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { uiLanguage } = useUiLanguageStore();

  const { data: arc, isLoading, error } = useQuery<StoryArc | null>({
    queryKey: ["educator-story-arc", courseId],
    queryFn: async () => {
      const token = await getToken();
      try {
        return await apiFetch<StoryArc>(`/educator/story-arcs/${courseId}`, { token: token! });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });

  const [arcTitle, setArcTitle] = useState("");
  const [arcDesc, setArcDesc] = useState("");
  const [chapters, setChapters] = useState<StoryChapterDraft[]>([]);
  const [chapterModal, setChapterModal] = useState<StoryChapterDraft | "new" | null>(null);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [arcDirty, setArcDirty] = useState(false);
  const [chaptersDirty, setChaptersDirty] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  useEffect(() => {
    if (arc) {
      setArcTitle(arc.title);
      setArcDesc(arc.description);
      setChapters([...arc.chapters].sort((a, b) => a.order - b.order));
      setArcDirty(false);
      setChaptersDirty(false);
    }
  }, [arc]);

  const createArc = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/educator/story-arcs", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ courseId, title: createTitle.trim(), description: createDesc.trim() }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-story-arc", courseId] });
      toast.success(t("educator.courseDetail.storyArcCreated"));
      setCreateTitle("");
      setCreateDesc("");
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.storyCreateFailed"), { description: e.message }),
  });

  const saveArcMeta = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/story-arcs/${arc!.id}`, {
        method: "PUT",
        token: token!,
        body: JSON.stringify({ title: arcTitle.trim(), description: arcDesc.trim() }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-story-arc", courseId] });
      toast.success(t("educator.courseDetail.storyArcUpdated"));
      setArcDirty(false);
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.storyUpdateFailed"), { description: e.message }),
  });

  const saveChapters = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/story-arcs/${arc!.id}/chapters`, {
        method: "PUT",
        token: token!,
        body: JSON.stringify({ chapters }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-story-arc", courseId] });
      toast.success(t("educator.courseDetail.storyChaptersSaved"));
      setChaptersDirty(false);
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.storyChaptersSaveFailed"), { description: e.message }),
  });

  const deleteArc = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/story-arcs/${arc!.id}`, { method: "DELETE", token: token! });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-story-arc", courseId] });
      toast.success(t("educator.courseDetail.storyArcDeleted"));
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.storyDeleteFailed"), { description: e.message }),
  });

  const handleChapterSave = (ch: StoryChapterDraft) => {
    setChapters((prev) => {
      const idx = prev.findIndex((c) => c.id === ch.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = ch;
        return next;
      }
      return [...prev, ch];
    });
    setChaptersDirty(true);
    setChapterModal(null);
  };

  const handleChapterDelete = (id: string) => {
    setChapters((prev) => prev.filter((c) => c.id !== id));
    setChaptersDirty(true);
    setDeleteChapterId(null);
  };

  if (isLoading) {
    return (
      <div className="mt-10 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-300">
        <div className="h-4 w-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        {t("educator.courseDetail.storyLoading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-5">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t("educator.courseDetail.storyLoadFailed")}</p>
        <p className="text-xs text-red-600 dark:text-red-300 mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  if (!arc) {
    return (
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">{t("educator.courseDetail.storyArcTitle")}</h2>
        </div>
        <div className="rounded-xl border border-dashed border-neutral-200 dark:border-white/[0.08] p-6 space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">
            {t("educator.courseDetail.storyEmpty")}
          </p>
          <div className="space-y-3 max-w-lg">
            <input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder={t("educator.courseDetail.storyTitlePlaceholder")}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <textarea
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder={t("educator.courseDetail.storyDescPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <button
              onClick={() => createArc.mutate()}
              disabled={!createTitle.trim() || !createDesc.trim() || createArc.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
              {createArc.isPending ? t("educator.courseDetail.storyCreating") : t("educator.courseDetail.storyCreate")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">{t("educator.courseDetail.storyArcTitle")}</h2>
        </div>
        <button
          onClick={() => deleteArc.mutate()}
          disabled={deleteArc.isPending}
          className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 transition-colors"
        >
          {deleteArc.isPending ? t("educator.courseDetail.storyDeleting") : t("educator.courseDetail.storyDeleteArc")}
        </button>
      </div>

      {/* Arc metadata */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.07] p-5 space-y-3 mb-6">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">{t("educator.courseDetail.storyLabelTitle")}</label>
          <input
            value={arcTitle}
            onChange={(e) => { setArcTitle(e.target.value); setArcDirty(true); }}
            className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">{t("educator.courseDetail.storyLabelDesc")}</label>
          <textarea
            value={arcDesc}
            onChange={(e) => { setArcDesc(e.target.value); setArcDirty(true); }}
            rows={3}
            className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>
        {arcDirty && (
          <button
            onClick={() => saveArcMeta.mutate()}
            disabled={!arcTitle.trim() || !arcDesc.trim() || saveArcMeta.isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
          >
            {saveArcMeta.isPending ? t("educator.courseDetail.storySaving") : t("educator.courseDetail.storySaveChanges")}
          </button>
        )}
      </div>

      {/* Chapters */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          {t("educator.courseDetail.storyChaptersCount", { count: sortedChapters.length })}
        </h3>
        <div className="flex items-center gap-3">
          {chaptersDirty && (
            <button
              onClick={() => saveChapters.mutate()}
              disabled={saveChapters.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
            >
              {saveChapters.isPending ? t("educator.courseDetail.storySaving") : t("educator.courseDetail.storySaveChapters")}
            </button>
          )}
          <button
            onClick={() => setChapterModal("new")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("educator.courseDetail.storyAddChapter")}
          </button>
        </div>
      </div>

      {sortedChapters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 dark:border-white/[0.08] p-6 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">{t("educator.courseDetail.storyNoChapters")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.07] overflow-hidden">
          {sortedChapters.map((ch, i) => {
            const lesson = lessons.find((l) => l.id === ch.lessonId);
            return (
              <div
                key={ch.id}
                className={`flex items-start gap-3 px-4 py-3 ${i < sortedChapters.length - 1 ? "border-b border-neutral-100 dark:border-white/[0.04]" : ""} hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors`}
              >
                <GripVertical className="h-4 w-4 text-neutral-300 dark:text-neutral-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Ch. {ch.order}</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">{ch.title}</span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {lesson ? `${lesson.order}. ${localizeField(lesson.title, lesson.titleFr, uiLanguage)}` : ch.lessonId}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 line-clamp-1">{ch.narrativeIntro}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setChapterModal(ch)}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                    title={t("educator.courseDetail.chapterEditTitle")}
                  >
                    <Pencil className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-300" />
                  </button>
                  <button
                    onClick={() => setDeleteChapterId(ch.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/[0.1] transition-colors"
                    title={t("educator.courseDetail.chapterDeleteTitle")}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chapter modal */}
      {chapterModal !== null && (
        <ChapterModal
          chapter={chapterModal === "new" ? null : chapterModal}
          defaultOrder={chapters.length + 1}
          lessons={lessons}
          onSave={handleChapterSave}
          onClose={() => setChapterModal(null)}
        />
      )}

      {/* Delete chapter confirmation */}
      {deleteChapterId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-2xl p-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{t("educator.courseDetail.storyRemoveTitle")}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-300 mb-6">
              {t("educator.courseDetail.storyRemoveDesc")}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteChapterId(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
                {t("educator.courseDetail.storyRemoveCancel")}
              </button>
              <button
                onClick={() => handleChapterDelete(deleteChapterId)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {t("educator.courseDetail.storyRemoveConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Lesson Modal ─────────────────────────────────────────────────────────────

function LessonModal({
  courseId,
  languageId,
  lesson,
  onClose,
}: Readonly<{
  courseId: string;
  languageId: string;
  lesson: Lesson | null;
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { uiLanguage } = useUiLanguageStore();
  const audioRef = useRef<HTMLInputElement>(null);

  const isEdit = !!lesson;
  const [title, setTitle] = useState(lesson ? localizeField(lesson.title, lesson.titleFr, uiLanguage) : "");
  const [description, setDescription] = useState(lesson ? localizeField(lesson.description, lesson.descriptionFr, uiLanguage) : "");
  const [type, setType] = useState<string>(lesson?.type ?? "lesson");
  const [artist, setArtist] = useState(lesson?.artist ?? "");
  const [genre, setGenre] = useState(lesson?.genre ?? "");
  const [order, setOrder] = useState(String(lesson?.order ?? 999));
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (isEdit) {
        return apiFetch(`/educator/lessons/${lesson.id}`, {
          method: "PATCH",
          token: token!,
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            type,
            artist: artist.trim() || null,
            genre: genre.trim() || null,
            order: parseInt(order) || 999,
          }),
        });
      }
      const fd = new FormData();
      fd.append("languageId", languageId);
      fd.append("courseId", courseId);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("type", type);
      if (artist.trim()) fd.append("artist", artist.trim());
      if (genre.trim()) fd.append("genre", genre.trim());
      fd.append("order", order || "999");
      if (audioFile) fd.append("audio", audioFile);
      return apiFetch("/educator/lessons", { method: "POST", token: token!, body: fd });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      toast.success(isEdit ? t("educator.courseDetail.lessonUpdated") : t("educator.courseDetail.lessonCreated"));
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = title.trim().length > 0 && description.trim().length > 0 && !save.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-white/[0.06]">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            {isEdit ? t("educator.courseDetail.modalEditTitle") : t("educator.courseDetail.modalNewTitle")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
            <X className="h-4 w-4 text-neutral-500 dark:text-neutral-300" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalType")}</label>
            <div className="flex gap-2 flex-wrap">
              {LESSON_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    type === t
                      ? "bg-brand-500 text-white"
                      : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-white/[0.1]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalTitleRequired")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("educator.courseDetail.modalTitlePlaceholder")}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalDescRequired")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("educator.courseDetail.modalDescPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalAudioFile")}</label>
              <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-neutral-500 dark:text-neutral-300
                  file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                  file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700
                  dark:file:bg-brand-900/30 dark:file:text-brand-300
                  hover:file:bg-brand-100 dark:hover:file:bg-brand-900/50"
              />
              {audioFile && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-300">{audioFile.name} · {(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalArtist")}</label>
              <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder={t("educator.courseDetail.modalOptional")} className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalGenre")}</label>
              <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder={t("educator.courseDetail.modalOptional")} className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalOrder")}</label>
            <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="w-24 rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
            {t("educator.courseDetail.modalCancel")}
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!canSave}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {save.isPending ? t("educator.courseDetail.modalSaving") : isEdit ? t("educator.courseDetail.modalSaveChanges") : t("educator.courseDetail.modalCreate")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const { id: courseId } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { uiLanguage } = useUiLanguageStore();

  const [modal, setModal] = useState<"create" | Lesson | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [replicaMode, setReplicaMode] = useState(false);

  const { data: me } = useQuery<EducatorMe>({
    queryKey: ["educator-me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorMe>("/educator/me", { token: token! });
    },
  });
  const canEdit = me ? canEditContent({ isAdmin: me.isAdmin, reviewerRole: me.reviewerRole }) : false;

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["educator-courses"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>("/educator/courses", { token: token! });
    },
  });

  const { data: allLessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ["educator-lessons"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Lesson[]>("/educator/lessons", { token: token! });
    },
  });

  const course = courses.find((c) => c.id === courseId);
  const lessons = allLessons
    .filter((l) => l.courseId === courseId)
    .sort((a, b) => a.order - b.order);
  const languageId = course?.languageId ?? lessons[0]?.languageId ?? "";

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/lessons/${id}`, { method: "DELETE", token: token! });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      setDeleteId(null);
      toast.success(t("educator.courseDetail.lessonDeleted"));
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.failedDelete"), { description: e.message }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const token = await getToken();
      return apiFetch(`/educator/lessons/${id}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      toast.success(variables.isActive ? t("educator.courseDetail.lessonPublished") : t("educator.courseDetail.lessonHidden"));
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.failedUpdate"), { description: e.message }),
  });

  // Per-field autosave for the "Edit as replica" view — no prior UI exposed
  // title/description editing at all, but PATCH /educator/courses/:id has
  // always accepted these fields.
  const updateCourseField = useMutation({
    mutationFn: async (data: Partial<Pick<Course, "title" | "titleFr" | "description" | "descriptionFr" | "level">>) => {
      const token = await getToken();
      return apiFetch(`/educator/courses/${courseId}`, { method: "PATCH", token: token!, body: JSON.stringify(data) });
    },
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["educator-courses"] });
      const previous = qc.getQueryData<Course[]>(["educator-courses"]);
      if (previous) {
        qc.setQueryData<Course[]>(["educator-courses"], previous.map((c) => (c.id === courseId ? { ...c, ...data } : c)));
      }
      return { previous };
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) qc.setQueryData(["educator-courses"], context.previous);
      toast.error(t("educator.courseDetail.failedUpdate"), { description: e.message });
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["educator-courses"] }),
  });

  const generateStubsMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<{ courses: number; lessons: number }>("/educator/generate-stubs", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ languageId, courseType: course?.courseType }),
      });
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      void qc.invalidateQueries({ queryKey: ["educator-courses"] });
      toast.success(t("educator.courseDetail.stubsGenerated"), { description: `${result.courses} course · ${result.lessons} lessons created.` });
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.stubsFailed"), { description: e.message }),
  });

  // course.title/description sometimes hold a JSON-encoded {en,fr} blob instead
  // of a plain string with a separate titleFr/descriptionFr — unwrap defensively
  // so the replica editor doesn't display or re-save the raw blob.
  const unwrappedTitle = course ? unwrapLocalizedBlob(course.title) : null;
  const titleEn = unwrappedTitle?.en ?? course?.title ?? "";
  const titleFr = unwrappedTitle?.fr ?? course?.titleFr ?? undefined;
  const unwrappedDescription = course ? unwrapLocalizedBlob(course.description) : null;
  const descriptionEn = unwrappedDescription?.en ?? course?.description ?? "";
  const descriptionFr = unwrappedDescription?.fr ?? course?.descriptionFr ?? undefined;

  const displayTitle = course ? localizeField(course.title, course.titleFr, uiLanguage) : undefined;
  const displayDescription = course ? localizeField(course.description, course.descriptionFr, uiLanguage) : undefined;
  const courseTitle = displayTitle ?? lessons[0]?.courseTitle ?? "Course";
  const levelLabel = course?.level ?? "";

  return (
    <div>
      <Link
        href="/educator/courses"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("educator.courseDetail.backToCourses")}
      </Link>

      {/* Course header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        {replicaMode && course ? (
          <div className="max-w-md flex-1">
            <ReplicaCourseCard
              title={{ en: titleEn, fr: titleFr }}
              description={{ en: descriptionEn, fr: descriptionFr }}
              level={course.level}
              courseTypeLabel={course.courseType?.replace(/_/g, " ")}
              readOnly={!canEdit}
              onSaveTitle={async (v) => {
                await updateCourseField.mutateAsync({ title: v.en ?? titleEn, titleFr: v.fr ?? null });
              }}
              onSaveDescription={async (v) => {
                await updateCourseField.mutateAsync({ description: v.en ?? descriptionEn, descriptionFr: v.fr ?? null });
              }}
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              {levelLabel && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 capitalize">
                  {levelLabel}
                </span>
              )}
              {course?.courseType && (
                <span className="text-xs text-neutral-500 dark:text-neutral-300 capitalize">
                  {course.courseType.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{courseTitle}</h1>
            {course?.description && (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300 max-w-2xl">{displayDescription}</p>
            )}
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {course && (
            <button
              onClick={() => setReplicaMode((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                replicaMode
                  ? "border-bronze-500 bg-bronze-500/10 text-bronze-600 dark:text-bronze-400"
                  : "border-neutral-200 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
              }`}
              title="Edit directly on a replica of the mobile course card"
            >
              <Palette className="h-3.5 w-3.5" /> {replicaMode ? "Editing replica" : "Edit as replica"}
            </button>
          )}
          <button
            onClick={() => setModal("create")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("educator.courseDetail.newLesson")}
          </button>
        </div>
      </div>

      {/* Lessons */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">{t("educator.courseDetail.noLessons")}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1 mb-5">{t("educator.courseDetail.noLessonsHint")}</p>
          {course?.courseType && (
            <button
              onClick={() => generateStubsMutation.mutate()}
              disabled={generateStubsMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {generateStubsMutation.isPending ? t("educator.courseDetail.seeding") : t("educator.courseDetail.seedStubs")}
            </button>
          )}
          {generateStubsMutation.isError && (
            <p className="mt-3 text-xs text-red-500">{(generateStubsMutation.error as Error).message}</p>
          )}
          {generateStubsMutation.isSuccess && (
            <p className="mt-3 text-xs text-green-600 dark:text-green-400">
              {t("educator.courseDetail.seededCount", { count: generateStubsMutation.data.lessons })}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300 w-8">{t("educator.courseDetail.colOrder")}</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300">{t("educator.courseDetail.colTitle")}</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300">{t("educator.courseDetail.colType")}</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300">{t("educator.courseDetail.colStatus")}</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-300">{t("educator.courseDetail.colDuration")}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson, i) => (
                <tr
                  key={lesson.id}
                  className={`${i < lessons.length - 1 ? "border-b border-neutral-100 dark:border-white/[0.04]" : ""} hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors`}
                >
                  <td className="px-4 py-3 text-xs text-neutral-400 dark:text-neutral-300 tabular-nums">{lesson.order}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/educator/courses/${courseId}/lessons/${lesson.id}`}
                      className="font-medium text-neutral-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 group"
                    >
                      {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
                      <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                    </Link>
                    {lesson.artist && <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5">{lesson.artist}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 capitalize">
                      {lesson.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: lesson.id, isActive: !lesson.isActive })}
                      disabled={toggleActiveMutation.isPending}
                      title={lesson.isActive ? t("educator.courseDetail.deactivateLesson") : t("educator.courseDetail.activateLesson")}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                        lesson.isActive
                          ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30"
                          : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.1]"
                      }`}
                    >
                      {lesson.isActive
                        ? <><Eye className="h-3 w-3" /> {t("educator.courseDetail.statusActive")}</>
                        : <><EyeOff className="h-3 w-3" /> {t("educator.courseDetail.statusInactive")}</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-300 text-xs tabular-nums">
                    {fmtDuration(lesson.duration)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {lesson.audioUrl && (
                        <button
                          onClick={() => setPlayUrl(playUrl === lesson.audioUrl ? null : lesson.audioUrl)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                          title={t("educator.courseDetail.playAudio")}
                        >
                          <Play className={`h-3.5 w-3.5 ${playUrl === lesson.audioUrl ? "text-brand-500" : "text-neutral-400 dark:text-neutral-300"}`} />
                        </button>
                      )}
                      <button
                        onClick={() => setModal(lesson)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                        title={t("educator.courseDetail.editLesson")}
                      >
                        <Pencil className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-300" />
                      </button>
                      <button
                        onClick={() => setDeleteId(lesson.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/[0.1] transition-colors"
                        title={t("educator.courseDetail.deleteLesson")}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline audio player */}
      {playUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white dark:bg-[#0f0f1a] border border-neutral-200 dark:border-white/[0.08] rounded-2xl shadow-xl px-4 py-3">
          <audio src={playUrl} controls autoPlay className="h-8 w-64" />
          <button onClick={() => setPlayUrl(null)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06]">
            <X className="h-4 w-4 text-neutral-500 dark:text-neutral-300" />
          </button>
        </div>
      )}

      {/* Create / Edit modal */}
      {modal !== null && (
        <LessonModal
          courseId={courseId}
          languageId={languageId}
          lesson={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
        />
      )}

      {/* Story Arc */}
      <StoryArcSection courseId={courseId} lessons={lessons} />

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-2xl p-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{t("educator.courseDetail.deleteTitle")}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-300 mb-6">
              {t("educator.courseDetail.deleteDesc")}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
                {t("educator.courseDetail.deleteCancel")}
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? t("educator.courseDetail.deleting") : t("educator.courseDetail.deleteButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
