"use client";

import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course } from "@/types";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Brain, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Bounty { id: string; title: string; xpReward: number; }
interface DueEntry { dictionaryEntryId: string; }

function BountyTeaser({ languageId }: Readonly<{ languageId: string }>) {
  const { t } = useTranslation();
  const { data: bounties = [] } = useQuery<Bounty[]>({
    queryKey: ["bounties", languageId],
    queryFn: () => apiFetch<Bounty[]>(`/bounties?languageId=${languageId}`),
  });
  const top = bounties[0];
  if (!top) return null;
  return (
    <Link
      href="/bounties"
      className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
        <Star className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            {t("learn.bountyLabel")}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300">
            +{top.xpReward} XP
          </span>
        </div>
        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{top.title}</p>
      </div>
      <span className="text-amber-400 text-lg">›</span>
    </Link>
  );
}

function ReviewBanner() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { data: dueWords = [] } = useQuery<DueEntry[]>({
    queryKey: ["wordbank-due"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DueEntry[]>("/wordbank/due", { token: token ?? undefined });
    },
    enabled: !!isSignedIn,
  });
  if (dueWords.length === 0) return null;
  return (
    <Link
      href="/word-review"
      className="flex items-center gap-3 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shrink-0">
        <Brain className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          {t("learn.reviewBanner", { count: dueWords.length })}
        </p>
        <p className="text-xs text-violet-500 dark:text-violet-400">
          {t("learn.reviewBannerCta")}
        </p>
      </div>
      <span className="text-violet-400 text-lg">›</span>
    </Link>
  );
}

const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
type Level = (typeof LEVELS)[number];

const LANGUAGES = [
  { id: "izon", name: "Izon" },
  { id: "akan", name: "Akan" },
  { id: "amharic", name: "Amharic" },
  { id: "yoruba", name: "Yoruba" },
  { id: "swahili", name: "Swahili" },
  { id: "hausa", name: "Hausa" },
  { id: "igbo", name: "Igbo" },
  { id: "oromo", name: "Oromo" },
] as const;

function CourseCard({ course }: Readonly<{ course: Course }>) {
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-2 bg-gradient-to-r from-brand-500 to-purple-500" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
              {t(`levels.${course.level}`)}
            </span>
            <h3 className="font-bold text-neutral-900 dark:text-white text-base leading-snug">
              {localizeField(course.title, course.titleFr, uiLanguage)}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
              {localizeField(course.description, course.descriptionFr, uiLanguage)}
            </p>
          </div>
        </div>

        {/* Progress */}
        {course.progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <span>{t("learn.progress")}</span>
              <span>{course.progress}%</span>
            </div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {t("learn.totalLessons", { count: course.lessonsCount })}
          </span>
          <Link
            href={`/course/${course.id}`}
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {t("common.start")} →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { getToken } = useAuth();
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [level, setLevel] = useState<Level>("all");

  const { data: allCourses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["courses", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>(`/courses?languageId=${selectedLanguageId}`, { token: token ?? undefined });
    },
  });

  const courses = level === "all" ? allCourses : allCourses.filter((c) => c.level === level);

  let content: React.ReactNode;

  if (isLoading) {
    const loadingCards = ["learn-skeleton-1", "learn-skeleton-2", "learn-skeleton-3", "learn-skeleton-4"];
    content = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loadingCards.map((cardKey) => (
          <div
            key={cardKey}
            className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl h-44 animate-pulse"
          />
        ))}
      </div>
    );
  } else if (courses.length === 0) {
    content = (
      <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
        <BookOpen className="mx-auto mb-3 h-10 w-10" />
        <p className="font-medium">{t("learn.emptyTitle")}</p>
        <p className="text-sm mt-1">{t("learn.emptyDescription")}</p>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("learn.title")}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          {t("learn.webSubtitle")}
        </p>
      </div>

      {/* Language picker — full-width scrollable row */}
      <div className="overflow-x-auto scrollbar-hide mb-2">
        <div className="flex gap-2 px-4 pb-2 w-max">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => { setLanguage(lang.id); setLevel("all"); }}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                selectedLanguageId === lang.id
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-neutral-200 text-neutral-600 hover:border-brand-400 dark:border-neutral-700 dark:text-neutral-400"
              )}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Level filter — full-width scrollable row */}
      <div className="overflow-x-auto scrollbar-hide mb-6">
        <div className="flex gap-2 px-4 pb-2 w-max">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors",
                level === l
                  ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400"
              )}
            >
              {l === "all" ? t("learn.allLevels") : t(`levels.${l}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Banners */}
      <div className="max-w-4xl mx-auto px-4 mb-6 space-y-3">
        <ReviewBanner />
        <BountyTeaser languageId={selectedLanguageId} />
      </div>

      {/* Courses grid */}
      <div className="max-w-4xl mx-auto px-4">
        {content}
      </div>
    </div>
  );
}
