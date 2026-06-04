import { useCallback, useEffect } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useMatchingStore, type Tile } from "@/store/matching-store";
import { hapticSuccess, hapticError, hapticTap } from "@/lib/haptics";
import { useMuseumTheme } from "@/lib/use-museum-theme";

const FLASH_DURATION = 600;
const COLUMNS = 4;
const GAP = 8;
const screenWidth = Dimensions.get("window").width;
const tileSize = (screenWidth - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

function getTileColors(tile: Tile): { bg: string; border: string; text: string } {
  if (tile.matched) return { bg: "#22c55e20", border: "#22c55e60", text: "#22c55e" };
  if (tile.flash === "correct") return { bg: "#22c55e30", border: "#22c55e", text: "#22c55e" };
  if (tile.flash === "incorrect") return { bg: "#ef444430", border: "#ef4444", text: "#ef4444" };
  if (tile.selected) return { bg: "#C4862A20", border: "#C4862A", text: "#C4862A" };
  if (tile.kind === "word") return { bg: "#a78bfa15", border: "#a78bfa50", text: "#a78bfa" };
  return { bg: "#f59e0b10", border: "#f59e0b40", text: "#f59e0b" };
}

function MatchingTile({ tile, onPress }: { tile: Tile; onPress: () => void }) {
  const M = useMuseumTheme();
  const scale = useSharedValue(1);
  const colors = getTileColors(tile);

  useEffect(() => {
    if (tile.flash !== "none") {
      scale.value = withSequence(
        withTiming(1.08, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }
  }, [tile.flash]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        disabled={tile.matched}
        style={{ width: tileSize, height: tileSize, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 2, padding: 6, backgroundColor: colors.bg, borderColor: colors.border }}
        className="active:opacity-70"
      >
        <Text
          style={{ textAlign: "center", fontSize: 12, fontWeight: "600", color: tile.matched || tile.flash !== "none" ? colors.text : M.text }}
          numberOfLines={3}
          adjustsFontSizeToFit
        >
          {tile.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function MatchingBoard() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { tiles, selectTile, clearFlash, matchedCount, totalPairs, attempts } =
    useMatchingStore();

  const handlePress = useCallback(
    (tileId: string) => {
      hapticTap();
      const result = selectTile(tileId);
      if (result) {
        if (result.matched) {
          hapticSuccess();
        } else {
          hapticError();
        }
        setTimeout(() => clearFlash(), FLASH_DURATION);
      }
    },
    [selectTile, clearFlash]
  );

  return (
    <View>
      <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 13, color: M.sub }}>
          {t("matching.matched", { matched: matchedCount, total: totalPairs })}
        </Text>
        <Text style={{ fontSize: 13, color: M.sub }}>
          {t("matching.attempts", { count: attempts })}
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
        {tiles.map((tile) => (
          <MatchingTile
            key={tile.id}
            tile={tile}
            onPress={() => handlePress(tile.id)}
          />
        ))}
      </View>

      <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ marginRight: 6, height: 12, width: 12, borderRadius: 4, backgroundColor: "#a78bfa50" }} />
          <Text style={{ fontSize: 11, color: M.sub }}>{t("matching.wordLabel")}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ marginRight: 6, height: 12, width: 12, borderRadius: 4, backgroundColor: "#f59e0b40" }} />
          <Text style={{ fontSize: 11, color: M.sub }}>{t("matching.englishLabel")}</Text>
        </View>
      </View>
    </View>
  );
}
