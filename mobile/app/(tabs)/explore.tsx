import { DISCOVER_TYPE_CONFIG } from "@/components/discover-card";
import { DiscoverRail } from "@/components/explore/discover-rail";
import { FeaturedHero } from "@/components/explore/featured-hero";
import { RoomTile } from "@/components/explore/room-tile";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ExhibitDivider } from "@/components/ui/section-header";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export { ErrorBoundary } from "@/components/screen-error-boundary";

const ROOMS = ["blog", "podcast", "film"] as const;

export default function LibraryScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never, { defaultValue: key }) as string;
  const router = useRouter();
  const { all } = useDiscover("all");

  const featuredItem = all.find((i) => i.featured) ?? all[0] ?? null;
  const openStory = (storyId: string) => router.push(`/discover-story/${storyId}` as never);

  // Editorial rails. A podcast season (has storyId) reads as a "series";
  // podcasts without one are standalone episodes to "listen" to.
  const series = all.filter((i) => i.type === "podcast" && i.storyId);
  const episodes = all.filter((i) => i.type === "podcast" && !i.storyId);
  const films = all.filter((i) => i.type === "film");
  const blogs = all.filter((i) => i.type === "blog");

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
          <View style={{ marginBottom: 16 }}>
            <FeaturedHero item={featuredItem} />
          </View>
        ) : null}

        {/* Today's gallery — cross-link to the daily surface so it isn't a
            second competing "library" (word/proverb/song of the day + games). */}
        <Pressable
          onPress={() => router.push("/today" as never)}
          className="active:opacity-80"
          style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14, marginBottom: 24, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, borderLeftWidth: 3, borderLeftColor: M.accent }}
          accessibilityRole="button"
        >
          <IconSymbol name="sparkles" size={18} color={M.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>Today&apos;s Gallery</Text>
            <Text style={{ fontSize: 12, color: M.sub }}>Word & proverb of the day, and quick games</Text>
          </View>
          <IconSymbol name="chevron.right" size={15} color={M.muted} />
        </Pressable>

        {/* Editorial rails */}
        <DiscoverRail title="Series" items={series} onSeeAll={() => router.push("/explore/podcast" as never)} onStoryPress={openStory} />
        <DiscoverRail title="Films" items={films} onSeeAll={() => router.push("/explore/film" as never)} onStoryPress={openStory} />
        <DiscoverRail title="Listen" items={episodes} onSeeAll={() => router.push("/explore/podcast" as never)} onStoryPress={openStory} />
        <DiscoverRail title="Read" items={blogs} onSeeAll={() => router.push("/explore/blog" as never)} onStoryPress={openStory} />

        {/* Browse the library — demoted room tiles */}
        <ExhibitDivider label={tr("explore.title").toUpperCase()} style={{ marginBottom: 12, marginTop: 4 }} />
        <View style={{ gap: 12 }}>
          {ROOMS.map((type) => {
            const cfg = DISCOVER_TYPE_CONFIG[type];
            return (
              <RoomTile
                key={type}
                kicker={tr(cfg.roomKickerKey)}
                title={tr(cfg.roomTitleKey)}
                subtitle={tr(`library.${type === "blog" ? "readingRoomSub" : type === "podcast" ? "listeningBoothSub" : "screeningRoomSub"}`)}
                glyph={cfg.heroGlyph}
                color={cfg.color}
                gradient={cfg.gradient}
                onPress={() => router.push(`/explore/${type}` as never)}
              />
            );
          })}
        </View>

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
