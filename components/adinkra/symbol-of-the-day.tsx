import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ADINKRA_SYMBOLS } from "@/lib/data/adinkra";
import { getDailyItem } from "@/lib/daily-picker";
import { AdinkraSymbolView } from "./adinkra-symbol";
import { IconSymbol } from "@/components/ui/icon-symbol";

export function SymbolOfTheDay() {
  const router = useRouter();
  const symbol = getDailyItem(ADINKRA_SYMBOLS);

  if (!symbol) return null;

  return (
    <Pressable
      onPress={() => router.push("/adinkra")}
      className="rounded-2xl bg-indigo-50 p-4 active:opacity-70 dark:bg-indigo-950"
    >
      <View className="mb-2 flex-row items-center">
        <IconSymbol name="sparkles" size={16} color="#6366f1" />
        <Text className="ml-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Adinkra Symbol of the Day
        </Text>
      </View>

      <View className="flex-row items-center">
        <View className="mr-3 h-14 w-14 items-center justify-center rounded-xl bg-white dark:bg-neutral-800">
          <AdinkraSymbolView symbol={symbol} size={36} color="#6366f1" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-neutral-900 dark:text-white">
            {symbol.name}
          </Text>
          <Text className="text-sm text-neutral-600 dark:text-neutral-400">
            {symbol.meaning}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color="#6366f1" />
      </View>
    </Pressable>
  );
}
