import { SwipeApprove, SwipeReject } from "@/components/review/swipe-actions";
import { useContributionAudio } from "@/components/review/use-contribution-audio";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { CATEGORY_LABELS, type DictionaryCategory } from "@/lib/dictionary";
import { type PendingContribution } from "@/lib/hooks/use-contributions";
import { getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

export function ContributionCard({
  item,
  onApprove,
  onReject,
  isPending,
}: {
  item: PendingContribution;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { isPlaying, togglePlay } = useContributionAudio(item.audioUrl, { unloadOnFinish: true });

  const hasAudio = item.type === "entry_audio" || item.type === "audio" || !!item.audioUrl;
  const typeBg = item.type === "entry_audio"
    ? "bg-orange-100 dark:bg-orange-900"
    : item.type === "entry_meaning"
      ? "bg-teal-100 dark:bg-teal-900"
      : "bg-blue-100 dark:bg-blue-900";
  const typeColor = item.type === "entry_audio"
    ? "text-orange-700 dark:text-orange-300"
    : item.type === "entry_meaning"
      ? "text-teal-700 dark:text-teal-300"
      : "text-blue-700 dark:text-blue-300";
  const typeLabel = item.type.replace("entry_", "");

  return (
    <Swipeable
      renderLeftActions={() => <SwipeApprove />}
      renderRightActions={() => <SwipeReject />}
      onSwipeableOpen={(dir) => {
        if (isPending) return;
        if (dir === "left") onApprove();
        if (dir === "right") onReject();
      }}
      overshootLeft={false}
      overshootRight={false}
    >
      <View className="mx-5 mb-3 overflow-hidden rounded-2xl bg-neutral-50 dark:bg-neutral-800">
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row items-center gap-3">
              {hasAudio && item.audioUrl ? (
                <Pressable
                  onPress={togglePlay}
                  className={`h-12 w-12 items-center justify-center rounded-xl ${
                    isPlaying ? "bg-blue-500" : "bg-orange-100 dark:bg-orange-900"
                  }`}
                >
                  <IconSymbol
                    name={isPlaying ? "pause.fill" : "play.fill"}
                    size={18}
                    color={isPlaying ? "white" : getAccent("orange").solid}
                  />
                </Pressable>
              ) : null}
              <View className="flex-1">
                <Text className="text-lg font-bold text-neutral-900 dark:text-white">
                  {item.word}
                </Text>
                <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  {item.english}
                </Text>
                {item.submitterName && (
                  <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    {t("review.submittedBy", { name: item.submitterName })}
                  </Text>
                )}
              </View>
            </View>
            <View className={`rounded-full px-2.5 py-1 ${typeBg}`}>
              <Text className={`text-xs font-semibold ${typeColor}`}>
                {typeLabel}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row flex-wrap gap-1.5">
            <View className="rounded-full bg-white px-2.5 py-1 dark:bg-neutral-700">
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                {CATEGORY_LABELS[item.category as DictionaryCategory] ?? item.category}
              </Text>
            </View>
            <View className="rounded-full bg-white px-2.5 py-1 dark:bg-neutral-700">
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                {getLanguageName(item.languageId)}
              </Text>
            </View>
          </View>

          {item.pronunciation && !item.pronunciation.startsWith("http") && (
            <Text className="mt-2 text-sm italic text-neutral-500 dark:text-neutral-400">
              /{item.pronunciation}/
            </Text>
          )}

          {item.example && (
            <View className="mt-3 rounded-xl bg-white p-3 dark:bg-neutral-900">
              <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                {item.example}
              </Text>
              {item.exampleTranslation && (
                <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {item.exampleTranslation}
                </Text>
              )}
            </View>
          )}

          {/* Swipe hint — shown once */}
          <Text className="mt-3 text-center text-[10px] text-neutral-400 dark:text-neutral-600">
            {t("review.swipeHint")}
          </Text>
        </View>

        {/* Action bar */}
        <View className="flex-row border-t border-neutral-200 dark:border-neutral-700">
          <Pressable
            onPress={onReject}
            disabled={isPending}
            className="flex-1 flex-row items-center justify-center py-3 active:opacity-70"
          >
            <IconSymbol name="xmark.circle.fill" size={16} color={M.error} />
            <Text className="ml-1.5 text-sm font-semibold text-red-500">{t("common.reject")}</Text>
          </Pressable>
          <View className="w-[1px] bg-neutral-200 dark:bg-neutral-700" />
          <Pressable
            onPress={onApprove}
            disabled={isPending}
            className="flex-1 flex-row items-center justify-center py-3 active:opacity-70"
          >
            <IconSymbol name="checkmark.circle.fill" size={16} color={M.success} />
            <Text className="ml-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
              {t("common.approve")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Swipeable>
  );
}
