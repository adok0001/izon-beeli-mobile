import { AudioPlayer } from "@/components/audio/audio-player";
import { InteractiveTranscript } from "@/components/audio/interactive-transcript";
import { LevelUpModal } from "@/components/level-up-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCompletedLessons, useCompleteLesson } from "@/lib/hooks/use-progress";
import { useLesson } from "@/lib/hooks/use-courses";
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
import { FeatureTourModal } from "@/components/feature-tour-modal";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
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
  const { t } = useTranslation();
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
                  {t("lesson.markComplete")}
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

        {/* Transcript */}
        {lesson.transcript && lesson.transcript.length > 0 ? (
          <View className="flex-1 px-1">
            <Text className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t("lesson.transcript")}
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
        )}

        {/* Full audio player at bottom */}
        {isCurrentTrack && <AudioPlayer />}
      </SafeAreaView>

      <LevelUpModal
        visible={!!levelUp}
        level={levelUp?.level ?? 1}
        title={levelUp?.title ?? ""}
        onDismiss={() => setLevelUp(null)}
      />

      <FeatureTourModal />
    </>
  );
}
