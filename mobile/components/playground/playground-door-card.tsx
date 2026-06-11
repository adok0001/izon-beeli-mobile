import { IconSymbol } from "@/components/ui/icon-symbol";
import { hapticTap } from "@/lib/haptics";
import { relevantGames, usePlaygroundStore } from "@/lib/playground";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export function PlaygroundDoorCard({ languageId }: { languageId: string }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const playedToday = usePlaygroundStore((s) => s.playedToday);
  const games = relevantGames(languageId);
  const playedCount = games.filter((g) => playedToday.includes(g.id)).length;

  const handlePress = () => {
    hapticTap();
    router.push("/playground" as never);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flexDirection: "row", alignItems: "center",
        borderRadius: 14, padding: 14,
        backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
        borderLeftWidth: 4, borderLeftColor: M.accent,
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={t("playground.visitTitle")}
    >
      <View
        style={{
          width: 38, height: 38, borderRadius: 10,
          alignItems: "center", justifyContent: "center",
          backgroundColor: `${M.accent}12`, marginRight: 12,
        }}
      >
        <IconSymbol name="building.columns.fill" size={18} color={M.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>
          {t("playground.visitTitle")}
        </Text>
        <Text style={{ fontSize: 11, color: M.muted, marginTop: 1 }}>
          {t("playground.visitSubtitle", { total: String(games.length), played: String(playedCount) })}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={13} color={M.accent} />
    </Pressable>
  );
}
