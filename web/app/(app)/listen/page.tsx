"use client";

import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { cn, formatDuration } from "@/lib/utils";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, Lesson } from "@/types";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
    BookMarked,
    Brain,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Globe2,
    Headphones,
    Pause,
    Play,
    Quote,
    Trophy,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// ── Types ────────────────────────────────────────────────────────────────────

interface Proverb { id: string; text: string; translation?: string | null; }
interface DueEntry { dictionaryEntryId: string; }
interface CulturalItem { id: string; title: string; category: string; description: string; emoji?: string | null; }

// ── Collapsible Section ───────────────────────────────────────────────────────

function Section({
  title,
  defaultOpen = true,
  children,
}: Readonly<{ title: string; defaultOpen?: boolean; children: React.ReactNode }>) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {title}
        </span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
          : <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        }
      </button>
      {open && <div className="space-y-3 pb-2">{children}</div>}
    </div>
  );
}

// ── Activity card ─────────────────────────────────────────────────────────────

function ActivityCard({
  href, icon: Icon, iconBg, label, badge,
}: Readonly<{
  href: string; icon: React.ElementType; iconBg: string; label: string; badge?: number;
}>) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center py-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-brand-300 dark:hover:border-brand-700 transition-colors relative"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", iconBg)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      {badge != null && badge > 0 && (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
          {badge}
        </span>
      )}
      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{label}</span>
    </Link>
  );
}

// ── Lesson row ────────────────────────────────────────────────────────────────

function LessonRow({ lesson, courseTitle }: Readonly<{ lesson: Lesson; courseTitle: string }>) {
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const { load, currentLesson, isPlaying, pause } = useAudioStore();
  const isActive = currentLesson?.id === lesson.id;

  const handlePlay = () => {
    if (isActive && isPlaying) pause();
    else load(lesson);
  };

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer group w-full text-left",
        isActive
          ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/40"
          : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
      )}
      onClick={handlePlay}
    >
      <div
        className={cn(
          "w-11 h-11 shrink-0 flex items-center justify-center rounded-full transition-colors",
          isActive
            ? "bg-brand-600 text-white"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:bg-brand-100 group-hover:text-brand-600"
        )}
        aria-label={isActive && isPlaying ? t("lesson.pause") : t("lesson.play")}
      >
        {isActive && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 dark:text-white truncate">
          {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{courseTitle}</p>
      </div>
      {lesson.duration !== undefined && (
        <span className="text-sm text-neutral-400 dark:text-neutral-500 shrink-0">
          {formatDuration(lesson.duration)}
        </span>
      )}
      {lesson.completed && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
    </button>
  );
}

// ── Proverbs card ─────────────────────────────────────────────────────────────

function ProverbsCard({ languageId }: Readonly<{ languageId: string }>) {
  const { t } = useTranslation();
  const { data: proverbs = [] } = useQuery<Proverb[]>({
    queryKey: ["proverbs", languageId],
    queryFn: () => apiFetch<Proverb[]>(`/proverbs?languageId=${languageId}`),
  });
  if (proverbs.length === 0) return null;
  const first = proverbs[0];
  return (
    <Link
      href={`/proverbs/${languageId}`}
      className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
        <Quote className="h-5 w-5 text-amber-700 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-0.5">
          {t("practice.proverbs")}
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 italic truncate">
          &ldquo;{first.text}&rdquo;
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-amber-400 shrink-0" />
    </Link>
  );
}

// ── Cultural card ─────────────────────────────────────────────────────────────

function CulturalCard({ languageId }: Readonly<{ languageId: string }>) {
  const { t } = useTranslation();
  const { data: items = [] } = useQuery<CulturalItem[]>({
    queryKey: ["cultural", languageId],
    queryFn: () => apiFetch<CulturalItem[]>(`/cultural?languageId=${languageId}`),
  });
  if (items.length === 0) return null;
  const first = items[0];
  return (
    <Link
      href={`/cultural/${languageId}`}
      className="flex items-center gap-3 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0 text-2xl">
        {first.emoji ?? <Globe2 className="h-5 w-5 text-purple-700 dark:text-purple-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-400 mb-0.5">
          {t("practice.sectionCulture")} · {items.length}
        </p>
        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{first.title}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-purple-400 shrink-0" />
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ListenPage() {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
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

  const { data: dueWords = [] } = useQuery<DueEntry[]>({
    queryKey: ["wordbank-due"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DueEntry[]>("/wordbank/due", { token: token ?? undefined });
    },
    enabled: !!isSignedIn,
  });

  let lessonContent: React.ReactNode;
  if (lessonsLoading) {
    lessonContent = (
      <div className="space-y-3">
        {["l1","l2","l3","l4","l5","l6"].map((k) => (
          <div key={k} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  } else if (lessons.length === 0) {
    lessonContent = (
      <div className="text-center py-12 text-neutral-400 dark:text-neutral-500">
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
            courseTitle={activeCourse ? localizeField(activeCourse.title, activeCourse.titleFr, uiLanguage) : ""}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("practice.title")}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          {t("practice.subtitle")}
        </p>
      </div>

      {/* ── Activities ── */}
      <Section title={t("practice.sectionActivities")}>
        <div className="flex gap-3">
          <ActivityCard
            href="/word-review"
            icon={Brain}
            iconBg="bg-emerald-500"
            label={t("practice.wordReview")}
            badge={dueWords.length}
          />
          <ActivityCard
            href={activeCourse ? `/quiz?courseId=${activeCourse.id}` : "/quiz"}
            icon={Trophy}
            iconBg="bg-brand-500"
            label={t("practice.quiz")}
          />
          <ActivityCard
            href="/leaderboard"
            icon={Users}
            iconBg="bg-violet-500"
            label={t("leaderboard.title")}
          />
        </div>
      </Section>

      {/* ── Audio Lessons ── */}
      <Section title={t("tabs.listen")}>
        {/* Course tabs */}
        {!coursesLoading && courses.length > 0 && (
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2 pb-2 w-max">
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
        {lessonContent}
      </Section>

      {/* ── Culture & Language ── */}
      <Section title={t("practice.sectionCulture")} defaultOpen={false}>
        <ProverbsCard languageId={selectedLanguageId} />
        <CulturalCard languageId={selectedLanguageId} />
        <Link
          href="/dictionary"
          className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <BookMarked className="h-5 w-5 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-0.5">
              {t("dictionaryPage.title")}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("dictionaryPage.subtitle")}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-blue-400 shrink-0" />
        </Link>
      </Section>
    </div>
  );
}
