import { DiscoverCard, DISCOVER_TYPE_CONFIG } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ExhibitDivider } from "@/components/ui/section-header";
import { useDiscover, type DiscoverFilter } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { DiscoverItem } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

const DIVIDER_STYLE = { marginTop: 4, marginBottom: 14 } as const;

// SVG noise grain for the cinematic hero atmosphere
const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
  useEffect(() => {
    const handle = () => setW(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return w;
}

function HeroCard({
  item,
  onStoryPress,
}: {
  item: DiscoverItem;
  onStoryPress: (id: string) => void;
}) {
  const M = useMuseumTheme();
  const cfg = DISCOVER_TYPE_CONFIG[item.type];
  const [hovered, setHovered] = useState(false);

  const router = useRouter();

  function handlePress() {
    if (item.type === "film" && item.scenes) {
      // A film IS its story — open the branching player by the film's own id.
      onStoryPress(item.id);
    } else {
      router.push(`/discover-content/${item.id}` as never);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 24,
        cursor: "pointer" as never,
        transform: [{ scale: hovered ? 1.005 : 1 }],
        ...({ transition: "transform 0.2s ease" } as object),
      }}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      {/* Cinematic gradient background */}
      <View
        style={{
          height: 240,
          backgroundColor: item.coverGradient[0],
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Film grain overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: GRAIN_URI as never,
            opacity: 0.06,
            pointerEvents: "none" as never,
          }}
        />
        {/* Dark gradient vignette bottom */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "70%",
            ...({ background: `linear-gradient(to bottom, transparent, ${item.coverGradient[0]}CC, #0D0F1A)` } as object),
          }}
        />

        {/* Background glyph at low opacity */}
        <IconSymbol
          name={cfg.icon}
          size={100}
          color={cfg.color}
          style={{ opacity: 0.07, position: "absolute" }}
        />

        {/* Type badge top-left */}
        <View
          style={{
            position: "absolute",
            top: 16,
            left: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: "rgba(13, 15, 26, 0.7)",
            backdropFilter: "blur(8px)" as never,
            borderWidth: 1,
            borderColor: `${cfg.color}40`,
          }}
        >
          <IconSymbol name={cfg.icon} size={10} color={cfg.color} />
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: cfg.color }}>
            {cfg.label}
          </Text>
        </View>

        {/* Content pinned bottom */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: M.parchment,
              letterSpacing: -0.3,
              lineHeight: 28,
              marginBottom: 6,
              ...({ textShadow: "0 1px 8px rgba(0,0,0,0.6)" } as object),
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 11, color: "rgba(247, 242, 232, 0.6)", fontWeight: "600" }}>
              {item.author}
            </Text>
            <Text style={{ fontSize: 11, color: "rgba(247, 242, 232, 0.3)" }}>·</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: `${cfg.color}25`,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <IconSymbol
                name={item.type === "blog" ? "chevron.right" : "play.fill"}
                size={9}
                color={cfg.color}
              />
              <Text style={{ fontSize: 10, fontWeight: "700", color: cfg.color }}>{cfg.cta}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function FeaturedStrip({
  items,
  onStoryPress,
  wide,
}: {
  items: DiscoverItem[];
  onStoryPress: (id: string) => void;
  wide: boolean;
}) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: 24 }}>
      <ExhibitDivider label={t("culture.sectionFeatured")} style={DIVIDER_STYLE} />
      {wide ? (
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          {items.map((item) => (
            <View key={item.id} style={{ flex: 1, minWidth: 200 }}>
              <DiscoverCard item={item} onStoryPress={onStoryPress} compact />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
        >
          {items.map((item) => (
            <DiscoverCard key={item.id} item={item} onStoryPress={onStoryPress} compact />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function CultureFeed({ filter }: { filter: DiscoverFilter }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { featured, rest } = useDiscover(filter);
  const windowWidth = useWindowWidth();
  const isWide = windowWidth >= 768;

  const handleStoryPress = useCallback(
    (storyId: string) => {
      router.push(`/discover-story/${storyId}` as never);
    },
    [router]
  );

  const heroItem = featured[0];
  const featuredStrip = featured.slice(1);

  const contentCols = isWide
    ? { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 12 }
    : {};

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: M.bg }}
      contentContainerStyle={{
        paddingHorizontal: isWide ? 40 : 16,
        paddingTop: 24,
        paddingBottom: 60,
        maxWidth: 940,
        marginLeft: "auto" as never,
        marginRight: "auto" as never,
        width: "100%",
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero: first featured item */}
      {heroItem && <HeroCard item={heroItem} onStoryPress={handleStoryPress} />}

      {/* Featured strip */}
      <FeaturedStrip items={featuredStrip} onStoryPress={handleStoryPress} wide={isWide} />

      {/* All content list/grid */}
      {rest.length > 0 && (
        <>
          <ExhibitDivider label={t("culture.sectionAll")} style={DIVIDER_STYLE} />
          <View style={contentCols}>
            {rest.map((item) => (
              <View
                key={item.id}
                style={
                  isWide
                    ? { width: "calc(50% - 6px)" as never, marginBottom: 12 }
                    : { marginBottom: 10 }
                }
              >
                <DiscoverCard item={item} onStoryPress={handleStoryPress} />
              </View>
            ))}
          </View>
        </>
      )}

      {featured.length === 0 && rest.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 80 }}>
          <IconSymbol name="film.stack" size={36} color={M.muted} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: M.text, marginBottom: 6 }}>
            {t("culture.emptyTitle")}
          </Text>
          <Text style={{ fontSize: 13, color: M.muted, textAlign: "center" as const, maxWidth: 280 }}>
            {t("culture.emptyBody")}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
