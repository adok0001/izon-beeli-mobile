import { DailyChallengeCards } from "@/components/daily-challenge-card";
import { EnrolledLanguageBar } from "@/components/language-picker";
import { animStyle } from "@/components/learn/anim";
import { LearnHeader } from "@/components/learn/learn-header";
import { LoadingScreen } from "@/components/loading-screen";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { StreakFreezeModal } from "@/components/streak-freeze-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UpNextCard } from "@/components/up-next-card";
import { WordChallengeCard } from "@/components/word-challenge-card";
import { getAccent } from "@/constants/accent-colors";
import { useBounties } from "@/lib/hooks/use-bounties";
import { useLanguageLessons, useLesson } from "@/lib/hooks/use-courses";
import { useTodayChallenges } from "@/lib/hooks/use-daily-challenge";
import { useCompletedLessons, useProgressSummary } from "@/lib/hooks/use-progress";
import { useToast } from "@/lib/hooks/use-toast";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { localizeField } from "@/lib/localize";
import { BUNDLED_AUDIO, formatDuration } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useTourStore } from "@/store/tour-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Lesson } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        await loadAndPlay(lessonId, audioSource, lesson.title, `/lesson/${lessonId}`);
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
          borderLeftColor: M.success,
          backgroundColor: M.successBg,
          borderWidth: 1,
          borderColor: M.successBorder,
        }}
        className="mb-3 p-4 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`Continue listening: ${localizeField(lesson.title, lesson.titleFr, uiLanguage)}, paused at ${posLabel}`}
        accessibilityHint="Tap to resume playback"
      >
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: M.success, borderRadius: 12 }}
            className="mr-3 h-12 w-12 items-center justify-center"
          >
            <IconSymbol name="play.fill" size={20} color={M.ink} />
          </View>
          <View className="flex-1">
            <Text style={{ color: M.success, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 }}>
              {t("learn.continueListening").toUpperCase()}
            </Text>
            <Text className="mt-0.5 text-base font-bold text-neutral-900 dark:text-white" numberOfLines={1}>
              {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("learn.pausedAt", { time: posLabel })}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={M.success} />
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
          backgroundColor: completed ? M.successBg : "transparent",
          borderWidth: 1.5,
          borderColor: completed ? M.success : M.border,
        }}
      >
        {completed && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: M.success }} />
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

// ─── LevelSection ──────────────────────────────────────────────────────────
const LEVEL_ACCENT: Record<string, string> = {
  beginner: "#10b981",
  intermediate: "#f59e0b",
  advanced: "#8b5cf6",
};

