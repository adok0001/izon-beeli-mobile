"use client";

import { MazeRoomCard } from "@/components/learn/maze-room-card";
import { SoundMap } from "@/components/learn/sound-map";
import { EmptyState } from "@/components/ui/empty-state";
import { LanguageSelector } from "@/components/ui/language-selector";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/hooks/use-me";
import { generateIzonDefaults } from "@/lib/izon-map-defaults";
import { useLanguageStore } from "@/store/language-store";
import type { Course, MapNodeConfig } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, LayoutGrid, Map, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bounty { id: string; title: string; xpReward: number; }
interface DueEntry { dictionaryEntryId: string; }

const LEVEL_ORDER = ["beginner", "intermediate", "advanced"] as const;
type Level = (typeof LEVEL_ORDER)[number];

const LEVEL_META: Record<Level, { label: string; bar: string; stripe: string; badge: string }> = {
  beginner:     { label: "Beginner Wing",     bar: "from-emerald-500 to-emerald-400", stripe: "bg-emerald-500", badge: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  intermediate: { label: "Intermediate Wing", bar: "from-blue-500 to-blue-400",       stripe: "bg-blue-500",    badge: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  advanced:     { label: "Advanced Wing",     bar: "from-violet-500 to-violet-400",   stripe: "bg-violet-500",  badge: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
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
      className="group flex items-center gap-4 p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/[0.15] hover:border-amber-400/35 hover:bg-amber-500/[0.1] transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_-4px_rgb(245_158_11_/0.4)]">
        <Star className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">{t("learn.bountyLabel")}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-400">+{top.xpReward} XP</span>
        </div>
        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{top.title}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}


// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="w-64 shrink-0 rounded-2xl border border-neutral-100 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#0d0d18]">
      <div className="h-[3px] bg-neutral-200 dark:bg-white/10" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-44 rounded-lg" />
        <div className="skeleton h-3 w-full rounded mt-1" />
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-[3px] w-full rounded-full mt-6" />
      </div>
    </div>
  );
}

// ── Gallery wing ──────────────────────────────────────────────────────────────

function CarouselSection({ level, courses }: Readonly<{ level: Level; courses: Course[] }>) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const meta = LEVEL_META[level];

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  return (
    <div>
      {/* Wing header */}
      <div className="flex items-center gap-3 px-4 mb-5">
        <div className={`w-[3px] h-4 rounded-full ${meta.stripe}`} />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.26em] text-neutral-500 dark:text-neutral-500">
          {meta.label}
        </h2>
        <div className="flex-1 h-px bg-neutral-100 dark:bg-white/[0.05]" />
        <span className="text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-wide">
          {courses.length} {courses.length === 1 ? t("learn.courseCount_one", { defaultValue: "course" }) : t("learn.courseCount_other", { defaultValue: "courses" })}
        </span>
        <div className="flex items-center gap-0.5 ml-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.07] transition-colors text-base"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.07] transition-colors text-base"
          >
            ›
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative -mx-4">
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-neutral-50 dark:from-[#07070f] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-neutral-50 dark:from-[#07070f] to-transparent z-10 pointer-events-none" />
        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-4 pb-2">
            {courses.map((course) => (
              <MazeRoomCard key={course.id} course={course} />
            ))}
            <div className="w-4 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ViewMode = "grid" | "map";

export default function LearnPage() {
  const { getToken } = useAuth();
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [view, setView] = useState<ViewMode>("grid");

  const { data: me } = useMe();

  const { data: allCourses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["courses", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>(`/courses?languageId=${selectedLanguageId}`, { token: token ?? undefined });
    },
  });

  const { data: rawMapNodes = [] } = useQuery<MapNodeConfig[]>({
    queryKey: ["map-nodes", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<MapNodeConfig[]>(`/map-nodes?languageId=${selectedLanguageId}`, { token: token ?? undefined });
    },
    enabled: view === "map",
  });

  const mapNodes: MapNodeConfig[] =
    rawMapNodes.length > 0 ? rawMapNodes : generateIzonDefaults(allCourses);

  const coursesByLevel = LEVEL_ORDER.reduce<Record<Level, Course[]>>(
    (acc, level) => { acc[level] = allCourses.filter((c) => c.level === level); return acc; },
    { beginner: [], intermediate: [], advanced: [] }
  );
  const activeLevels = LEVEL_ORDER.filter((l) => coursesByLevel[l].length > 0);

  return (
    <div className="py-8 space-y-10">

      {/* ── Wing header ── */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-px bg-amber-500/50" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-amber-500/70 font-semibold">
            Language Gallery
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-neutral-900 dark:text-white leading-tight tracking-tight">
              {t("learn.title")}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1.5">
              {t("learn.webSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-1">
            {me && (
              <>
                {me.streak > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/[0.1] border border-orange-500/[0.2]">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{me.streak}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/[0.1] border border-amber-500/[0.2]">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{me.points} XP</span>
                </div>
              </>
            )}

            {/* View toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
                  view === "grid"
                    ? "bg-white dark:bg-white/[0.12] text-neutral-800 dark:text-white shadow-sm"
                    : "text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("map")}
                aria-label="Map view"
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
                  view === "map"
                    ? "bg-white dark:bg-white/[0.12] text-neutral-800 dark:text-white shadow-sm"
                    : "text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400"
                }`}
              >
                <Map className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <LanguageSelector
            value={selectedLanguageId}
            onChange={(id) => setLanguage(id)}
            allowCustom={false}
            className="w-56"
          />
        </div>
      </div>

      {/* ── Banners ── */}
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        <BountyTeaser languageId={selectedLanguageId} />
      </div>

      {/* ── Sound map ── */}
      {view === "map" && !isLoading && allCourses.length === 0 && (
        <div className="max-w-4xl mx-auto px-4">
          <EmptyState variant="courses" title={t("learn.emptyTitle")} description={t("learn.emptyDescription")} />
        </div>
      )}
      {view === "map" && !isLoading && allCourses.length > 0 && (
        <div className="max-w-5xl mx-auto px-4">
          <SoundMap courses={allCourses} mapNodes={mapNodes} />
        </div>
      )}

      {view === "grid" && (isLoading ? (
        <div className="space-y-10">
          {LEVEL_ORDER.map((level) => (
            <div key={level}>
              <div className="flex items-center gap-3 px-4 mb-5">
                <div className={`w-[3px] h-4 rounded-full ${LEVEL_META[level].stripe}`} />
                <div className="skeleton h-3 w-28 rounded" />
                <div className="flex-1 h-px bg-neutral-100 dark:bg-white/[0.05]" />
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
        <div className="space-y-10">
          {activeLevels.map((level) => (
            <CarouselSection key={level} level={level} courses={coursesByLevel[level]} />
          ))}
        </div>
      ))}
    </div>
  );
}
