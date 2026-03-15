import { View, Text } from "react-native";
import { getLevelInfo } from "@/lib/xp-levels";

interface XpLevelBadgeProps {
  points: number;
  variant?: "compact" | "full";
}

export function XpLevelBadge({ points, variant = "compact" }: XpLevelBadgeProps) {
  const info = getLevelInfo(points);

  if (variant === "compact") {
    return (
      <View className="flex-row items-center gap-1.5">
        <View className="rounded-full bg-blue-500 px-2 py-0.5">
          <Text className="text-xs font-bold text-white">Lv.{info.level}</Text>
        </View>
        <View className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <View
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${Math.round(info.progress * 100)}%` }}
          />
        </View>
      </View>
    );
  }

  // Full variant
  return (
    <View className="items-center">
      <View className="mb-2 h-16 w-16 items-center justify-center rounded-full border-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
        <Text className="text-xl font-bold text-blue-600 dark:text-blue-400">
          {info.level}
        </Text>
      </View>
      <Text className="text-base font-bold text-neutral-900 dark:text-white">
        {info.title}
      </Text>
      <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {info.currentXP} / {info.xpForNextLevel} XP
      </Text>
      <View className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <View
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${Math.round(info.progress * 100)}%` }}
        />
      </View>
      <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
        Total XP: {info.totalXP}
      </Text>
    </View>
  );
}
