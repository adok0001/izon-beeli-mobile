import { DiscoverCard } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDiscover, type DiscoverFilter } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useCallback, useRef, useEffect, useState } from "react";
import { Animated, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTER_OPTIONS: { id: DiscoverFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blog", label: "Blog" },
  { id: "podcast", label: "Podcast" },
  { id: "film", label: "Film" },
];

const TYPE_COLORS: Record<string, string> = {
  all: "#C4862A",
  blog: "#38bdf8",
  podcast: "#a78bfa",
  film: "#fb923c",
};

function SectionLabel({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#C4862A" }} />
        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, color: M.muted }}>{label}</Text>
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#C4862A" }} />
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
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

  const renderListHeader = useCallback(
    () => (
      <>
        {featured.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <SectionLabel label="FEATURED" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {featured.map((item) => (
                <DiscoverCard key={item.id} item={item} onStoryPress={handleStoryPress} compact />
              ))}
            </ScrollView>
          </View>
        )}
        {rest.length > 0 && <SectionLabel label="ALL CONTENT" />}
      </>
    ),
    [featured, rest.length, handleStoryPress]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Dark foyer header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
        <Animated.Text
          style={{
            fontSize: 32,
            fontWeight: "900",
            color: M.parchment,
            letterSpacing: -0.5,
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          }}
        >
          CULTURE
        </Animated.Text>
        <Animated.Text
          style={{
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 2.5,
            color: "#C4862A",
            marginTop: 3,
            opacity: subtitleAnim,
          }}
        >
          STORIES · PODCASTS · FILM
        </Animated.Text>

        {/* Gold rule */}
        <View style={{ height: 1, backgroundColor: "#C4862A", opacity: 0.25, marginTop: 12, marginBottom: 12 }} />

        {/* Filter pills */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.id;
            const col = TYPE_COLORS[opt.id] ?? "#C4862A";
            return (
              <Pressable
                key={opt.id}
                onPress={() => setActiveFilter(opt.id)}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 6,
                  backgroundColor: isActive ? `${col}18` : M.card,
                  borderWidth: 1,
                  borderColor: isActive ? `${col}55` : M.border,
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: isActive ? col : M.sub }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <FlatList
        style={{ flex: 1, backgroundColor: M.bg }}
        data={rest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <DiscoverCard item={item} onStoryPress={handleStoryPress} />
          </View>
        )}
        ListEmptyComponent={
          featured.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <IconSymbol name="globe.fill" size={36} color={M.muted} />
              <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: M.text }}>
                Nothing here yet
              </Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.muted, textAlign: "center" }}>
                Check back soon for new stories and films.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
