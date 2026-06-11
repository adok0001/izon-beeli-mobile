import { IconSymbol } from "@/components/ui/icon-symbol";
import { hapticTap } from "@/lib/haptics";
import { usePlaygroundStore, type PlaygroundGame } from "@/lib/playground";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

function GameChip({ game, dueCount }: { game: PlaygroundGame; dueCount: number }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const playedToday = usePlaygroundStore((s) => s.playedToday);
  const markPlayed = usePlaygroundStore((s) => s.markPlayed);
  const played = playedToday.includes(game.id);
  const showDue = dueCount > 0 && (game.id === "word-review" || game.id === "speed-round");
  const tr = (key: string) => t(key as never) as string;

  const handlePress = () => {
    hapticTap();
    markPlayed(game.id);
    router.push(game.route as never);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        width: 92,
        alignItems: "center",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 6,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={tr(`playground.games.${game.i18nKey}.title`)}
    >
      <View>
        <View
          style={{
            width: 38, height: 38, borderRadius: 11,
            alignItems: "center", justifyContent: "center",
            backgroundColor: `${game.color}18`,
          }}
        >
          <IconSymbol name={game.icon as never} size={18} color={game.color} />
        </View>
        {played && (
          <View style={{ position: "absolute", top: -5, right: -7 }}>
            <IconSymbol name="checkmark.circle.fill" size={15} color={M.success} />
          </View>
        )}
        {!played && showDue && (
          <View
            style={{
              position: "absolute", top: -5, right: -9,
              minWidth: 16, borderRadius: 999,
              alignItems: "center", justifyContent: "center",
              backgroundColor: M.error, paddingHorizontal: 4, paddingVertical: 1,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>{dueCount}</Text>
          </View>
        )}
      </View>
      <Text
        style={{ marginTop: 8, fontSize: 10, fontWeight: "700", color: M.text, textAlign: "center" }}
        numberOfLines={2}
      >
        {tr(`playground.games.${game.i18nKey}.title`)}
      </Text>
    </Pressable>
  );
}

export function GameShelf({ games, dueCount }: { games: PlaygroundGame[]; dueCount: number }) {
  if (games.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
    >
      {games.map((game) => (
        <GameChip key={game.id} game={game} dueCount={dueCount} />
      ))}
    </ScrollView>
  );
}
