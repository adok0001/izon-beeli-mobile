import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

type DetailsStepProps = Readonly<{
  title: string;
  description: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
}>;

export function DetailsStep({
  title,
  description,
  onChangeTitle,
  onChangeDescription,
}: DetailsStepProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
        {t("contribute.lessonInfo")}
      </Text>
      <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
        {t("contribute.lessonInfoDesc")}
      </Text>

      <View className="mb-4">
        <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t("journal.titleLabel")}
        </Text>
        <TextInput
          value={title}
          onChangeText={onChangeTitle}
          placeholder={t("contribute.lessonTitlePlaceholder")}
          placeholderTextColor={M.muted}
          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          autoFocus
        />
      </View>

      <View className="mb-4">
        <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t("contribute.descriptionLabel")}
        </Text>
        <TextInput
          value={description}
          onChangeText={onChangeDescription}
          placeholder={t("contribute.lessonDescPlaceholder")}
          placeholderTextColor={M.muted}
          multiline
          numberOfLines={4}
          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          style={{ minHeight: 120, textAlignVertical: "top" }}
        />
      </View>
    </View>
  );
}
