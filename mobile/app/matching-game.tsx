import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useStreakCelebration } from "@/lib/hooks/use-progress";
import { StreakCelebrationModal } from "@/components/streak-celebration-modal";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { MatchingBoard } from "@/components/quiz/matching-board";
import { useMatchingStore } from "@/store/matching-store";
import { generateMatchingPairs } from "@/lib/quiz-engine";
import { useLanguageStore } from "@/store/language-store";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useLesson } from "@/lib/hooks/use-courses";
import { getLanguageName } from "@/lib/mock-data";
import { hapticHeavy } from "@/lib/haptics";
import { playFinishSound } from "@/lib/sounds";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";

export default function MatchingGameScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string; lessonId?: string }>();
  const { selectedLanguageId } = useLanguageStore();
  const { data: dictionaryEntries = [], isLoading: isDictLoading } = useDictionary(selectedLanguageId);
  const { data: lessonData, isLoading: isLessonLoading } = useLesson(params.lessonId ?? "");
  const { phase, startGame, getResult, reset } = useMatchingStore();
  const [isEmpty, setIsEmpty] = useState(false);
  const initialized = useRef(false);
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { onStreakUpdate, pendingCelebration, showCelebration, dismissCelebration, celebration, toast, dismissToast } = useStreakCelebration();

  const languageName = getLanguageName(selectedLanguageId);
  const { t } = useTranslation();

  useEffect(() => {
    if (initialized.current) return;
    if (isDictLoading) return;
    if (params.lessonId && isLessonLoading) return;
    initialized.current = true;

    const segments = lessonData?.transcript ?? [];
    const pairs = generateMatchingPairs(
      {
        languageId: selectedLanguageId,
        courseId: params.courseId,
        lessonId: params.lessonId,
        pairCount: 8,
      },
      dictionaryEntries,
      segments
    );

    if (pairs.length === 0) {
      setIsEmpty(true);
    } else {
      startGame(pairs);
    }
  }, [isDictLoading, isLessonLoading]);

  useEffect(() => {
    if (phase !== "results") return;
    hapticHeavy();
    playFinishSound();
    const result = getResult();
    const post = async () => {
      try {
        const token = await getToken();
        const res = await apiFetch<{ streak?: number; streakIncremented?: boolean; streakMilestone?: number | null }>("/matching-results", {
          method: "POST",
          token: token ?? undefined,
          body: JSON.stringify({
            languageId: selectedLanguageId,
            accuracy: result.accuracy,
            totalPairs: result.totalPairs,
            durationMs: result.timeElapsed * 1000,
          }),
        });
        queryClient.invalidateQueries({ queryKey: ["progress"] });
        if (res.streakIncremented && res.streak) {
          onStreakUpdate(res.streak, !!res.streakMilestone);
        }
      } catch {
        // non-blocking
      }
    };
    post();
  }, [phase]);

  const handlePlayAgain = useCallback(() => {
    dismissCelebration();
    const segments = lessonData?.transcript ?? [];
    const pairs = generateMatchingPairs(
      {
        languageId: selectedLanguageId,
        courseId: params.courseId,
        lessonId: params.lessonId,
        pairCount: 8,
      },
      dictionaryEntries,
      segments
    );
    if (pairs.length > 0) {
      startGame(pairs);
    }
  }, [selectedLanguageId, params.courseId, params.lessonId, lessonData, dictionaryEntries, startGame]);

  const result = phase === "results" ? getResult() : null;

  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => { reset(); router.back(); }} hitSlop={8}>
        <IconSymbol name="xmark" size={22} color={M.muted} />
      </Pressable>
    ),
    [reset, router, M.muted]
  );

  const screenOptions = useMemo(
    () => ({
      title: `${languageName} ${t("matching.titleSuffix")}`,
      headerShown: true,
      presentation: "fullScreenModal" as const,
      headerLeft,
    }),
    [languageName, t, headerLeft]
  );

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
        {isEmpty ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <IconSymbol name="rectangle.grid.2x2" size={56} color={M.border} />
            <Text style={{ marginTop: 16, textAlign: "center", fontSize: 17, fontWeight: "600", color: M.sub }}>
              {t("matching.notEnoughVocab")}
            </Text>
            <Text style={{ marginTop: 8, textAlign: "center", fontSize: 13, color: M.muted }}>
              {t("matching.notEnoughVocabDesc")}
            </Text>
            <Button
              label={t("matching.goBack")}
              onPress={() => { reset(); router.back(); }}
              fullWidth={false}
              style={{ marginTop: 24 }}
            />
          </View>
        ) : phase === "results" && result ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View style={{ marginBottom: 24, height: 112, width: 112, alignItems: "center", justifyContent: "center", borderRadius: 56, backgroundColor: M.successBg, borderWidth: 1, borderColor: M.successBorder }}>
              <Text style={{ fontSize: 28, fontWeight: "700", color: M.success }}>{result.accuracy}%</Text>
            </View>

            <Text style={{ marginBottom: 8, fontSize: 24, fontWeight: "700", color: M.text }}>{t("matching.allMatched")}</Text>
            <Text style={{ marginBottom: 4, fontSize: 15, color: M.sub }}>
              {t("matching.pairsAttempts", { total: result.totalPairs, attempts: result.attempts })}
            </Text>
            <Text style={{ marginBottom: 24, fontSize: 15, color: M.sub }}>
              {t("matching.time", { time: result.timeElapsed })}
            </Text>

            <View style={{ width: "100%", gap: 12 }}>
              <Button label={t("matching.playAgain")} onPress={handlePlayAgain} />
              <Button label={t("matching.backToLearn")} onPress={() => { if (pendingCelebration) { showCelebration(); return; } reset(); router.back(); }} variant="secondary" />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
            <Text style={{ marginBottom: 16, textAlign: "center", fontSize: 15, color: M.sub }}>
              {t("matching.instruction")}
            </Text>
            <MatchingBoard />
          </View>
        )}
      </SafeAreaView>
      <NotificationBanner visible={toast.visible} title={toast.title} body={toast.body} type={toast.type} onDismiss={dismissToast} />
      <StreakCelebrationModal visible={!!celebration} streak={celebration?.streak ?? 0} isMilestone={celebration?.isMilestone} onDismiss={() => { dismissCelebration(); reset(); router.back(); }} />
    </>
  );
}
