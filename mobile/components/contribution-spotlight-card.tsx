import { IconSymbol } from "@/components/ui/icon-symbol";
import { useContributors } from "@/lib/hooks/use-contributors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export function ContributionSpotlightCard() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { data: contributors = [] } = useContributors();
  const featured = contributors[0];

  if (!featured) return null;

  return (
    <Pressable
      onPress={() => router.push("/contributors")}
      style={{
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        borderLeftWidth: 4,
        borderLeftColor: "#60a5fa",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`Community spotlight: ${featured.name}`}
    >
      {/* Avatar */}
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(96, 165, 250, 0.15)", borderWidth: 1.5, borderColor: "rgba(96, 165, 250, 0.3)" }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#60a5fa" }}>
          {(featured.name[0] ?? "C").toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.8, color: "#60a5fa" }}>
            COMMUNITY SPOTLIGHT
          </Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }} numberOfLines={1}>
          {featured.name}
        </Text>
        <Text style={{ fontSize: 11, color: M.muted, marginTop: 1 }}>
          {featured.approvedCount} words contributed
        </Text>
      </View>

      <IconSymbol name="chevron.right" size={14} color="#60a5fa" />
    </Pressable>
  );
}
