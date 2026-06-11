import { DiscoverCard } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDiscover, type DiscoverFilter } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";

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

export function CultureFeed({ filter }: { filter: DiscoverFilter }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { featured, rest } = useDiscover(filter);

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
  );
}
