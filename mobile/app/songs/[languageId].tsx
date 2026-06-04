import { IconSymbol } from "@/components/ui/icon-symbol";
import { LoadingScreen } from "@/components/loading-screen";
import { ALL_LESSONS } from "@/lib/data/lessons";
import { useCourses } from "@/lib/hooks/use-courses";
import { getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LessonData } from "@/lib/data/lessons";

function SongCard({ song }: { song: LessonData }) {
  const M = useMuseumTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/lesson/${song.id}` as any)}
      style={{
        marginBottom: 12, borderRadius: 16, backgroundColor: M.card,
        padding: 16, borderWidth: 1, borderColor: M.border,
        borderLeftWidth: 4, borderLeftColor: M.accent,
      }}
      className="active:opacity-70"
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}>
          <IconSymbol name="music.note" size={22} color={M.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: M.text }} numberOfLines={1}>
            {song.title}
          </Text>
          {song.artist && (
            <Text style={{ fontSize: 12, marginTop: 2, color: M.sub }} numberOfLines={1}>
              {song.artist}
              {song.genre ? ` · ${song.genre}` : ""}
            </Text>
          )}
        </View>
        <IconSymbol name="chevron.right" size={16} color={M.muted} />
      </View>
    </Pressable>
  );
}

export default function SongsScreen() {
  const M = useMuseumTheme();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: `${languageName} ${t("songs.title")}`,
          headerBackTitle: "Back",
        }}
      />

      {isLoading ? (
        <LoadingScreen />
      ) : songs.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder, marginBottom: 16 }}>
            <IconSymbol name="music.note" size={28} color={M.accent} />
          </View>
          <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "700", color: M.text }}>
            {t("songs.noSongs", { defaultValue: "No songs available yet." })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SongCard song={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
