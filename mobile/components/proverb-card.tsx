import { IconSymbol } from "@/components/ui/icon-symbol";
import { localizeField } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Proverb } from "@/types";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface Props {
  proverb: Proverb;
  compact?: boolean;
}

export function ProverbCard({ proverb, compact = false }: Props) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();

  return (
    <View className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/20">
      <View className="mb-2 flex-row items-center">
        <IconSymbol name="text.quote" size={16} color="#d97706" />
        <Text className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          {t("proverbs.label")}
        </Text>
      </View>

      <Text className="text-base font-semibold italic text-neutral-900 dark:text-white">
        &ldquo;{proverb.text}&rdquo;
      </Text>

      <Text className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
        {localizeField(proverb.translation, proverb.translationFr, uiLanguage)}
      </Text>

      {!compact && (
        <View className="mt-3 rounded-lg bg-amber-100/60 px-3 py-2 dark:bg-amber-900/30">
          <Text className="text-xs font-medium text-amber-800 dark:text-amber-300">
            {localizeField(proverb.meaning, proverb.meaningFr, uiLanguage)}
          </Text>
        </View>
      )}
    </View>
  );
}
