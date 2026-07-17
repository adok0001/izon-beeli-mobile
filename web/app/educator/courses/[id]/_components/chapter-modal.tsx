"use client";

import { localizeField } from "@/lib/localize";
import { useForm } from "@/lib/use-form";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Lesson, StoryChapterDraft } from "./shared";

export function ChapterModal({
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
  const [form, setForm] = useForm({
    lessonId: chapter?.lessonId ?? lessons[0]?.id ?? "",
    title: chapter?.title ?? "",
    narrativeIntro: chapter?.narrativeIntro ?? "",
    narrativeOutro: chapter?.narrativeOutro ?? "",
    order: String(chapter?.order ?? defaultOrder),
  });

  const canSave = form.lessonId && form.title.trim() && form.narrativeIntro.trim() && form.narrativeOutro.trim();

  const handleSave = () => {
    onSave({
      id: chapter?.id ?? `story-ch-new-${Date.now()}`,
      lessonId: form.lessonId,
      title: form.title.trim(),
      narrativeIntro: form.narrativeIntro.trim(),
      narrativeOutro: form.narrativeOutro.trim(),
      order: parseInt(form.order) || 1,
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
              value={form.lessonId}
              onChange={(e) => setForm({ lessonId: e.target.value })}
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
              value={form.title}
              onChange={(e) => setForm({ title: e.target.value })}
              placeholder={t("educator.courseDetail.chapterTitlePlaceholder")}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">
              {t("educator.courseDetail.chapterIntroLabel")} <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.narrativeIntro}
              onChange={(e) => setForm({ narrativeIntro: e.target.value })}
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
              value={form.narrativeOutro}
              onChange={(e) => setForm({ narrativeOutro: e.target.value })}
              placeholder={t("educator.courseDetail.chapterOutroPlaceholder")}
              rows={4}
              className="w-full rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">{t("educator.courseDetail.chapterOrderLabel")}</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ order: e.target.value })}
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
