import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWordOfTheDay } from "@/lib/hooks/use-word-of-the-day";
import { useSaveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { localizeField } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface Props {
  languageId: string;
}

export function WordOfTheDay({ languageId }: Props) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const word = useWordOfTheDay(languageId);
  const { data: savedIds } = useWordBank();
  const saveWord = useSaveWord();
  const router = useRouter();

  if (!word) return null;

  const isSaved = savedIds?.includes(word.id) ?? false;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/word/[id]", params: { id: word.id, languageId: word.languageId } })}
      className="active:opacity-70"
    >
    <View className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <IconSymbol name="star.fill" size={16} color="#3b82f6" />
          <Text className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            {t("wordOfTheDay.title")}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (!isSaved) saveWord.mutate(word.id);
          }}
          hitSlop={8}
        >
          <IconSymbol
            name={isSaved ? "bookmark.fill" : "bookmark"}
            size={18}
            color={isSaved ? "#3b82f6" : "#9ca3af"}
          />
        </Pressable>
      </View>

      <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
        {word.word}
      </Text>

      {word.pronunciation && (
        <Text className="mt-0.5 text-sm italic text-neutral-500 dark:text-neutral-400">
          /{word.pronunciation}/
        </Text>
      )}

      <Text className="mt-1 text-base text-neutral-700 dark:text-neutral-300">
        {localizeField(word.english, word.french, uiLanguage)}
      </Text>

      {word.example && (
        <View className="mt-3 rounded-lg bg-blue-100/50 px-3 py-2 dark:bg-blue-900/30">
          <Text className="text-sm text-neutral-700 dark:text-neutral-300">
            {word.example}
          </Text>
          {word.exampleTranslation && (
            <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {localizeField(word.exampleTranslation, word.exampleTranslationFr, uiLanguage)}
            </Text>
          )}
        </View>
      )}
    </View>
    </Pressable>
  );
}
