import { DiscoverCard } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { DiscoverItem } from "@/types";
import { Pressable, ScrollView, Text, View } from "react-native";

interface DiscoverRailProps {
  title: string;
  items: DiscoverItem[];
  /** Optional "See all" tap target (e.g. opens the type's room). */
  onSeeAll?: () => void;
  /** Routing for a film that has a branching interactive story. */
  onStoryPress?: (storyId: string) => void;
}

/**
 * A horizontal editorial rail of compact Discover cards. The Explore home is
 * composed of these (Series, Films, Listen, Read) so the library reads like a
 * modern streaming shelf, not a directory of room tiles. Renders nothing when
 * empty so callers can list every rail unconditionally.
 */
export function DiscoverRail({ title, items, onSeeAll, onStoryPress }: DiscoverRailProps) {
  const M = useMuseumTheme();
  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, paddingHorizontal: 4 }}>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text, letterSpacing: -0.2 }}>{title}</Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 2 }} className="active:opacity-70">
            <Text style={{ fontSize: 12, fontWeight: "700", color: M.accent }}>See all</Text>
            <IconSymbol name="chevron.right" size={11} color={M.accent} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 4, paddingBottom: 2 }}
      >
        {items.map((item) => (
          <DiscoverCard key={item.id} item={item} onStoryPress={onStoryPress} compact />
        ))}
      </ScrollView>
    </View>
  );
}
