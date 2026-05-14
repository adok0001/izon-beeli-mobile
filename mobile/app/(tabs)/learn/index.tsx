import { EnrolledLanguageBar } from "@/components/language-picker";
import { NotificationBell } from "@/components/notifications/notification-center";

import { StreakFreezeModal } from "@/components/streak-freeze-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UpNextCard } from "@/components/up-next-card";
import { XpLevelBadge } from "@/components/xp-level-badge";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getStoryForCourse } from "@/lib/data/stories";
import { useBounties } from "@/lib/hooks/use-bounties";
import { useCourseLessons, useCourses, useLesson } from "@/lib/hooks/use-courses";
import { useTodayChallenges } from "@/lib/hooks/use-daily-challenge";
import { useCompletedLessons, useProgressSummary } from "@/lib/hooks/use-progress";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { localizeField } from "@/lib/localize";
import { BUNDLED_AUDIO, formatDuration } from "@/lib/mock-data";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
// TODO: Legacy tour import (soft-retired) — remove after full deprecation
import { useTourStore } from "@/store/tour-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, Lesson } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

function ContinueCard({ lessonId, positionSeconds }: { lessonId: string; positionSeconds: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { data: lesson } = useLesson(lessonId);
  const { loadAndPlay, seekTo, currentTrackId } = useAudioStore();

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
    <Pressable
      onPress={handleResume}
      className="mb-3 rounded-2xl bg-emerald-50 p-4 active:opacity-70 dark:bg-emerald-950"
      accessibilityRole="button"
      accessibilityLabel={`Continue listening: ${localizeField(lesson.title, lesson.titleFr, uiLanguage)}, paused at ${posLabel}`}
      accessibilityHint="Tap to resume playback"
    >
      <View className="flex-row items-center">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
          <IconSymbol name="play.fill" size={22} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            {t("learn.continueListening")}
          </Text>
          <Text className="text-base font-bold text-neutral-900 dark:text-white" numberOfLines={1}>
            {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("learn.pausedAt", { time: posLabel })}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color="#10b981" />
      </View>
    </Pressable>
  );
}

