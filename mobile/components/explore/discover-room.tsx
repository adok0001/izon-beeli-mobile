import { DiscoverCard } from "@/components/discover-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ExhibitDivider } from "@/components/ui/section-header";
import { useDiscover, type DiscoverFilter } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ScrollView, Text, View } from "react-native";
import type { DiscoverItem } from "@/types";

const DIVIDER_STYLE = { marginTop: 4, marginBottom: 12 } as const;

interface DiscoverRoomProps {
  filter: DiscoverFilter;
  accentColor: string;
  /** Rendered above the featured row — e.g. a hero card component */
  hero?: React.ReactNode;
}

export function DiscoverRoom({ filter, accentColor, hero }: DiscoverRoomProps) {
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
        {hero ? <View style={{ marginBottom: 16 }}>{hero}</View> : null}
        {featured.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <ExhibitDivider label={t("culture.sectionFeatured")} style={DIVIDER_STYLE} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {featured.map((item: DiscoverItem) => (
                <DiscoverCard key={item.id} item={item} onStoryPress={handleStoryPress} compact />
              ))}
            </ScrollView>
          </View>
        )}
        {rest.length > 0 && (
          <ExhibitDivider
            label={t("library.allContent")}
            style={{ ...DIVIDER_STYLE, borderBottomColor: accentColor }}
          />
        )}
      </>
    ),
    [featured, rest.length, handleStoryPress, hero, accentColor, t]
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
        featured.length === 0 && !hero ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="globe.fill" size={36} color={M.muted} />
            <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: M.text }}>
              {t("library.emptyTitle")}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: M.muted, textAlign: "center" }}>
              {t("library.emptyBody")}
            </Text>
          </View>
        ) : null
      }
    />
  );
}
