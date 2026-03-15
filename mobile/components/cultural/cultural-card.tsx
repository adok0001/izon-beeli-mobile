import type { CulturalContent } from "@/types";
import { Pressable, Text, View } from "react-native";

interface Props {
  item: CulturalContent;
  onPress?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  colors: "Colors",
  naming_ceremonies: "Naming",
  festivals: "Festivals",
  creation_myths: "Myths & Stories",
  music: "Music",
  clothing: "Clothing",
  cuisine: "Cuisine",
  greetings_etiquette: "Greetings",
};

export function CulturalCard({ item, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="mr-3 w-56 rounded-2xl bg-neutral-50 p-4 active:opacity-70 dark:bg-neutral-800"
    >
      <Text className="text-4xl">{item.imageEmoji}</Text>

      <View className="mt-2 self-start rounded-full bg-amber-100 px-2.5 py-0.5 dark:bg-amber-900/40">
        <Text className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {CATEGORY_LABELS[item.category] ?? item.category}
        </Text>
      </View>

      <Text
        className="mt-2 text-base font-bold text-neutral-900 dark:text-white"
        numberOfLines={1}
      >
        {item.title}
      </Text>
      <Text
        className="mt-1 text-sm text-neutral-600 dark:text-neutral-400"
        numberOfLines={2}
      >
        {item.description}
      </Text>
    </Pressable>
  );
}
