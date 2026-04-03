"use client";

import { apiFetch } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Comment, FeedItem } from "@/types";
import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import Image from "next/image";
import Link from "next/link";
import {
    CheckCircle2,
    Globe2,
    Heart,
    MessageCircle,
    Mic,
    Trophy,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

function SignInModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-neutral-900 dark:text-white">{t("common.signInToInteract")}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          {t("common.signInFeedDesc")}
        </p>
        <div className="flex flex-col gap-3">
          <SignInButton mode="redirect">
            <button className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
              {t("common.signIn")}
            </button>
          </SignInButton>
          <Link
            href="/sign-up"
            onClick={onClose}
            className="block w-full py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 text-center hover:border-brand-400 transition-colors"
          >
            {t("common.createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}

type FilterType = FeedItem["type"] | "all";

function getTypeConfig(t: TFunction) {
  return {
    lesson_completed: {
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      label: t("feed.typeLesson"),
    },
    achievement: {
      icon: Trophy,
      color: "text-amber-600 dark:text-amber-400",
      label: t("feed.typeAchievement"),
    },
    contribution: {
      icon: Mic,
      color: "text-blue-600 dark:text-blue-400",
      label: t("feed.typeContribution"),
    },
    community: {
      icon: Globe2,
      color: "text-purple-600 dark:text-purple-400",
      label: t("feed.typeCommunity"),
    },
  } satisfies Record<FeedItem["type"], { icon: LucideIcon; color: string; label: string }>;
}

function FeedCard({ item, onSignInRequired }: Readonly<{ item: FeedItem; onSignInRequired: () => void }>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const qc = useQueryClient();
  const cfg = getTypeConfig(t)[item.type];
  const TypeIcon = cfg.icon;
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
            <Image src={item.userAvatarUrl} alt={item.userName} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            item.userName?.[0]?.toUpperCase() ?? "?"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-neutral-900 dark:text-white">
              {item.userName}
            </span>
            <span className={cn("text-xs font-medium flex items-center gap-1", cfg.color)}>
              <TypeIcon className="h-3.5 w-3.5" />
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
          onClick={() => isSignedIn ? toggleLike.mutate() : onSignInRequired()}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-500 transition-colors"
        >
          <Heart className="h-4 w-4" /> <span>{item.likes}</span>
        </button>
        <button
          onClick={() => isSignedIn ? setShowComments(!showComments) : onSignInRequired()}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-500 transition-colors"
        >
          <MessageCircle className="h-4 w-4" /> <span>{item.comments}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <span className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs shrink-0">
                {c.userName?.[0]?.toUpperCase() ?? "?"}
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
              placeholder={t("feed.addComment")}
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
              {t("common.post")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>("all");
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: t("feed.filterAll") },
    { value: "lesson_completed", label: t("feed.filterLessons") },
    { value: "achievement", label: t("feed.filterAchievements") },
    { value: "contribution", label: t("feed.filterContributions") },
  ];

  const { data: items = [], isLoading } = useQuery<FeedItem[]>({
    queryKey: ["feed", filter],
    queryFn: async () => {
      const token = await getToken();
      const q = filter === "all" ? "" : `?type=${filter}`;
      const res = await apiFetch<{ items: FeedItem[] }>(`/feed${q}`, { token: token ?? undefined });
      return res.items;
    },
  });

  let feedContent: React.ReactNode;

  if (isLoading) {
    const loadingCards = ["feed-skeleton-1", "feed-skeleton-2", "feed-skeleton-3", "feed-skeleton-4"];
    feedContent = (
      <div className="space-y-4">
        {loadingCards.map((cardKey) => (
          <div key={cardKey} className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  } else if (items.length === 0) {
    feedContent = (
      <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
        <Globe2 className="mx-auto mb-3 h-10 w-10" />
        <p className="font-medium">{t("feed.emptyTitle")}</p>
        <p className="text-sm mt-1">{t("feed.emptyDescription")}</p>
      </div>
    );
  } else {
    feedContent = (
      <div className="space-y-4">
        {items.map((item) => (
          <FeedCard key={item.id} item={item} onSignInRequired={() => setSignInModalOpen(true)} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("feed.title")}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          {t("feed.subtitle")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {filters.map(({ value, label }) => (
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

      {feedContent}
      {signInModalOpen && <SignInModal onClose={() => setSignInModalOpen(false)} />}
    </div>
  );
}
