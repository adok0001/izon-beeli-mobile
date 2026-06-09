import { getAccent } from "@/constants/accent-colors";
import { useCultural } from "@/lib/hooks/use-cultural";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CulturalCard } from "./cultural-card";
import { useTranslation } from "react-i18next";

interface Props {
  languageId: string;
  onViewAll?: () => void;
}

export function CulturalSection({ languageId, onViewAll }: Props) {
  const { t } = useTranslation();
  const { data: content = [] } = useCultural(languageId);

  if (content.length === 0) return null;

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <IconSymbol name="star.fill" size={16} color={getAccent("amber").solid} />
          <Text className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            {t("cultural.heritage")}
          </Text>
        </View>
        {onViewAll && (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {t("cultural.viewAll")}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 px-5"
      >
        {content.map((item) => (
          <CulturalCard key={item.id} item={item} onPress={onViewAll} />
        ))}
      </ScrollView>
    </View>
  );
}
