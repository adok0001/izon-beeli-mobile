import { View, Text } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { Proverb } from "@/types";

interface Props {
  proverb: Proverb;
  compact?: boolean;
}

export function ProverbCard({ proverb, compact = false }: Props) {
  return (
    <View className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/20">
      <View className="mb-2 flex-row items-center">
        <IconSymbol name="text.quote" size={16} color="#d97706" />
        <Text className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Proverb
        </Text>
      </View>

      <Text className="text-base font-semibold italic text-neutral-900 dark:text-white">
        &ldquo;{proverb.text}&rdquo;
      </Text>

      <Text className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
        {proverb.translation}
      </Text>

      {!compact && (
        <View className="mt-3 rounded-lg bg-amber-100/60 px-3 py-2 dark:bg-amber-900/30">
          <Text className="text-xs font-medium text-amber-800 dark:text-amber-300">
            {proverb.meaning}
          </Text>
        </View>
      )}
    </View>
  );
}
