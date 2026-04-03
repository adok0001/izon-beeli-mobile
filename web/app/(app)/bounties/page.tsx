"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { id: "izon", name: "Izon" },
  { id: "akan", name: "Akan" },
  { id: "amharic", name: "Amharic" },
  { id: "yoruba", name: "Yoruba" },
  { id: "swahili", name: "Swahili" },
  { id: "hausa", name: "Hausa" },
  { id: "igbo", name: "Igbo" },
  { id: "oromo", name: "Oromo" },
];

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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
            {t("bounties.title")}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("bounties.subtitle")}
          </p>
        </div>
      </div>

      {/* Language filter */}
      <div className="overflow-x-auto scrollbar-hide mb-6">
        <div className="flex gap-2 pb-2 w-max">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
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
