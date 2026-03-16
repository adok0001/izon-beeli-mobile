"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface Contribution {
  id: string;
  word: string;
  english: string;
  category: string;
  languageId: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  pronunciation: string | null;
  reviewNote: string | null;
  xpAwarded: number | null;
  bountyXpAwarded: number | null;
  createdAt: string;
}

const STATUS_CONFIG = {
  submitted: { label: "myContributions.statusPending", cls: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" },
  approved: { label: "myContributions.statusApproved", cls: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" },
  rejected: { label: "myContributions.statusRejected", cls: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" },
  draft: { label: "common.save", cls: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400" },
} as const;

export default function MyContributionsPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const { data: contributions = [], isLoading } = useQuery<Contribution[]>({
    queryKey: ["my-contributions"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/contributions", { token: token ?? undefined });
    },
  });

  const approvedCount = contributions.filter((c) => c.status === "approved").length;
  const pendingCount = contributions.filter((c) => c.status === "submitted").length;
  const totalXp = contributions.reduce((sum, c) => sum + (c.xpAwarded ?? 0) + (c.bountyXpAwarded ?? 0), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {t("myContributions.title")}
          </h1>
        </div>
        <Link
          href="/contribute"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + {t("contribute.title")}
        </Link>
      </div>

      {/* Stats */}
      {contributions.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { value: approvedCount, label: t("myContributions.approvedLabel"), cls: "text-green-600 dark:text-green-400" },
            { value: pendingCount, label: t("myContributions.pendingLabel"), cls: "text-amber-600 dark:text-amber-400" },
            { value: contributions.length, label: t("myContributions.totalLabel"), cls: "text-neutral-700 dark:text-neutral-300" },
            ...(totalXp > 0 ? [{ value: totalXp, label: t("myContributions.xpEarned"), cls: "text-blue-600 dark:text-blue-400" }] : []),
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center"
            >
              <p className={cn("text-2xl font-bold", stat.cls)}>{stat.value}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : contributions.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-neutral-400 dark:text-neutral-500">
          <FileText className="mb-3 h-10 w-10" />
          <p className="font-medium">{t("myContributions.noContributions")}</p>
          <p className="text-sm mt-1 text-center max-w-xs">{t("myContributions.submitMore")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
          {contributions.map((item) => {
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.submitted;
            return (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {item.word}
                      {item.english && (
                        <span className="font-normal text-neutral-500 dark:text-neutral-400"> → {item.english}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                        {item.languageId}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusCfg.cls)}>
                      {t(statusCfg.label as Parameters<typeof t>[0])}
                    </span>
                    {item.status === "approved" && (
                      <div className="flex gap-1">
                        {item.xpAwarded != null && item.xpAwarded > 0 && (
                          <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                            +{item.xpAwarded} XP
                          </span>
                        )}
                        {item.bountyXpAwarded != null && item.bountyXpAwarded > 0 && (
                          <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                            +{item.bountyXpAwarded} {t("myContributions.bountyLabel")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {item.status === "rejected" && item.reviewNote && (
                  <div className="mt-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-400 dark:text-red-500">
                      {t("myContributions.reviewerNote")}
                    </p>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{item.reviewNote}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
