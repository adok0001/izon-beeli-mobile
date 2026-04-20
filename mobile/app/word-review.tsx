import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiFetch } from "@/lib/api";
import type { DictionaryEntry } from "@/lib/dictionary";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { useInvalidateReviewQueue, useReviewWord, useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { playCorrectSound, playIncorrectSound } from "@/lib/sounds";
import { useQueries } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CardFace = "question" | "answer";

function ReviewCard({
  entry,
  onRate,
  isSubmitting,
}: {
  entry: DictionaryEntry;
  onRate: (confidence: "easy" | "hard" | "again") => void;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const [face, setFace] = useState<CardFace>("question");

  return (
    <View className="flex-1 px-5">
      {/* Card */}
      <Pressable
        onPress={() => setFace(face === "question" ? "answer" : "question")}
        className="flex-1 items-center justify-center rounded-3xl bg-neutral-50 p-8 active:opacity-90 dark:bg-neutral-800"
      >
        {face === "question" ? (
          <>
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t("wordReview.translateToEnglish")}
            </Text>
            <Text className="text-center text-4xl font-bold text-neutral-900 dark:text-white">
              {entry.word}
            </Text>
            {entry.pronunciation && (
              <Text className="mt-2 text-center text-base text-neutral-500 dark:text-neutral-400">
                /{entry.pronunciation}/
              </Text>
            )}
            <View className="mt-6 flex-row items-center gap-1">
              <IconSymbol name="hand.tap" size={16} color="#9ca3af" />
              <Text className="text-sm text-neutral-400 dark:text-neutral-500">
                {t("wordReview.tapToReveal")}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t("wordReview.english")}
            </Text>
            <Text className="text-center text-4xl font-bold text-neutral-900 dark:text-white">
              {entry.english}
            </Text>
            {entry.example && (
              <Text className="mt-4 text-center text-sm italic text-neutral-500 dark:text-neutral-400">
                {entry.example}
              </Text>
            )}
            {entry.exampleTranslation && (
              <Text className="mt-1 text-center text-sm text-neutral-400 dark:text-neutral-500">
                {entry.exampleTranslation}
              </Text>
            )}
          </>
        )}
      </Pressable>

      {/* Rating buttons — only show after revealing */}
      {face === "answer" && (
        <View className="mt-4 flex-row gap-3 pb-4">
          <Pressable
            onPress={() => onRate("again")}
            disabled={isSubmitting}
            className="flex-1 items-center rounded-2xl border-2 border-red-200 bg-red-50 py-4 active:opacity-70 dark:border-red-800 dark:bg-red-950"
          >
            <IconSymbol name="arrow.counterclockwise" size={20} color="#ef4444" />
            <Text className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
              {t("wordReview.again")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onRate("hard")}
            disabled={isSubmitting}
            className="flex-1 items-center rounded-2xl border-2 border-amber-200 bg-amber-50 py-4 active:opacity-70 dark:border-amber-800 dark:bg-amber-950"
          >
            <IconSymbol name="minus.circle" size={20} color="#f59e0b" />
            <Text className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {t("wordReview.hard")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onRate("easy")}
            disabled={isSubmitting}
            className="flex-1 items-center rounded-2xl border-2 border-green-200 bg-green-50 py-4 active:opacity-70 dark:border-green-800 dark:bg-green-950"
          >
            <IconSymbol name="checkmark.circle" size={20} color="#22c55e" />
            <Text className="mt-1 text-xs font-semibold text-green-600 dark:text-green-400">
              {t("wordReview.easy")}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function WordReviewScreen() {
  const router = useRouter();
  const { data: dueEntries = [], isLoading: isDueLoading } = useWordsDueForReview();
  const languageIds = useMemo(
    () => [...new Set(dueEntries.map((e) => e.languageId))],
    [dueEntries]
  );
  const dictionaryQueries = useQueries({
    queries: languageIds.map((langId) => ({
      queryKey: ["dictionary", langId, null],
      queryFn: () => apiFetch<DictionaryEntry[]>(`/dictionary?languageId=${encodeURIComponent(langId)}`),
    })),
  });
  const isDictLoading = dictionaryQueries.some((q) => q.isLoading);
  const dictionary = dictionaryQueries.flatMap((q) => q.data ?? []);
  const reviewWord = useReviewWord();
  const invalidateReviewQueue = useInvalidateReviewQueue();

  // Invalidate the review queue when leaving the screen
  useEffect(() => {
    return () => { invalidateReviewQueue(); };
  }, [invalidateReviewQueue]);

  // Local queue — built once from server data, then managed in-memory
  const [queue, setQueue] = useState<DictionaryEntry[]>([]);
  const [queueBuilt, setQueueBuilt] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const { t } = useTranslation();

  const isLoading = isDueLoading || isDictLoading;

  // Build the local queue once when data arrives
  if (!queueBuilt && !isLoading && dueEntries.length > 0 && dictionary.length > 0) {
    const dictMap = new Map(dictionary.map((e) => [e.id, e]));
    const resolved = dueEntries
      .map((e) => dictMap.get(e.dictionaryEntryId))
      .filter(Boolean) as DictionaryEntry[];
    setQueue(resolved);
    setQueueBuilt(true);
  }

  const currentEntry = queue[currentIndex];
  const isFinished = queueBuilt && currentIndex >= queue.length;

  const handleRate = useCallback(
    (confidence: "easy" | "hard" | "again") => {
      if (!currentEntry) return;
      if (confidence === "easy") {
        hapticSuccess();
        playCorrectSound().catch(() => {});
      } else if (confidence === "hard") {
        hapticTap();
      } else {
        hapticError();
        playIncorrectSound().catch(() => {});
      }

      // Send review to server (fire-and-forget, don't refetch during session)
      reviewWord.mutate({ dictionaryEntryId: currentEntry.id, confidence });

      setReviewed((n) => n + 1);

      if (confidence === "again") {
        // Put the word back at the end of the queue
        setQueue((prev) => {
          const next = [...prev];
          next.push(next[currentIndex]);
          return next;
        });
      }

      setCurrentIndex((i) => i + 1);
    },
    [currentEntry, currentIndex, reviewWord]
  );

  return (
    <>
      <Stack.Screen options={{ title: t("wordReview.title"), headerShown: true }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : queue.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <IconSymbol name="checkmark.circle.fill" size={56} color="#22c55e" />
            <Text className="mt-4 text-center text-xl font-bold text-neutral-900 dark:text-white">
              {t("wordReview.allCaughtUp")}
            </Text>
            <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
              {t("wordReview.noWordsDue")}
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="mt-6 rounded-xl bg-blue-500 px-8 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-white">{t("wordReview.done")}</Text>
            </Pressable>
          </View>
        ) : isFinished ? (
          <View className="flex-1 items-center justify-center px-8">
            <IconSymbol name="checkmark.seal.fill" size={56} color="#3b82f6" />
            <Text className="mt-4 text-center text-xl font-bold text-neutral-900 dark:text-white">
              {t("wordReview.sessionComplete")}
            </Text>
            <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
              {reviewed !== 1 ? t("wordReview.sessionReviewedPlural", { count: reviewed }) : t("wordReview.sessionReviewed", { count: reviewed })}
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="mt-6 rounded-xl bg-blue-500 px-8 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-white">{t("wordReview.done")}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Progress */}
            <View className="mx-5 mt-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t("wordReview.of", { current: currentIndex + 1, total: queue.length })}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t("wordReview.reviewed", { count: reviewed })}
                </Text>
              </View>
              <View className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
                <View
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                />
              </View>
            </View>

            <ReviewCard
              entry={currentEntry}
              onRate={handleRate}
              isSubmitting={reviewWord.isPending}
            />
          </>
        )}
      </SafeAreaView>
    </>
  );
}
