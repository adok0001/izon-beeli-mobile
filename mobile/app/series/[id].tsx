import { DiscoverCard } from "@/components/discover-card";
import { CourseArtwork } from "@/components/learn/course-artwork";
import { LoadingScreen } from "@/components/loading-screen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent, type AccentHue } from "@/constants/accent-colors";
import { useCourses } from "@/lib/hooks/use-courses";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useStoryArcById, type SeasonChapter } from "@/lib/hooks/use-story-arc";
import { styleLabel } from "@/lib/series-presentation";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
  const { id, level: levelParam } = useLocalSearchParams<{ id: string; level?: string }>();
  const storyId = id ?? "";

  const { uiLanguage } = useUiLanguageStore();
  const { data: arc, isLoading } = useStoryArcById(storyId);
  const { all: podcasts } = useDiscover("podcast");
  const { all: allFilms } = useDiscover("film");
  const { data: courses } = useCourses(arc?.languageId ?? "");
  const [activeLevel, setActiveLevel] = useState<string | null>(levelParam ?? null);

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
  // `lessonDuration` is seconds, like every duration the API serves.
  const totalMinutes = Math.round(
    chapters.reduce((sum, ch) => sum + (ch.lessonDuration ?? 0), 0) / 60,
  );
  const activeCount = chapters.filter((ch) => ch.lessonIsActive).length;

  const cast = arc.cast ?? [];

  // "Also in this world" — the films and companion courses that share the
  // season's cast and threads (linked to the arc in the CMS, empty for seasons
  // without a mapped world so the section simply doesn't render).
  const filmStoryIds = arc.filmStoryIds ?? [];
  const companionCourseIds = (arc.companionCourses ?? []).map((c) => c.id);
  const worldFilms = filmStoryIds.length
    ? allFilms.filter((f) => f.storyId && filmStoryIds.includes(f.storyId))
    : [];
  const worldCourses = companionCourseIds.length
    ? (courses ?? []).filter((c) => companionCourseIds.includes(c.id))
    : [];
  const openStory = (sid: string) => router.push(`/discover-story/${sid}` as never);
  const openCourse = (courseId: string) =>
    router.push({ pathname: "/learn/course/[courseId]", params: { courseId } });

  const renderCourseCard = (course: Course) => (
    <Pressable
      key={course.id}
      onPress={() => openCourse(course.id)}
      className="active:opacity-80"
      style={{ width: 150, borderRadius: 14, overflow: "hidden", backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}
      accessibilityRole="button"
      accessibilityLabel={localize(course.title, uiLanguage)}
    >
      <CourseArtwork course={course} size="thumb" />
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }} numberOfLines={2}>
          {localize(course.title, uiLanguage)}
        </Text>
        <Text style={{ marginTop: 3, fontSize: 11, fontWeight: "600", textTransform: "capitalize", color: M.muted }}>
          {course.level} · course
        </Text>
      </View>
    </Pressable>
  );

  // Group chapters by level, preserving the LEVELS order; anything unleveled
  // falls into a trailing "More" bucket so nothing is dropped.
  const grouped = LEVELS.map((lvl) => ({
    ...lvl,
    items: chapters.filter((ch) => ch.level === lvl.key),
  })).filter((g) => g.items.length > 0);
  const ungrouped = chapters.filter((ch) => !LEVELS.some((l) => l.key === ch.level));

  // The segmented control only filters when there's more than one level —
  // otherwise there's nothing to switch between, so show everything.
  const selectedLevel = activeLevel ?? grouped[0]?.key;
  const visibleGroups = grouped.length > 1 ? grouped.filter((g) => g.key === selectedLevel) : grouped;
  const otherGroups = grouped.length > 1 ? grouped.filter((g) => g.key !== selectedLevel) : [];
  const otherLevelsCount = otherGroups.reduce((sum, g) => sum + g.items.length, 0);
  const otherLevelLabels = otherGroups.map((g) => g.label).join(" & ");

  const handleEpisodePress = (ch: SeasonChapter) => {
    if (ch.lessonIsActive) router.push(`/lesson/${ch.lessonId}` as never);
  };

  const renderEpisode = (ch: SeasonChapter) => {
    const active = !!ch.lessonIsActive;
    const style = styleLabel(ch.lessonStyle);
    const runtime = ch.lessonDuration ? `${Math.round(ch.lessonDuration / 60)} min` : null;
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
            <Text style={{ marginTop: 6, fontSize: 30, fontWeight: "800", color: M.parchment }}>
              {arc.nativeTitle ?? arc.title}
            </Text>
            {arc.nativeTitle ? (
              <Text style={{ marginTop: 2, fontSize: 15, fontWeight: "600", color: M.textDim }}>{arc.title}</Text>
            ) : null}
            {arc.logline ? (
              <Text style={{ marginTop: 10, fontSize: 14, lineHeight: 20, color: M.textDim }}>{arc.logline}</Text>
            ) : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(7,8,15,0.4)", borderWidth: 1, borderColor: "rgba(247,242,232,0.2)" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: M.parchment }}>
                  {chapters.length} episode{chapters.length === 1 ? "" : "s"}
                  {totalMinutes > 0 ? `  ·  ${formatRuntime(totalMinutes)}` : ""}
                </Text>
              </View>
              {grouped.length > 0 ? (
                <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(7,8,15,0.4)", borderWidth: 1, borderColor: "rgba(247,242,232,0.2)" }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: M.parchment }}>
                    {grouped.length} level{grouped.length === 1 ? "" : "s"}
                  </Text>
                </View>
              ) : null}
              {cast.length > 0 ? (
                <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(7,8,15,0.4)", borderWidth: 1, borderColor: "rgba(247,242,232,0.2)" }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: M.parchment }}>{cast.length} cast</Text>
                </View>
              ) : null}
              {activeCount === 0 ? (
                <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(7,8,15,0.4)", borderWidth: 1, borderColor: "rgba(247,242,232,0.2)" }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: M.parchment }}>Coming soon</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>

          {/* Level segmented control — jumps to that level's episode group below */}
          {grouped.length > 1 ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
              <View style={{ flexDirection: "row", backgroundColor: M.card, borderWidth: 1, borderColor: M.border, borderRadius: 14, padding: 4, gap: 4 }}>
                {grouped.map((g) => {
                  const isActive = (activeLevel ?? grouped[0]?.key) === g.key;
                  return (
                    <Pressable
                      key={g.key}
                      onPress={() => setActiveLevel(g.key)}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        paddingVertical: 9,
                        borderRadius: 10,
                        backgroundColor: isActive ? M.accent : "transparent",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: isActive ? M.ink : M.sub }}>{g.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Cast strip */}
          {cast.length > 0 ? (
            <View style={{ marginTop: 18 }}>
              <Text style={{ paddingHorizontal: 20, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: M.muted }}>
                The Cast
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, gap: 12 }}>
                {cast.map((c) => {
                  const accent = getAccent(c.hue as AccentHue);
                  return (
                    <View key={c.castId} style={{ width: 92, alignItems: "center" }}>
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: accent.bg,
                          borderWidth: 1,
                          borderColor: accent.border,
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{c.avatar}</Text>
                      </View>
                      <Text style={{ marginTop: 6, fontSize: 12, fontWeight: "700", color: M.text }} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={{ fontSize: 10, color: M.muted, textAlign: "center" }} numberOfLines={2}>
                        {c.role}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Episodes — filtered to the selected level when the segmented control is showing */}
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            {visibleGroups.map((g) => (
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
            {otherLevelsCount > 0 ? (
              <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>
                + {otherLevelsCount} more across {otherLevelLabels}
              </Text>
            ) : null}
          </View>

          {/* Also in this world — films + companion courses sharing the season,
              in one mixed rail (not split by type) so "related" reads as a
              single set, matching how the season's world is pitched elsewhere. */}
          {worldFilms.length > 0 || worldCourses.length > 0 ? (
            <View style={{ marginTop: 12, paddingHorizontal: 20 }}>
              <Text style={{ marginBottom: 10, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: M.muted }}>
                Also in this world
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 2 }}>
                {worldFilms.map((film) => (
                  <DiscoverCard key={film.id} item={film} onStoryPress={openStory} compact />
                ))}
                {worldCourses.map(renderCourseCard)}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
