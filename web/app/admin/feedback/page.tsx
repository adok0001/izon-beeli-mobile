"use client";

import { apiFetch } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bug, Lightbulb, MessageSquare, Monitor, MoreHorizontal, Search, Smartphone, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FeedbackItem {
  id: string;
  category: "bug" | "suggestion" | "other";
  message: string;
  platform: string | null;
  osVersion: string | null;
  appVersion: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

const CATEGORY_CONFIG = {
  bug: {
    icon: Bug,
    color: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
    border: "border-red-100 dark:border-red-900/30",
    label: "Bug",
  },
  suggestion: {
    icon: Lightbulb,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/30",
    label: "Suggestion",
  },
  other: {
    icon: MoreHorizontal,
    color: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400",
    border: "border-neutral-200 dark:border-neutral-700",
    label: "Other",
  },
} as const;

function PlatformBadge({ platform }: Readonly<{ platform: string | null }>) {
  if (!platform) return null;
  const isWeb = platform === "web";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
      {isWeb ? <Monitor className="h-2.5 w-2.5" /> : <Smartphone className="h-2.5 w-2.5" />}
      {platform}
    </span>
  );
}

export default function AdminFeedbackPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "bug" | "suggestion" | "other">("all");

  const { data: items = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["admin", "feedback"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<FeedbackItem[]>("/feedback/admin?limit=200", { token: token ?? undefined });
    },
    staleTime: 30_000,
  });

  const deleteFeedback = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/feedback/admin/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const bugs = items.filter((i) => i.category === "bug");
  const suggestions = items.filter((i) => i.category === "suggestion");
  const other = items.filter((i) => i.category === "other");

  const q = search.trim().toLowerCase();
  const visible = items.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (!q) return true;
    return (
      item.message.toLowerCase().includes(q) ||
      (item.userName?.toLowerCase().includes(q) ?? false) ||
      (item.userEmail?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
          {t("admin.feedback.title")}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("admin.feedback.subtitle", { count: items.length })}
        </p>
      </div>

      {/* Summary pills — also act as category filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
            categoryFilter === "all"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
              : "text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400"
          }`}
        >
          {t("admin.feedback.filterAll")} · {items.length}
        </button>
        {(["bug", "suggestion", "other"] as const).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const Icon = cfg.icon;
          const catCounts: Record<string, number> = { bug: bugs.length, suggestion: suggestions.length, other: other.length };
          const count = catCounts[cat] ?? 0;
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(active ? "all" : cat)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                active ? cfg.color + " " + cfg.border + " ring-2 ring-offset-1 ring-current" : cfg.color + " " + cfg.border + " opacity-70 hover:opacity-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.feedback.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && visible.length === 0 && (
        <div className="text-center py-20 text-neutral-400 dark:text-neutral-500">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{items.length === 0 ? t("admin.feedback.empty") : t("admin.feedback.noResults")}</p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((item) => {
          const cfg = CATEGORY_CONFIG[item.category];
          const Icon = cfg.icon;
          const isDeleting = deleteFeedback.isPending && deleteFeedback.variables === item.id;
          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-neutral-900 rounded-xl border ${cfg.border} p-4 transition-opacity ${isDeleting ? "opacity-40" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color} px-0 bg-transparent border-0`}>
                      {cfg.label}
                    </span>
                    {item.userName && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item.userName}
                        {item.userEmail && (
                          <span className="text-neutral-400 dark:text-neutral-500"> · {item.userEmail}</span>
                        )}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                    {item.message}
                  </p>
                  {(item.platform || item.appVersion || item.osVersion) && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <PlatformBadge platform={item.platform} />
                      {item.appVersion && (
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          v{item.appVersion}
                        </span>
                      )}
                      {item.osVersion && (
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          OS {item.osVersion}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (globalThis.confirm(t("admin.feedback.confirmDelete"))) {
                      deleteFeedback.mutate(item.id);
                    }
                  }}
                  disabled={deleteFeedback.isPending}
                  className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={t("admin.feedback.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
