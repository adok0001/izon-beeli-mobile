"use client";

import { ApiError, apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { cn, formatDuration } from "@/lib/utils";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, Lesson } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CirclePlay, Headphones } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useTranslation } from "react-i18next";

function LessonRow({ lesson }: Readonly<{ lesson: Lesson }>) {
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);

  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-700 dark:hover:bg-brand-950/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
        <CirclePlay className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-neutral-900 dark:text-white">
          {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
        </p>
        <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
          {localizeField(lesson.description, lesson.descriptionFr, uiLanguage)}
        </p>
      </div>
      {lesson.duration !== undefined && (
        <span className="shrink-0 text-sm text-neutral-400 dark:text-neutral-500">
          {formatDuration(lesson.duration)}
        </span>
      )}
    </Link>
  );
}

export default function CoursePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);

  const { data: course, isLoading: courseLoading, error } = useQuery<Course>({
    queryKey: ["course", id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course>(`/courses/${id}`, { token: token ?? undefined });
    },
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["course-lessons", id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Lesson[]>(`/lessons?courseId=${id}`, { token: token ?? undefined });
    },
    enabled: !!course,
  });

  const notFound = error instanceof ApiError && error.status === 404;

  if (courseLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 h-5 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="mb-3 h-9 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="mb-8 h-16 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => `course-skeleton-${index + 1}`).map((rowKey) => (
            <div key={rowKey} className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
        <BookOpen className="mb-3 h-12 w-12 text-neutral-400 dark:text-neutral-500" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {t("coursePage.notFoundTitle")}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {t("coursePage.notFoundDescription")}
        </p>
        <Link
          href="/learn"
          className="mt-6 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const localizedTitle = localizeField(course.title, course.titleFr, uiLanguage);
  const localizedDescription = localizeField(course.description, course.descriptionFr, uiLanguage);
  const firstLesson = lessons[0];

  let lessonsContent: React.ReactNode;

  if (lessonsLoading) {
    lessonsContent = (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => `course-lesson-${index + 1}`).map((rowKey) => (
          <div key={rowKey} className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        ))}
      </div>
    );
  } else if (lessons.length === 0) {
    lessonsContent = (
      <div className="rounded-2xl border border-dashed border-neutral-200 px-6 py-12 text-center dark:border-neutral-800">
        <Headphones className="mx-auto mb-3 h-10 w-10 text-neutral-400 dark:text-neutral-500" />
        <p className="font-medium text-neutral-900 dark:text-white">{t("listenPage.emptyTitle")}</p>
      </div>
    );
  } else {
    lessonsContent = (
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/learn"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <span className="mb-2 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              {t(`levels.${course.level}`)}
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{localizedTitle}</h1>
          </div>
          <span className="shrink-0 text-sm text-neutral-400 dark:text-neutral-500">
            {t("learn.totalLessons", { count: course.lessonsCount })}
          </span>
        </div>

        <p className="max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {localizedDescription}
        </p>

        {course.progress !== undefined && (
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>{t("learn.progress")}</span>
              <span>{course.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}

        {firstLesson && (
          <div className="mt-6">
            <Link
              href={`/lesson/${firstLesson.id}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors",
                "bg-brand-600 hover:bg-brand-700"
              )}
            >
              <CirclePlay className="h-4 w-4" />
              {t("coursePage.startFirstLesson")}
            </Link>
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">
          {t("coursePage.lessonsTitle")}
        </h2>
        {lessonsContent}
      </section>
    </div>
  );
}