"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { LanguageSelector } from "@/components/ui/language-selector";
import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, UserMe } from "@/types";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Brain, ChevronRight, Flame, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bounty { id: string; title: string; xpReward: number; }
interface DueEntry { dictionaryEntryId: string; }

const LEVEL_ORDER = ["beginner", "intermediate", "advanced"] as const;
type Level = (typeof LEVEL_ORDER)[number];

const LEVEL_COLORS: Record<Level, { badge: string; dot: string; bar: string }> = {
  beginner:     { badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", bar: "from-emerald-500 to-emerald-400" },
  intermediate: { badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",             dot: "bg-blue-500",    bar: "from-blue-500 to-blue-400" },
  advanced:     { badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400",     dot: "bg-violet-500",  bar: "from-violet-500 to-violet-400" },
};

// ── Banners ───────────────────────────────────────────────────────────────────

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
      className="group flex items-center gap-4 p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/[0.15] dark:border-amber-500/[0.18] hover:border-amber-400/40 hover:bg-amber-500/[0.1] transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
        <Star className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">{t("learn.bountyLabel")}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/[0.15] text-[10px] font-bold text-amber-600 dark:text-amber-400">+{top.xpReward} XP</span>
        </div>
        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{top.title}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-amber-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
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
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-glow-xs">
        <Brain className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">{t("learn.reviewBanner", { count: dueWords.length })}</p>
        <p className="text-xs text-brand-500/70 dark:text-brand-500 mt-0.5">{t("learn.reviewBannerCta")}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-brand-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// ── Course card (carousel) ────────────────────────────────────────────────────

function CourseCard({ course }: Readonly<{ course: Course }>) {
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const colors = LEVEL_COLORS[course.level];

  return (
    <div className="w-72 shrink-0 group relative bg-white dark:bg-white/[0.03] rounded-2xl border border-neutral-100 dark:border-white/[0.07] overflow-hidden hover:border-brand-300/60 dark:hover:border-brand-500/30 hover:shadow-card-hover dark:hover:shadow-glow-xs transition-all duration-200 flex flex-col">
      {/* Top accent line */}
      <div className={`h-[3px] bg-gradient-to-r ${colors.bar}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Level badge */}
        <span className={`inline-block self-start text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-3 ${colors.badge}`}>
          {t(`levels.${course.level}`)}
        </span>

        <h3 className="font-bold text-neutral-900 dark:text-white text-base leading-snug mb-1.5">
          {localizeField(course.title, course.titleFr, uiLanguage)}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed flex-1">
          {localizeField(course.description, course.descriptionFr, uiLanguage)}
        </p>

        {/* Progress */}
        {course.progress !== undefined && course.progress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-neutral-400 dark:text-neutral-500">{t("learn.progress")}</span>
              <span className="font-semibold text-neutral-600 dark:text-neutral-400">{course.progress}%</span>
            </div>
            <div className="h-1.5 bg-neutral-100 dark:bg-white/[0.07] rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all`}
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

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="w-72 shrink-0 rounded-2xl border border-neutral-100 dark:border-white/[0.07] overflow-hidden bg-white dark:bg-white/[0.03]">
      <div className="h-[3px] bg-neutral-200 dark:bg-white/10" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-5 w-48 rounded-lg" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-1.5 w-full rounded-full mt-6" />
      </div>
    </div>
  );
}

// ── Carousel section ──────────────────────────────────────────────────────────

function CarouselSection({ level, courses }: Readonly<{ level: Level; courses: Course[] }>) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const colors = LEVEL_COLORS[level];

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {t(`levels.${level}`)}
          </h2>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">({courses.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide -mx-4"
      >
        <div className="flex gap-4 px-4 pb-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {/* End spacer */}
          <div className="w-4 shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

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

  const coursesByLevel = LEVEL_ORDER.reduce<Record<Level, Course[]>>(
    (acc, level) => { acc[level] = allCourses.filter((c) => c.level === level); return acc; },
    { beginner: [], intermediate: [], advanced: [] }
  );

  const activeLevels = LEVEL_ORDER.filter((l) => coursesByLevel[l].length > 0);

  return (
    <div className="py-6 space-y-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4">
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
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/[0.1] border border-orange-500/[0.2]">
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

        {/* Language picker */}
        <div className="mt-4">
          <LanguageSelector
            value={selectedLanguageId}
            onChange={(id) => setLanguage(id)}
            allowCustom={false}
            className="w-52"
          />
        </div>
      </div>

      {/* Banners */}
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        <ReviewBanner />
        <BountyTeaser languageId={selectedLanguageId} />
      </div>

      {/* Carousel sections */}
      {isLoading ? (
        <div className="space-y-8">
          {LEVEL_ORDER.map((level) => (
            <div key={level}>
              <div className="flex items-center gap-2 px-4 mb-3">
                <div className={`w-2 h-2 rounded-full ${LEVEL_COLORS[level].dot}`} />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
              <div className="overflow-x-auto scrollbar-hide -mx-4">
                <div className="flex gap-4 px-4 pb-2">
                  {[1, 2, 3].map((k) => <SkeletonCard key={k} />)}
                  <div className="w-4 shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : allCourses.length === 0 ? (
        <div className="max-w-4xl mx-auto px-4">
          <EmptyState
            variant="courses"
            title={t("learn.emptyTitle")}
            description={t("learn.emptyDescription")}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {activeLevels.map((level) => (
            <CarouselSection key={level} level={level} courses={coursesByLevel[level]} />
          ))}
        </div>
      )}
    </div>
  );
}
