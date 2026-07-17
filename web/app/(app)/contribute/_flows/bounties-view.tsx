"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Bounty, BountyTarget } from "../_components/shared";

export function BountiesView({ onContribute }: Readonly<{ onContribute: (target: BountyTarget) => void }>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const { data: bounties = [], isLoading } = useQuery<Bounty[]>({
    queryKey: ["bounties"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Bounty[]>("/bounties", { token: token ?? undefined });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (bounties.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
        <Gift className="mx-auto mb-3 h-10 w-10" />
        <p className="font-medium">{t("contribute.noBounties")}</p>
        <p className="text-sm mt-1">{t("contribute.noBountiesDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bounties.map((bounty) => (
        <div
          key={bounty.id}
          className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">{bounty.title}</h3>
              {bounty.description && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{bounty.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-neutral-400 capitalize">{bounty.languageId}</span>
                {bounty.category && (
                  <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full px-2 py-0.5 capitalize">{bounty.category}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">+{bounty.reward} XP</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>{t("contribute.progress")}</span>
              <span>{bounty.progressPercent}%</span>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(bounty.progressPercent, 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onContribute({ id: bounty.id, languageId: bounty.languageId, category: bounty.category ?? undefined })}
            className="w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            {t("contribute.contributeWord")}
          </button>
        </div>
      ))}
    </div>
  );
}