const LevelSection = memo(function LevelSection({
  level,
  theme,
  lessons,
  completedIds,
  index,
}: {
  level: string;
  theme: string | null;
  lessons: Lesson[];
  completedIds: Set<string>;
  index: number;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const anim = useRef(new Animated.Value(0)).current;
  const accentColor = LEVEL_ACCENT[level] ?? M.accent;
  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ marginBottom: 16 }, animStyle(anim, 20)]}>
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
        {/* Section header */}
        <View className="p-4 pb-2">
          <View className="mb-2 flex-row items-center justify-between">
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
              <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase", color: accentColor }}>
                {t(`levels.${level}`, { defaultValue: level })}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: M.textDimDark }}>
              {completedCount}/{lessons.length}
            </Text>
          </View>
          {theme ? (
            <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, letterSpacing: -0.2, marginBottom: 2 }}>
              {theme}
            </Text>
          ) : null}
        </View>

        {/* Lessons */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              completed={completedIds.has(lesson.id)}
              onPress={() => router.push(`/lesson/${lesson.id}`)}
            />
          ))}
        </View>
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
  const bountyAccent = getAccent("amber");

  const visible = bounties?.filter((b) => b.status === "active") ?? [];
  if (visible.length === 0) return null;

  const preview = visible.slice(0, 4);

  return (
    <View>
      {/* Header row */}
      <Pressable
        onPress={() => router.push("/bounties")}
        className="active:opacity-70"
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`View all ${visible.length} bounties`}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <IconSymbol name="star.fill" size={13} color={bountyAccent.solid} />
          <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.6, color: bountyAccent.solid }}>
            {t("learn.bountyLabel").toUpperCase()}
          </Text>
          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: 7,
              paddingVertical: 2,
              backgroundColor: bountyAccent.border,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: bountyAccent.solid }}>
              {visible.length}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: bountyAccent.solid }}>
            {t("learn.seeAll", { defaultValue: "See all" })}
          </Text>
          <IconSymbol name="chevron.right" size={11} color={bountyAccent.solid} />
        </View>
      </Pressable>

      {/* Horizontal scroll of bounty cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 4 }}
      >
        {preview.map((bounty) => {
          const progress = Math.min(bounty.progressPercent / 100, 1);
          return (
            <Pressable
              key={bounty.id}
              onPress={() => router.push("/bounties")}
              style={{
                width: 168,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: bountyAccent.border,
                borderTopWidth: 3,
                borderTopColor: bountyAccent.solid,
                backgroundColor: bountyAccent.bg,
                padding: 12,
              }}
              className="active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={`${bounty.title}, earn ${bounty.xpReward} XP, ${bounty.currentCount} of ${bounty.targetCount} complete`}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: M.text, flex: 1, marginRight: 6, lineHeight: 16 }}
                  numberOfLines={2}
                >
                  {bounty.title}
                </Text>
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    backgroundColor: bountyAccent.border,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "800", color: bountyAccent.solid }}>
                    +{bounty.xpReward}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={{ height: 3, borderRadius: 2, backgroundColor: `${bountyAccent.solid}25`, overflow: "hidden" }}>
                <View
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    backgroundColor: progress >= 1 ? M.success : bountyAccent.solid,
                    width: `${Math.round(progress * 100)}%`,
                  }}
                />
              </View>

              <Text style={{ marginTop: 5, fontSize: 10, color: bountyAccent.solid, fontWeight: "600" }}>
                {bounty.currentCount}/{bounty.targetCount}
                {bounty.category ? ` · ${bounty.category}` : ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Group lessons by level then theme for the learn tab
type LevelGroup = { level: string; theme: string | null; lessons: Lesson[] };

function groupLessonsByLevelTheme(lessons: Lesson[]): LevelGroup[] {
  const map = new Map<string, LevelGroup>();
  for (const lesson of lessons) {
    const level = lesson.level ?? "beginner";
    const theme = lesson.theme ?? null;
    const key = `${level}::${theme ?? ""}`;
    if (!map.has(key)) map.set(key, { level, theme, lessons: [] });
    map.get(key)!.lessons.push(lesson);
  }
  return Array.from(map.values());
}

// ─── LearnScreen ───────────────────────────────────────────────────────────
export default function LearnScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);
  const {
    data: allLessons = [],
    isLoading: lessonsLoading,
    refetch: refetchLessons,
  } = useLanguageLessons(selectedLanguageId ?? "");
  const {
    data: completedLessonIds,
    isLoading: progressLoading,
    refetch,
  } = useCompletedLessons();
  const { data: summary, refetch: refetchSummary } = useProgressSummary();
  const { refetch: refetchDue } = useWordsDueForReview(selectedLanguageId);
  const { data: todayChallenges = [] } = useTodayChallenges();

  const completedIds = useMemo(
    () => new Set(completedLessonIds ?? []),
    [completedLessonIds]
  );
  const completedToday = useMemo(
    () => todayChallenges.filter((c) => c.completed).length,
    [todayChallenges]
  );
  const levelGroups = useMemo(() => groupLessonsByLevelTheme(allLessons), [allLessons]);

  const [refreshing, setRefreshing] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const freezeChecked = useRef(false);
  const goalCelebrationChecked = useRef(false);
  const { toast, success: toastSuccess, dismiss: dismissToast } = useToast();
  const resumeState = useAudioStore((s) => s.resumeState);
  const loadResumeState = useAudioStore((s) => s.loadResumeState);
  const activeTour = useTourStore((s) => s.activeTour);

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

  const isLoading = lessonsLoading || progressLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSummary(), refetchLessons(), refetchDue()]);
    setRefreshing(false);
  }, [refetch, refetchSummary, refetchLessons, refetchDue]);

  const onStreakPress = useCallback(() => {
    if (summary?.streakBroken && summary.streak > 0) setFreezeModalVisible(true);
  }, [summary?.streakBroken, summary?.streak]);
  const onGoalPress = useCallback(() => setGoalModalVisible(true), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* ── Museum Foyer Header — exhibition placard ── */}
      <LearnHeader
        summary={summary}
        completedToday={completedToday}
        selectedLanguageId={selectedLanguageId}
        onStreakPress={onStreakPress}
        onGoalPress={onGoalPress}
      />

      {/* Language selector — sits at the boundary */}
      <View style={{ backgroundColor: M.card, borderBottomWidth: 1, borderBottomColor: M.border }}>
        <EnrolledLanguageBar />
      </View>

      {/* ── Gallery Content ── */}
      <View style={{ flex: 1, backgroundColor: M.card }}>
        {isLoading ? (
          <LoadingScreen />
        ) : levelGroups.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <IconSymbol name="book.fill" size={44} color="rgba(255,255,255,0.1)" />
            <Text style={{ marginTop: 16, textAlign: "center", fontSize: 14, color: M.textDimDark }}>
              {t("learn.noCourses")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={levelGroups}
            keyExtractor={(item) => `${item.level}::${item.theme ?? ""}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16 }}
            renderItem={({ item, index }) => (
              <LevelSection
                level={item.level}
                theme={item.theme}
                lessons={item.lessons}
                completedIds={completedIds}
                index={index}
              />
            )}
            ListHeaderComponent={
              <View style={{ gap: 10, marginBottom: 16 }}>
                {resumeState && resumeState.positionSeconds > 5 && (
                  <ContinueCard
                    lessonId={resumeState.lessonId}
                    positionSeconds={resumeState.positionSeconds}
                  />
                )}
                <UpNextCard languageId={selectedLanguageId} />
                <BountyTeaser languageId={selectedLanguageId ?? ""} />
                <WordChallengeCard languageId={selectedLanguageId ?? ""} />
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
              width: 40, height: 4, borderRadius: 2,
              backgroundColor: M.border, alignSelf: "center", marginBottom: 16,
            }}
          />
          <Text
            style={{
              marginBottom: 20, textAlign: "center",
              fontSize: 17, fontWeight: "800", color: M.parchment,
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
