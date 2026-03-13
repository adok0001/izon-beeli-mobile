"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { FeedItem, Comment } from "@/types";

const TYPE_CONFIG: Record<
  FeedItem["type"],
  { emoji: string; color: string; label: string }
> = {
  lesson_completed: { emoji: "✅", color: "text-green-600 dark:text-green-400", label: "Lesson" },
  achievement: { emoji: "🏆", color: "text-amber-600 dark:text-amber-400", label: "Achievement" },
  contribution: { emoji: "🎤", color: "text-blue-600 dark:text-blue-400", label: "Contribution" },
  community: { emoji: "🌍", color: "text-purple-600 dark:text-purple-400", label: "Community" },
};

type FilterType = FeedItem["type"] | "all";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lesson_completed", label: "Lessons" },
  { value: "achievement", label: "Achievements" },
  { value: "contribution", label: "Contributions" },
];

function FeedCard({ item }: { item: FeedItem }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const cfg = TYPE_CONFIG[item.type];
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", item.id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Comment[]>(`/feed/${item.id}/comments`, { token: token ?? undefined });
    },
    enabled: showComments,
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/feed/${item.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: commentText }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", item.id] });
      setCommentText("");
    },
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/feed/${item.id}/like`, { method: "POST", token: token ?? undefined });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden shrink-0 flex items-center justify-center text-lg">
          {item.userAvatarUrl ? (
            <img src={item.userAvatarUrl} alt={item.userName} className="w-full h-full object-cover" />
          ) : (
            item.userName[0]?.toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-neutral-900 dark:text-white">
              {item.userName}
            </span>
            <span className={cn("text-xs font-medium flex items-center gap-1", cfg.color)}>
              <span>{cfg.emoji}</span>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            {formatRelativeTime(item.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="font-medium text-neutral-900 dark:text-white text-sm">{item.title}</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{item.description}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => toggleLike.mutate()}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-500 transition-colors"
        >
          ❤️ <span>{item.likes}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-500 transition-colors"
        >
          💬 <span>{item.comments}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <span className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs shrink-0">
                {c.userName[0]?.toUpperCase()}
              </span>
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {c.userName}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{c.text}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && commentText.trim()) addComment.mutate();
              }}
            />
            <button
              onClick={() => addComment.mutate()}
              disabled={!commentText.trim() || addComment.isPending}
              className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const { getToken } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: items = [], isLoading } = useQuery<FeedItem[]>({
    queryKey: ["feed", filter],
    queryFn: async () => {
      const token = await getToken();
      const q = filter !== "all" ? `?type=${filter}` : "";
      return apiFetch<FeedItem[]>(`/feed${q}`, { token: token ?? undefined });
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Community</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          See what others are learning
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              filter === value
                ? "bg-brand-600 text-white border-brand-600"
                : "border-neutral-200 text-neutral-600 hover:border-brand-400 dark:border-neutral-700 dark:text-neutral-400"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <p className="text-4xl mb-3">🌍</p>
          <p className="font-medium">Nothing here yet</p>
          <p className="text-sm mt-1">Complete a lesson to see activity.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
