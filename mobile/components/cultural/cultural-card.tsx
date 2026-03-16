import { localizeField } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { CulturalContent } from "@/types";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface Props {
  item: CulturalContent;
  onPress?: () => void;
}

export function CulturalCard({ item, onPress }: Props) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const categoryLabel = t(`cultural.categories.${item.category}` as any, { defaultValue: item.category });

  return (
    <Pressable
      onPress={onPress}
      className="mr-3 w-56 rounded-2xl bg-neutral-50 p-4 active:opacity-70 dark:bg-neutral-800"
    >
      <Text className="text-4xl">{item.imageEmoji}</Text>

      <View className="mt-2 self-start rounded-full bg-amber-100 px-2.5 py-0.5 dark:bg-amber-900/40">
        <Text className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {categoryLabel}
        </Text>
      </View>

      <Text
        className="mt-2 text-base font-bold text-neutral-900 dark:text-white"
        numberOfLines={1}
      >
        {localizeField(item.title, item.titleFr, uiLanguage)}
      </Text>
      <Text
        className="mt-1 text-sm text-neutral-600 dark:text-neutral-400"
        numberOfLines={2}
      >
        {localizeField(item.description, item.descriptionFr, uiLanguage)}
      </Text>
    </Pressable>
  );
}
