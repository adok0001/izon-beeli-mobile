import type { SeriesLevelBand } from "@/lib/data/series";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, ScrollView, Text, View } from "react-native";

interface LevelBandRailProps {
  bands: SeriesLevelBand[];
  onPress: (band: SeriesLevelBand) => void;
}

/** "By level" rail — Beginner/Intermediate/Advanced cards linking into the series, pre-filtered. */
export function LevelBandRail({ bands, onPress }: LevelBandRailProps) {
  const M = useMuseumTheme();
  if (bands.length === 0) return null;

  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ marginBottom: 10, paddingHorizontal: 4, fontSize: 15, fontWeight: "800", color: M.text, letterSpacing: -0.2 }}>
        By level
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 4, paddingBottom: 2 }}>
        {bands.map((band) => (
          <Pressable
            key={band.key}
            onPress={() => onPress(band)}
            className="active:opacity-80"
            style={{ width: 130, padding: 14, borderRadius: 16, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}
            accessibilityRole="button"
            accessibilityLabel={`${band.label}: ${band.subtitle}`}
          >
            <View style={{ alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: M.accent }}>{band.cefr}</Text>
            </View>
            <Text style={{ marginTop: 10, fontSize: 14, fontWeight: "700", color: M.text }}>{band.label}</Text>
            <Text style={{ marginTop: 2, fontSize: 11, color: M.muted }} numberOfLines={2}>
              {band.subtitle}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
