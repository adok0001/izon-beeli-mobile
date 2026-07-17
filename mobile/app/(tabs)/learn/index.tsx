import { DailyChallengeCards } from "@/components/daily-challenge-card";
import { LanguageExhibitCard } from "@/components/language-picker";
import { ContinueCard } from "@/components/learn/continue-card";
import { CourseCarousel } from "@/components/learn/course-carousel";
import { DailyReadCard } from "@/components/learn/daily-read-card";
import { ExploreAllRow } from "@/components/learn/explore-all-row";
import { LibraryTeaser } from "@/components/learn/library-teaser";
import { TodaysGalleryCard } from "@/components/learn/todays-gallery-card";
import { StreakWeekStrip } from "@/components/learn/streak-week-strip";
import { WelcomeChecklistCard } from "@/components/welcome-checklist-fab";
import { Eyebrow } from "@/components/ui/section-header";
import { LoadingScreen } from "@/components/loading-screen";
import { QueryErrorState } from "@/components/query-error-state";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { NotificationBell } from "@/components/notifications/notification-center";
import { StreakFreezeModal } from "@/components/streak-freeze-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { fonts } from "@/constants/typography";
import { useCourses, useLanguageLessons } from "@/lib/hooks/use-courses";
import { useTodayChallenges } from "@/lib/hooks/use-daily-challenge";
import { useCompletedLessons, useProgressSummary } from "@/lib/hooks/use-progress";
import { useToast } from "@/lib/hooks/use-toast";
import { useWordOfTheDay } from "@/lib/hooks/use-word-of-the-day";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useTourStore } from "@/store/tour-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";

const DAILY_GOAL = 3;

function greetingKey(): "learn.goodMorning" | "learn.goodAfternoon" | "learn.goodEvening" {
  const h = new Date().getHours();
  if (h < 12) return "learn.goodMorning";
  if (h < 18) return "learn.goodAfternoon";
  return "learn.goodEvening";
}

// ─── LearnScreen ─────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);
  const resumeState = useAudioStore((s) => s.resumeState);

  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesError,
    refetch: refetchCourses,
  } = useCourses(selectedLanguageId);
  const {
    data: lessons = [],
    isLoading: lessonsLoading,
    isError: lessonsError,
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
  const hasError = coursesError || lessonsError;

  const [refreshing, setRefreshing] = useState(false);
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

  const firstName = user?.firstName ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Foyer greeting header */}
      <LinearGradient
        colors={[M.ink, `${M.ink}EE`, `${M.ink}00`]}
        style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 26, color: M.parchment, flex: 1, marginRight: 12 }} numberOfLines={1}>
            {t(greetingKey(), {
              defaultValue: greetingKey() === "learn.goodMorning" ? "Good morning" :
                greetingKey() === "learn.goodAfternoon" ? "Good afternoon" : "Good evening",
            })}
            {firstName ? `, ${firstName}` : ""}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable
              onPress={() => router.push("/dictionary")}
              style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}
              accessibilityRole="button"
              accessibilityLabel={t("profile.dictionary")}
              className="active:opacity-70"
            >
              <IconSymbol name="character.book.closed" size={17} color={M.accent} />
            </Pressable>
            <NotificationBell />
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          <LanguageExhibitCard />
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={{ flex: 1, backgroundColor: M.bg }}>
          <LoadingScreen />
        </View>
      ) : hasError ? (
        <View style={{ flex: 1, backgroundColor: M.bg }}>
          <QueryErrorState onRetry={onRefresh} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: M.bg }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32, gap: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={M.accent}
              colors={[M.accent]}
            />
          }
        >
          {/* Getting started — de-stickied welcome checklist, auto-hides once complete */}
          <WelcomeChecklistCard />

          {/* Streak week-strip */}
          <View style={{ paddingHorizontal: 20 }}>
            <StreakWeekStrip
              summary={summary}
              completedToday={completedToday}
              onGoalPress={() => setGoalModalVisible(true)}
              onPress={() => {
                if (summary?.streakBroken && summary.streak > 0) setFreezeModalVisible(true);
              }}
            />
          </View>

          {/* Featured courses — active courses in progress, then recommended starters */}
          {courses.length > 0 && (
            <CourseCarousel
              courses={courses}
              lessons={lessons}
              completedIds={completedIds}
              // userLevel: wire once first-run "choose your level" ships; falls back
              // to the flagship Izon starting course until then.
            />
          )}

          {/* Explore all courses */}
          <ExploreAllRow courses={courses} />

          {/* Today's Gallery — doorway to practice, games & cultural content */}
          <TodaysGalleryCard />

          {/* Daily Read */}
          <DailyReadCard entry={wotd} />

          {/* Library teaser — rotating featured media item */}
          <LibraryTeaser />

          {/* Jump Back In — resume last partially-played lesson */}
          {resumeState?.lessonId && (
            <View style={{ paddingHorizontal: 20 }}>
              <Eyebrow
                label={t("learn.jumpBackIn", { defaultValue: "Jump Back In" })}
                style={{ marginBottom: 8 }}
              />
              <ContinueCard />
            </View>
          )}

          {/* Empty state */}
          {courses.length === 0 && (
            <View className="items-center justify-center px-8 py-16">
              <IconSymbol name="book.fill" size={44} color={M.muted} />
              <Text style={{ marginTop: 16, textAlign: "center", fontSize: 14, color: M.sub }}>
                {t("learn.noCourses")}
              </Text>
            </View>
          )}
        </ScrollView>
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
