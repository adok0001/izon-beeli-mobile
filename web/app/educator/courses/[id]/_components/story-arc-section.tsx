"use client";

import { apiFetch, ApiError } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { useForm } from "@/lib/use-form";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ChapterModal } from "./chapter-modal";
import type { Lesson, StoryArc, StoryChapterDraft } from "./shared";

export function StoryArcSection({
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

  const [ui, setUi] = useForm({
    arcTitle: "",
    arcDesc: "",
    chapters: [] as StoryChapterDraft[],
    chapterModal: null as StoryChapterDraft | "new" | null,
    deleteChapterId: null as string | null,
    arcDirty: false,
    chaptersDirty: false,
    createTitle: "",
    createDesc: "",
  });

  useEffect(() => {
    if (arc) {
      setUi({
        arcTitle: arc.title,
        arcDesc: arc.description,
        chapters: [...arc.chapters].sort((a, b) => a.order - b.order),
        arcDirty: false,
        chaptersDirty: false,
      });
    }
  }, [arc]);

  const createArc = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/educator/story-arcs", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ courseId, title: ui.createTitle.trim(), description: ui.createDesc.trim() }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-story-arc", courseId] });
      toast.success(t("educator.courseDetail.storyArcCreated"));
      setUi({ createTitle: "", createDesc: "" });
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.storyCreateFailed"), { description: e.message }),
  });

  const saveArcMeta = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/story-arcs/${arc!.id}`, {
        method: "PUT",
        token: token!,
        body: JSON.stringify({ title: ui.arcTitle.trim(), description: ui.arcDesc.trim() }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-story-arc", courseId] });
      toast.success(t("educator.courseDetail.storyArcUpdated"));
      setUi({ arcDirty: false });
    },
    onError: (e: Error) => toast.error(t("educator.courseDetail.storyUpdateFailed"), { description: e.message }),
  });

  const saveChapters = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/story-arcs/${arc!.id}/chapters`, {
        method: "PUT",
        token: token!,
        body: JSON.stringify({ chapters: ui.chapters }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-story-arc", courseId] });
      toast.success(t("educator.courseDetail.storyChaptersSaved"));
      setUi({ chaptersDirty: false });
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
    const idx = ui.chapters.findIndex((c) => c.id === ch.id);
    let nextChapters: StoryChapterDraft[];
    if (idx >= 0) {
      nextChapters = [...ui.chapters];
      nextChapters[idx] = ch;
    } else {
      nextChapters = [...ui.chapters, ch];
    }
    setUi({ chapters: nextChapters, chaptersDirty: true, chapterModal: null });
  };

  const handleChapterDelete = (id: string) => {
    setUi({ chapters: ui.chapters.filter((c) => c.id !== id), chaptersDirty: true, deleteChapterId: null });
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
              value={ui.createTitle}
              onChange={(e) => setUi({ createTitle: e.target.value })}
              placeholder={t("educator.courseDetail.storyTitlePlaceholder")}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <textarea
              value={ui.createDesc}
              onChange={(e) => setUi({ createDesc: e.target.value })}
              placeholder={t("educator.courseDetail.storyDescPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <button
              onClick={() => createArc.mutate()}
              disabled={!ui.createTitle.trim() || !ui.createDesc.trim() || createArc.isPending}
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

  const sortedChapters = [...ui.chapters].sort((a, b) => a.order - b.order);

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
            value={ui.arcTitle}
            onChange={(e) => setUi({ arcTitle: e.target.value, arcDirty: true })}
            className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">{t("educator.courseDetail.storyLabelDesc")}</label>
          <textarea
            value={ui.arcDesc}
            onChange={(e) => setUi({ arcDesc: e.target.value, arcDirty: true })}
            rows={3}
            className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>
        {ui.arcDirty && (
          <button
            onClick={() => saveArcMeta.mutate()}
            disabled={!ui.arcTitle.trim() || !ui.arcDesc.trim() || saveArcMeta.isPending}
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
          {ui.chaptersDirty && (
            <button
              onClick={() => saveChapters.mutate()}
              disabled={saveChapters.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
            >
              {saveChapters.isPending ? t("educator.courseDetail.storySaving") : t("educator.courseDetail.storySaveChapters")}
            </button>
          )}
          <button
            onClick={() => setUi({ chapterModal: "new" })}
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
                    onClick={() => setUi({ chapterModal: ch })}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                    title={t("educator.courseDetail.chapterEditTitle")}
                  >
                    <Pencil className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-300" />
                  </button>
                  <button
                    onClick={() => setUi({ deleteChapterId: ch.id })}
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
      {ui.chapterModal !== null && (
        <ChapterModal
          chapter={ui.chapterModal === "new" ? null : ui.chapterModal}
          defaultOrder={ui.chapters.length + 1}
          lessons={lessons}
          onSave={handleChapterSave}
          onClose={() => setUi({ chapterModal: null })}
        />
      )}

      {/* Delete chapter confirmation */}
      {ui.deleteChapterId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-2xl p-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{t("educator.courseDetail.storyRemoveTitle")}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-300 mb-6">
              {t("educator.courseDetail.storyRemoveDesc")}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setUi({ deleteChapterId: null })} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors">
                {t("educator.courseDetail.storyRemoveCancel")}
              </button>
              <button
                onClick={() => handleChapterDelete(ui.deleteChapterId!)}
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
