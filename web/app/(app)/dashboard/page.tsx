"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DailyChallenge, DashboardStats, StreakCalendar } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Flame,
  Star,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface ProgressSummary {
  streak: number;
  points: number;
  lessonsCompleted: number;
  level?: number;
  xp?: number;
  xpForNextLevel?: number;
}

// ── Weekly Activity Bar Chart ─────────────────────────────────────────────────

function WeeklyChart({ stats }: Readonly<{ stats: DashboardStats }>) {
  const { t } = useTranslation();
  const days = stats.weeklyActivity;
  const maxLessons = Math.max(...days.map((d) => d.lessonsCompleted), 1);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="h-4 w-4 text-brand-500" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t("dashboard.weeklyActivity")}
        </h3>
      </div>
      <div className="flex items-end gap-2 h-24">
        {days.map((day) => {
          const heightPct = maxLessons > 0 ? (day.lessonsCompleted / maxLessons) * 100 : 0;
          const label = new Date(day.date + "T12:00:00").toLocaleDateString(undefined, {
            weekday: "short",
          });
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                <div
                  className="w-full rounded-t-md bg-brand-500 dark:bg-brand-400 transition-all min-h-[3px]"
                  style={{ height: `${Math.max(heightPct, 3)}%` }}
                  title={`${day.lessonsCompleted} lessons`}
                />
              </div>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <span>{t("dashboard.lessonsThisWeek", { count: stats.totalLessonsThisWeek })}</span>
        {stats.avgQuizAccuracyThisWeek !== null && (
          <span>{t("dashboard.avgQuizAccuracy", { pct: stats.avgQuizAccuracyThisWeek })}</span>
        )}
      </div>
    </div>
  );
}

// ── Streak Calendar ───────────────────────────────────────────────────────────

function StreakCalendarGrid({ activeDays }: Readonly<{ activeDays: string[] }>) {
  const { t } = useTranslation();
  const activeSet = new Set(activeDays);

  // Build last 30 days
  const today = new Date();
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-4 w-4 text-brand-500" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t("dashboard.streakCalendar")}
        </h3>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {days.map((day) => {
          const isToday = day === today.toISOString().slice(0, 10);
          const active = activeSet.has(day);
          return (
            <div
              key={day}
              title={day}
              className={cn(
                "aspect-square rounded-sm",
                active
                  ? "bg-brand-500 dark:bg-brand-400"
                  : "bg-neutral-100 dark:bg-neutral-800",
                isToday && "ring-2 ring-brand-400 dark:ring-brand-500"
              )}
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
        {t("dashboard.last30Days")}
      </p>
    </div>
  );
}

// ── Daily Challenge Card ──────────────────────────────────────────────────────

function ChallengePill({ challenge }: Readonly<{ challenge: DailyChallenge }>) {
  const pct = Math.min((challenge.progress / challenge.target) * 100, 100);
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {challenge.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <Target className="h-4 w-4 text-brand-500 shrink-0" />
            )}
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
              {challenge.title}
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
            {challenge.description}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 shrink-0">
          <Zap className="h-3.5 w-3.5" />
          +{challenge.xpReward} XP
        </div>
      </div>
      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            challenge.completed ? "bg-green-500" : "bg-brand-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 text-right">
        {challenge.progress}/{challenge.target}
      </p>
    </div>
  );
}

// ── Summary Stat Card ─────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: Readonly<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}>) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">{value}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const { data: summary } = useQuery<ProgressSummary>({
    queryKey: ["progress", "summary"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ProgressSummary>("/progress/summary", { token: token ?? undefined });
    },
  });

  const { data: weeklyStats, isLoading: loadingWeekly } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "weekly-stats"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DashboardStats>("/dashboard/weekly-stats", { token: token ?? undefined });
    },
  });

  const { data: streakCalendar } = useQuery<StreakCalendar>({
    queryKey: ["dashboard", "streak-calendar"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<StreakCalendar>("/dashboard/streak-calendar", { token: token ?? undefined });
    },
  });

  const { data: challenges = [], isLoading: loadingChallenges } = useQuery<DailyChallenge[]>({
    queryKey: ["daily-challenges", "today"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DailyChallenge[]>("/daily-challenges/today", { token: token ?? undefined });
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {t("profile.progressDashboard")}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={Flame}
          label={t("profile.streak")}
          value={summary?.streak ?? 0}
          color="text-orange-500 bg-orange-50 dark:bg-orange-900/20"
        />
        <SummaryCard
          icon={Star}
          label={t("profile.points")}
          value={(summary?.points ?? 0).toLocaleString()}
          color="text-brand-500 bg-brand-50 dark:bg-brand-900/20"
        />
        <SummaryCard
          icon={BookOpen}
          label={t("profile.lessons")}
          value={summary?.lessonsCompleted ?? 0}
          color="text-green-600 bg-green-50 dark:bg-green-900/20"
        />
      </div>

      {/* XP Progress bar */}
      {summary?.xp !== undefined && summary.xpForNextLevel !== undefined && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t("dashboard.level", { level: summary.level ?? 1 })}
              </span>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {summary.xp} / {summary.xpForNextLevel} XP
            </span>
          </div>
          <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-brand-500 rounded-full transition-all"
              style={{
                width: `${Math.min((summary.xp / summary.xpForNextLevel) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Weekly activity chart */}
      {(() => {
        if (loadingWeekly) return <div className="h-48 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />;
        if (weeklyStats) return <WeeklyChart stats={weeklyStats} />;
        return null;
      })()}

      {/* Streak calendar */}
      {streakCalendar && <StreakCalendarGrid activeDays={streakCalendar.activeDays} />}

      {/* Daily challenges */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-brand-500" />
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {t("dashboard.dailyChallenges")}
          </h2>
        </div>
        {(() => {
          if (loadingChallenges) {
            return (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                ))}
              </div>
            );
          }
          if (challenges.length === 0) {
            return (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 py-4">
                {t("dashboard.noChallenges")}
              </p>
            );
          }
          return (
            <div className="space-y-3">
              {challenges.map((c) => (
                <ChallengePill key={c.id} challenge={c} />
              ))}
            </div>
          );
        })()}
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/quiz"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <BrainCircuit className="h-4 w-4" />
          {t("quiz.title")}
        </Link>
        <Link
          href="/leaderboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          {t("leaderboard.title")}
        </Link>
      </div>
    </div>
  );
}
