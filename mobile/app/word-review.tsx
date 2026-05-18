import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiFetch } from "@/lib/api";
import type { DictionaryEntry } from "@/lib/dictionary";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { useInvalidateDailyChallenges } from "@/lib/hooks/use-daily-challenge";
import { useInvalidateReviewQueue, useReviewWord, useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { useQueryClient } from "@tanstack/react-query";
import { playCorrectSound, playIncorrectSound } from "@/lib/sounds";
import { useLanguageStore } from "@/store/language-store";
import type { AudioSource } from "@/types";
import { useQueries } from "@tanstack/react-query";
import { Audio } from "expo-av";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CardFace = "question" | "answer";

function AudioButton({ audioSource }: { audioSource: AudioSource }) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const handlePress = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const source = typeof audioSource === "string" ? { uri: audioSource } : audioSource;
      const { sound } = await Audio.Sound.createAsync(source as any);
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      setIsPlaying(true);
      await sound.playAsync();
    } catch {
      setIsPlaying(false);
    }
  }, [audioSource]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isPlaying}
      className="mt-4 flex-row items-center gap-2 rounded-full bg-blue-50 px-5 py-2.5 active:opacity-70 dark:bg-blue-900/30"
    >
      <IconSymbol
        name={isPlaying ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
        size={18}
        color="#3b82f6"
      />
      <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        {isPlaying ? t("wordReview.playing") : t("wordReview.playAudio")}
      </Text>
    </Pressable>
  );
}

function ReviewCard({
  entry,
  onRate,
  isSubmitting,
}: {
  entry: DictionaryEntry;
  onRate: (confidence: "again" | "hard" | "good" | "easy") => void;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const [face, setFace] = useState<CardFace>("question");

  return (
    <View className="flex-1 px-5">
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
            {entry.audioUrl && <AudioButton audioSource={entry.audioUrl} />}
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
            onPress={() => onRate("good")}
            disabled={isSubmitting}
            className="flex-1 items-center rounded-2xl border-2 border-green-200 bg-green-50 py-4 active:opacity-70 dark:border-green-800 dark:bg-green-950"
          >
            <IconSymbol name="checkmark.circle" size={20} color="#22c55e" />
            <Text className="mt-1 text-xs font-semibold text-green-600 dark:text-green-400">
              {t("wordReview.good")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onRate("easy")}
            disabled={isSubmitting}
            className="flex-1 items-center rounded-2xl border-2 border-blue-200 bg-blue-50 py-4 active:opacity-70 dark:border-blue-800 dark:bg-blue-950"
          >
            <IconSymbol name="checkmark.seal.fill" size={20} color="#3b82f6" />
            <Text className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
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
  const { selectedLanguageId } = useLanguageStore();
  const { data: dueEntries = [], isLoading: isDueLoading } = useWordsDueForReview(selectedLanguageId);
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
  const queryClient = useQueryClient();
  const invalidateReviewQueue = useInvalidateReviewQueue();
  const invalidateDailyChallenges = useInvalidateDailyChallenges();
  const { t } = useTranslation();

  useEffect(() => {
    return () => {
      invalidateReviewQueue();
      invalidateDailyChallenges();
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    };
  }, [invalidateReviewQueue, invalidateDailyChallenges, queryClient]);

  const isLoading = isDueLoading || isDictLoading;

  const reviewCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of dueEntries) map.set(e.dictionaryEntryId, e.reviewCount);
    return map;
  }, [dueEntries]);

  const [queue, setQueue] = useState<DictionaryEntry[]>([]);
  const [queueBuilt, setQueueBuilt] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [xpToast, setXpToast] = useState<string | null>(null);

  useEffect(() => {
    if (queueBuilt || isLoading || dueEntries.length === 0 || dictionary.length === 0) return;
    const dictMap = new Map(dictionary.map((e) => [e.id, e]));
    const resolved = dueEntries
      .map((e) => dictMap.get(e.dictionaryEntryId))
      .filter(Boolean) as DictionaryEntry[];
    setQueue(resolved);
    setQueueBuilt(true);
  }, [isLoading, dueEntries, dictionary, queueBuilt]);

  const currentEntry = queue[currentIndex];
  const isFinished = queueBuilt && currentIndex >= queue.length;

  const handleRate = useCallback(
    (confidence: "again" | "hard" | "good" | "easy") => {
      if (!currentEntry) return;
      const entry = currentEntry;

      if (confidence === "easy" || confidence === "good") {
        hapticSuccess();
        playCorrectSound().catch(() => {});
      } else if (confidence === "hard") {
        hapticTap();
      } else {
        hapticError();
        playIncorrectSound().catch(() => {});
      }

      reviewWord.mutate(
        { dictionaryEntryId: entry.id, confidence },
        {
          onSuccess: (data) => {
            if (confidence !== "again" && data.xpEarned) {
              setXpToast(`+${data.xpEarned} XP`);
              setTimeout(() => setXpToast(null), 1500);
            }
          },
        }
      );

      setReviewedIds((prev) => {
        const next = new Set(prev);
        next.add(entry.id);
        return next;
      });

      if (confidence === "again") {
        setQueue((prev) => [...prev, entry]);
      }

      setCurrentIndex((i) => i + 1);
    },
    [currentEntry, reviewWord]
  );

  const uniqueReviewed = reviewedIds.size;
  const showLoading = isLoading || (!queueBuilt && dueEntries.length > 0);

  return (
    <>
      <Stack.Screen options={{ title: t("wordReview.title"), headerShown: true }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {showLoading ? (
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
              {uniqueReviewed !== 1
                ? t("wordReview.sessionReviewedPlural", { count: uniqueReviewed })
                : t("wordReview.sessionReviewed", { count: uniqueReviewed })}
            </Text>

            {/* Retention curve */}
            {uniqueReviewed > 0 && (() => {
              const reviewed = [...reviewedIds];
              const counts = reviewed.map((id) => reviewCountMap.get(id) ?? 1);
              const avg = counts.reduce((s, n) => s + n, 0) / counts.length;
              const retention = avg >= 5 ? 95 : avg >= 4 ? 85 : avg >= 3 ? 70 : avg >= 2 ? 50 : 30;
              const barWidth = retention;
              return (
                <View className="mt-5 w-full rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
                  <Text className="mb-1 text-center text-sm text-blue-800 dark:text-blue-300">
                    {t("wordReview.retentionDesc", { avg: avg.toFixed(1), pct: retention })}
                  </Text>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
                    <View
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </View>
                </View>
              );
            })()}

            <Pressable
              onPress={() => router.back()}
              className="mt-6 rounded-xl bg-blue-500 px-8 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-white">{t("wordReview.done")}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="mx-5 mt-3">
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t("wordReview.of", { current: currentIndex + 1, total: queue.length })}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t("wordReview.reviewed", { count: uniqueReviewed })}
                </Text>
              </View>
              <View className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
                <View
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${(currentIndex / queue.length) * 100}%` }}
                />
              </View>
            </View>

            <ReviewCard
              key={currentEntry.id}
              entry={currentEntry}
              onRate={handleRate}
              isSubmitting={reviewWord.isPending}
            />

            {xpToast && (
              <View className="absolute right-6 top-20 rounded-full bg-amber-100 px-4 py-1.5 dark:bg-amber-900/40">
                <Text className="text-sm font-bold text-amber-700 dark:text-amber-300">{xpToast}</Text>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </>
  );
}
