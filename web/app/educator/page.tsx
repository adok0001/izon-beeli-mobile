"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { BookText, CheckCircle2, ClipboardList, Clock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface EducatorStats {
  dictionaryEntries: number;
  pendingContributions: number;
  approvedContributions: number;
  pendingLessons: number;
}

interface EducatorMe {
  name: string;
  isAdmin: boolean;
  reviewerLanguages: string[];
  languages: { id: string; name: string; nativeName: string }[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: Readonly<{
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  href?: string;
}>) {
  const inner = (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 ${href ? "hover:border-brand-300 dark:hover:border-brand-700 transition-colors cursor-pointer" : ""}`}>
      <div className={`inline-flex p-2 rounded-lg mb-3 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value.toLocaleString()}</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function EducatorOverviewPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const { data: me } = useQuery<EducatorMe>({
    queryKey: ["educator", "me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorMe>("/educator/me", { token: token ?? undefined });
    },
  });

  const { data: stats } = useQuery<EducatorStats>({
    queryKey: ["educator", "stats"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorStats>("/educator/stats", { token: token ?? undefined });
    },
  });

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
          {t("educator.overview.welcome", { name: me?.name ?? "…" })}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {me?.isAdmin
            ? t("educator.overview.scopeAdmin")
            : t("educator.overview.scopeLangs", {
                languages: me?.languages.map((l) => l.name).join(", ") ?? "…",
              })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t("educator.stats.pendingContributions")}
          value={stats?.pendingContributions ?? 0}
          icon={Clock}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          href="/educator/review"
        />
        <StatCard
          label={t("educator.stats.pendingLessons")}
          value={stats?.pendingLessons ?? 0}
          icon={ClipboardList}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          href="/educator/review"
        />
        <StatCard
          label={t("educator.stats.approvedContributions")}
          value={stats?.approvedContributions ?? 0}
          icon={CheckCircle2}
          color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label={t("educator.stats.dictionaryEntries")}
          value={stats?.dictionaryEntries ?? 0}
          icon={BookText}
          color="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
          href="/educator/dictionary"
        />
      </div>

      {/* Language scope */}
      {me && !me.isAdmin && me.languages.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            {t("educator.overview.assignedLanguages")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {me.languages.map((lang) => (
              <span
                key={lang.id}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
              >
                {lang.name}
                <span className="ml-1.5 text-brand-400 dark:text-brand-500 text-xs">
                  ({lang.nativeName})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
