import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, type LayoutChangeEvent } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { getAccent } from "@/constants/accent-colors";
import { useMatchingStore, type Tile } from "@/store/matching-store";
import { hapticSuccess, hapticError, hapticTap } from "@/lib/haptics";
import { useMuseumTheme } from "@/lib/use-museum-theme";

const FLASH_DURATION = 600;
const GAP = 8;
// Target tile size band — keeps tiles a sensible size on phones *and* tablets
// instead of ballooning to fill a wide window.
const TARGET_TILE = 116;
const MIN_TILE = 88;
const MAX_TILE = 148;

// Derive an adaptive column count + tile size from the *measured* container
// width (not the full window), so the board reflows on large screens.
function computeLayout(width: number): { columns: number; tileSize: number } {
  const columns = Math.max(2, Math.round((width + GAP) / (TARGET_TILE + GAP)));
  const rawSize = (width - GAP * (columns - 1)) / columns;
  const tileSize = Math.max(MIN_TILE, Math.min(rawSize, MAX_TILE));
  return { columns, tileSize };
}

function getTileColors(tile: Tile, M: ReturnType<typeof useMuseumTheme>): { bg: string; border: string; text: string } {
  if (tile.matched) return { bg: M.successBg, border: M.successBorder, text: M.success };
  if (tile.flash === "correct") return { bg: M.successBg, border: M.success, text: M.success };
  if (tile.flash === "incorrect") return { bg: M.errorBg, border: M.error, text: M.error };
  if (tile.selected) return { bg: `${M.accent}20`, border: M.accent, text: M.accent };
  if (tile.kind === "word") return { bg: getAccent("purple").bg, border: getAccent("purple").border, text: getAccent("purple").solid };
  return { bg: getAccent("amber").bg, border: getAccent("amber").border, text: getAccent("amber").solid };
}

function MatchingTile({ tile, size, onPress }: { tile: Tile; size: number; onPress: () => void }) {
  const M = useMuseumTheme();
  const scale = useSharedValue(1);
  const colors = getTileColors(tile, M);

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
        style={{ width: size, height: size, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 2, padding: 6, backgroundColor: colors.bg, borderColor: colors.border }}
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
  const [boardWidth, setBoardWidth] = useState(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setBoardWidth(e.nativeEvent.layout.width);
  }, []);

  const { tileSize } = boardWidth > 0 ? computeLayout(boardWidth) : { tileSize: 0 };

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

      <View
        onLayout={handleLayout}
        style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: GAP }}
      >
        {tileSize > 0 &&
          tiles.map((tile) => (
            <MatchingTile
              key={tile.id}
              tile={tile}
              size={tileSize}
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
          <View style={{ marginRight: 6, height: 12, width: 12, borderRadius: 4, backgroundColor: `${getAccent("amber").solid}40` }} />
          <Text style={{ fontSize: 11, color: M.sub }}>{t("matching.englishLabel")}</Text>
        </View>
      </View>
    </View>
  );
}
