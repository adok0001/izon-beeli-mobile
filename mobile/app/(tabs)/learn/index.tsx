import { ContributionSpotlightCard } from "@/components/contribution-spotlight-card";
import { EnrolledLanguageBar } from "@/components/language-picker";
import { WordChallengeCard } from "@/components/word-challenge-card";
import { LoadingScreen } from "@/components/loading-screen";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { NotificationBell } from "@/components/notifications/notification-center";
import { StreakFreezeModal } from "@/components/streak-freeze-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UpNextCard } from "@/components/up-next-card";
import { getCourseTypeColors, getLevelColors } from "@/constants/course-colors";
import { useBounties } from "@/lib/hooks/use-bounties";
import { useCourseLessons, useCourses, useLesson } from "@/lib/hooks/use-courses";
import { type DailyGoal, useCurrentUser, useUpdateDailyGoal } from "@/lib/hooks/use-current-user";
import { useTodayChallenges } from "@/lib/hooks/use-daily-challenge";
import { useCompletedLessons, useProgressSummary } from "@/lib/hooks/use-progress";
import { useStoryArcs } from "@/lib/hooks/use-story-arc";
import { useToast } from "@/lib/hooks/use-toast";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { localizeField } from "@/lib/localize";
import { BUNDLED_AUDIO, formatDuration } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useTourStore } from "@/store/tour-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, Lesson } from "@/types";
import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useMountAnimation(count = 1, stagger = 80) {
  const anims = useRef(
    Array.from({ length: count }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.stagger(
      stagger,
      anims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })
      )
    ).start();
  }, []);

  return anims;
}

function animStyle(anim: Animated.Value, offsetY = 18) {
  return {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [offsetY, 0],
        }),
      },
    ],
  };
}

const GOAL_OPTIONS: { id: DailyGoal; icon: string; labelKey: string; detailKey: string }[] = [
  { id: "casual",    icon: "leaf.fill",  labelKey: "onboarding.goalCasual",    detailKey: "onboarding.goalCasualDetail" },
  { id: "steady",    icon: "flame.fill", labelKey: "onboarding.goalSteady",    detailKey: "onboarding.goalSteadyDetail" },
  { id: "intensive", icon: "bolt.fill",  labelKey: "onboarding.goalIntensive", detailKey: "onboarding.goalIntensiveDetail" },
];

// ─── DailyGoalRing ─────────────────────────────────────────────────────────
function DailyGoalRing({ completedToday }: { completedToday: number }) {
  const M = useMuseumTheme();
  const target = 3;
  const pct = Math.min(completedToday / target, 1);
  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  const color = pct >= 1 ? "#4ade80" : M.accent;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 8, fontWeight: "800", color }}>
        {completedToday}/{target}
      </Text>
    </View>
  );
}

// ─── ContinueCard ──────────────────────────────────────────────────────────
const ContinueCard = memo(function ContinueCard({
  lessonId,
  positionSeconds,
}: {
  lessonId: string;
  positionSeconds: number;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { data: lesson } = useLesson(lessonId);
  const { loadAndPlay, seekTo, currentTrackId } = useAudioStore();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  if (!lesson) return null;

  const audioSource = lesson.audioUrl ?? BUNDLED_AUDIO[lesson.id];
  const mins = Math.floor(positionSeconds / 60);
  const secs = Math.floor(positionSeconds % 60);
  const posLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const handleResume = async () => {
    if (audioSource) {
      if (currentTrackId !== lessonId) {
        await loadAndPlay(lessonId, audioSource, lesson.title);
        await seekTo(positionSeconds);
      } else {
        await seekTo(positionSeconds);
      }
    }
    router.push(`/lesson/${lessonId}`);
  };

  return (
    <Animated.View style={animStyle(anim)}>
      <Pressable
        onPress={handleResume}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          borderLeftWidth: 4,
          borderLeftColor: "#4ade80",
          backgroundColor: "rgba(74, 222, 128, 0.06)",
          borderWidth: 1,
          borderColor: "rgba(74, 222, 128, 0.15)",
        }}
        className="mb-3 p-4 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`Continue listening: ${localizeField(lesson.title, lesson.titleFr, uiLanguage)}, paused at ${posLabel}`}
        accessibilityHint="Tap to resume playback"
      >
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: "#22c55e", borderRadius: 12 }}
            className="mr-3 h-12 w-12 items-center justify-center"
          >
            <IconSymbol name="play.fill" size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text style={{ color: "#4ade80", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 }}>
              {t("learn.continueListening").toUpperCase()}
            </Text>
            <Text className="mt-0.5 text-base font-bold text-neutral-900 dark:text-white" numberOfLines={1}>
              {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("learn.pausedAt", { time: posLabel })}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color="#22c55e" />
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ─── LessonRow ─────────────────────────────────────────────────────────────
function LessonRow({
  lesson,
  completed,
  onPress,
}: {
  lesson: Lesson;
  completed: boolean;
  onPress: () => void;
}) {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();

  return (
    <Pressable
      onPress={onPress}
      style={{ borderTopWidth: 1, borderTopColor: M.border }}
      className="flex-row items-center py-3 active:opacity-60"
      accessibilityRole="button"
      accessibilityLabel={`${localizeField(lesson.title, lesson.titleFr, uiLanguage)}${completed ? ", completed" : ""}`}
      accessibilityHint="Tap to open lesson"
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: completed ? "rgba(74, 222, 128, 0.15)" : "transparent",
          borderWidth: 1.5,
          borderColor: completed ? "#4ade80" : M.border,
        }}
      >
        {completed && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" }} />
        )}
      </View>
      <View className="ml-3 flex-1">
        <Text
          style={{
            fontSize: 13,
            fontWeight: completed ? "500" : "600",
            color: completed ? M.muted : M.text,
            opacity: completed ? 0.6 : 1,
          }}
          numberOfLines={1}
        >
          {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
        </Text>
        {lesson.description ? (
          <Text style={{ fontSize: 11, color: M.textDimDark, marginTop: 1 }} numberOfLines={1}>
            {localizeField(lesson.description, lesson.descriptionFr, uiLanguage)}
          </Text>
        ) : null}
      </View>
      {lesson.duration && (
        <Text style={{ fontSize: 11, color: M.textDimDark, marginRight: 6 }}>
          {formatDuration(lesson.duration)}
        </Text>
      )}
      <IconSymbol name="chevron.right" size={14} color={M.textDimDark} />
    </Pressable>
  );
}

