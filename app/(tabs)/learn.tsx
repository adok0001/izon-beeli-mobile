import { SymbolOfTheDay } from "@/components/adinkra/symbol-of-the-day";
import { CulturalSection } from "@/components/cultural/cultural-section";
import { DailyChallengeCard } from "@/components/daily-challenge-card";
import { UpNextCard } from "@/components/up-next-card";
import { LanguagePickerButton } from "@/components/language-picker";
import { NotificationBell } from "@/components/notifications/notification-center";
import { ProverbOfTheDay } from "@/components/proverb-of-the-day";
import { StreakFreezeModal } from "@/components/streak-freeze-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordOfTheDay } from "@/components/word-of-the-day";
import { XpLevelBadge } from "@/components/xp-level-badge";
import { getStoryForCourse } from "@/lib/data/stories";
import { useCourseLessons, useCourses, useLesson } from "@/lib/hooks/use-courses";
import { useCompletedLessons, useProgressSummary } from "@/lib/hooks/use-progress";
import { formatDuration, BUNDLED_AUDIO } from "@/lib/mock-data";
import { useLanguageStore } from "@/store/language-store";
import { useAudioStore } from "@/store/audio-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Course, Lesson } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ContinueCard({ lessonId, positionSeconds }: { lessonId: string; positionSeconds: number }) {
  const router = useRouter();
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
    >
      <View className="flex-row items-center">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
          <IconSymbol name="play.fill" size={22} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Continue Listening
          </Text>
          <Text className="text-base font-bold text-neutral-900 dark:text-white" numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Paused at {posLabel}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color="#10b981" />
      </View>
    </Pressable>
  );
}

