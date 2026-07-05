"use client";

import { ApiError, apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Flame,
  Loader2,
  RotateCcw,
  Snowflake,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

type LastActive = "today" | "yesterday" | "stale" | "clear";

interface StreakBody {
  streak: number;
  lastActive: LastActive;
  freezes?: number;
  userId?: string;
}

interface SetStreakResult {
  userId: string;
  streak: number;
  lastActiveDate: string | null;
  freezeCount: number;
}

interface Scenario {
  key: string;
  Icon: LucideIcon;
  /** Tailwind text color class for the icon. */
  color: string;
  /**
   * Explicit left-rule class. Kept as a literal (not derived from `color`) so
   * Tailwind's JIT scanner sees it in source and doesn't purge it.
   */
  rule: string;
  label: string;
  detail: string;
  body: StreakBody;
}

// Each preset maps to the server's set-streak knobs. "yesterday" leaves the
// streak primed so the next lesson increments it; "stale" simulates a missed
// day (the broken-streak path); "clear" wipes lastActiveDate entirely.
const SCENARIOS: Scenario[] = [
  {
    key: "milestone-7",
    Icon: Flame,
    color: "text-orange-500",
    rule: "border-l-orange-500",
    label: "Prime 7-day milestone",
    detail: "Streak 6 + active yesterday → next lesson hits 7",
    body: { streak: 6, lastActive: "yesterday" },
  },
  {
    key: "milestone-14",
    Icon: Flame,
    color: "text-orange-500",
    rule: "border-l-orange-500",
    label: "Prime 14-day milestone",
    detail: "Streak 13 + active yesterday → next lesson hits 14",
    body: { streak: 13, lastActive: "yesterday" },
  },
  {
    key: "milestone-21",
    Icon: Trophy,
    color: "text-amber-500",
    rule: "border-l-amber-500",
    label: "Prime 21-day milestone",
    detail: "Streak 20 + active yesterday → next lesson hits 21",
    body: { streak: 20, lastActive: "yesterday" },
  },
  {
    key: "milestone-30",
    Icon: Trophy,
    color: "text-amber-500",
    rule: "border-l-amber-500",
    label: "Prime 30-day milestone",
    detail: "Streak 29 + active yesterday → next lesson hits 30",
    body: { streak: 29, lastActive: "yesterday" },
  },
  {
    key: "milestone-50",
    Icon: Star,
    color: "text-teal-500",
    rule: "border-l-teal-500",
    label: "Prime 50-day milestone",
    detail: "Streak 49 + active yesterday → next lesson hits 50",
    body: { streak: 49, lastActive: "yesterday" },
  },
  {
    key: "milestone-100",
    Icon: Crown,
    color: "text-fuchsia-500",
    rule: "border-l-fuchsia-500",
    label: "Prime 100-day milestone",
    detail: "Streak 99 + active yesterday → next lesson hits 100",
    body: { streak: 99, lastActive: "yesterday" },
  },
  {
    key: "broken",
    Icon: AlertTriangle,
    color: "text-rose-500",
    rule: "border-l-rose-500",
    label: "Break the streak",
    detail: "Streak 10, last active 3 days ago → broken-streak UI",
    body: { streak: 10, lastActive: "stale" },
  },
  {
    key: "broken-with-freeze",
    Icon: Snowflake,
    color: "text-sky-500",
    rule: "border-l-sky-500",
    label: "Break streak + grant freeze",
    detail: "Broken streak with 1 freeze available to spend",
    body: { streak: 10, lastActive: "stale", freezes: 1 },
  },
  {
    key: "reset",
    Icon: RotateCcw,
    color: "text-purple-500",
    rule: "border-l-purple-500",
    label: "Reset to zero",
    detail: "Streak 0, freezes 0, last active cleared",
    body: { streak: 0, lastActive: "clear", freezes: 0 },
  },
];

const LAST_ACTIVE_OPTIONS: { value: LastActive; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "stale", label: "Stale (3 days ago)" },
  { value: "clear", label: "Clear" },
];

const labelCls =
  "block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-2";

const inputCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

