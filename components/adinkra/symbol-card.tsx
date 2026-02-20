import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { AdinkraSymbol } from "@/lib/data/adinkra";
import { AdinkraSymbolView } from "./adinkra-symbol";

interface Props {
  symbol: AdinkraSymbol;
  onPress?: () => void;
}

export function SymbolCard({ symbol, onPress }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/adinkra");
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-1 items-center rounded-2xl bg-neutral-50 p-3 active:opacity-70 dark:bg-neutral-800"
    >
      <View className="mb-2 h-16 w-16 items-center justify-center rounded-xl bg-white dark:bg-neutral-700">
        <AdinkraSymbolView symbol={symbol} size={40} color="#6366f1" />
      </View>
      <Text
        className="text-center text-xs font-bold text-neutral-900 dark:text-white"
        numberOfLines={1}
      >
        {symbol.name}
      </Text>
      <Text
        className="mt-0.5 text-center text-[10px] text-neutral-500 dark:text-neutral-400"
        numberOfLines={1}
      >
        {symbol.meaning}
      </Text>
    </Pressable>
  );
}
