"use client";

import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { useForm } from "@/lib/use-form";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LESSON_TYPES, type Lesson } from "./shared";

export function LessonModal({
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
  const [form, setForm] = useForm({
    title: lesson ? localizeField(lesson.title, lesson.titleFr, uiLanguage) : "",
    description: lesson ? localizeField(lesson.description, lesson.descriptionFr, uiLanguage) : "",
    type: lesson?.type ?? "lesson",
    artist: lesson?.artist ?? "",
    genre: lesson?.genre ?? "",
    order: String(lesson?.order ?? 999),
    audioFile: null as File | null,
    error: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (isEdit) {
        return apiFetch(`/educator/lessons/${lesson.id}`, {
          method: "PATCH",
          token: token!,
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            type: form.type,
            artist: form.artist.trim() || null,
            genre: form.genre.trim() || null,
            order: parseInt(form.order) || 999,
          }),
        });
      }
      const fd = new FormData();
      fd.append("languageId", languageId);
      fd.append("courseId", courseId);
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("type", form.type);
      if (form.artist.trim()) fd.append("artist", form.artist.trim());
      if (form.genre.trim()) fd.append("genre", form.genre.trim());
      fd.append("order", form.order || "999");
      if (form.audioFile) fd.append("audio", form.audioFile);
      return apiFetch("/educator/lessons", { method: "POST", token: token!, body: fd });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      toast.success(isEdit ? t("educator.courseDetail.lessonUpdated") : t("educator.courseDetail.lessonCreated"));
      onClose();
    },
    onError: (e: Error) => setForm({ error: e.message }),
  });

  const canSave = form.title.trim().length > 0 && form.description.trim().length > 0 && !save.isPending;

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
                  onClick={() => setForm({ type: t })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    form.type === t
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
              value={form.title}
              onChange={(e) => setForm({ title: e.target.value })}
              placeholder={t("educator.courseDetail.modalTitlePlaceholder")}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalDescRequired")}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ description: e.target.value })}
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
                onChange={(e) => setForm({ audioFile: e.target.files?.[0] ?? null })}
                className="block w-full text-sm text-neutral-500 dark:text-neutral-300
                  file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                  file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700
                  dark:file:bg-brand-900/30 dark:file:text-brand-300
                  hover:file:bg-brand-100 dark:hover:file:bg-brand-900/50"
              />
              {form.audioFile && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-300">{form.audioFile.name} · {(form.audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalArtist")}</label>
              <input value={form.artist} onChange={(e) => setForm({ artist: e.target.value })} placeholder={t("educator.courseDetail.modalOptional")} className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalGenre")}</label>
              <input value={form.genre} onChange={(e) => setForm({ genre: e.target.value })} placeholder={t("educator.courseDetail.modalOptional")} className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.modalOrder")}</label>
            <input type="number" value={form.order} onChange={(e) => setForm({ order: e.target.value })} className="w-24 rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {form.error && <p className="text-xs text-red-500">{form.error}</p>}
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
