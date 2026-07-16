import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiFetch, friendlyError } from "@/lib/api";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingScreen } from "@/components/loading-screen";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLesson } from "@/lib/hooks/use-courses";
import { useDictionary } from "@/lib/hooks/use-dictionary";

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

  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={handlePress}
      disabled={isPlaying}
      style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: M.accentBorder }}
      className="active:opacity-70"
    >
      <IconSymbol name={isPlaying ? "speaker.wave.3.fill" : "speaker.wave.2.fill"} size={18} color={M.accent} />
      <Text style={{ fontSize: 13, fontWeight: "600", color: M.accent }}>
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
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [face, setFace] = useState<CardFace>("question");

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <Pressable
        onPress={() => setFace(face === "question" ? "answer" : "question")}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: M.card, padding: 32, borderWidth: 1, borderColor: M.border }}
        className="active:opacity-90"
      >
        {face === "question" ? (
          <>
            <Text style={{ marginBottom: 8, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
              {t("wordReview.translateToEnglish")}
            </Text>
            <Text style={{ textAlign: "center", fontSize: 40, fontWeight: "700", color: M.text }}>
              {entry.word}
            </Text>
            {entry.pronunciation && !entry.pronunciation.startsWith("http") && (
              <Text style={{ marginTop: 8, textAlign: "center", fontSize: 16, color: M.sub }}>
                /{entry.pronunciation}/
              </Text>
            )}
            {entry.audioUrl && <AudioButton audioSource={entry.audioUrl} />}
            <View style={{ marginTop: 24, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <IconSymbol name="hand.tap" size={16} color={M.muted} />
              <Text style={{ fontSize: 13, color: M.muted }}>{t("wordReview.tapToReveal")}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={{ marginBottom: 8, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
              {t("wordReview.english")}
            </Text>
            <Text style={{ textAlign: "center", fontSize: 40, fontWeight: "700", color: M.text }}>
              {entry.english}
            </Text>
            {entry.example && (
              <Text style={{ marginTop: 16, textAlign: "center", fontSize: 13, fontStyle: "italic", color: M.sub }}>
                {entry.example}
              </Text>
            )}
            {entry.exampleTranslation && (
              <Text style={{ marginTop: 4, textAlign: "center", fontSize: 13, color: M.muted }}>
                {entry.exampleTranslation}
              </Text>
            )}
          </>
        )}
      </Pressable>

      {face === "answer" && (
        <View style={{ marginTop: 16, flexDirection: "row", gap: 12, paddingBottom: 16 }}>
          {[
            { key: "again" as const, icon: "arrow.counterclockwise", color: M.error },
            { key: "hard" as const, icon: "minus.circle", color: M.accent },
            { key: "good" as const, icon: "checkmark.circle", color: M.success },
            { key: "easy" as const, icon: "checkmark.seal.fill", color: getAccent("purple").solid },
          ].map(({ key, icon, color }) => (
            <Pressable
              key={key}
              onPress={() => onRate(key)}
              disabled={isSubmitting}
              style={{ flex: 1, alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: `${color}40`, backgroundColor: `${color}15`, paddingVertical: 16 }}
              className="active:opacity-70"
            >
              <IconSymbol name={icon as any} size={20} color={color} />
              <Text style={{ marginTop: 4, fontSize: 11, fontWeight: "600", color }}>
                {t(`wordReview.${key}` as any)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default function WordReviewScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { selectedLanguageId } = useLanguageStore();
  const { t } = useTranslation();

  // Lesson mode: load lesson transcript and match to dictionary
  const { data: lessonData, isLoading: isLessonLoading } = useLesson(lessonId ?? "");
  const { data: lessonDictionary = [], isLoading: isLessonDictLoading } = useDictionary(
    lessonId ? selectedLanguageId : ""
  );

  // SRS mode: words due for review from the user's wordbank
  const { data: dueEntries = [], isLoading: isDueLoading } = useWordsDueForReview(
    lessonId ? null : selectedLanguageId
  );
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
  const srsDictionary = dictionaryQueries.flatMap((q) => q.data ?? []);

  const reviewWord = useReviewWord();
  const queryClient = useQueryClient();
  const invalidateReviewQueue = useInvalidateReviewQueue();
  const invalidateDailyChallenges = useInvalidateDailyChallenges();

  useEffect(() => {
    return () => {
      invalidateReviewQueue();
      invalidateDailyChallenges();
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    };
  }, [invalidateReviewQueue, invalidateDailyChallenges, queryClient]);

  // Lesson-mode: match transcript words to dictionary entries
  const lessonEntries = useMemo(() => {
    if (!lessonId || !lessonData?.transcript?.length || !lessonDictionary.length) return [];
    const transcriptWords = new Set(
      lessonData.transcript
        .flatMap((seg) =>
          seg.text.split(/\s+/).map((w) => w.toLowerCase().replace(/[.,!?;:'"()\[\]]/g, "").trim())
        )
        .filter(Boolean)
    );
    return lessonDictionary.filter((e) => transcriptWords.has(e.word.toLowerCase().trim()));
  }, [lessonId, lessonData, lessonDictionary]);

  const isLoading = lessonId
    ? isLessonLoading || isLessonDictLoading
    : isDueLoading || isDictLoading;

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
    if (queueBuilt || isLoading) return;
    if (lessonId) {
      // Lesson mode: use transcript-matched entries (fall back to full dictionary if no matches)
      const entries = lessonEntries.length > 0 ? lessonEntries : lessonDictionary;
      if (entries.length === 0) return;
      setQueue(entries);
      setQueueBuilt(true);
    } else {
      if (dueEntries.length === 0 || srsDictionary.length === 0) return;
      const dictMap = new Map(srsDictionary.map((e) => [e.id, e]));
      const resolved = dueEntries
        .map((e) => dictMap.get(e.dictionaryEntryId))
        .filter(Boolean) as DictionaryEntry[];
      setQueue(resolved);
      setQueueBuilt(true);
    }
  }, [isLoading, lessonId, lessonEntries, lessonDictionary, dueEntries, srsDictionary, queueBuilt]);

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
          onError: (e) => Alert.alert(t("common.error"), friendlyError(e)),
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
  const hasSource = lessonId ? (lessonDictionary.length > 0) : (dueEntries.length > 0);
  const showLoading = isLoading || (!queueBuilt && hasSource);

  const M = useMuseumTheme();

  return (
    <>
      <Stack.Screen options={{ title: lessonId ? t("wordReview.lessonTitle") : t("wordReview.title"), headerShown: true }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        {showLoading ? (
          <LoadingScreen />
        ) : queue.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <IconSymbol name="checkmark.circle.fill" size={56} color={M.success} />
            <Text style={{ marginTop: 16, textAlign: "center", fontSize: 20, fontWeight: "700", color: M.text }}>
              {t("wordReview.allCaughtUp")}
            </Text>
            <Text style={{ marginTop: 8, textAlign: "center", fontSize: 13, color: M.sub }}>
              {lessonId ? t("wordReview.noLessonWords") : t("wordReview.noWordsDue")}
            </Text>
            <Pressable onPress={() => router.back()} style={{ marginTop: 24, borderRadius: 12, backgroundColor: getAccent("purple").solid, paddingHorizontal: 32, paddingVertical: 12 }} className="active:opacity-80">
              <Text style={{ fontWeight: "600", color: M.ink }}>{t("wordReview.done")}</Text>
            </Pressable>
          </View>
        ) : isFinished ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <IconSymbol name="checkmark.seal.fill" size={56} color={getAccent("purple").solid} />
            <Text style={{ marginTop: 16, textAlign: "center", fontSize: 20, fontWeight: "700", color: M.text }}>
              {t("wordReview.sessionComplete")}
            </Text>
            <Text style={{ marginTop: 8, textAlign: "center", fontSize: 13, color: M.sub }}>
              {uniqueReviewed !== 1
                ? t("wordReview.sessionReviewedPlural", { count: uniqueReviewed })
                : t("wordReview.sessionReviewed", { count: uniqueReviewed })}
            </Text>

            {uniqueReviewed > 0 && (() => {
              const reviewed = [...reviewedIds];
              const counts = reviewed.map((id) => reviewCountMap.get(id) ?? 1);
              const avg = counts.reduce((s, n) => s + n, 0) / counts.length;
              const retention = avg >= 5 ? 95 : avg >= 4 ? 85 : avg >= 3 ? 70 : avg >= 2 ? 50 : 30;
              return (
                <View style={{ marginTop: 20, width: "100%", borderRadius: 16, backgroundColor: `${getAccent("purple").solid}15`, padding: 16, borderWidth: 1, borderColor: `${getAccent("purple").solid}30` }}>
                  <Text style={{ marginBottom: 4, textAlign: "center", fontSize: 13, color: getAccent("purple").solid }}>
                    {t("wordReview.retentionDesc", { avg: avg.toFixed(1), pct: retention })}
                  </Text>
                  <View style={{ marginTop: 8, height: 8, overflow: "hidden", borderRadius: 999, backgroundColor: `${getAccent("purple").solid}30` }}>
                    <View style={{ height: 8, borderRadius: 999, backgroundColor: getAccent("purple").solid, width: `${retention}%` }} />
                  </View>
                </View>
              );
            })()}

            <Pressable onPress={() => router.back()} style={{ marginTop: 24, borderRadius: 12, backgroundColor: getAccent("purple").solid, paddingHorizontal: 32, paddingVertical: 12 }} className="active:opacity-80">
              <Text style={{ fontWeight: "600", color: M.ink }}>{t("wordReview.done")}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ marginHorizontal: 20, marginTop: 12 }}>
              <View style={{ marginBottom: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: M.sub }}>{t("wordReview.of", { current: currentIndex + 1, total: queue.length })}</Text>
                <Text style={{ fontSize: 11, color: M.sub }}>{t("wordReview.reviewed", { count: uniqueReviewed })}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 999, backgroundColor: M.border }}>
                <View style={{ height: 6, borderRadius: 999, backgroundColor: getAccent("purple").solid, width: `${(currentIndex / queue.length) * 100}%` }} />
              </View>
            </View>

            <ReviewCard
              key={currentEntry.id}
              entry={currentEntry}
              onRate={handleRate}
              isSubmitting={reviewWord.isPending}
            />

            {xpToast && (
              <View style={{ position: "absolute", right: 24, top: 80, borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: M.accentBorder }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.accent }}>{xpToast}</Text>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </>
  );
}
