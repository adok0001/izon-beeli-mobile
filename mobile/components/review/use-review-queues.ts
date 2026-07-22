import {
  usePendingContributions,
  usePendingLessonContributions,
} from "@/lib/hooks/use-contributions";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useActiveLanguages } from "@/store/languages-store";
import { useMemo } from "react";

export type ReviewTab = "words" | "lessons" | "coverage";

/**
 * Scopes the pending word/lesson queues to what the signed-in reviewer is
 * allowed to see, then derives the counts, the visible (language-filtered)
 * lists and the language chip ids for the active tab.
 */
export function useReviewQueues(activeTab: ReviewTab, selectedLang: string | null) {
  const { data: currentUser } = useCurrentUser();
  const activeLanguages = useActiveLanguages();
  const isAdmin = currentUser?.isAdmin ?? false;
  const canReview = isAdmin || (currentUser?.isReviewer ?? false);

  const { data: pending, isLoading: loadingWords, refetch: refetchWords } = usePendingContributions();
  const { data: pendingLessons, isLoading: loadingLessons, refetch: refetchLessons } = usePendingLessonContributions();

  const allowedLanguages = isAdmin
    ? null
    : new Set(currentUser?.reviewerLanguages ?? []);

  const scopedWords = allowedLanguages
    ? (pending ?? []).filter((c) => allowedLanguages.has(c.languageId))
    : (pending ?? []);
  const scopedLessons = allowedLanguages
    ? (pendingLessons ?? []).filter((c) => allowedLanguages.has(c.languageId))
    : (pendingLessons ?? []);

  const wordCount = scopedWords.length;
  const lessonCount = scopedLessons.length;

  const visibleWords = selectedLang ? scopedWords.filter((c) => c.languageId === selectedLang) : scopedWords;
  const visibleLessons = selectedLang ? scopedLessons.filter((c) => c.languageId === selectedLang) : scopedLessons;

  const coverageLanguages = useMemo(
    () => (isAdmin ? activeLanguages.map((l) => l.id) : currentUser?.reviewerLanguages ?? []),
    [isAdmin, currentUser?.reviewerLanguages, activeLanguages],
  );

  const languageIds = useMemo(() => {
    if (activeTab === "coverage") return coverageLanguages;
    const ids = activeTab === "words"
      ? [...new Set(scopedWords.map((c) => c.languageId))]
      : [...new Set(scopedLessons.map((c) => c.languageId))];
    return ids;
  }, [activeTab, scopedWords, scopedLessons, coverageLanguages]);

  return {
    isAdmin,
    canReview,
    loadingWords,
    loadingLessons,
    refetchWords,
    refetchLessons,
    wordCount,
    lessonCount,
    visibleWords,
    visibleLessons,
    coverageLanguages,
    languageIds,
  };
}