function CourseCard({ course, completedIds }: { course: Course; completedIds: Set<string> }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { data: lessons = [], isLoading: lessonsLoading } = useCourseLessons(course.id);
  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;
  const progressPercent =
    lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <View className="mb-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900">
          <Text className="text-xs font-semibold capitalize text-blue-700 dark:text-blue-300">
            {course.level}
          </Text>
        </View>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {completedCount}/{lessons.length} lessons
        </Text>
      </View>

      <Text className="mb-1 text-lg font-bold text-neutral-900 dark:text-white">
        {course.title}
      </Text>
      <Text className="mb-3 text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={2}>
        {course.description}
      </Text>

      {progressPercent > 0 && (
        <View className="mb-3">
          <View className="relative h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
            <View
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${progressPercent}%` }}
            />
            {[25, 50, 75].map((pct) => (
              <View
                key={pct}
                className="absolute top-0 h-2 w-0.5"
                style={{
                  left: `${pct}%`,
                  backgroundColor:
                    progressPercent >= pct
                      ? "#93c5fd"
                      : colorScheme === "dark"
                        ? "#4b5563"
                        : "#d1d5db",
                }}
              />
            ))}
          </View>
          {progressPercent >= 100 && (
            <Text className="mt-1 text-right text-xs font-semibold text-green-600 dark:text-green-400">
              Complete!
            </Text>
          )}
        </View>
      )}

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
        >
          <IconSymbol name="trophy.fill" size={16} color="#3b82f6" />
          <Text className="ml-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
            Practice Quiz
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            router.push({ pathname: "/matching-game", params: { courseId: course.id } })
          }
          className="flex-1 flex-row items-center justify-center rounded-lg border border-violet-200 py-2.5 active:opacity-70 dark:border-violet-800"
        >
          <IconSymbol name="rectangle.grid.2x2" size={16} color="#8b5cf6" />
          <Text className="ml-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400">
            Matching Game
          </Text>
        </Pressable>
      </View>
      {getStoryForCourse(course.id) && (
        <Pressable
          onPress={() => router.push(`/story/${course.id}` as any)}
          className="mt-2 flex-row items-center justify-center rounded-lg border border-amber-200 py-2.5 active:opacity-70 dark:border-amber-800"
        >
          <IconSymbol name="book.fill" size={16} color="#f59e0b" />
          <Text className="ml-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
            Story Mode
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function LessonRow({ lesson, completed, onPress }: { lesson: Lesson; completed: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-t border-neutral-200 py-3 active:opacity-70 dark:border-neutral-700"
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
          {lesson.title}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
          {lesson.description}
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

export default function LearnScreen() {
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const { data: courses = [], isLoading: coursesLoading, refetch: refetchCourses } = useCourses(selectedLanguageId);
  const { data: completedLessonIds, isLoading: progressLoading, refetch } = useCompletedLessons();
  const { data: summary, refetch: refetchSummary } = useProgressSummary();
  const completedIds = new Set(completedLessonIds ?? []);
  const [refreshing, setRefreshing] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const freezeModalShown = useRef(false);
  const { resumeState, loadResumeState } = useAudioStore();

  useEffect(() => {
    loadResumeState();
  }, []);

  // Show freeze modal once when we detect a broken streak
  useEffect(() => {
    if (
      summary?.streakBroken &&
      !freezeModalShown.current &&
      summary.streak > 0
    ) {
      freezeModalShown.current = true;
      setFreezeModalVisible(true);
    }
  }, [summary?.streakBroken, summary?.streak]);

  const isLoading = coursesLoading || progressLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSummary(), refetchCourses()]);
    setRefreshing(false);
  }, [refetch, refetchSummary, refetchCourses]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View className="mr-3 shrink">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            Learn
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            Pick a language
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <NotificationBell />
          <Pressable
            onPress={() => router.push("/quiz")}
            className="h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"
          >
            <IconSymbol name="trophy.fill" size={18} color="#3b82f6" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/dictionary")}
            className="h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900"
          >
            <IconSymbol name="character.book.closed" size={18} color="#f59e0b" />
          </Pressable>
          <LanguagePickerButton />
        </View>
      </View>

      {/* Stats bar */}
      <View className="flex-row items-center gap-4 border-b border-neutral-100 px-5 pb-3 dark:border-neutral-800">
        <Pressable
          onPress={() => summary?.streakBroken && summary.streak > 0 && setFreezeModalVisible(true)}
          className="flex-row items-center gap-1"
        >
          <IconSymbol
            name="flame.fill"
            size={16}
            color={summary?.streakBroken ? "#9ca3af" : "#f59e0b"}
          />
          <Text className={`text-sm font-semibold ${summary?.streakBroken ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-300"}`}>
            {summary?.streak ?? 0}
          </Text>
          {(summary?.freezeCount ?? 0) > 0 && (
            <View className="ml-0.5 flex-row items-center rounded-full bg-blue-100 px-1.5 dark:bg-blue-900">
              <IconSymbol name="snowflake" size={10} color="#3b82f6" />
              <Text className="ml-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                {summary!.freezeCount}
              </Text>
            </View>
          )}
        </Pressable>
        <XpLevelBadge points={summary?.points ?? 0} variant="compact" />
        <View className="flex-row items-center">
          <IconSymbol name="checkmark.circle.fill" size={16} color="#22c55e" />
          <Text className="ml-1 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {summary?.completedCount ?? 0}
          </Text>
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
            No courses available for this language yet. Check back soon!
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
              {resumeState && resumeState.positionSeconds > 5 && (
                <ContinueCard
                  lessonId={resumeState.lessonId}
                  positionSeconds={resumeState.positionSeconds}
                />
              )}
              <DailyChallengeCard />
              <UpNextCard />
              <Pressable
                onPress={() => router.push("/multiplayer")}
                className="rounded-2xl bg-[#123499] p-4 active:opacity-70 dark:bg-[#0f2670]"
              >
                <View className="flex-row items-center">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                    <IconSymbol name="trophy.fill" size={24} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      Multiplayer
                    </Text>
                    <Text className="text-base font-bold text-neutral-900 dark:text-white">
                      Quiz Battle & Paired Lessons
                    </Text>
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                      Challenge friends or find an opponent
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color="#3b82f6" />
                </View>
              </Pressable>
              <WordOfTheDay languageId={selectedLanguageId} />
              <ProverbOfTheDay languageId={selectedLanguageId} />
              <CulturalSection languageId={selectedLanguageId} onViewAll={() => router.push(`/cultural/${selectedLanguageId}` as any)} />
              {selectedLanguageId === "akan" && <SymbolOfTheDay />}
              {/* Ge'ez Script — shown for Ethiopic script languages */}
              {["amharic", "tigrinya", "oromo"].includes(selectedLanguageId) && (
                <Pressable
                  onPress={() => router.push("/geez-lesson")}
                  className="rounded-2xl bg-emerald-50 p-4 active:opacity-70 dark:bg-emerald-950"
                >
                  <View className="flex-row items-center">
                    <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-neutral-800">
                      <Text className="text-2xl font-bold text-emerald-600">ሀ</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Script Practice
                      </Text>
                      <Text className="text-base font-bold text-neutral-900 dark:text-white">
                        Ge&apos;ez / Fidel
                      </Text>
                      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                        Learn the Ethiopic alphabet
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#10b981" />
                  </View>
                </Pressable>
              )}
              {/* Adinkra symbols — Ghanaian languages (Akan already has SymbolOfTheDay) */}
              {["ga", "ewe", "dagbani"].includes(selectedLanguageId) && (
                <Pressable
                  onPress={() => router.push("/adinkra")}
                  className="rounded-2xl bg-violet-50 p-4 active:opacity-70 dark:bg-violet-950"
                >
                  <View className="flex-row items-center">
                    <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-neutral-800">
                      <IconSymbol name="sparkles" size={24} color="#7c3aed" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                        Cultural Symbols
                      </Text>
                      <Text className="text-base font-bold text-neutral-900 dark:text-white">
                        Adinkra Symbols
                      </Text>
                      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                        Explore Akan wisdom symbols
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#7c3aed" />
                  </View>
                </Pressable>
              )}
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
