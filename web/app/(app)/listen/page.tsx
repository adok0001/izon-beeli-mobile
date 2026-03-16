"use client";

import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { cn, formatDuration } from "@/lib/utils";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, Lesson } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Headphones, Pause, Play } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function LessonRow({ lesson, courseTitle }: Readonly<{ lesson: Lesson; courseTitle: string }>) {
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const { load, currentLesson, isPlaying, pause } = useAudioStore();
  const isActive = currentLesson?.id === lesson.id;

  const handlePlay = () => {
    if (isActive && isPlaying) {
      pause();
    } else {
      load(lesson);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer group",
        isActive
          ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/40"
          : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
      )}
      onClick={handlePlay}
    >
      {/* Play button */}
      <div
        className={cn(
          "w-11 h-11 shrink-0 flex items-center justify-center rounded-full transition-colors",
          isActive
            ? "bg-brand-600 text-white"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:bg-brand-100 group-hover:text-brand-600"
        )}
        aria-hidden="true"
        aria-label={isActive && isPlaying ? t("lesson.pause") : t("lesson.play")}
      >
        {isActive && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 dark:text-white truncate">
          {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{courseTitle}</p>
      </div>

      {/* Duration */}
      {lesson.duration !== undefined && (
        <span className="text-sm text-neutral-400 dark:text-neutral-500 shrink-0">
          {formatDuration(lesson.duration)}
        </span>
      )}

      {/* Completed badge */}
      {lesson.completed && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
      )}
    </button>
  );
}

export default function ListenPage() {
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["courses", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>(`/courses?languageId=${selectedLanguageId}`, { token: token ?? undefined });
    },
  });

  const activeCourse = selectedCourseId
    ? courses.find((c) => c.id === selectedCourseId)
    : courses[0];

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["lessons", activeCourse?.id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Lesson[]>(`/lessons?courseId=${activeCourse!.id}`, { token: token ?? undefined });
    },
    enabled: !!activeCourse,
  });

  let lessonContent: React.ReactNode;

  if (lessonsLoading) {
    const loadingRows = ["listen-skeleton-1", "listen-skeleton-2", "listen-skeleton-3", "listen-skeleton-4", "listen-skeleton-5", "listen-skeleton-6"];
    lessonContent = (
      <div className="space-y-3">
        {loadingRows.map((rowKey) => (
          <div key={rowKey} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  } else if (lessons.length === 0) {
    lessonContent = (
      <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
        <Headphones className="mx-auto mb-3 h-10 w-10" />
        <p className="font-medium">{t("listenPage.emptyTitle")}</p>
      </div>
    );
  } else {
    lessonContent = (
      <div className="space-y-1">
        {lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            courseTitle={
              activeCourse
                ? localizeField(activeCourse.title, activeCourse.titleFr, uiLanguage)
                : ""
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("tabs.listen")}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          {t("listenPage.subtitle")}
        </p>
      </div>

      {/* Course tabs — full-width scrollable row */}
      {!coursesLoading && courses.length > 0 && (
        <div className="overflow-x-auto scrollbar-hide mb-6">
          <div className="flex gap-2 px-4 pb-2 w-max">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                  activeCourse?.id === course.id
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-neutral-200 text-neutral-600 hover:border-brand-400 dark:border-neutral-700 dark:text-neutral-400"
                )}
              >
                  {localizeField(course.title, course.titleFr, uiLanguage)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lesson list */}
      <div className="max-w-3xl mx-auto px-4">
        {lessonContent}
      </div>
    </div>
  );
}
