"use client";

import type { Lesson } from "@/app/educator/courses/[id]/_components/shared";
import { localizePair } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ActionButton, Field, SelectField, TextareaField } from "./fields";
import type { ChapterDraft } from "./types";

/**
 * The season's episodes. Order is the list position — the server is sent
 * `order: i + 1` on save (`story-arcs.ts:481-489`), so there is no manual
 * number to keep in sync.
 *
 * A course-bound season's narrative lives on its lessons and its order IS the
 * lesson order (the server ignores chapters for those on save,
 * `story-arcs.ts:402`), so those render read-only with a pointer to the course.
 */
export function ChapterList({
  chapters,
  lessons,
  readOnly,
  courseId,
  onChange,
  onMove,
  onRemove,
  onAdd,
}: Readonly<{
  chapters: ChapterDraft[];
  lessons: Lesson[];
  readOnly: boolean;
  courseId: string | null;
  onChange: (index: number, patch: Partial<ChapterDraft>) => void;
  onMove: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}>) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();

  const lessonLabel = (lesson: Lesson) =>
    `${lesson.order}. ${localizePair(lesson.titleTranslations, lesson.title, uiLanguage)}`;

  return (
    <div className="space-y-3 border-t border-neutral-200 dark:border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t("educator.story.chaptersCount", { count: chapters.length })}
        </h4>
        {!readOnly && <ActionButton onClick={onAdd}>{t("educator.story.addChapter")}</ActionButton>}
      </div>

      {readOnly && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {t("educator.storyArcs.courseBoundNotice", {
            defaultValue:
              "This season is bound to a course, so its narrative and episode order live on the course's lessons. Edit them there — chapter changes made here are not saved.",
          })}{" "}
          {courseId && (
            <Link href={`/educator/courses/${courseId}`} className="font-semibold underline">
              {t("educator.storyArcs.openCourse", { defaultValue: "Open course" })}
            </Link>
          )}
        </div>
      )}

      {chapters.length === 0 && <p className="text-sm text-neutral-500">{t("educator.story.noChapters")}</p>}

      {chapters.map((chapter, i) => (
        <div
          key={chapter.key}
          className="rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-neutral-500">
              {t("educator.story.chapterLabel", { number: i + 1 })}
            </span>
            <div className="flex items-center gap-1.5">
              <ActionButton
                onClick={() => onChange(i, { isActive: !chapter.isActive })}
                tone={chapter.isActive ? undefined : "danger"}
              >
                {chapter.isActive
                  ? t("educator.storyArcs.chapterVisible", { defaultValue: "Visible" })
                  : t("educator.storyArcs.chapterHidden", { defaultValue: "Hidden" })}
              </ActionButton>
              {!readOnly && (
                <>
                  <ActionButton
                    onClick={() => onMove(i, -1)}
                    disabled={i === 0}
                    title={t("educator.storyArcs.moveUp", { defaultValue: "Move up" })}
                  >
                    ↑
                  </ActionButton>
                  <ActionButton
                    onClick={() => onMove(i, 1)}
                    disabled={i === chapters.length - 1}
                    title={t("educator.storyArcs.moveDown", { defaultValue: "Move down" })}
                  >
                    ↓
                  </ActionButton>
                  <ActionButton
                    tone="danger"
                    onClick={() => {
                      if (globalThis.confirm(t("educator.story.removeChapterMessage"))) onRemove(i);
                    }}
                  >
                    {t("educator.storyArcs.remove", { defaultValue: "Remove" })}
                  </ActionButton>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SelectField
              label={t("educator.story.chapterLessonLabel")}
              value={chapter.lessonId}
              onChange={(v) => onChange(i, { lessonId: v })}
              disabled={readOnly}
              required
            >
              <option value="">{t("educator.story.chapterLessonChoose")}</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lessonLabel(lesson)}
                </option>
              ))}
              {/* A chapter may point at a lesson outside the current option set
                  (another course, or one since deactivated) — keep it selectable
                  rather than silently resetting the link. */}
              {chapter.lessonId && !lessons.some((l) => l.id === chapter.lessonId) && (
                <option value={chapter.lessonId}>{chapter.lessonId}</option>
              )}
            </SelectField>
            <Field
              label={t("educator.story.chapterTitleLabel")}
              value={chapter.title}
              onChange={(v) => onChange(i, { title: v })}
              placeholder={t("educator.story.chapterTitlePlaceholder")}
              disabled={readOnly}
              required
            />
          </div>
          <TextareaField
            label={t("educator.story.chapterNarrativeIntroLabel")}
            value={chapter.narrativeIntro}
            onChange={(v) => onChange(i, { narrativeIntro: v })}
            placeholder={t("educator.story.chapterNarrativeIntroPlaceholder")}
            disabled={readOnly}
            required
          />
          <TextareaField
            label={t("educator.story.chapterNarrativeOutroLabel")}
            value={chapter.narrativeOutro}
            onChange={(v) => onChange(i, { narrativeOutro: v })}
            placeholder={t("educator.story.chapterNarrativeOutroPlaceholder")}
            disabled={readOnly}
            required
          />
        </div>
      ))}
    </div>
  );
}
