import { DailyChallengeCards } from "@/components/daily-challenge-card";
import { JourneyMap } from "@/components/learn/journey-map";
import { LearnHeader } from "@/components/learn/learn-header";
import { LoadingScreen } from "@/components/loading-screen";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { StreakFreezeModal } from "@/components/streak-freeze-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCourses, useLanguageLessons } from "@/lib/hooks/use-courses";
import { useTodayChallenges } from "@/lib/hooks/use-daily-challenge";
import { useCompletedLessons, useProgressSummary } from "@/lib/hooks/use-progress";
import { useToast } from "@/lib/hooks/use-toast";
import { useWordOfTheDay } from "@/lib/hooks/use-word-of-the-day";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useTourStore } from "@/store/tour-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAILY_GOAL = 3;
/** Fallback word for the in-path défi coin before the word of the day loads. */
const DEFI_WORD_FALLBACK = "vírírií";

// ─── LearnScreen ─────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);

  const {
    data: courses = [],
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useCourses(selectedLanguageId);
  const {
    data: lessons = [],
    isLoading: lessonsLoading,
    refetch: refetchLessons,
  } = useLanguageLessons(selectedLanguageId);
  const {
    data: completedLessonIds,
    isLoading: progressLoading,
    refetch,
  } = useCompletedLessons();
  const { data: summary, refetch: refetchSummary } = useProgressSummary();
  const { refetch: refetchDue } = useWordsDueForReview(selectedLanguageId);
  const { data: todayChallenges = [] } = useTodayChallenges();
  const wotd = useWordOfTheDay(selectedLanguageId);

  const completedIds = useMemo(() => new Set(completedLessonIds ?? []), [completedLessonIds]);
  const completedToday = useMemo(
    () => todayChallenges.filter((c) => c.completed).length,
    [todayChallenges]
  );
  const pathDone = useMemo(
    () => lessons.filter((l) => completedIds.has(l.id)).length,
    [lessons, completedIds]
  );

  const [refreshing, setRefreshing] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const freezeChecked = useRef(false);
  const goalCelebrationChecked = useRef(false);
  const { toast, success: toastSuccess, dismiss: dismissToast } = useToast();
  const activeTour = useTourStore((s) => s.activeTour);

  useFocusEffect(
    useCallback(() => {
      refetchSummary();
    }, [refetchSummary])
  );

  useEffect(() => {
    if (!summary?.streakBroken || summary.streak <= 0 || activeTour || freezeChecked.current)
      return;
    freezeChecked.current = true;
    const today = new Date().toISOString().slice(0, 10);
    AsyncStorage.getItem("streak-freeze-shown")
      .then((lastShown) => {
        if (lastShown === today) return;
        AsyncStorage.setItem("streak-freeze-shown", today).catch(() => {});
        setFreezeModalVisible(true);
      })
      .catch(() => {});
  }, [summary?.streakBroken, summary?.streak, activeTour]);

  useEffect(() => {
    if (completedToday < DAILY_GOAL || goalCelebrationChecked.current) return;
    goalCelebrationChecked.current = true;
    const today = new Date().toISOString().slice(0, 10);
    AsyncStorage.getItem("daily-goal-celebration-shown")
      .then((lastShown) => {
        if (lastShown === today) return;
        AsyncStorage.setItem("daily-goal-celebration-shown", today).catch(() => {});
        toastSuccess(t("dailyGoal.celebrationTitle"), t("dailyGoal.celebrationBody"));
      })
      .catch(() => {});
  }, [completedToday]);

  const isLoading = coursesLoading || lessonsLoading || progressLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      refetchSummary(),
      refetchCourses(),
      refetchLessons(),
      refetchDue(),
    ]);
    setRefreshing(false);
  }, [refetch, refetchSummary, refetchCourses, refetchLessons, refetchDue]);

  const onStreakPress = useCallback(() => {
    if (summary?.streakBroken && summary.streak > 0) setFreezeModalVisible(true);
  }, [summary?.streakBroken, summary?.streak]);
  const onGoalPress = useCallback(() => setGoalModalVisible(true), []);
  const onDefiPress = useCallback(() => router.push("/word-challenge"), [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* ── Museum Foyer Header — placard fading into the gallery floor ── */}
      <LearnHeader
        summary={summary}
        completedToday={completedToday}
        selectedLanguageId={selectedLanguageId}
        pathDone={pathDone}
        pathTotal={lessons.length}
        onStreakPress={onStreakPress}
        onGoalPress={onGoalPress}
      />

      {/* ── The Journey ── */}
      {isLoading ? (
        <View style={{ flex: 1, backgroundColor: M.bg }}>
          <LoadingScreen />
        </View>
      ) : courses.length === 0 ? (
        <View style={{ flex: 1, backgroundColor: M.bg }} className="items-center justify-center px-8">
          <IconSymbol name="book.fill" size={44} color={M.muted} />
          <Text style={{ marginTop: 16, textAlign: "center", fontSize: 14, color: M.sub }}>
            {t("learn.noCourses")}
          </Text>
        </View>
      ) : (
        <JourneyMap
          courses={courses}
          lessons={lessons}
          completedIds={completedIds}
          refreshing={refreshing}
          onRefresh={onRefresh}
          accent={M.accent}
          challenge={{
            word: wotd?.word ?? DEFI_WORD_FALLBACK,
            done: completedToday >= DAILY_GOAL,
            onPress: onDefiPress,
          }}
        />
      )}

      <StreakFreezeModal
        visible={freezeModalVisible}
        streak={summary?.streak ?? 0}
        freezeCount={summary?.freezeCount ?? 0}
        onDismiss={() => setFreezeModalVisible(false)}
      />

      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />

      <Modal
        visible={goalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          onPress={() => setGoalModalVisible(false)}
        />
        <View
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: M.ink,
            borderTopWidth: 1,
            borderTopColor: M.border,
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 16,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: M.border,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              marginBottom: 20,
              textAlign: "center",
              fontSize: 17,
              fontWeight: "800",
              color: M.parchment,
            }}
          >
            {t("learn.dailyGoalTitle")}
          </Text>
          <DailyChallengeCards />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
