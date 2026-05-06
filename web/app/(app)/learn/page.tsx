"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, UserMe } from "@/types";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Brain, Flame, Star, Zap } from "lucide-react";
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
      className="group flex items-center gap-4 p-4 rounded-2xl bg-amber-500/[0.06] dark:bg-amber-500/[0.06] border border-amber-500/[0.15] dark:border-amber-500/[0.18] hover:border-amber-400/40 dark:hover:border-amber-400/35 hover:bg-amber-500/[0.1] transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow">
        <Star className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t("learn.bountyLabel")}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/[0.15] text-[10px] font-bold text-amber-600 dark:text-amber-400">
            +{top.xpReward} XP
          </span>
        </div>
        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{top.title}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
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
      className="group flex items-center gap-4 p-4 rounded-2xl bg-brand-500/[0.06] border border-brand-500/[0.15] dark:border-brand-500/[0.2] hover:border-brand-400/40 hover:bg-brand-500/[0.1] transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-glow-xs group-hover:shadow-glow-sm transition-shadow">
        <Brain className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
          {t("learn.reviewBanner", { count: dueWords.length })}
        </p>
        <p className="text-xs text-brand-500/70 dark:text-brand-500 mt-0.5">
          {t("learn.reviewBannerCta")}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-brand-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
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
    <div className="group relative bg-white dark:bg-white/[0.03] rounded-2xl border border-neutral-100 dark:border-white/[0.07] overflow-hidden hover:border-brand-300/60 dark:hover:border-brand-500/30 hover:shadow-card-hover dark:hover:shadow-glow-xs transition-all duration-200">
      {/* Top gradient accent */}
      <div className="h-[2px] bg-gradient-to-r from-brand-500 via-purple-400 to-brand-400" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-400 mb-2">
              {t(`levels.${course.level}`)}
            </span>
            <h3 className="font-bold text-neutral-900 dark:text-white text-base leading-snug">
              {localizeField(course.title, course.titleFr, uiLanguage)}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
              {localizeField(course.description, course.descriptionFr, uiLanguage)}
            </p>
          </div>
        </div>

        {/* Progress */}
        {course.progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-neutral-400 dark:text-neutral-500">{t("learn.progress")}</span>
              <span className="font-semibold text-neutral-600 dark:text-neutral-400">{course.progress}%</span>
            </div>
            <div className="h-1 bg-neutral-100 dark:bg-white/[0.07] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
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
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 group-hover:gap-2 transition-all"
          >
            {t("common.start")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [level, setLevel] = useState<Level>("all");

  const { data: me } = useQuery<UserMe>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<UserMe>("/users/me", { token: token ?? undefined });
    },
    enabled: !!isSignedIn,
  });

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
          <div key={cardKey} className="skeleton rounded-2xl h-44" />
        ))}
      </div>
    );
  } else if (courses.length === 0) {
    content = (
      <EmptyState
        variant="courses"
        title={t("learn.emptyTitle")}
        description={t("learn.emptyDescription")}
      />
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {t("learn.title")}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
              {t("learn.webSubtitle")}
            </p>
          </div>
          {me && (
            <div className="flex items-center gap-2 shrink-0">
              {me.streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/[0.1] border border-orange-500/[0.2] dark:border-orange-500/[0.2]">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{me.streak}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500/[0.1] border border-brand-500/[0.2]">
                <Zap className="h-3.5 w-3.5 text-brand-500" />
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{me.points} XP</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Language picker */}
      <div className="overflow-x-auto scrollbar-hide mb-2">
        <div className="flex gap-2 px-4 pb-2 w-max">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => { setLanguage(lang.id); setLevel("all"); }}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150",
                selectedLanguageId === lang.id
                  ? "bg-brand-600 text-white border-brand-600 shadow-glow-xs"
                  : "border-neutral-200 dark:border-white/[0.1] text-neutral-600 dark:text-neutral-400 hover:border-brand-400/50 dark:hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-300"
              )}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Level filter */}
      <div className="overflow-x-auto scrollbar-hide mb-6">
        <div className="flex gap-2 px-4 pb-2 w-max">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs font-semibold border capitalize transition-all duration-150",
                level === l
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                  : "border-neutral-200 dark:border-white/[0.1] text-neutral-500 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-white/[0.25] hover:text-neutral-700 dark:hover:text-neutral-200"
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
