"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Crown, Flame, Medal, Star, Trophy } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatarUrl?: string | null;
  points: number;
  streak: number;
  selectedLanguageId?: string | null;
  isCurrentUser: boolean;
}

const RANK_STYLES: Record<number, { bg: string; text: string; icon: React.ReactNode }> = {
  1: {
    bg: "bg-amber-50 dark:bg-amber-900/25 border-amber-300 dark:border-amber-700 shadow-[0_0_20px_-6px_rgb(245_158_11_/0.4)]",
    text: "text-amber-700 dark:text-amber-300",
    icon: <Crown className="h-4 w-4 text-amber-500" />,
  },
  2: {
    bg: "bg-neutral-100 dark:bg-neutral-800/60 border-neutral-300 dark:border-neutral-700",
    text: "text-neutral-600 dark:text-neutral-300",
    icon: <Medal className="h-4 w-4 text-neutral-400" />,
  },
  3: {
    bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-400",
    icon: <Medal className="h-4 w-4 text-orange-400" />,
  },
};

function RankBadge({ rank }: Readonly<{ rank: number }>) {
  if (rank <= 3) {
    return (
      <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border", RANK_STYLES[rank]?.bg, RANK_STYLES[rank]?.text)}>
        {rank}
      </span>
    );
  }
  return (
    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800">
      {rank}
    </span>
  );
}

function Avatar({ name, avatarUrl }: Readonly<{ name: string; avatarUrl?: string | null }>) {
  if (avatarUrl) {
    return <Image src={avatarUrl} alt={name} width={36} height={36} className="rounded-full object-cover" />;
  }
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 text-sm font-bold">
      {initials}
    </div>
  );
}

export default function LeaderboardPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<LeaderboardEntry[]>("/users/leaderboard", { token: token ?? undefined });
    },
    staleTime: 60_000,
  });

  // Split out current user if they're outside the top display
  const topEntries = data?.filter((e) => e.rank <= 50 && e.rank >= 1).slice(0, 50) ?? [];
  const currentUserEntry = data?.find((e) => e.isCurrentUser);
  const currentUserInTop = topEntries.some((e) => e.isCurrentUser);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-px bg-amber-500/50" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-amber-500/70 font-semibold">Hall of Fame</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_-6px_rgb(245_158_11_/0.4)]">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white">{t("leaderboard.title")}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("leaderboard.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Top 3 podium */}
      {!isLoading && topEntries.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-8">
          {/* 2nd */}
          {[1, 0, 2].map((podiumIndex) => {
            const entry = topEntries[podiumIndex];
            if (!entry) return null;
            const heights = ["h-20", "h-28", "h-16"];
            const isFirst = podiumIndex === 0;
            return (
              <div key={entry.id} className={cn("flex flex-col items-center gap-2", isFirst && "order-first md:order-none")}>
                <Avatar name={entry.name} avatarUrl={entry.avatarUrl} />
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 max-w-16 truncate text-center">{entry.name}</p>
                <div className={cn("w-16 rounded-t-lg flex items-center justify-center", heights[podiumIndex],
                  podiumIndex === 0 ? "bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_24px_-6px_rgb(245_158_11_/0.6)]" :
                  podiumIndex === 1 ? "bg-gradient-to-t from-neutral-500 to-neutral-400 dark:from-neutral-600 dark:to-neutral-500" :
                  "bg-gradient-to-t from-orange-500 to-orange-400")}>
                  <span className="text-white font-bold text-lg">{entry.rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {isLoading && Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}

        {!isLoading && topEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("leaderboard.empty")}</p>
          </div>
        )}

        {topEntries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-colors",
              entry.isCurrentUser
                ? "bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800/50 shadow-[0_0_16px_-6px_rgb(245_158_11_/0.3)]"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            )}
          >
            <RankBadge rank={entry.rank} />
            <Avatar name={entry.name} avatarUrl={entry.avatarUrl} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={cn("font-semibold text-sm truncate", entry.isCurrentUser ? "text-amber-700 dark:text-amber-300" : "text-neutral-900 dark:text-neutral-100")}>
                  {entry.name}
                </p>
                {entry.isCurrentUser && (
                  <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">{t("leaderboard.you")}</span>
                )}
                {entry.rank <= 3 && RANK_STYLES[entry.rank]?.icon}
              </div>
              {entry.selectedLanguageId && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{entry.selectedLanguageId}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {entry.streak > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">{entry.streak}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Star className="h-3.5 w-3.5" />
                <span className="text-sm font-bold tabular-nums">{entry.points.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Current user if outside top 50 */}
        {!isLoading && currentUserEntry && !currentUserInTop && (
          <>
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-700" />
              <p className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0">{t("leaderboard.yourRank")}</p>
              <div className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-700" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800">
              <RankBadge rank={currentUserEntry.rank} />
              <Avatar name={currentUserEntry.name} avatarUrl={currentUserEntry.avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-brand-700 dark:text-brand-300 truncate">{currentUserEntry.name}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {currentUserEntry.streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">{currentUserEntry.streak}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5" />
                  <span className="text-sm font-bold tabular-nums">{currentUserEntry.points.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
