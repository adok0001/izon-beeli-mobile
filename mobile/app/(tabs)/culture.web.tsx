import { DiscoverCard, DISCOVER_TYPE_CONFIG } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDiscover, type DiscoverFilter } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { DiscoverItem } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";

// SVG noise grain for the cinematic header atmosphere
const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

const FILTER_OPTIONS: { id: DiscoverFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blog", label: "Blog" },
  { id: "podcast", label: "Podcast" },
  { id: "film", label: "Film" },
];

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
  useEffect(() => {
    const handle = () => setW(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return w;
}

function SectionLabel({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, marginTop: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#C4862A" }} />
        <Text
          style={{
            fontSize: 9,
            fontWeight: "800",
            letterSpacing: 2,
            color: M.muted,
            textTransform: "uppercase" as const,
          }}
        >
          {label}
        </Text>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#C4862A" }} />
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
    </View>
  );
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

  function handlePress() {
    if (item.type === "film" && item.storyId) {
      onStoryPress(item.storyId);
    } else if (item.contentUrl) {
      window.open(item.contentUrl, "_blank");
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
        transition: "transform 0.2s ease" as never,
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
            background: `linear-gradient(to bottom, transparent, ${item.coverGradient[0]}CC, #0D0F1A)` as never,
          }}
        />

        {/* Background emoji at low opacity */}
        <Text
          style={{
            fontSize: 100,
            opacity: 0.07,
            position: "absolute",
            userSelect: "none" as never,
          }}
        >
          {item.coverEmoji}
        </Text>

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
              color: "#F7F2E8",
              letterSpacing: -0.3,
              lineHeight: 28,
              marginBottom: 6,
              textShadow: "0 1px 8px rgba(0,0,0,0.6)" as never,
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
  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: 24 }}>
      <SectionLabel label="FEATURED" />
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

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function CultureScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>("all");
  const { featured, rest } = useDiscover(activeFilter);
  const windowWidth = useWindowWidth();
  const isWide = windowWidth >= 768;
  const scrollRef = useRef<ScrollView>(null);

  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 14 }),
      Animated.spring(subtitleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 14 }),
    ]).start();
  }, [titleAnim, subtitleAnim]);

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
    <View style={{ flex: 1, backgroundColor: "#0D0F1A" }}>
      {/* ── Fixed dark foyer header ── */}
      <View
        style={{
          backgroundColor: "#0D0F1A",
          paddingHorizontal: isWide ? 40 : 20,
          paddingTop: 24,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#2E3245",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Film grain on header */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: GRAIN_URI as never,
            opacity: 0.04,
            pointerEvents: "none" as never,
          }}
        />

        <View
          style={{
            maxWidth: 900,
            marginLeft: "auto" as never,
            marginRight: "auto" as never,
            width: "100%",
          }}
        >
          <Animated.Text
            style={{
              fontSize: isWide ? 40 : 32,
              fontWeight: "900",
              color: "#F7F2E8",
              letterSpacing: -1,
              lineHeight: isWide ? 44 : 36,
              opacity: titleAnim,
              transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            CULTURE
          </Animated.Text>

          <Animated.Text
            style={{
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 3,
              color: "#C4862A",
              marginTop: 4,
              textTransform: "uppercase" as const,
              opacity: subtitleAnim,
              transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
            }}
          >
            STORIES · PODCASTS · FILM
          </Animated.Text>

          {/* Gold rule */}
          <View
            style={{
              height: 1,
              backgroundColor: "#C4862A",
              opacity: 0.3,
              marginTop: 12,
              marginBottom: 14,
            }}
          />

          {/* Filter pills */}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.id;
              const typeColor =
                opt.id === "blog"
                  ? "#38bdf8"
                  : opt.id === "podcast"
                  ? "#a78bfa"
                  : opt.id === "film"
                  ? "#fb923c"
                  : "#C4862A";
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setActiveFilter(opt.id)}
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    backgroundColor: isActive ? `${typeColor}18` : "rgba(46, 50, 69, 0.6)",
                    borderWidth: 1,
                    borderColor: isActive ? `${typeColor}60` : "#2E3245",
                    cursor: "pointer" as never,
                    transition: "all 0.15s ease" as never,
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: 0.3,
                      color: isActive ? typeColor : "#9A9480",
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        ref={scrollRef}
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
        {heroItem && (
          <HeroCard item={heroItem} onStoryPress={handleStoryPress} />
        )}

        {/* Featured strip */}
        <FeaturedStrip items={featuredStrip} onStoryPress={handleStoryPress} wide={isWide} />

        {/* All content list/grid */}
        {rest.length > 0 && (
          <>
            <SectionLabel label="ALL CONTENT" />
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
            <Text style={{ fontSize: 36, marginBottom: 16 }}>🎬</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: M.text, marginBottom: 6 }}>
              Nothing here yet
            </Text>
            <Text style={{ fontSize: 13, color: M.muted, textAlign: "center" as const, maxWidth: 280 }}>
              Check back soon for new stories and films.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
