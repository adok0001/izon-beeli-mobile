import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AudioPlayer } from "@/components/audio/audio-player";
import { InteractiveTranscript } from "@/components/audio/interactive-transcript";
import { useAudioStore } from "@/store/audio-store";
import { useProgressStore } from "@/store/progress-store";
import { getLessonById, formatDuration } from "@/lib/mock-data";
import { playFinishSound } from "@/lib/sounds";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getLessonById(id);
  const { loadAndPlay, currentTrackId, isPlaying, togglePlayback } = useAudioStore();
  const { isCompleted, markComplete } = useProgressStore();

  if (!lesson) {
    return (
      <>
        <Stack.Screen options={{ title: "Lesson" }} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <Text className="text-lg text-neutral-500 dark:text-neutral-400">
            Lesson not found
          </Text>
        </View>
      </>
    );
  }

  const isCurrentTrack = currentTrackId === lesson.id;
  const completed = isCompleted(lesson.id);

  const handlePlayAudio = () => {
    if (isCurrentTrack) {
      togglePlayback();
    } else if (lesson.audioUrl) {
      loadAndPlay(lesson.id, lesson.audioUrl, lesson.title);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: lesson.title }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {/* Header info */}
        <View className="border-b border-neutral-100 px-5 pb-4 pt-2 dark:border-neutral-800">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                {lesson.title}
              </Text>
              <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {lesson.description}
              </Text>
            </View>
            {completed && (
              <View className="ml-3 mt-1 flex-row items-center rounded-full bg-green-100 px-2.5 py-1 dark:bg-green-900">
                <IconSymbol name="checkmark.circle.fill" size={14} color="#22c55e" />
                <Text className="ml-1 text-xs font-semibold text-green-700 dark:text-green-300">
                  Done
                </Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View className="mt-3 flex-row items-center gap-3">
            {lesson.audioUrl && (
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
                  {isCurrentTrack && isPlaying ? "Pause" : isCurrentTrack ? "Resume" : "Play"}
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
                onPress={() => {
                  markComplete(lesson.id);
                  playFinishSound();
                }}
                className="flex-row items-center rounded-full border border-green-500 px-4 py-2.5 active:opacity-80"
              >
                <IconSymbol name="checkmark.circle.fill" size={16} color="#22c55e" />
                <Text className="ml-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
                  Mark Complete
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Transcript */}
        {lesson.transcript && lesson.transcript.length > 0 ? (
          <View className="flex-1 px-1">
            <Text className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Transcript
            </Text>
            <InteractiveTranscript segments={lesson.transcript} />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <IconSymbol name="book.fill" size={40} color="#d1d5db" />
            <Text className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">
              No transcript available for this lesson
            </Text>
          </View>
        )}

        {/* Full audio player at bottom */}
        {isCurrentTrack && <AudioPlayer />}
      </SafeAreaView>
    </>
  );
}
