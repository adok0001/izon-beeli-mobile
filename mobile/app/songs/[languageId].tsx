import { IconSymbol } from "@/components/ui/icon-symbol";
import { LoadingScreen } from "@/components/loading-screen";
import { ALL_LESSONS } from "@/lib/data/lessons";
import { useCourses } from "@/lib/hooks/use-courses";
import { getLanguageName } from "@/lib/mock-data";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LessonData } from "@/lib/data/lessons";

function SongCard({ song }: { song: LessonData }) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => router.push(`/lesson/${song.id}` as any)}
      className="mb-3 rounded-2xl bg-pink-50 p-4 active:opacity-70 dark:bg-pink-900/20"
    >
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/40">
          <IconSymbol name="music.note" size={22} color="#db2777" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-neutral-900 dark:text-white" numberOfLines={1}>
            {song.title}
          </Text>
          {song.artist && (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
              {song.artist}
              {song.genre ? ` · ${song.genre}` : ""}
            </Text>
          )}
        </View>
        <IconSymbol name="chevron.right" size={16} color="#db2777" />
      </View>
    </Pressable>
  );
}

export default function SongsScreen() {
  const { t } = useTranslation();
  const { languageId } = useLocalSearchParams<{ languageId: string }>();
  const { data: courses = [], isLoading } = useCourses(languageId ?? "");

  const songs = useMemo(() => {
    const songCourseIds = courses
      .filter((c) => c.courseType === "songs")
      .map((c) => c.id);
    if (songCourseIds.length === 0) return [];
    return ALL_LESSONS.filter(
      (l) => l.type === "song" && songCourseIds.includes(l.courseId)
    );
  }, [courses]);

  const languageName = getLanguageName(languageId ?? "");

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: `${languageName} ${t("songs.title")}`,
          headerBackTitle: "Back",
        }}
      />

      {isLoading ? (
        <LoadingScreen color="#db2777" />
      ) : songs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="music.note" size={48} color="#d1d5db" />
          <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
            {t("songs.noSongs", { defaultValue: "No songs available yet." })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SongCard song={item} />}
          contentContainerClassName="px-4 py-4"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
