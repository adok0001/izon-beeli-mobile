import { IconSymbol } from "@/components/ui/icon-symbol";
import { useBounties } from "@/lib/hooks/use-bounties";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

/** Teaser card for the top active bounty in the selected language. */
export function BountyTeaser({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const amber = getAccent("amber");
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
        borderColor: amber.border,
        borderLeftWidth: 4,
        borderLeftColor: amber.solid,
        backgroundColor: amber.bg,
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
            backgroundColor: amber.bg,
            marginRight: 12,
          }}
        >
          <IconSymbol name="star.fill" size={17} color=amber.solid />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: amber.solid }}>
              {t("learn.bountyLabel").toUpperCase()}
            </Text>
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 7,
                paddingVertical: 1.5,
                backgroundColor: amber.bg,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: amber.solid }}>
                +{topBounty.xpReward} XP
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: M.text, marginTop: 2 }} numberOfLines={1}>
            {topBounty.title}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={14} color=amber.solid />
      </View>
    </Pressable>
  );
}
