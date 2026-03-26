import { AudioPlayer } from "@/components/audio/audio-player";
import { InteractiveTranscript } from "@/components/audio/interactive-transcript";
import { LevelUpModal } from "@/components/level-up-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCompletedLessons, useCompleteLesson } from "@/lib/hooks/use-progress";
import { useLesson } from "@/lib/hooks/use-courses";
import { useNextLesson } from "@/lib/hooks/use-next-lesson";
import { formatDuration, BUNDLED_AUDIO } from "@/lib/mock-data";
import { playFinishSound } from "@/lib/sounds";
import { hapticHeavy } from "@/lib/haptics";
import { cancelDailyStreakReminder } from "@/lib/hooks/use-daily-reminder";
import { useAudioStore } from "@/store/audio-store";
import { analytics } from "@/lib/analytics";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useTourStore } from "@/store/tour-store";
import { localizeField } from "@/lib/localize";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function LessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lesson, isLoading, isError } = useLesson(id ?? "");
  const { loadAndPlay, currentTrackId, isPlaying, togglePlayback } = useAudioStore();
  const { data: completedLessonIds } = useCompletedLessons();
  const { selectedLanguageId } = useLanguageStore();
  const { uiLanguage } = useUiLanguageStore();
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const { t } = useTranslation();
  const { data: nextLessonData } = useNextLesson(selectedLanguageId);
  const showTour = useTourStore((s) => s.showTour);
  const hasSeen = useTourStore((s) => s.hasSeen);
  const completeLesson = useCompleteLesson({
    onLevelUp: (level, title) => {
      analytics.levelUp(level, title);
      setLevelUp({ level, title });
    },
  });

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: t("lesson.title") }} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </>
    );
  }

  if (isError || !lesson) {
    return (
      <>
        <Stack.Screen options={{ title: t("lesson.title") }} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <Text className="text-lg text-neutral-500 dark:text-neutral-400">
            {t("lesson.notFound")}
          </Text>
        </View>
      </>
    );
  }

  // Fall back to bundled audio if no CDN URL yet
  const audioSource = lesson.audioUrl ?? BUNDLED_AUDIO[lesson.id];

  const isCurrentTrack = currentTrackId === lesson.id;
  const completed = completedLessonIds?.includes(lesson.id) ?? false;

  const isSong = lesson.type === "song";
  const lessonTitle = localizeField(lesson.title, lesson.titleFr, uiLanguage);
  const lessonDescription = localizeField(lesson.description, lesson.descriptionFr, uiLanguage);

  const handlePlayAudio = () => {
    if (isCurrentTrack) {
      togglePlayback();
    } else if (audioSource) {
      loadAndPlay(lesson.id, audioSource, lessonTitle);
      analytics.lessonStarted(lesson.id, selectedLanguageId);
    }
  };

  const handleMarkComplete = () => {
    completeLesson.mutate(lesson.id);
    playFinishSound();
    hapticHeavy();
    analytics.lessonCompleted(lesson.id, selectedLanguageId);
    cancelDailyStreakReminder().catch(() => {});
    setShowSummary(true);

    // Contextual tours: show journal tour after first lesson complete,
    // then practice tour on subsequent completions
    setTimeout(() => {
      if (!hasSeen("journal")) {
        showTour("journal");
      } else if (!hasSeen("practice")) {
        showTour("practice");
      }
    }, 1500);
  };

  return (
    <>
      <Stack.Screen options={{ title: lessonTitle }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {/* Header info */}
        <View className="border-b border-neutral-100 px-5 pb-4 pt-2 dark:border-neutral-800">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                {lessonTitle}
              </Text>
              <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {lessonDescription}
              </Text>
              {isSong && lesson.artist && (
                <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {lesson.artist}{lesson.genre ? ` · ${t(`songs.genre_${lesson.genre}`, { defaultValue: lesson.genre })}` : ""}
                </Text>
              )}
            </View>
            {completed && (
              <View className="ml-3 mt-1 flex-row items-center rounded-full bg-green-100 px-2.5 py-1 dark:bg-green-900">
                <IconSymbol name="checkmark.circle.fill" size={14} color="#22c55e" />
                <Text className="ml-1 text-xs font-semibold text-green-700 dark:text-green-300">
                  {t("lesson.done")}
                </Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View className="mt-3 flex-row items-center gap-3">
            {audioSource && (
              <Pressable
                onPress={handlePlayAudio}
                className="flex-row items-center rounded-full bg-blue-500 px-5 py-2.5 active:opacity-80"
              >
                <IconSymbol
                  name={isCurrentTrack && isPlaying ? "pause.fill" : "play.fill"}
                  size={18}
                  color="#ffffff"
                />
                <Text className="ml-2 font-semibold text-white">
                  {isCurrentTrack && isPlaying ? t("lesson.pause") : isCurrentTrack ? t("lesson.resume") : t("lesson.play")}
                </Text>
                {lesson.duration && (
                  <Text className="ml-2 text-sm text-blue-200">
                    {formatDuration(lesson.duration)}
                  </Text>
                )}
              </Pressable>
            )}

            {!completed && (
              <Pressable
                onPress={handleMarkComplete}
                className="flex-row items-center rounded-full border border-green-500 px-4 py-2.5 active:opacity-80"
              >
                <IconSymbol name="checkmark.circle.fill" size={16} color="#22c55e" />
                <Text className="ml-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
                  {isSong ? t("songs.listened") : t("lesson.markComplete")}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/quiz",
                  params: { courseId: lesson.courseId },
                })
              }
              className="flex-row items-center rounded-full border border-blue-500 px-4 py-2.5 active:opacity-80"
            >
              <IconSymbol name="trophy.fill" size={16} color="#3b82f6" />
              <Text className="ml-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                {t("lesson.practice")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Post-lesson summary */}
        {showSummary ? (
          <ScrollView className="flex-1" contentContainerClassName="px-5 py-6" showsVerticalScrollIndicator={false}>
            <View className="items-center mb-6">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <IconSymbol name="checkmark.circle.fill" size={36} color="#22c55e" />
              </View>
              <Text className="mt-3 text-xl font-bold text-neutral-900 dark:text-white">
                {t("lesson.summary")}
              </Text>
            </View>

            {/* Stats */}
            <View className="flex-row gap-3 mb-6">
              {lesson.transcript && lesson.transcript.length > 0 && (
                <View className="flex-1 items-center rounded-2xl bg-blue-50 py-4 dark:bg-blue-950">
                  <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {new Set(
                      lesson.transcript
                        .flatMap((s) => s.text.split(/\s+/))
                        .map((w) => w.toLowerCase().replace(/[.,!?;:'"]/g, ""))
                        .filter(Boolean)
                    ).size}
                  </Text>
                  <Text className="mt-1 text-xs text-blue-500 dark:text-blue-400">
                    {t("lesson.wordsLearned")}
                  </Text>
                </View>
              )}
              {lesson.duration && (
                <View className="flex-1 items-center rounded-2xl bg-violet-50 py-4 dark:bg-violet-950">
                  <Text className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {formatDuration(lesson.duration)}
                  </Text>
                  <Text className="mt-1 text-xs text-violet-500 dark:text-violet-400">
                    {t("lesson.timeSpent")}
                  </Text>
                </View>
              )}
            </View>

            {/* What's next actions */}
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t("lesson.whatsNext")}
            </Text>
            <View className="gap-3">
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/quiz",
                    params: { courseId: lesson.courseId },
                  })
                }
                className="flex-row items-center rounded-2xl bg-blue-500 px-4 py-4 active:opacity-80"
              >
                <IconSymbol name="trophy.fill" size={18} color="#fff" />
                <Text className="ml-2 text-base font-semibold text-white">
                  {t("lesson.takeQuiz")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/word-review")}
                className="flex-row items-center rounded-2xl border border-emerald-200 px-4 py-4 active:opacity-80 dark:border-emerald-800"
              >
                <IconSymbol name="brain.head.profile" size={18} color="#10b981" />
                <Text className="ml-2 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                  {t("lesson.reviewWords")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(tabs)/journal" as any)}
                className="flex-row items-center rounded-2xl border border-neutral-200 px-4 py-4 active:opacity-80 dark:border-neutral-700"
              >
                <IconSymbol name="pencil.and.list.clipboard" size={18} color="#9ca3af" />
                <Text className="ml-2 text-base font-semibold text-neutral-600 dark:text-neutral-300">
                  {t("lesson.writeReflection")}
                </Text>
              </Pressable>

              {nextLessonData?.lesson && nextLessonData.lesson.id !== lesson.id && (
                <Pressable
                  onPress={() => {
                    setShowSummary(false);
                    router.replace(`/lesson/${nextLessonData.lesson!.id}`);
                  }}
                  className="flex-row items-center rounded-2xl border border-blue-200 px-4 py-4 active:opacity-80 dark:border-blue-800"
                >
                  <IconSymbol name="play.fill" size={18} color="#3b82f6" />
                  <Text className="ml-2 text-base font-semibold text-blue-600 dark:text-blue-400">
                    {t("lesson.continueToNext")}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => setShowSummary(false)}
                className="items-center py-3"
              >
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {isSong ? t("songs.lyrics") : t("lesson.transcript")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
        /* Transcript */
        lesson.transcript && lesson.transcript.length > 0 ? (
          <View className="flex-1 px-1">
            <Text className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {isSong ? t("songs.lyrics") : t("lesson.transcript")}
            </Text>
            <InteractiveTranscript segments={lesson.transcript} />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <IconSymbol name="book.fill" size={40} color="#d1d5db" />
            <Text className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">
              {t("lesson.noTranscript")}
            </Text>
          </View>
        ))}

        {/* Full audio player at bottom */}
        {isCurrentTrack && <AudioPlayer />}
      </SafeAreaView>

      <LevelUpModal
        visible={!!levelUp}
        level={levelUp?.level ?? 1}
        title={levelUp?.title ?? ""}
        onDismiss={() => setLevelUp(null)}
      />

    </>
  );
}