function errorDetail(err: unknown): string {
  // 404 almost always means the API build lacks this route (not deployed yet).
  if (err instanceof ApiError && err.status === 404) {
    return "Endpoint not found — this build of the API may not be deployed yet.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export default function StreakToolsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [customStreak, setCustomStreak] = useState(0);
  const [customFreezes, setCustomFreezes] = useState(0);
  const [customLastActive, setCustomLastActive] = useState<LastActive>("yesterday");
  const [customUserId, setCustomUserId] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const mutation = useMutation<SetStreakResult, unknown, StreakBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      return apiFetch<SetStreakResult>("/progress/admin/set-streak", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
    onSettled: () => setPendingKey(null),
  });

  function apply(body: StreakBody, key: string) {
    const withUser: StreakBody = customUserId.trim()
      ? { ...body, userId: customUserId.trim() }
      : body;
    setPendingKey(key);
    mutation.mutate(withUser);
  }

  const result = mutation.data;
  const busy = pendingKey !== null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          Streak Tools
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Override a user&apos;s streak to test milestones, the celebration modal, and the
          broken-streak / freeze flows without waiting real days.
        </p>
      </div>

      {/* Result banners */}
      {mutation.isSuccess && result && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm text-emerald-800 dark:text-emerald-300">
            <p className="font-semibold">Streak updated</p>
            <p className="mt-0.5">
              Streak {result.streak} · freezes {result.freezeCount} · last active{" "}
              {result.lastActiveDate ?? "cleared"}.
            </p>
          </div>
        </div>
      )}
      {mutation.isError && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <p className="font-semibold">Could not update streak</p>
            <p className="mt-0.5">{errorDetail(mutation.error)}</p>
          </div>
        </div>
      )}

      {/* ── Custom override ─────────────────────────────────────────── */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
        Custom Override
      </h2>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-5">
        <div>
          <label className={labelCls} htmlFor="streak-days">
            Streak days
          </label>
          <input
            id="streak-days"
            type="number"
            min={0}
            max={9999}
            value={customStreak}
            onChange={(e) => setCustomStreak(Math.max(0, Number(e.target.value) || 0))}
            className={inputCls}
          />
        </div>

        <div>
          <span className={labelCls}>Last active</span>
          <div className="flex flex-wrap gap-2">
            {LAST_ACTIVE_OPTIONS.map(({ value, label }) => {
              const active = customLastActive === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCustomLastActive(value)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                    active
                      ? "bg-brand-600 text-white border-brand-600"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-brand-400"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="freeze-count">
            Freeze count
          </label>
          <input
            id="freeze-count"
            type="number"
            min={0}
            max={9999}
            value={customFreezes}
            onChange={(e) => setCustomFreezes(Math.max(0, Number(e.target.value) || 0))}
            className={inputCls}
          />
          <p className="mt-1.5 text-[11px] text-neutral-400">
            Set to 0 or higher — always applied
          </p>
        </div>

        <div>
          <label className={labelCls} htmlFor="user-id">
            User ID
          </label>
          <input
            id="user-id"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={customUserId}
            onChange={(e) => setCustomUserId(e.target.value)}
            placeholder="Leave blank to apply to yourself"
            className={inputCls}
          />
          <p className="mt-1.5 text-[11px] text-neutral-400">
            Applies to your own account when blank. Also used by presets below.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            apply(
              {
                streak: customStreak,
                lastActive: customLastActive,
                freezes: customFreezes,
              },
              "custom"
            )
          }
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {pendingKey === "custom" && <Loader2 className="h-4 w-4 animate-spin" />}
          Apply
        </button>
      </div>

      {/* ── Presets ─────────────────────────────────────────────────── */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-8 mb-4">
        Presets
      </h2>

      <div className="space-y-2.5">
        {SCENARIOS.map(({ key, Icon, color, rule, label, detail, body }) => {
          const active = pendingKey === key;
          return (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => apply(body, key)}
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl border border-l-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60 disabled:cursor-not-allowed",
                busy && !active && "opacity-50",
                rule
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                {active ? (
                  <Loader2 className={cn("h-4.5 w-4.5 animate-spin", color)} />
                ) : (
                  <Icon className={cn("h-[18px] w-[18px]", color)} />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-neutral-900 dark:text-white">
                  {label}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                  {detail}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
