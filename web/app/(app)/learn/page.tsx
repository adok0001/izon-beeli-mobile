"use client";

import { JourneyPath } from "@/components/learn/journey-path";
import { EmptyState } from "@/components/ui/empty-state";
import { LanguageSelector } from "@/components/ui/language-selector";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/hooks/use-me";
import { useLanguageStore } from "@/store/language-store";
import type { Course } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bounty { id: string; title: string; xpReward: number; }
interface DueEntry { dictionaryEntryId: string; }

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


// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStep() {
  return (
    <li className="relative pl-14">
      <span className="absolute left-0 top-1 h-10 w-10 rounded-full border-2 border-neutral-200 dark:border-white/[0.08]" />
      <div className="rounded-2xl border border-neutral-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
        <div className="skeleton h-3 w-full rounded" />
      </div>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { getToken } = useAuth();
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const { data: me } = useMe();

  const { data: allCourses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["courses", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>(`/courses?languageId=${selectedLanguageId}`, { token: token ?? undefined });
    },
  });

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

      {isLoading ? (
        <div className="mx-auto max-w-4xl px-4">
          <ol className="space-y-3">
            {[1, 2, 3, 4].map((k) => <SkeletonStep key={k} />)}
          </ol>
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
        <JourneyPath courses={allCourses} />
      )}
    </div>
  );
}
