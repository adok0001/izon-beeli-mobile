import { forwardRef } from "react";
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

type Props = WordCardProps | ProverbCardProps | AchievementCardProps;

export const ShareCardPreview = forwardRef<View, Props>((props, ref) => {
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
        {props.template !== "achievement" && (
          <Text className="text-xs text-neutral-400">
            {(props as WordCardProps | ProverbCardProps).language}
          </Text>
        )}
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

      {/* Footer */}
      <Text className="mt-6 text-center text-[10px] text-neutral-300">
        Learn African languages · izonbeeli.app
      </Text>
    </View>
  );
});

ShareCardPreview.displayName = "ShareCardPreview";
