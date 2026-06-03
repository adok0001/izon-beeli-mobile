"use client";

import { apiFetch } from "@/lib/api";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguageStore } from "@/store/language-store";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { LANGUAGES } from "@mobile/lib/data/languages";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface Bounty {
  id: string;
  title: string;
  description: string;
  languageId: string;
  category?: string | null;
  contributionType?: string | null;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  progressPercent: number;
  createdByName?: string | null;
  expiresAt?: string | null;
}

function BountyCard({ bounty }: Readonly<{ bounty: Bounty }>) {
  const { t } = useTranslation();
  const langName = LANGUAGES.find((l) => l.id === bounty.languageId)?.name ?? bounty.languageId;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-xs font-semibold text-brand-700 dark:text-brand-300">
            {langName}
          </span>
          {bounty.category && (
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 capitalize">
              {bounty.category}
            </span>
          )}
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-xs font-bold text-amber-700 dark:text-amber-300">
          +{bounty.xpReward} XP
        </span>
      </div>

      <h3 className="font-bold text-neutral-900 dark:text-white mb-1">{bounty.title}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">{bounty.description}</p>

      {bounty.createdByName && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3">
          {t("bounties.createdBy", { name: bounty.createdByName })}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
          <span>{bounty.currentCount} / {bounty.targetCount}</span>
          <span className="font-semibold">{bounty.progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${bounty.progressPercent}%` }}
          />
        </div>
      </div>

      <Link
        href={`/contribute?languageId=${bounty.languageId}${bounty.category ? `&category=${bounty.category}` : ""}`}
        className="block w-full text-center py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
      >
        {t("bounties.contribute")}
      </Link>
    </div>
  );
}

export default function BountiesPage() {
  const { t } = useTranslation();
  const { selectedLanguageId, setLanguage } = useLanguageStore();

  const { data: bounties = [], isLoading } = useQuery<Bounty[]>({
    queryKey: ["bounties", selectedLanguageId],
    queryFn: () => apiFetch<Bounty[]>(`/bounties?languageId=${selectedLanguageId}`),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-px bg-amber-500/50" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-amber-500/70 font-semibold">Earn XP</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_-6px_rgb(245_158_11_/0.4)]">
            <Star className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white">
              {t("bounties.title")}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("bounties.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Language filter */}
      <div className="mb-6">
        <LanguageSelector
          value={selectedLanguageId}
          onChange={setLanguage}
          allowCustom={false}
          className="w-52"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bounties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <Star className="h-7 w-7 text-amber-400" />
          </div>
          <p className="font-semibold text-neutral-500 dark:text-neutral-400">
            {t("bounties.noActive")}
          </p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
            {t("bounties.noActiveDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </div>
  );
}
