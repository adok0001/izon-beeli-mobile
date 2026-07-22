import { DISCOVER_TYPE_CONFIG } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { DiscoverItem } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

interface FeaturedHeroProps {
  item: DiscoverItem;
  /** Overrides the type's default CTA copy (e.g. "Start Episode 1" for a season spotlight). */
  ctaLabel?: string;
  /** Constrains the card to a fixed width (used when riding inside the carousel). */
  width?: number;
}

// Matches the Library screen's own ScrollView paddingHorizontal so the
// carousel's negative margin bleeds edge-to-edge without overshooting it.
const CAROUSEL_GUTTER = 16;

/**
 * One card per type's featured item, so the Library spotlight always agrees
 * with each Room's own hero — both read the same per-type `featured` flag
 * instead of Library picking one arbitrary item across all types.
 */
export function FeaturedHeroCarousel({ items }: { items: DiscoverItem[] }) {
  const { width: screenWidth } = useWindowDimensions();
  const nextCardPeek = CAROUSEL_GUTTER / 2;
  const cardWidth = screenWidth - CAROUSEL_GUTTER * 2 - nextCardPeek;

  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={items.length > 1 ? cardWidth + nextCardPeek : undefined}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: CAROUSEL_GUTTER, gap: CAROUSEL_GUTTER / 2 }}
      style={{ marginHorizontal: -CAROUSEL_GUTTER }}
    >
      {items.map((item) => (
        <FeaturedHero
          key={item.id}
          item={item}
          width={cardWidth}
          ctaLabel={item.type === "podcast" && item.storyId ? "Start Episode 1" : undefined}
        />
      ))}
    </ScrollView>
  );
}

export function FeaturedHero({ item, ctaLabel, width }: FeaturedHeroProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const cfg = DISCOVER_TYPE_CONFIG[item.type];

  function handlePress() {
    if (item.type === "podcast" && item.storyId) {
      router.push(`/series/${item.storyId}` as never);
    } else if (item.type === "film" && item.scenes) {
      // A film IS its story — open the branching player by the film's own id.
      router.push(`/discover-story/${item.id}` as never);
    } else {
      router.push(`/discover-content/${item.id}` as never);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      className="active:opacity-90"
    >
      <LinearGradient
        colors={[item.coverGradient[0], M.ink]}
        style={{
          width,
          borderRadius: 20,
          padding: 20,
          paddingTop: 28,
          paddingBottom: 20,
          minHeight: 190,
          justifyContent: "flex-end",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Background glyph */}
        <IconSymbol
          name={cfg.icon}
          size={80}
          color={cfg.color}
          style={{ position: "absolute", top: 10, right: 12, opacity: 0.18 }}
        />

        {/* Type badge */}
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: cfg.accentDim,
            marginBottom: 12,
          }}
        >
          <IconSymbol name={cfg.icon} size={11} color={cfg.color} />
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.2, color: cfg.color }}>
            {t("library.featuredToday")}
          </Text>
        </View>

        <Text
          numberOfLines={2}
          style={{ fontSize: 22, fontWeight: "900", color: M.parchment, lineHeight: 28, letterSpacing: -0.3 }}
        >
          {item.title}
        </Text>
        <Text style={{ fontSize: 12, color: M.sub, marginTop: 6 }}>
          {item.author}
          {item.duration ? ` · ${Math.round(item.duration / 60)} min` : ""}
        </Text>

        {/* CTA pill */}
        <View
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            backgroundColor: cfg.accentDim,
            borderWidth: 1,
            borderColor: cfg.accentBorder,
          }}
        >
          <IconSymbol name={cfg.icon} size={11} color={cfg.color} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: cfg.color }}>{ctaLabel ?? cfg.cta}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
