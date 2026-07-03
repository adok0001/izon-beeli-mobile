import { LoadingScreen } from "@/components/loading-screen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useStoryArcById } from "@/lib/hooks/use-story-arc";
import { getSeriesMeta, styleLabel } from "@/lib/data/series";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { StoryChapter } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LEVELS: { key: string; label: string }[] = [
  { key: "beginner", label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
];

function formatRuntime(mins: number): string {
  if (mins <= 0) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function SeriesScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const storyId = id ?? "";

  const { data: arc, isLoading } = useStoryArcById(storyId);
  const { all: podcasts } = useDiscover("podcast");
  const meta = getSeriesMeta(storyId);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Series" }} />
        <LoadingScreen color={getAccent("amber").solid} />
      </>
    );
  }

  if (!arc) {
    return (
      <>
        <Stack.Screen options={{ title: "Series" }} />
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: M.bg }}>
          <IconSymbol name="film.fill" size={48} color={M.muted} />
          <Text style={{ marginTop: 16, fontSize: 16, color: M.sub }}>This series isn&apos;t available yet.</Text>
        </SafeAreaView>
      </>
    );
  }

  const hero = podcasts.find((p) => p.storyId === storyId);
  const gradientTop = hero?.coverGradient?.[0] ?? "#3B1F6E";
  const coverEmoji = hero?.coverEmoji ?? "🎙️";

  const chapters = [...arc.chapters].sort((a, b) => a.order - b.order);
  const totalMinutes = chapters.reduce((sum, ch) => sum + (ch.lessonDuration ?? 0), 0);
  const activeCount = chapters.filter((ch) => ch.lessonIsActive).length;

  // Group chapters by level, preserving the LEVELS order; anything unleveled
  // falls into a trailing "More" bucket so nothing is dropped.
  const grouped = LEVELS.map((lvl) => ({
    ...lvl,
    items: chapters.filter((ch) => ch.level === lvl.key),
  })).filter((g) => g.items.length > 0);
  const ungrouped = chapters.filter((ch) => !LEVELS.some((l) => l.key === ch.level));

  const handleEpisodePress = (ch: StoryChapter) => {
    if (ch.lessonIsActive) router.push(`/lesson/${ch.lessonId}` as never);
  };

  const renderEpisode = (ch: StoryChapter) => {
    const active = !!ch.lessonIsActive;
    const style = styleLabel(meta?.styleByLessonId[ch.lessonId]);
    const runtime = ch.lessonDuration ? `${ch.lessonDuration} min` : null;
    return (
      <Pressable
        key={ch.id}
        onPress={() => handleEpisodePress(ch)}
        disabled={!active}
        className={active ? "active:opacity-80" : ""}
        style={{
          marginBottom: 12,
          borderRadius: 16,
          borderWidth: 1,
          padding: 16,
          borderColor: M.border,
          backgroundColor: M.card,
          opacity: active ? 1 : 0.55,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              backgroundColor: active ? M.accentGlow : M.pillBg,
              borderWidth: 1,
              borderColor: active ? M.accentBorder : M.border,
            }}
          >
            {active ? (
              <IconSymbol name="play.fill" size={15} color={M.accent} />
            ) : (
              <IconSymbol name="lock.fill" size={14} color={M.muted} />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: active ? M.text : M.sub }} numberOfLines={1}>
              {ch.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
              {style ? (
                <View style={{ borderRadius: 6, backgroundColor: M.pillBg, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", color: M.sub }}>{style}</Text>
                </View>
              ) : null}
              <Text style={{ fontSize: 12, color: M.muted }}>
                {runtime}
                {runtime && !active ? "  ·  " : ""}
                {!active ? "Coming soon" : ""}
              </Text>
            </View>
          </View>

          {active ? <IconSymbol name="chevron.right" size={16} color={M.muted} /> : null}
        </View>

        {ch.narrativeIntro ? (
          <Text style={{ marginTop: 10, fontSize: 13, lineHeight: 19, color: M.sub }} numberOfLines={2}>
            {ch.narrativeIntro}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: arc.title }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <LinearGradient
            colors={[gradientTop, M.ink]}
            style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 22, overflow: "hidden" }}
          >
            <Text style={{ fontSize: 84, position: "absolute", top: 8, right: 10, opacity: 0.16 }}>{coverEmoji}</Text>
            <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: M.accent }}>
              Audio Drama Series
            </Text>
            <Text style={{ marginTop: 6, fontSize: 26, fontWeight: "800", color: M.parchment }}>{arc.title}</Text>
            {meta?.nativeTitle ? (
              <Text style={{ marginTop: 2, fontSize: 15, fontStyle: "italic", color: M.textDim }}>{meta.nativeTitle}</Text>
            ) : null}
            {meta?.logline ? (
              <Text style={{ marginTop: 10, fontSize: 14, lineHeight: 20, color: M.textDim }}>{meta.logline}</Text>
            ) : null}
            <Text style={{ marginTop: 12, fontSize: 12, fontWeight: "600", color: M.textDim }}>
              {chapters.length} episodes{totalMinutes > 0 ? `  ·  ${formatRuntime(totalMinutes)}` : ""}
              {activeCount === 0 ? "  ·  Coming soon" : ""}
            </Text>
          </LinearGradient>

          {/* Cast strip */}
          {meta && meta.cast.length > 0 ? (
            <View style={{ marginTop: 18 }}>
              <Text style={{ paddingHorizontal: 20, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: M.muted }}>
                The Cast
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, gap: 12 }}>
                {meta.cast.map((c) => (
                  <View key={c.id} style={{ width: 92, alignItems: "center" }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: M.accentGlow,
                        borderWidth: 1,
                        borderColor: M.accentBorder,
                      }}
                    >
                      <Text style={{ fontSize: 18, fontWeight: "800", color: M.accent }}>{c.name.charAt(0)}</Text>
                    </View>
                    <Text style={{ marginTop: 6, fontSize: 12, fontWeight: "700", color: M.text }} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: M.muted, textAlign: "center" }} numberOfLines={2}>
                      {c.role}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Episodes grouped by level */}
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            {grouped.map((g) => (
              <View key={g.key} style={{ marginBottom: 8 }}>
                <Text style={{ marginBottom: 10, fontSize: 13, fontWeight: "800", letterSpacing: 0.4, color: M.text }}>
                  {g.label}
                  <Text style={{ fontWeight: "600", color: M.muted }}>{`   ${g.items.length}`}</Text>
                </Text>
                {g.items.map(renderEpisode)}
              </View>
            ))}
            {ungrouped.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ marginBottom: 10, fontSize: 13, fontWeight: "800", color: M.text }}>More</Text>
                {ungrouped.map(renderEpisode)}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
