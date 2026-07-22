import { SwipeApprove, SwipeReject } from "@/components/review/swipe-actions";
import { useContributionAudio } from "@/components/review/use-contribution-audio";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { type PendingLessonContribution } from "@/lib/hooks/use-contributions";
import { getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

export function LessonContributionCard({
  item,
  onApprove,
  onReject,
  isPending,
}: {
  item: PendingLessonContribution;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { isPlaying, togglePlay } = useContributionAudio(item.audioUrl);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const segmentCount = item.segments.length;
  const timedCount = item.segments.filter((s) => s.startTime != null).length;

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
          {/* Header */}
          <View className="flex-row items-start">
            {/* Play button */}
            <Pressable
              onPress={togglePlay}
              className={`mr-3 h-12 w-12 items-center justify-center rounded-xl ${
                isPlaying ? "bg-blue-500" : "bg-blue-100 dark:bg-blue-900"
              }`}
            >
              <IconSymbol
                name={isPlaying ? "pause.fill" : "play.fill"}
                size={18}
                color={isPlaying ? M.parchment : getAccent("blue").solid}
              />
            </Pressable>

            <View className="flex-1">
              <Text className="text-base font-bold text-neutral-900 dark:text-white">
                {item.title}
              </Text>
              <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {t("review.submittedBy", { name: item.userName ?? t("review.unknown") })}
              </Text>
            </View>

            <View className="rounded-full bg-purple-100 px-2.5 py-1 dark:bg-purple-900">
              <Text className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                {t("review.lessonBadge")}
              </Text>
            </View>
          </View>

          {/* Meta chips */}
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            <View className="rounded-full bg-white px-2.5 py-1 dark:bg-neutral-700">
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                {getLanguageName(item.languageId)}
              </Text>
            </View>
            {item.duration && (
              <View className="rounded-full bg-white px-2.5 py-1 dark:bg-neutral-700">
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                  {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, "0")}
                </Text>
              </View>
            )}
            <View className="rounded-full bg-white px-2.5 py-1 dark:bg-neutral-700">
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                {t("review.segments", { count: segmentCount })}{timedCount > 0 ? ` ${t("review.timedSegments", { count: timedCount })}` : ""}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text className="mt-3 text-sm leading-5 text-neutral-700 dark:text-neutral-300" numberOfLines={2}>
            {item.description}
          </Text>

          {/* Transcript — expandable */}
          {segmentCount > 0 && (
            <Pressable
              onPress={() => setTranscriptExpanded(!transcriptExpanded)}
              className="mt-3 rounded-xl bg-white p-3 active:opacity-70 dark:bg-neutral-900"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {t("review.transcript")}
                </Text>
                <IconSymbol
                  name={transcriptExpanded ? "chevron.up" : "chevron.down"}
                  size={12}
                  color={M.muted}
                />
              </View>

              {transcriptExpanded ? (
                <ScrollView style={{ maxHeight: 200 }} className="mt-2" nestedScrollEnabled>
                  {item.segments.map((seg) => (
                    <View key={seg.id} className="mb-2 flex-row">
                      <Text className="mr-2 min-w-[36px] text-xs tabular-nums text-neutral-400 dark:text-neutral-500">
                        {seg.startTime != null ? `${seg.startTime.toFixed(1)}s` : "--"}
                      </Text>
                      <View className="flex-1">
                        <Text className="text-sm text-neutral-800 dark:text-neutral-200">
                          {seg.text}
                        </Text>
                        {seg.translation && (
                          <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            {seg.translation}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={2}>
                  {item.segments.slice(0, 2).map((s) => s.text).join(" · ")}
                  {segmentCount > 2 ? ` ${t("review.moreSegments", { count: segmentCount - 2 })}` : ""}
                </Text>
              )}
            </Pressable>
          )}

          {/* Swipe hint */}
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
