import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerButton } from "@/components/language-picker";
import { useLanguageStore } from "@/store/language-store";
import { useAudioStore } from "@/store/audio-store";
import { useCompletedLessons } from "@/lib/hooks/use-progress";
import { useLanguageLessons } from "@/lib/hooks/use-courses";
import { BUNDLED_AUDIO, formatDuration } from "@/lib/mock-data";
import type { Lesson } from "@/types";

function AudioLessonCard({ lesson, completed }: { lesson: Lesson; completed: boolean }) {
  const router = useRouter();
  const { loadAndPlay, currentTrackId, isPlaying, togglePlayback } = useAudioStore();

  const isCurrentTrack = currentTrackId === lesson.id;
  const audioSource = lesson.audioUrl ?? BUNDLED_AUDIO[lesson.id];

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlayback();
    } else if (audioSource) {
      loadAndPlay(lesson.id, audioSource, lesson.title);
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/lesson/${lesson.id}`)}
      className="mb-3 flex-row items-center rounded-xl bg-neutral-50 p-4 active:opacity-70 dark:bg-neutral-800"
    >
      <Pressable
        onPress={handlePlay}
        className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
          isCurrentTrack ? "bg-blue-500" : "bg-blue-100 dark:bg-blue-900"
        }`}
        hitSlop={4}
      >
        <IconSymbol
          name={isCurrentTrack && isPlaying ? "pause.fill" : "play.fill"}
          size={20}
          color={isCurrentTrack ? "#ffffff" : "#3b82f6"}
        />
      </Pressable>

      <View className="flex-1">
        <Text
          className="text-base font-semibold text-neutral-900 dark:text-white"
          numberOfLines={1}
        >
          {lesson.title}
        </Text>
        <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
          {lesson.description}
        </Text>
        <View className="mt-1 flex-row items-center">
          <IconSymbol name="clock" size={12} color="#9ca3af" />
          <Text className="ml-1 text-xs text-neutral-400 dark:text-neutral-500">
            {lesson.duration ? formatDuration(lesson.duration) : "—"}
          </Text>
          {completed && (
            <>
              <Text className="mx-2 text-neutral-300 dark:text-neutral-600">·</Text>
              <IconSymbol name="checkmark.circle.fill" size={12} color="#22c55e" />
              <Text className="ml-1 text-xs text-green-600 dark:text-green-400">Completed</Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function ListenScreen() {
  const { selectedLanguageId } = useLanguageStore();
  const { data: completedLessonIds, isLoading: progressLoading } = useCompletedLessons();
  const { data: allLessons = [], isLoading: lessonsLoading } = useLanguageLessons(selectedLanguageId);
  const completedIds = new Set(completedLessonIds ?? []);

  // Show lessons that have audio (either from API or bundled fallback)
  const audioLessons = allLessons.filter(
    (l) => l.audioUrl || BUNDLED_AUDIO[l.id]
  );

  const isLoading = progressLoading || lessonsLoading;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View>
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            Listen
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Audio lessons and stories
          </Text>
        </View>
        <LanguagePickerButton />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : audioLessons.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="headphones" size={48} color="#d1d5db" />
          <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
            No audio lessons available for this language yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={audioLessons}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-4 pt-2"
          renderItem={({ item }) => (
            <AudioLessonCard lesson={item} completed={completedIds.has(item.id)} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

    </SafeAreaView>
  );
}
