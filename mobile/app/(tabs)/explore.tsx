import { FeaturedHero } from "@/components/explore/featured-hero";
import { RoomTile } from "@/components/explore/room-tile";
import { DISCOVER_TYPE_CONFIG } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ExhibitDivider } from "@/components/ui/section-header";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured hero */}
        {featuredItem ? (
          <View style={{ marginBottom: 20 }}>
            <FeaturedHero item={featuredItem} />
          </View>
        ) : null}

        {/* Room tiles */}
        <ExhibitDivider label={tr("explore.title").toUpperCase()} style={{ marginBottom: 12 }} />
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
