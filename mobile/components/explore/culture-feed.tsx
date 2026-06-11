import { DiscoverCard } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ExhibitDivider } from "@/components/ui/section-header";
import { useDiscover, type DiscoverFilter } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ScrollView, Text, View } from "react-native";

const DIVIDER_STYLE = { marginTop: 4, marginBottom: 12 } as const;

export function CultureFeed({ filter }: { filter: DiscoverFilter }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
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
            <ExhibitDivider label={t("culture.sectionFeatured")} style={DIVIDER_STYLE} />
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
        {rest.length > 0 && <ExhibitDivider label={t("culture.sectionAll")} style={DIVIDER_STYLE} />}
      </>
    ),
    [featured, rest.length, handleStoryPress, t]
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
              {t("culture.emptyTitle")}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: M.muted, textAlign: "center" }}>
              {t("culture.emptyBody")}
            </Text>
          </View>
        ) : null
      }
    />
  );
}
