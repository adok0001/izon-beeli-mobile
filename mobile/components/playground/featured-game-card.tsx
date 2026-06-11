import { IconSymbol } from "@/components/ui/icon-symbol";
import { type } from "@/constants/typography";
import { hapticTap } from "@/lib/haptics";
import { usePlaygroundStore, type PlaygroundGame } from "@/lib/playground";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export function FeaturedGameCard({
  game,
  dueCount,
}: {
  game: PlaygroundGame;
  dueCount: number;
}) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const playedToday = usePlaygroundStore((s) => s.playedToday);
  const markPlayed = usePlaygroundStore((s) => s.markPlayed);
  const played = playedToday.includes(game.id);
  const tr = (key: string) => t(key as never) as string;

  // Contextual invitation beats the static catalog description when words are due.
  const invitation =
    dueCount > 0 && (game.id === "speed-round" || game.id === "word-review")
      ? t("playground.dueInvitation", { count: dueCount })
      : tr(`playground.games.${game.i18nKey}.description`);

  const handlePress = () => {
    hapticTap();
    markPlayed(game.id);
    router.push(game.route as never);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        borderLeftWidth: 4,
        borderLeftColor: game.color,
        overflow: "hidden",
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={tr(`playground.games.${game.i18nKey}.title`)}
      accessibilityHint={invitation}
    >
      {/* Label strip */}
      <View
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          backgroundColor: `${game.color}10`,
          paddingHorizontal: 14, paddingVertical: 8,
          borderBottomWidth: 1, borderBottomColor: `${game.color}20`,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <IconSymbol name="gamecontroller.fill" size={12} color={game.color} />
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, color: game.color }}>
            {t("playground.todaysGame").toUpperCase()}
          </Text>
        </View>
        {played ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <IconSymbol name="checkmark.circle.fill" size={12} color={M.success} />
            <Text style={{ fontSize: 8, fontWeight: "700", letterSpacing: 1, color: M.success }}>
              {t("playground.playedToday").toUpperCase()}
            </Text>
          </View>
        ) : (
          <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: `${game.color}20` }}>
            <Text style={{ fontSize: 8, fontWeight: "700", letterSpacing: 1, color: game.color }}>
              {t("playground.daily").toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        {/* Icon watermark, cropped bottom-right */}
        <View style={{ position: "absolute", right: -10, bottom: -14, opacity: 0.08 }}>
          <IconSymbol name={game.icon as never} size={88} color={game.color} />
        </View>

        <Text style={[type.h2, { color: M.text }]}>
          {tr(`playground.games.${game.i18nKey}.title`)}
        </Text>
        <Text style={{ marginTop: 6, fontSize: 13, lineHeight: 19, color: M.sub, paddingRight: 48 }}>
          {invitation}
        </Text>

        <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
          <IconSymbol name="play.circle.fill" size={18} color={game.color} />
          <Text style={{ fontSize: 12, fontWeight: "800", color: game.color }}>
            {t("playground.play")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
