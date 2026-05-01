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

const FLASH_DURATION = 600;
const COLUMNS = 4;
const GAP = 8;
const screenWidth = Dimensions.get("window").width;
const tileSize = (screenWidth - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

function MatchingTile({ tile, onPress }: { tile: Tile; onPress: () => void }) {
  const scale = useSharedValue(1);

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

  const bgColor = tile.matched
    ? "bg-green-100 dark:bg-green-900/40 border-green-400"
    : tile.flash === "correct"
      ? "bg-green-200 dark:bg-green-800/50 border-green-500"
      : tile.flash === "incorrect"
        ? "bg-red-200 dark:bg-red-800/50 border-red-500"
        : tile.selected
          ? "bg-blue-100 dark:bg-blue-900/40 border-blue-500"
          : tile.kind === "word"
            ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700"
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700";

  const textColor = tile.matched
    ? "text-green-700 dark:text-green-300"
    : tile.kind === "word"
      ? "text-violet-800 dark:text-violet-200"
      : "text-amber-800 dark:text-amber-200";

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        disabled={tile.matched}
        className={`items-center justify-center rounded-xl border-2 p-1.5 ${bgColor}`}
        style={{ width: tileSize, height: tileSize }}
      >
        <Text
          className={`text-center text-xs font-semibold ${textColor}`}
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
        // Clear flash after delay
        setTimeout(() => clearFlash(), FLASH_DURATION);
      }
    },
    [selectTile, clearFlash]
  );

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between px-1">
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("matching.matched", { matched: matchedCount, total: totalPairs })}
        </Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("matching.attempts", { count: attempts })}
        </Text>
      </View>

      <View className="flex-row flex-wrap" style={{ gap: GAP }}>
        {tiles.map((tile) => (
          <MatchingTile
            key={tile.id}
            tile={tile}
            onPress={() => handlePress(tile.id)}
          />
        ))}
      </View>

      <View className="mt-3 flex-row items-center justify-center gap-4">
        <View className="flex-row items-center">
          <View className="mr-1.5 h-3 w-3 rounded bg-violet-300 dark:bg-violet-700" />
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {t("matching.wordLabel")}
          </Text>
        </View>
        <View className="flex-row items-center">
          <View className="mr-1.5 h-3 w-3 rounded bg-amber-300 dark:bg-amber-700" />
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {t("matching.englishLabel")}
          </Text>
        </View>
      </View>
    </View>
  );
}
