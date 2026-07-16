import { getAccent, type AccentHue } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { ScrollView, Text, View } from "react-native";

export type SeasonCastMember = Readonly<{
  castId: string;
  name: string;
  role: string;
  avatar: string;
  hue: string;
}>;

/**
 * Horizontal cast strip for a season. Renders nothing when the cast is empty,
 * so callers can drop it in unconditionally. Pure props → shared by the live
 * Series screen and the Studio season preview.
 */
export function SeasonCastStrip({ cast }: Readonly<{ cast: readonly SeasonCastMember[] }>) {
  const M = useMuseumTheme();
  if (cast.length === 0) return null;
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={{ paddingHorizontal: 20, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: M.muted }}>
        The Cast
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, gap: 12 }}>
        {cast.map((c) => {
          const accent = getAccent(c.hue as AccentHue);
          return (
            <View key={c.castId} style={{ width: 92, alignItems: "center" }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: accent.bg,
                  borderWidth: 1,
                  borderColor: accent.border,
                }}
              >
                <Text style={{ fontSize: 22 }}>{c.avatar}</Text>
              </View>
              <Text style={{ marginTop: 6, fontSize: 12, fontWeight: "700", color: M.text }} numberOfLines={1}>
                {c.name}
              </Text>
              <Text style={{ fontSize: 10, color: M.muted, textAlign: "center" }} numberOfLines={2}>
                {c.role}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
