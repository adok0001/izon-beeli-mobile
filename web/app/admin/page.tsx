"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  BookText,
  BrainCircuit,
  CircleCheck,
  ClipboardList,
  Library,
  MessageSquare,
  Mic,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdminStats {
  users: number;
  lessons: number;
  courses: number;
  contributions: number;
  pendingContributions: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  dictionaryEntries: number;
  feedbackReceived: number;
}

const STAT_CARDS: Array<{
  key: keyof AdminStats;
  labelKey: string;
  icon: React.ElementType;
  color: string;
}> = [
  { key: "users", labelKey: "admin.stats.totalUsers", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  { key: "courses", labelKey: "admin.stats.courses", icon: Library, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
  { key: "lessons", labelKey: "admin.stats.lessons", icon: BookOpen, color: "text-brand-600 bg-brand-50 dark:bg-brand-900/20" },
  { key: "dictionaryEntries", labelKey: "admin.stats.dictionaryEntries", icon: BookText, color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20" },
  { key: "contributions", labelKey: "admin.stats.contributions", icon: Mic, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
  { key: "pendingContributions", labelKey: "admin.stats.pendingReview", icon: ClipboardList, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" },
  { key: "lessonsCompleted", labelKey: "admin.stats.lessonsCompleted", icon: CircleCheck, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
  { key: "quizzesTaken", labelKey: "admin.stats.quizzesTaken", icon: BrainCircuit, color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20" },
  { key: "feedbackReceived", labelKey: "admin.stats.feedbackReceived", icon: MessageSquare, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20" },
];

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: Readonly<{
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}>) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-neutral-900 dark:text-white tabular-nums">
          {value.toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<AdminStats>("/admin/stats", { token: token ?? undefined });
    },
    staleTime: 30_000,
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">{t("admin.nav.overview")}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("admin.overview.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {STAT_CARDS.map(({ key, labelKey, icon, color }) => (
          <StatCard
            key={key}
            label={t(labelKey)}
            value={stats?.[key] ?? 0}
            icon={icon}
            color={color}
            loading={isLoading}
          />
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">{t("admin.overview.quickActions")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href="/admin/users"
            className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-brand-400 dark:hover:border-brand-600 transition-colors group"
          >
            <Users className="h-5 w-5 text-brand-500 group-hover:text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t("admin.overview.manageUsers")}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("admin.overview.manageUsersDesc")}</p>
            </div>
          </a>
          <a
            href="/admin/review"
            className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-brand-400 dark:hover:border-brand-600 transition-colors group"
          >
            <ClipboardList className="h-5 w-5 text-brand-500 group-hover:text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t("admin.overview.reviewContributions")}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("admin.overview.pending", { count: stats?.pendingContributions ?? 0 })}
              </p>
            </div>
          </a>
          <a
            href="/admin/courses"
            className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-brand-400 dark:hover:border-brand-600 transition-colors group"
          >
            <BookOpen className="h-5 w-5 text-brand-500 group-hover:text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t("admin.overview.manageCourses")}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {stats?.courses ?? 0} {t("admin.stats.courses").toLowerCase()} · {stats?.lessons ?? 0} {t("admin.stats.lessons").toLowerCase()}
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
