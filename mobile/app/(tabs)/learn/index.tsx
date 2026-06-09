import { ContributionSpotlightCard } from "@/components/contribution-spotlight-card";
import { EnrolledLanguageBar } from "@/components/language-picker";
import { BountyTeaser } from "@/components/learn/bounty-teaser";
import { ContinueCard } from "@/components/learn/continue-card";
import { CourseCard } from "@/components/learn/course-card";
import { DailyGoalRing } from "@/components/learn/daily-goal-ring";
import { animStyle, useMountAnimation } from "@/components/learn/anim";
import { LoadingScreen } from "@/components/loading-screen";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { NotificationBell } from "@/components/notifications/notification-center";
import { StreakFreezeModal } from "@/components/streak-freeze-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UpNextCard } from "@/components/up-next-card";
import { WordChallengeCard } from "@/components/word-challenge-card";
import { type DailyGoal, useCurrentUser, useUpdateDailyGoal } from "@/lib/hooks/use-current-user";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useTourStore } from "@/store/tour-store";
import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLearnData } from "./use-learn-data";

const GOAL_OPTIONS: { id: DailyGoal; icon: string; labelKey: string; detailKey: string }[] = [
  { id: "casual",    icon: "leaf.fill",  labelKey: "onboarding.goalCasual",    detailKey: "onboarding.goalCasualDetail" },
  { id: "steady",    icon: "flame.fill", labelKey: "onboarding.goalSteady",    detailKey: "onboarding.goalSteadyDetail" },
  { id: "intensive", icon: "bolt.fill",  labelKey: "onboarding.goalIntensive", detailKey: "onboarding.goalIntensiveDetail" },
];

const DAILY_GOAL = 3;