function CourseCard({ course, completedIds }: { course: Course; completedIds: Set<string> }) {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { uiLanguage } = useUiLanguageStore();
  const { data: lessons = [], isLoading: lessonsLoading } = useCourseLessons(course.id);
  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;
  const progressPercent =
    lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View className="mb-4 overflow-hidden rounded-2xl bg-neutral-50 dark:bg-neutral-800">
      {/* Tappable header — always visible */}
      <Pressable
        onPress={() => setCollapsed((c) => !c)}
        className="p-4 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`${localizeField(course.title, course.titleFr, uiLanguage)}, ${completedCount} of ${lessons.length} lessons completed`}
        accessibilityHint={collapsed ? "Tap to expand course" : "Tap to collapse course"}
        accessibilityState={{ expanded: !collapsed }}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <View className="rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900">
            <Text className="text-xs font-semibold capitalize text-blue-700 dark:text-blue-300">
              {t(`levels.${course.level}`, { defaultValue: course.level })}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {t("learn.lessonsCount", { done: completedCount, total: lessons.length })}
            </Text>
            <IconSymbol
              name={collapsed ? "chevron.right" : "chevron.down"}
              size={13}
              color="#9ca3af"
            />
          </View>
        </View>

        <Text className="mb-1 text-lg font-bold text-neutral-900 dark:text-white">
          {localizeField(course.title, course.titleFr, uiLanguage)}
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={2}>
          {localizeField(course.description, course.descriptionFr, uiLanguage)}
        </Text>

        {progressPercent > 0 && (
          <View className="mt-3">
            <View className="relative h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
              <View
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${progressPercent}%` }}
              />
              {[25, 50, 75].map((pct) => {
                const inactiveColor = colorScheme === "dark" ? "#4b5563" : "#d1d5db";
                const tickColor = progressPercent >= pct ? "#93c5fd" : inactiveColor;
                return (
                  <View
                    key={pct}
                    className="absolute top-0 h-2 w-0.5"
                    style={{ left: `${pct}%`, backgroundColor: tickColor }}
                  />
                );
              })}
            </View>
            {progressPercent >= 100 && (
              <Text className="mt-1 text-right text-xs font-semibold text-green-600 dark:text-green-400">
                {t("learn.complete")}
              </Text>
            )}
          </View>
        )}
      </Pressable>

      {/* Collapsible: lessons + actions */}
      {!collapsed && (
        <View className="px-4 pb-4">
          {lessonsLoading ? (
            <ActivityIndicator size="small" color="#3b82f6" />
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

          <View className="mt-2 flex-row gap-2">
            <Pressable
              onPress={() =>
                router.push({ pathname: "/quiz", params: { courseId: course.id } })
              }
              className="flex-1 flex-row items-center justify-center rounded-lg border border-blue-200 py-2.5 active:opacity-70 dark:border-blue-800"
              accessibilityRole="button"
              accessibilityLabel={t("learn.practiceQuiz")}
              accessibilityHint="Start a practice quiz for this course"
            >
              <IconSymbol name="trophy.fill" size={16} color="#3b82f6" />
              <Text className="ml-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                {t("learn.practiceQuiz")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({ pathname: "/matching-game", params: { courseId: course.id } })
              }
              className="flex-1 flex-row items-center justify-center rounded-lg border border-violet-200 py-2.5 active:opacity-70 dark:border-violet-800"
              accessibilityRole="button"
              accessibilityLabel={t("learn.matchingGame")}
              accessibilityHint="Start a matching game for this course"
            >
              <IconSymbol name="rectangle.grid.2x2" size={16} color="#8b5cf6" />
              <Text className="ml-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400">
                {t("learn.matchingGame")}
              </Text>
            </Pressable>
          </View>
          {getStoryForCourse(course.id) && (
            <Pressable
              onPress={() => router.push(`/story/${course.id}` as any)}
              className="mt-2 flex-row items-center justify-center rounded-lg border border-amber-200 py-2.5 active:opacity-70 dark:border-amber-800"
              accessibilityRole="button"
              accessibilityLabel={t("learn.storyMode")}
              accessibilityHint="Open story mode for this course"
            >
              <IconSymbol name="book.fill" size={16} color="#f59e0b" />
              <Text className="ml-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                {t("learn.storyMode")}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function LessonRow({ lesson, completed, onPress }: { lesson: Lesson; completed: boolean; onPress: () => void }) {
  const { uiLanguage } = useUiLanguageStore();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-t border-neutral-200 py-3 active:opacity-70 dark:border-neutral-700"
      accessibilityRole="button"
      accessibilityLabel={`${localizeField(lesson.title, lesson.titleFr, uiLanguage)}${completed ? ", completed" : ""}`}
      accessibilityHint="Tap to open lesson"
    >
      <IconSymbol
        name={completed ? "checkmark.circle.fill" : "circle"}
        size={20}
        color={completed ? "#22c55e" : "#9ca3af"}
      />
      <View className="ml-3 flex-1">
        <Text
          className="text-sm font-medium text-neutral-900 dark:text-white"
          numberOfLines={1}
        >
          {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
          {localizeField(lesson.description, lesson.descriptionFr, uiLanguage)}
        </Text>
      </View>
      {lesson.duration && (
        <Text className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">
          {formatDuration(lesson.duration)}
        </Text>
      )}
      <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
    </Pressable>
  );
}

function BountyTeaser({ languageId }: { languageId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: bounties } = useBounties(languageId);
  const topBounty = bounties?.[0]; // highest xpReward

  if (!topBounty) return null;

  return (
    <Pressable
      onPress={() => router.push("/bounties")}
      className="rounded-2xl bg-amber-50 p-4 active:opacity-70 dark:bg-amber-950"
      accessibilityRole="button"
      accessibilityLabel={`Bounty: ${topBounty.title}, earn ${topBounty.xpReward} XP`}
      accessibilityHint="Tap to view all bounties"
    >
      <View className="flex-row items-center">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
          <IconSymbol name="star.fill" size={18} color="#fff" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              {t("learn.bountyLabel")}
            </Text>
            <View className="rounded-full bg-amber-200 px-2 py-0.5 dark:bg-amber-800">
              <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
                +{topBounty.xpReward} XP
              </Text>
            </View>
          </View>
          <Text className="text-sm font-medium text-neutral-900 dark:text-white" numberOfLines={1}>
            {topBounty.title}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color="#f59e0b" />
      </View>
    </Pressable>
  );
}

function ContributorBanner() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/reviewer-application")}
      className="flex-row items-center rounded-2xl bg-emerald-50 p-4 active:opacity-70 dark:bg-emerald-950"
      accessibilityRole="button"
      accessibilityLabel={t("learn.contributorBannerTitle")}
      accessibilityHint="Tap to apply as a contributor"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
        <IconSymbol name="person.badge.plus" size={18} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {t("learn.contributorBannerTitle")}
        </Text>
        <Text className="text-xs text-emerald-600 dark:text-emerald-400">
          {t("learn.contributorBannerCta")}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color="#10b981" />
    </Pressable>
  );
}

function ReviewBanner({ languageId }: Readonly<{ languageId?: string | null }>) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: dueWords = [] } = useWordsDueForReview(languageId);

  if (dueWords.length === 0) return null;

  return (
    <Pressable
      onPress={() => router.push("/word-review")}
      className="flex-row items-center rounded-2xl bg-violet-50 p-4 active:opacity-70 dark:bg-violet-950"
      accessibilityRole="button"
      accessibilityLabel={t("learn.reviewBanner", { count: dueWords.length })}
      accessibilityHint="Tap to review words due for practice"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-violet-500">
        <IconSymbol name="brain.head.profile" size={18} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          {t("learn.reviewBanner", { count: dueWords.length })}
        </Text>
        <Text className="text-xs text-violet-500 dark:text-violet-400">
          {t("learn.reviewBannerCta")}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color="#8b5cf6" />
    </Pressable>
  );
}

function DailyGoalRing({ completedToday }: { completedToday: number }) {
  const target = 3;
  const pct = Math.min(completedToday / target, 1);
  const size = 36;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  const color = pct >= 1 ? "#22c55e" : "#3b82f6";

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 9, fontWeight: "700", color }}>
        {completedToday}/{target}
      </Text>
    </View>
  );
}

export default function LearnScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const { data: courses = [], isLoading: coursesLoading, refetch: refetchCourses } = useCourses(selectedLanguageId);
  const { data: completedLessonIds, isLoading: progressLoading, refetch } = useCompletedLessons();
  const { data: summary, refetch: refetchSummary } = useProgressSummary();
  const { refetch: refetchDue } = useWordsDueForReview(selectedLanguageId);
  const { data: todayChallenges = [] } = useTodayChallenges();
  const completedIds = new Set(completedLessonIds ?? []);
  const completedToday = useMemo(
    () => todayChallenges.filter((c) => c.completed).length,
    [todayChallenges]
  );
  const [refreshing, setRefreshing] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const freezeChecked = useRef(false);
  const { resumeState, loadResumeState } = useAudioStore();
  const showTour = useTourStore((s) => s.showTour);
  const hasSeen = useTourStore((s) => s.hasSeen);
  const activeTour = useTourStore((s) => s.activeTour);
  const isFocused = useIsFocused();

  useEffect(() => {
    loadResumeState();
  }, []);

  // TODO: Legacy tour trigger (soft-retired) — remove after full deprecation
  // showTour('learn') is disabled; welcome checklist now handles onboarding

  // Show freeze modal once per day when we detect a broken streak (wait for any tour to finish)
  useEffect(() => {
    if (
      !summary?.streakBroken ||
      summary.streak <= 0 ||
      activeTour ||
      freezeChecked.current
    )
      return;

    freezeChecked.current = true;
    const today = new Date().toISOString().slice(0, 10);
    AsyncStorage.getItem("streak-freeze-shown").then((lastShown) => {
      if (lastShown === today) return;
      AsyncStorage.setItem("streak-freeze-shown", today).catch(() => {});
      setFreezeModalVisible(true);
    }).catch(() => {});
  }, [summary?.streakBroken, summary?.streak, activeTour]);

  const isLoading = coursesLoading || progressLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSummary(), refetchCourses(), refetchDue()]);
    setRefreshing(false);
  }, [refetch, refetchSummary, refetchCourses, refetchDue]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View className="mr-3 shrink">
          <Text className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
            {t("learn.title")}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {t("learn.subtitle")}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <NotificationBell />
          <Pressable
            onPress={() => router.push("/quiz")}
            className="h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"
            accessibilityRole="button"
            accessibilityLabel="Practice quiz"
          >
            <IconSymbol name="trophy.fill" size={18} color="#3b82f6" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/dictionary")}
            className="h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900"
            accessibilityRole="button"
            accessibilityLabel="Dictionary"
          >
            <IconSymbol name="character.book.closed" size={18} color="#f59e0b" />
          </Pressable>
        </View>
      </View>

      <EnrolledLanguageBar />

      {/* Stats card */}
      <View className="mx-5 mb-3 flex-row rounded-2xl bg-neutral-50 px-2 py-3 dark:bg-neutral-800">
        {/* Streak */}
        <Pressable
          onPress={() => summary?.streakBroken && summary.streak > 0 && setFreezeModalVisible(true)}
          className="flex-row items-center gap-1"
          accessibilityRole="button"
          accessibilityLabel={`${summary?.streakBroken ? "Broken streak" : "Streak"}: ${summary?.streak ?? 0} days`}
          accessibilityHint={summary?.streakBroken && (summary?.streak ?? 0) > 0 ? "Tap to use a streak freeze" : undefined}
        >
          <View className="flex-row items-center gap-1">
            <IconSymbol
              name="flame.fill"
              size={16}
              color={summary?.streakBroken ? "#9ca3af" : "#f59e0b"}
            />
            <Text className={`text-base font-bold ${summary?.streakBroken ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-800 dark:text-white"}`}>
              {summary?.streak ?? 0}
            </Text>
            {(summary?.freezeCount ?? 0) > 0 && (
              <View className="flex-row items-center rounded-full bg-blue-100 px-1 dark:bg-blue-900">
                <IconSymbol name="snowflake" size={9} color="#3b82f6" />
                <Text className="ml-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                  {summary!.freezeCount}
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{t("learn.streak")}</Text>
        </Pressable>

        <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />

        {/* XP Level */}
        <View className="flex-1 items-center">
          <XpLevelBadge points={summary?.points ?? 0} variant="compact" />
          <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{t("learn.level")}</Text>
        </View>

        <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />

        {/* Lessons done */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center gap-1">
            <IconSymbol name="checkmark.circle.fill" size={16} color="#22c55e" />
            <Text className="text-base font-bold text-neutral-800 dark:text-white">
              {summary?.completedCount ?? 0}
            </Text>
          </View>
          <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{t("learn.statsLessonsDone")}</Text>
        </View>

        <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />

        {/* Daily goal */}
        <View className="flex-1 items-center">
          <DailyGoalRing completedToday={completedToday} />
          <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{t("learn.today")}</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : courses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="book.fill" size={48} color="#d1d5db" />
          <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
            {t("learn.noCourses")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8 pt-2"
          renderItem={({ item }) => <CourseCard course={item} completedIds={completedIds} />}
          ListHeaderComponent={
            <View className="mb-4 gap-3">
              <ReviewBanner languageId={selectedLanguageId} />
              {resumeState && resumeState.positionSeconds > 5 && (
                <ContinueCard
                  lessonId={resumeState.lessonId}
                  positionSeconds={resumeState.positionSeconds}
                />
              )}
              <UpNextCard languageId={selectedLanguageId} />
              <BountyTeaser languageId={selectedLanguageId} />
              <ContributorBanner />
            </View>
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <StreakFreezeModal
        visible={freezeModalVisible}
        streak={summary?.streak ?? 0}
        freezeCount={summary?.freezeCount ?? 0}
        onDismiss={() => setFreezeModalVisible(false)}
      />

    </SafeAreaView>
  );
}
