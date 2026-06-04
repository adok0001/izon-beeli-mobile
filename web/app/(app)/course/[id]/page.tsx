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

// ── Window chrome (Poolsuite-style) ──────────────────────────────────────────

function WindowTitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50/80 dark:bg-white/[0.02]">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f56", opacity: 0.45 }} />
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e", opacity: 0.45 }} />
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27c93f", opacity: 0.45 }} />
      <span className="flex-1 text-center font-mono text-[9px] text-neutral-400 dark:text-neutral-600 tracking-wide select-none truncate">
        {title}
      </span>
    </div>
  );
}

// ── Level config ──────────────────────────────────────────────────────────────

const LEVEL_COLORS = {
  beginner:     { bar: "bg-emerald-500", badge: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25", glow: "shadow-[0_0_20px_-6px_rgb(16_185_129_/0.35)]" },
  intermediate: { bar: "bg-blue-500",    badge: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25",             glow: "shadow-[0_0_20px_-6px_rgb(59_130_246_/0.35)]" },
  advanced:     { bar: "bg-violet-500",  badge: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/25",     glow: "shadow-[0_0_20px_-6px_rgb(139_92_246_/0.35)]" },
} as const;

// ── Lesson row ────────────────────────────────────────────────────────────────

function LessonRow({ lesson, index }: Readonly<{ lesson: Lesson; index: number }>) {
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const num = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="group flex items-center gap-4 rounded-xl border border-neutral-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-4 py-4 transition-all duration-200 hover:border-amber-400/40 dark:hover:border-amber-500/30 hover:bg-amber-50/30 dark:hover:bg-amber-500/[0.04] hover:shadow-[0_4px_20px_-8px_rgb(245_158_11_/0.2)]"
    >
      <div className="shrink-0 flex flex-col items-center gap-1">
        <span className="font-mono text-[9px] text-neutral-300 dark:text-neutral-700 tabular-nums">{num}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/8 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 group-hover:bg-amber-500/15 transition-colors">
          <CirclePlay className="h-4 w-4" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-neutral-900 dark:text-white text-sm leading-snug">
          {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
        </p>
        {lesson.description && (
          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-500">
            {localizeField(lesson.description, lesson.descriptionFr, uiLanguage)}
          </p>
        )}
      </div>
      {lesson.duration !== undefined && (
        <span className="shrink-0 font-mono text-[10px] text-neutral-400 dark:text-neutral-600 tabular-nums">
          {formatDuration(lesson.duration)}
        </span>
      )}
      <div className="w-px h-6 bg-neutral-100 dark:bg-white/[0.05] shrink-0" />
      <svg className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-700 group-hover:text-amber-400 transition-colors shrink-0" viewBox="0 0 16 16" fill="none">
        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CoursePageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      <div className="h-4 w-20 animate-pulse rounded bg-neutral-100 dark:bg-white/[0.06]" />
      <div className="rounded-2xl border border-neutral-100 dark:border-white/[0.06] overflow-hidden">
        <div className="h-10 bg-neutral-50 dark:bg-white/[0.03]" />
        <div className="p-6 space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-white/[0.06]" />
          <div className="h-7 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-white/[0.06]" />
          <div className="h-3 w-full animate-pulse rounded bg-neutral-100 dark:bg-white/[0.06]" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-100 dark:bg-white/[0.06]" />
          <div className="h-1.5 w-full animate-pulse rounded-full bg-neutral-100 dark:bg-white/[0.06]" />
        </div>
      </div>
      <div className="space-y-3">
        {[1,2,3].map((k) => (
          <div key={k} className="h-18 animate-pulse rounded-xl bg-neutral-100 dark:bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  if (courseLoading) return <CoursePageSkeleton />;

  if (notFound || !course) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center gap-4">
        <BookOpen className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
        <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">
          {t("coursePage.notFoundTitle")}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("coursePage.notFoundDescription")}
        </p>
        <Link href="/learn" className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-colors">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const localizedTitle = localizeField(course.title, course.titleFr, uiLanguage);
  const localizedDescription = localizeField(course.description, course.descriptionFr, uiLanguage);
  const firstLesson = lessons[0];
  const level = (course.level ?? "beginner") as keyof typeof LEVEL_COLORS;
  const levelColors = LEVEL_COLORS[level] ?? LEVEL_COLORS.beginner;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">

      {/* Back link */}
      <Link
        href="/learn"
        className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        {t("common.back")}
      </Link>

      {/* ── Course header window ── */}
      <div className={cn("rounded-2xl border border-neutral-100 dark:border-white/[0.07] overflow-hidden", levelColors.glow)}>
        <WindowTitleBar title={`course — ${localizedTitle}`} />

        <div className="p-6">
          {/* Level + lesson count */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.18em] border", levelColors.badge)}>
              {t(`levels.${course.level}`)}
            </span>
            <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.18em]">
              {t("learn.totalLessons", { count: course.lessonsCount })}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-neutral-900 dark:text-white leading-tight tracking-tight mb-3">
            {localizedTitle}
          </h1>

          {/* Description */}
          {localizedDescription && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl">
              {localizedDescription}
            </p>
          )}

          {/* Progress bar */}
          {course.progress !== undefined && (
            <div className="mt-5">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                  {t("learn.progress")}
                </span>
                <span className="font-mono text-[10px] text-amber-500 tabular-nums">{course.progress}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.06]">
                <div
                  className={cn("h-full rounded-full transition-all", levelColors.bar)}
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          {firstLesson && (
            <div className="mt-6">
              <Link
                href={`/lesson/${firstLesson.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_24px_-6px_rgb(245_158_11_/0.5)] hover:shadow-[0_0_36px_-6px_rgb(245_158_11_/0.7)]"
              >
                <CirclePlay className="h-4 w-4" />
                {t("coursePage.startFirstLesson")}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Lessons section ── */}
      <section className="mt-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-7 h-px bg-amber-500/50" />
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-500/70">
            {t("coursePage.lessonsTitle")}
          </span>
          <div className="flex-1 h-px bg-neutral-100 dark:bg-white/[0.04]" />
          {!lessonsLoading && lessons.length > 0 && (
            <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.18em]">
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            </span>
          )}
        </div>

        {lessonsLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((k) => (
              <div key={k} className="h-[72px] animate-pulse rounded-xl bg-neutral-100 dark:bg-white/[0.04]" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-white/[0.07] px-6 py-14 text-center">
            <Headphones className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p className="font-display font-semibold text-neutral-700 dark:text-neutral-400">
              {t("listenPage.emptyTitle")}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {lessons.map((lesson, i) => (
              <LessonRow key={lesson.id} lesson={lesson} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
