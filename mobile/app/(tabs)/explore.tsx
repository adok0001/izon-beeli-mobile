import { ContinueListeningCard } from "@/components/explore/continue-listening-card";
import { DiscoverRail } from "@/components/explore/discover-rail";
import { FeaturedHero } from "@/components/explore/featured-hero";
import { LevelBandRail } from "@/components/explore/level-band-rail";
import { ProverbOfTheDay } from "@/components/proverb-of-the-day";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useResumeLesson } from "@/lib/hooks/use-resume-lesson";
import { useStoryArcById } from "@/lib/hooks/use-story-arc";
import { buildLevelBands } from "@/lib/series-presentation";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function LibraryScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never, { defaultValue: key }) as string;
  const router = useRouter();
  const { all } = useDiscover("all");
  const { resumeState } = useResumeLesson();
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);
  const { uiLanguage } = useUiLanguageStore();

  const featuredItem = all.find((i) => i.featured) ?? all[0] ?? null;
  const openStory = (storyId: string) => router.push(`/discover-story/${storyId}` as never);

  // Editorial rails. A podcast season (has storyId) reads as a "series";
  // podcasts without one are standalone episodes to "listen" to.
  const series = all.filter((i) => i.type === "podcast" && i.storyId);
  const films = all.filter((i) => i.type === "film");

  // Level bands ride on whichever season is currently promoted, built from that
  // season's companion courses (served with the arc).
  const primaryStoryId = series[0]?.storyId;
  const { data: primaryArc } = useStoryArcById(primaryStoryId ?? "");
  const levelBands = buildLevelBands(primaryArc?.companionCourses, uiLanguage, primaryArc?.nativeTitle);
  const openSeriesLevel = (level: string) =>
    router.push({ pathname: "/series/[id]", params: { id: primaryStoryId!, level } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Foyer header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2.5, color: M.accent, marginBottom: 4 }}>
          {tr("explore.subtitle").toUpperCase()}
        </Text>
        <Text style={{ fontSize: 32, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
          {tr("explore.title").toUpperCase()}
        </Text>
        <View style={{ height: 1, backgroundColor: M.accent, opacity: 0.25, marginTop: 12 }} />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.bg }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Spotlight */}
        {featuredItem ? (
          <View style={{ marginBottom: 22 }}>
            <FeaturedHero
              item={featuredItem}
              ctaLabel={featuredItem.type === "podcast" && featuredItem.storyId ? "Start Episode 1" : undefined}
            />
          </View>
        ) : null}

        {/* Continue listening — the last partially-played lesson, if any */}
        {resumeState ? (
          <View style={{ marginBottom: 22 }}>
            <Text style={{ marginBottom: 10, paddingHorizontal: 4, fontSize: 15, fontWeight: "800", color: M.text, letterSpacing: -0.2 }}>
              Continue listening
            </Text>
            <ContinueListeningCard />
          </View>
        ) : null}

        {/* Editorial rails */}
        <DiscoverRail title="New series" items={series} onSeeAll={() => router.push("/explore/podcast" as never)} onStoryPress={openStory} />
        <DiscoverRail title="Films" items={films} onSeeAll={() => router.push("/explore/film" as never)} onStoryPress={openStory} />

        {/* By level */}
        {primaryStoryId ? (
          <LevelBandRail bands={levelBands} onPress={(band) => openSeriesLevel(band.key)} />
        ) : null}

        {/* Cultural */}
        <View style={{ marginBottom: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, paddingHorizontal: 4 }}>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text, letterSpacing: -0.2 }}>Culture Notes</Text>
            <Pressable
              onPress={() => router.push(`/cultural/${selectedLanguageId}` as never)}
              hitSlop={8}
              className="active:opacity-70"
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: M.accent }}>Gallery</Text>
              <IconSymbol name="chevron.right" size={11} color={M.accent} />
            </Pressable>
          </View>
          <Pressable onPress={() => router.push(`/cultural/${selectedLanguageId}` as never)} className="active:opacity-80">
            <ProverbOfTheDay languageId={selectedLanguageId} />
          </Pressable>
        </View>

        {/* Today's gallery — cross-link to the daily surface so it isn't a
            second competing "library" (word/proverb/song of the day + games). */}
        <Pressable
          onPress={() => router.push("/today" as never)}
          className="active:opacity-80"
          style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14, marginBottom: 12, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, borderLeftWidth: 3, borderLeftColor: M.accent }}
          accessibilityRole="button"
        >
          <IconSymbol name="sparkles" size={18} color={M.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>Today&apos;s Gallery</Text>
            <Text style={{ fontSize: 12, color: M.sub }}>Word & proverb of the day, and quick games</Text>
          </View>
          <IconSymbol name="chevron.right" size={15} color={M.muted} />
        </Pressable>

        {/* Empty state */}
        {all.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <IconSymbol name="books.vertical.fill" size={36} color={M.muted} />
            <Text style={{ marginTop: 12, fontSize: 14, color: M.sub, textAlign: "center" }}>
              {tr("library.emptyTitle")}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
