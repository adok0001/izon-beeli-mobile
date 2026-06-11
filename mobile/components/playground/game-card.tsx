import { IconSymbol } from "@/components/ui/icon-symbol";
import { hapticTap } from "@/lib/haptics";
import { usePlaygroundStore, type PlaygroundGame } from "@/lib/playground";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export function GameCard({ game, dueCount }: { game: PlaygroundGame; dueCount: number }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const playedToday = usePlaygroundStore((s) => s.playedToday);
  const markPlayed = usePlaygroundStore((s) => s.markPlayed);
  const played = playedToday.includes(game.id);
  const showDue = !played && dueCount > 0 && (game.id === "word-review" || game.id === "speed-round");

  const tr = (key: string) => t(key as never) as string;
  const title = tr(`playground.games.${game.i18nKey}.title`);
  const description = tr(`playground.games.${game.i18nKey}.description`);

  const handlePress = () => {
    hapticTap();
    markPlayed(game.id);
    router.push(game.route as never);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flex: 1,
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        padding: 14,
        minHeight: 110,
        overflow: "hidden",
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
    >
      {/* State badge */}
      {played ? (
        <View style={{ position: "absolute", top: 10, right: 10 }}>
          <IconSymbol name="checkmark.circle.fill" size={16} color={M.success} />
        </View>
      ) : showDue ? (
        <View
          style={{
            position: "absolute", top: 10, right: 10,
            minWidth: 18, borderRadius: 999,
            alignItems: "center", justifyContent: "center",
            backgroundColor: M.error, paddingHorizontal: 5, paddingVertical: 1,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>{dueCount}</Text>
        </View>
      ) : game.tag ? (
        <View style={{ position: "absolute", top: 10, right: 10, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: `${game.color}25` }}>
          <Text style={{ fontSize: 7, fontWeight: "800", letterSpacing: 1, color: game.color }}>
            {t("playground.daily").toUpperCase()}
          </Text>
        </View>
      ) : null}

      {/* Icon */}
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: `${game.color}18`, marginBottom: 10 }}>
        <IconSymbol name={game.icon as never} size={20} color={game.color} />
      </View>

      <Text style={{ fontSize: 13, fontWeight: "800", color: M.text, marginBottom: 3 }}>{title}</Text>
      <Text style={{ fontSize: 11, color: M.muted, lineHeight: 15 }} numberOfLines={2}>{description}</Text>

      {/* Bottom color accent */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: `${game.color}40` }} />
    </Pressable>
  );
}
