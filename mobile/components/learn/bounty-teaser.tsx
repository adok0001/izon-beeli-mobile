import { IconSymbol } from "@/components/ui/icon-symbol";
import { useBounties } from "@/lib/hooks/use-bounties";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

/** Teaser card for the top active bounty in the selected language. */
export function BountyTeaser({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: bounties } = useBounties(languageId);
  const topBounty = bounties?.[0];

  if (!topBounty) return null;

  return (
    <Pressable
      onPress={() => router.push("/bounties")}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(245, 158, 11, 0.25)",
        borderLeftWidth: 4,
        borderLeftColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.07)",
        padding: 14,
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`Bounty: ${topBounty.title}, earn ${topBounty.xpReward} XP`}
      accessibilityHint="Tap to view all bounties"
    >
      <View className="flex-row items-center">
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            marginRight: 12,
          }}
        >
          <IconSymbol name="star.fill" size={17} color="#f59e0b" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: "#f59e0b" }}>
              {t("learn.bountyLabel").toUpperCase()}
            </Text>
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 7,
                paddingVertical: 1.5,
                backgroundColor: "rgba(245, 158, 11, 0.2)",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#f59e0b" }}>
                +{topBounty.xpReward} XP
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: M.text, marginTop: 2 }} numberOfLines={1}>
            {topBounty.title}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={14} color="#f59e0b" />
      </View>
    </Pressable>
  );
}