// ─── CourseCard ────────────────────────────────────────────────────────────
const CourseCard = memo(function CourseCard({
  course,
  completedIds,
  hasStoryArc,
  index,
}: {
  course: Course;
  completedIds: Set<string>;
  hasStoryArc: boolean;
  index: number;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { data: lessons = [], isLoading: lessonsLoading } = useCourseLessons(course.id);
  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const [collapsed, setCollapsed] = useState(false);
  const typeColors = getCourseTypeColors(course.courseType);
  const levelColors = getLevelColors(course.level);
  const anim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay: index * 90,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!collapsed) {
      Animated.timing(progressAnim, {
        toValue: progressPercent,
        duration: 700,
        delay: index * 90 + 200,
        useNativeDriver: false,
      }).start();
    }
  }, [collapsed, progressPercent]);

  const accentColor = typeColors.tickActive ?? M.accent;

  return (
    <Animated.View style={[{ marginBottom: 16 }, animStyle(anim, 24)]}>
      <View
        style={{
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.borderDark,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
        }}
      >
        {/* Header */}
        <Pressable
          onPress={() => setCollapsed((c) => !c)}
          className="p-4 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={`${localizeField(course.title, course.titleFr, uiLanguage)}, ${completedCount} of ${lessons.length} lessons completed`}
          accessibilityHint={collapsed ? "Tap to expand course" : "Tap to collapse course"}
          accessibilityState={{ expanded: !collapsed }}
        >
          {/* Top row: level badge + count */}
          <View className="mb-2.5 flex-row items-center justify-between">
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: `${accentColor}20`,
                borderWidth: 1,
                borderColor: `${accentColor}40`,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "800",
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                  color: accentColor,
                }}
              >
                {t(`levels.${course.level}`, { defaultValue: course.level })}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text style={{ fontSize: 11, color: M.textDimDark }}>
                {completedCount}/{lessons.length}
              </Text>
              <IconSymbol
                name={collapsed ? "chevron.right" : "chevron.down"}
                size={12}
                color={M.textDimDark}
              />
            </View>
          </View>

          {/* Title */}
          <Text
            style={{ fontSize: 18, fontWeight: "800", color: M.text, letterSpacing: -0.3, marginBottom: 4 }}
          >
            {localizeField(course.title, course.titleFr, uiLanguage)}
          </Text>
          <Text style={{ fontSize: 13, color: M.textDim, lineHeight: 18 }} numberOfLines={2}>
            {localizeField(course.description, course.descriptionFr, uiLanguage)}
          </Text>

          {/* Course type badge */}
          {course.courseType && typeColors.label ? (
            <View
              style={{
                marginTop: 10,
                alignSelf: "flex-start",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: `${accentColor}18`,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: accentColor }}>
                {typeColors.label}
              </Text>
            </View>
          ) : null}

          {/* Progress bar */}
          {progressPercent > 0 && (
            <View style={{ marginTop: 14 }}>
              <View
                style={{
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <Animated.View
                  style={{
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: accentColor,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                  }}
                />
              </View>
              {progressPercent >= 100 && (
                <Text style={{ marginTop: 4, fontSize: 10, fontWeight: "700", color: "#4ade80", textAlign: "right" }}>
                  {t("learn.complete")}
                </Text>
              )}
            </View>
          )}
        </Pressable>

        {/* Lessons + Actions */}
        {!collapsed && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {lessonsLoading ? (
              <ActivityIndicator size="small" color={accentColor} style={{ paddingVertical: 12 }} />
            ) : (
              lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  completed={completedIds.has(lesson.id)}
                  onPress={() => router.push(`/lesson/${lesson.id}`)}
                />
              ))
            )}

            {/* Action buttons */}
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => router.push({ pathname: "/quiz", params: { courseId: course.id } })}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: `${accentColor}40`,
                  backgroundColor: `${accentColor}10`,
                  gap: 6,
                }}
                className="active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={t("learn.practiceQuiz")}
              >
                <IconSymbol name="trophy.fill" size={14} color={accentColor} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: accentColor }}>
                  {t("learn.practiceQuiz")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push({ pathname: "/matching-game", params: { courseId: course.id } })}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: "rgba(139, 92, 246, 0.35)",
                  backgroundColor: "rgba(139, 92, 246, 0.08)",
                  gap: 6,
                }}
                className="active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={t("learn.matchingGame")}
              >
                <IconSymbol name="rectangle.grid.2x2" size={14} color="#8b5cf6" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#8b5cf6" }}>
                  {t("learn.matchingGame")}
                </Text>
              </Pressable>
            </View>

            {hasStoryArc && (
              <Pressable
                onPress={() => router.push(`/story/${course.id}` as any)}
                style={{
                  marginTop: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: "rgba(245, 158, 11, 0.35)",
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  gap: 6,
                }}
                className="active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={t("learn.storyMode")}
              >
                <IconSymbol name="book.fill" size={14} color="#f59e0b" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#f59e0b" }}>
                  {t("learn.storyMode")}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
});

