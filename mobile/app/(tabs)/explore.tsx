import { CultureFeed } from "@/components/explore/culture-feed";
import { DailyExhibits } from "@/components/explore/daily-exhibits";
import { LanguagePickerButton } from "@/components/language-picker";
import { getAccent } from "@/constants/accent-colors";
import { type DiscoverFilter } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ExploreFilter = "daily" | DiscoverFilter;

const FILTER_OPTIONS: { id: ExploreFilter; labelKey: string }[] = [
  { id: "daily", labelKey: "explore.filterDaily" },
  { id: "all", labelKey: "culture.filterAll" },
  { id: "blog", labelKey: "culture.filterBlog" },
  { id: "podcast", labelKey: "culture.filterPodcast" },
  { id: "film", labelKey: "culture.filterFilm" },
];

const TYPE_COLORS: Record<DiscoverFilter, string | null> = {
  all: null, // null → Museum accent (theme-dependent)
  blog: getAccent("sky").solid,
  podcast: getAccent("purple").solid,
  film: getAccent("orange").solid,
};

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function ExploreScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never) as string;
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>("daily");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Dark foyer header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
              {t("explore.title").toUpperCase()}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "700", letterSpacing: 2.5, color: M.accent, marginTop: 3 }}>
              {t("explore.subtitle").toUpperCase()}
            </Text>
          </View>
          {activeFilter === "daily" && (
            <View style={{ marginTop: 4 }}>
              <LanguagePickerButton />
            </View>
          )}
        </View>

        {/* Gold rule */}
        <View style={{ height: 1, backgroundColor: M.accent, opacity: 0.25, marginTop: 12, marginBottom: 12 }} />

        {/* Filter pills */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.id;
            const col = (opt.id === "daily" ? null : TYPE_COLORS[opt.id]) ?? M.accent;
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
                  {tr(opt.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {activeFilter === "daily" ? (
        <DailyExhibits />
      ) : (
        <CultureFeed filter={activeFilter} />
      )}
    </SafeAreaView>
  );
}
