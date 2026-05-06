"use client";

import { apiFetch } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface DueEntry {
  dictionaryEntryId: string;
  confidence: number;
  reviewCount: number;
  languageId: string;
}

interface DictEntry {
  id: string;
  word: string;
  english: string;
  pronunciation?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
}

type CardFace = "question" | "answer";

function ReviewCard({
  entry,
  onRate,
  isPending,
}: Readonly<{
  entry: DictEntry;
  onRate: (confidence: "easy" | "hard" | "again") => void;
  isPending: boolean;
}>) {
  const { t } = useTranslation();
  const [face, setFace] = useState<CardFace>("question");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); setFace((f) => (f === "question" ? "answer" : "question")); return; }
      if (face === "answer" && !isPending) {
        if (e.key === "1") onRate("again");
        if (e.key === "2") onRate("hard");
        if (e.key === "3") onRate("easy");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [face, isPending, onRate]);

  return (
    <div className="flex flex-col gap-4">
      {/* Flip card */}
      <button
        type="button"
        onClick={() => setFace((f) => (f === "question" ? "answer" : "question"))}
        className="min-h-64 w-full rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 flex flex-col items-center justify-center gap-3 hover:border-brand-300 dark:hover:border-brand-700 transition-colors cursor-pointer"
      >
        {face === "question" ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t("wordReview.translateToEnglish")}
            </p>
            <p className="text-4xl font-bold text-neutral-900 dark:text-white text-center">
              {entry.word}
            </p>
            {entry.pronunciation && (
              <p className="text-base text-neutral-500 dark:text-neutral-400 font-mono italic">
                /{entry.pronunciation}/
              </p>
            )}
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
              {t("wordReview.tapToReveal")}
              <span className="ml-2 hidden md:inline text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">Space</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t("wordReview.english")}
            </p>
            <p className="text-4xl font-bold text-neutral-900 dark:text-white text-center">
              {entry.english}
            </p>
            {entry.example && (
              <p className="text-sm italic text-neutral-500 dark:text-neutral-400 text-center mt-2">
                {entry.example}
              </p>
            )}
            {entry.exampleTranslation && (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center">
                {entry.exampleTranslation}
              </p>
            )}
          </>
        )}
      </button>

      {/* Rating buttons — only after reveal */}
      {face === "answer" && (
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onRate("again")}
            disabled={isPending}
            className="flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-5 w-5 text-red-500" />
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">{t("wordReview.again")}</span>
            <span className="text-[10px] text-red-400 dark:text-red-600 font-mono">1</span>
          </button>
          <button
            type="button"
            onClick={() => onRate("hard")}
            disabled={isPending}
            className="flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{t("wordReview.hard")}</span>
            <span className="text-[10px] text-amber-400 dark:text-amber-600 font-mono">2</span>
          </button>
          <button
            type="button"
            onClick={() => onRate("easy")}
            disabled={isPending}
            className="flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">{t("wordReview.easy")}</span>
            <span className="text-[10px] text-green-400 dark:text-green-600 font-mono">3</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function WordReviewPage() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();

  const { data: dueEntries = [], isLoading: isDueLoading } = useQuery<DueEntry[]>({
    queryKey: ["wordbank-due", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DueEntry[]>("/wordbank/due", { token: token ?? undefined });
    },
  });

  const { data: dictionary = [], isLoading: isDictLoading } = useQuery<DictEntry[]>({
    queryKey: ["dictionary-due", selectedLanguageId],
    queryFn: () => apiFetch<DictEntry[]>(`/dictionary?languageId=${selectedLanguageId}`),
    enabled: dueEntries.length > 0,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, confidence }: { id: string; confidence: "easy" | "hard" | "again" }) => {
      const token = await getToken();
      return apiFetch(`/wordbank/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ confidence }),
        token: token ?? undefined,
      });
    },
  });

  const [queue, setQueue] = useState<DictEntry[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const isLoading = isDueLoading || isDictLoading;

  // Build queue once data arrives
  if (!isLoading && queue === null) {
    if (dueEntries.length > 0 && dictionary.length > 0) {
      const dictMap = new Map(dictionary.map((e) => [e.id, e]));
      const resolved = dueEntries
        .map((e) => dictMap.get(e.dictionaryEntryId))
        .filter(Boolean) as DictEntry[];
      setQueue(resolved);
    } else {
      setQueue([]);
    }
  }

  const currentEntry = queue?.[currentIndex];
  const isFinished = queue !== null && currentIndex >= queue.length;

  const handleRate = useCallback(
    (confidence: "easy" | "hard" | "again") => {
      if (!currentEntry) return;
      reviewMutation.mutate({ id: currentEntry.id, confidence });
      setReviewed((n) => n + 1);

      if (confidence === "again") {
        setQueue((prev) => {
          if (!prev) return prev;
          const next = [...prev];
          next.push(next[currentIndex]);
          return next;
        });
      }
      setCurrentIndex((i) => i + 1);
    },
    [currentEntry, currentIndex, reviewMutation]
  );

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="h-64 bg-neutral-100 dark:bg-neutral-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (queue?.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          {t("wordReview.allCaughtUp")}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          {t("wordReview.noWordsDue")}
        </p>
        <Link
          href="/dictionary"
          className="inline-block px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          {t("dictionaryPage.title")}
        </Link>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="h-14 w-14 text-brand-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          {t("wordReview.sessionComplete")}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          {t("wordReview.sessionReviewedPlural", { count: reviewed })}
        </p>
        <Link
          href="/listen"
          className="inline-block px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          {t("wordReview.done")}
        </Link>
      </div>
    );
  }

  if (!currentEntry) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
        {t("wordReview.title")}
      </h1>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
          <span>{t("wordReview.of", { current: currentIndex + 1, total: queue?.length ?? 0 })}</span>
          <span>{t("wordReview.reviewed", { count: reviewed })}</span>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${(currentIndex / (queue?.length ?? 1)) * 100}%` }}
          />
        </div>
      </div>

      <ReviewCard
        entry={currentEntry}
        onRate={handleRate}
        isPending={reviewMutation.isPending}
      />
    </div>
  );
}