// ─── BountyTeaser ──────────────────────────────────────────────────────────
function BountyTeaser({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: bounties } = useBounties(languageId);
  const topBounty = bounties?.[0];

  if (!topBounty) return null;

  return (
    <Pressable
      onPress={() => router.push("/bounties")}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(245, 158, 11, 0.25)",
        borderLeftWidth: 4,
        borderLeftColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.07)",
        padding: 14,
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`Bounty: ${topBounty.title}, earn ${topBounty.xpReward} XP`}
      accessibilityHint="Tap to view all bounties"
    >
      <View className="flex-row items-center">
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            marginRight: 12,
          }}
        >
          <IconSymbol name="star.fill" size={17} color="#f59e0b" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: "#f59e0b" }}>
              {t("learn.bountyLabel").toUpperCase()}
            </Text>
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 7,
                paddingVertical: 1.5,
                backgroundColor: "rgba(245, 158, 11, 0.2)",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#f59e0b" }}>
                +{topBounty.xpReward} XP
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: M.text, marginTop: 2 }} numberOfLines={1}>
            {topBounty.title}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={14} color="#f59e0b" />
      </View>
    </Pressable>
  );
}

// ─── LearnScreen ───────────────────────────────────────────────────────────
export default function LearnScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const avatarInitial = (user?.username ?? "L")[0]?.toUpperCase() ?? "L";
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);
  const {
    data: courses = [],
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useCourses(selectedLanguageId);
  const {
    data: completedLessonIds,
    isLoading: progressLoading,
    refetch,
  } = useCompletedLessons();
  const { data: summary, refetch: refetchSummary } = useProgressSummary();
  const { refetch: refetchDue } = useWordsDueForReview(selectedLanguageId);
  const { data: todayChallenges = [] } = useTodayChallenges();
  const { data: storyArcSummaries = [] } = useStoryArcs();

  const storyArcCourseIds = useMemo(
    () => new Set(storyArcSummaries.map((a) => a.courseId)),
    [storyArcSummaries]
  );
  const completedIds = useMemo(
    () => new Set(completedLessonIds ?? []),
    [completedLessonIds]
  );
  const completedToday = useMemo(
    () => todayChallenges.filter((c) => c.completed).length,
    [todayChallenges]
  );

  const [refreshing, setRefreshing] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const { currentUser } = useCurrentUser();
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

  const DAILY_GOAL = 3;
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
    await Promise.all([refetch(), refetchSummary(), refetchCourses(), refetchDue()]);
    setRefreshing(false);
  }, [refetch, refetchSummary, refetchCourses, refetchDue]);

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
