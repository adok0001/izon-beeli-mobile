import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface WordCardProps {
  template: "word";
  word: string;
  translation: string;
  language: string;
  pronunciation?: string;
}

interface ProverbCardProps {
  template: "proverb";
  text: string;
  translation: string;
  language: string;
}

interface AchievementCardProps {
  template: "achievement";
  title: string;
  detail: string;
}

interface SymbolCardProps {
  template: "symbol";
  name: string;
  meaning: string;
  language: string;
}

interface CulturalCardProps {
  template: "cultural";
  title: string;
  description: string;
  category: string;
  emoji: string;
  language?: string;
}

type Props = WordCardProps | ProverbCardProps | AchievementCardProps | SymbolCardProps | CulturalCardProps;

export const ShareCardPreview = forwardRef<View, Props>((props, ref) => {
  const { t } = useTranslation();

  return (
    <View
      ref={ref}
      className="overflow-hidden rounded-2xl bg-white"
      style={{ width: 320, padding: 24 }}
    >
      {/* Brand header */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xs font-bold tracking-wider text-blue-500">
          Beeli
        </Text>
        {"language" in props && props.language ? (
          <Text className="text-xs text-neutral-400">{props.language}</Text>
        ) : null}
      </View>

      {props.template === "word" && (
        <>
          <Text className="text-3xl font-bold text-neutral-900">
            {props.word}
          </Text>
          {props.pronunciation && (
            <Text className="mt-1 text-sm italic text-neutral-400">
              /{props.pronunciation}/
            </Text>
          )}
          <View className="mt-3 h-px bg-neutral-200" />
          <Text className="mt-3 text-lg text-neutral-600">
            {props.translation}
          </Text>
        </>
      )}

      {props.template === "proverb" && (
        <>
          <Text className="text-lg font-semibold italic text-neutral-800">
            &ldquo;{props.text}&rdquo;
          </Text>
          <View className="mt-3 h-px bg-neutral-200" />
          <Text className="mt-3 text-base text-neutral-600">
            {props.translation}
          </Text>
        </>
      )}

      {props.template === "achievement" && (
        <>
          <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Text className="text-2xl">🏆</Text>
          </View>
          <Text className="text-xl font-bold text-neutral-900">
            {props.title}
          </Text>
          <Text className="mt-1 text-base text-neutral-500">
            {props.detail}
          </Text>
        </>
      )}

      {props.template === "symbol" && (
        <>
          <Text className="text-3xl font-bold text-neutral-900">{props.name}</Text>
          <View className="mt-3 h-px bg-neutral-200" />
          <Text className="mt-3 text-base text-neutral-600">{props.meaning}</Text>
        </>
      )}

      {props.template === "cultural" && (
        <>
          <View className="flex-row items-center gap-2">
            <Text className="text-3xl">{props.emoji}</Text>
            <View className="rounded-full bg-neutral-100 px-3 py-1">
              <Text className="text-xs font-medium capitalize text-neutral-500">
                {props.category}
              </Text>
            </View>
          </View>
          <Text className="mt-3 text-xl font-bold text-neutral-900">{props.title}</Text>
          <Text className="mt-2 text-sm leading-5 text-neutral-600" numberOfLines={2}>
            {props.description}
          </Text>
        </>
      )}

      {/* Footer */}
      <Text className="mt-6 text-center text-[10px] text-neutral-300">
        {t("share.tagline")}
      </Text>
    </View>
  );
});

ShareCardPreview.displayName = "ShareCardPreview";