export default function LearnScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const avatarInitial = (user?.username ?? "L")[0]?.toUpperCase() ?? "L";
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);

  const {
    courses,
    coursesLoading,
    progressLoading,
    summary,
    completedToday,
    storyArcCourseIds,
    completedIds,
    refetchSummary,
    refetchAll,
  } = useLearnData(selectedLanguageId);

  const [refreshing, setRefreshing] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const updateDailyGoal = useUpdateDailyGoal();
  const freezeChecked = useRef(false);
  const goalCelebrationChecked = useRef(false);
  const { toast, success: toastSuccess, dismiss: dismissToast } = useToast();
  const resumeState = useAudioStore((s) => s.resumeState);
  const loadResumeState = useAudioStore((s) => s.loadResumeState);
  const activeTour = useTourStore((s) => s.activeTour);

  // Entrance animations
  const [titleAnim, subtitleAnim, statsAnim] = useMountAnimation(3, 70);

  useEffect(() => {
    loadResumeState();
  }, []);

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
    AsyncStorage.getItem("streak-freeze-shown").then((lastShown) => {
      if (lastShown === today) return;
      AsyncStorage.setItem("streak-freeze-shown", today).catch(() => {});
      setFreezeModalVisible(true);
    }).catch(() => {});
  }, [summary?.streakBroken, summary?.streak, activeTour]);

  useEffect(() => {
    if (completedToday < DAILY_GOAL || goalCelebrationChecked.current) return;
    goalCelebrationChecked.current = true;
    const today = new Date().toISOString().slice(0, 10);
    AsyncStorage.getItem("daily-goal-celebration-shown").then((lastShown) => {
      if (lastShown === today) return;
      AsyncStorage.setItem("daily-goal-celebration-shown", today).catch(() => {});
      toastSuccess(t("dailyGoal.celebrationTitle"), t("dailyGoal.celebrationBody"));
    }).catch(() => {});
  }, [completedToday]);

  const isLoading = coursesLoading || progressLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  }, [refetchAll]);

  const streakActive = !summary?.streakBroken && summary?.refreshedToday !== false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* ── Museum Foyer Header ── */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        {/* Top row: title + actions */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Animated.Text
              style={[
                {
                  fontSize: 32,
                  fontWeight: "900",
                  color: M.parchment,
                  letterSpacing: -0.5,
                  lineHeight: 36,
                },
                animStyle(titleAnim, 12),
              ]}
            >
              {t("learn.title")}
            </Animated.Text>
            <Animated.Text
              style={[
                { fontSize: 13, color: M.textDim, marginTop: 4 },
                animStyle(subtitleAnim, 10),
              ]}
              numberOfLines={1}
            >
              {t("learn.subtitle")}
            </Animated.Text>
          </View>

          <View className="flex-row items-center gap-1.5 mt-1">
            <NotificationBell />
            <Pressable
              onPress={() => router.push("/quiz")}
              style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(196, 134, 42, 0.15)",
                borderWidth: 1, borderColor: "rgba(196, 134, 42, 0.3)",
              }}
              accessibilityRole="button"
              accessibilityLabel="Practice quiz"
            >
              <IconSymbol name="trophy.fill" size={16} color={M.accent} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/dictionary")}
              style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.07)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
              }}
              accessibilityRole="button"
              accessibilityLabel="Dictionary"
            >
              <IconSymbol name="character.book.closed" size={16} color={M.textDim} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: "center", justifyContent: "center",
                backgroundColor: M.accent,
              }}
              accessibilityRole="button"
              accessibilityLabel="Profile"
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: M.ink }}>{avatarInitial}</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats row — specimen labels */}
        <Animated.View style={[{ marginTop: 20, flexDirection: "row", gap: 8 }, animStyle(statsAnim, 8)]}>
          {/* Streak */}
          <Pressable
            onPress={() =>
              summary?.streakBroken && summary.streak > 0 && setFreezeModalVisible(true)
            }
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
            accessibilityRole="button"
            accessibilityLabel={`${summary?.streakBroken ? "Broken streak" : "Streak"}: ${summary?.streak ?? 0} days`}
          >
            <IconSymbol
              name="flame.fill"
              size={15}
              color={streakActive ? "#FB923C" : "rgba(255,255,255,0.2)"}
            />
            <View>
              <Text style={{ fontSize: 9, fontWeight: "700", letterSpacing: 1.2, color: M.textDimDark }}>
                STREAK
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: streakActive ? M.parchment : "rgba(255,255,255,0.25)",
                  textDecorationLine: summary?.streakBroken ? "line-through" : "none",
                }}
              >
                {summary?.streak ?? 0}d
              </Text>
            </View>
            {(summary?.freezeCount ?? 0) > 0 && (
              <View
                style={{
                  marginLeft: "auto",
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 999,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                  gap: 3,
                }}
              >
                <IconSymbol name="snowflake" size={9} color="#60a5fa" />
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#60a5fa" }}>
                  {summary!.freezeCount}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Divider */}
          <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />

          {/* Daily goal */}
          <Pressable
            onPress={() => setGoalPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Daily goal"
            className="active:opacity-70"
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <DailyGoalRing completedToday={completedToday} />
            <View>
              <Text style={{ fontSize: 9, fontWeight: "700", letterSpacing: 1.2, color: M.textDimDark }}>
                DAILY GOAL
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "800", color: M.parchment }}>
                {completedToday}
                <Text style={{ fontSize: 12, fontWeight: "500", color: M.textDimDark }}>/3</Text>
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Language selector — sits at the boundary */}
      <View style={{ backgroundColor: M.card, borderBottomWidth: 1, borderBottomColor: M.border }}>
        <EnrolledLanguageBar />
      </View>

      {/* ── Gallery Content ── */}
      <View style={{ flex: 1, backgroundColor: M.card }}>
        {isLoading ? (
          <LoadingScreen />
        ) : courses.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <IconSymbol name="book.fill" size={44} color="rgba(255,255,255,0.1)" />
            <Text style={{ marginTop: 16, textAlign: "center", fontSize: 14, color: M.textDimDark }}>
              {t("learn.noCourses")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16 }}
            renderItem={({ item, index }) => (
              <CourseCard
                course={item}
                completedIds={completedIds}
                hasStoryArc={storyArcCourseIds.has(item.id)}
                index={index}
              />
            )}
            ListHeaderComponent={
              <View style={{ gap: 10, marginBottom: 16 }}>
                {resumeState &&
                  resumeState.positionSeconds > 5 &&
                  resumeState.languageId === selectedLanguageId && (
                  <ContinueCard
                    lessonId={resumeState.lessonId}
                    positionSeconds={resumeState.positionSeconds}
                  />
                )}
                <UpNextCard languageId={selectedLanguageId} />
                <BountyTeaser languageId={selectedLanguageId ?? ""} />
                <WordChallengeCard languageId={selectedLanguageId ?? ""} />
                <ContributionSpotlightCard />
              </View>
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={M.accent}
                colors={[M.accent]}
              />
            }
          />
        )}
      </View>

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

      {/* Goal picker */}
      <Modal visible={goalPickerVisible} transparent animationType="slide" onRequestClose={() => setGoalPickerVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={() => setGoalPickerVisible(false)} />
        <View
          style={{
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            backgroundColor: M.ink,
            borderTopWidth: 1, borderTopColor: M.border,
            paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: M.border, alignSelf: "center", marginBottom: 16 }} />
          <Text style={{ marginBottom: 20, textAlign: "center", fontSize: 17, fontWeight: "800", color: M.parchment }}>
            {t("profile.dailyGoal")}
          </Text>
          {GOAL_OPTIONS.map((opt) => {
            const selected = currentUser?.dailyGoal === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => { updateDailyGoal.mutate(opt.id); setGoalPickerVisible(false); }}
                style={{
                  marginBottom: 10, flexDirection: "row", alignItems: "center",
                  borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? M.accent : M.border,
                  backgroundColor: selected ? `${M.accent}10` : M.card,
                }}
                className="active:opacity-70"
              >
                <View
                  style={{
                    marginRight: 14, width: 42, height: 42, borderRadius: 21,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: selected ? M.accent : M.border,
                  }}
                >
                  <IconSymbol name={opt.icon as any} size={18} color={selected ? M.ink : M.sub} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? M.accent : M.text }}>
                    {t(opt.labelKey as any)}
                  </Text>
                  <Text style={{ fontSize: 12, color: M.sub, marginTop: 2 }}>{t(opt.detailKey as any)}</Text>
                </View>
                {selected && <IconSymbol name="checkmark.circle.fill" size={20} color={M.accent} />}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
