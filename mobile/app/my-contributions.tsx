import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMyContributions, type MyContribution } from "@/lib/hooks/use-contributions";
import { getLanguageName } from "@/lib/mock-data";
import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Image, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_CONFIG = {
  submitted: { label: "myContributions.statusPending", color: "#f59e0b", bg: "bg-amber-100 dark:bg-amber-900" },
  approved: { label: "myContributions.statusApproved", color: "#22c55e", bg: "bg-green-100 dark:bg-green-900" },
  rejected: { label: "myContributions.statusRejected", color: "#ef4444", bg: "bg-red-100 dark:bg-red-900" },
} as const;

function StatusTimeline({ status }: { status: string }) {
  const { t } = useTranslation();
  const steps = [
    { key: "submitted", label: t("myContributions.timelineSubmitted") },
    { key: "review", label: t("myContributions.timelineInReview") },
    { key: "done", label: status === "rejected" ? t("myContributions.statusRejected") : t("myContributions.statusApproved") },
  ];
  const activeIndex = status === "submitted" ? 0 : 2;
  const isRejected = status === "rejected";

  return (
    <View className="mt-3 flex-row items-center">
      {steps.map((step, i) => {
        const done = i <= activeIndex;
        const isLast = i === steps.length - 1;
        const dotColor = done ? (isLast && isRejected ? "#ef4444" : "#3b82f6") : "#d1d5db";
        return (
          <View key={step.key} className="flex-1 flex-row items-center">
            <View className="items-center" style={{ minWidth: 40 }}>
              <View
                className="h-3 w-3 rounded-full border-2"
                style={{
                  backgroundColor: done ? dotColor : "transparent",
                  borderColor: dotColor,
                }}
              />
              <Text className="mt-1 text-center text-[9px] text-neutral-400 dark:text-neutral-500" style={{ width: 44 }}>
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View
                className="mb-4 h-0.5 flex-1"
                style={{ backgroundColor: i < activeIndex ? dotColor : "#d1d5db" }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

function ContributionRow({ item }: { item: MyContribution }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.submitted;
  const categoryLabel = item.category
    ? t(`dictionaryPage.categoryLabels.${item.category}` as any, { defaultValue: item.category })
    : null;

  const hasAudio = item.type === "entry_audio" || item.type === "audio" || !!item.audioUrl;
  const hasImage = item.type === "entry_image" || !!item.imageUrl;

  return (
    <View className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
      {hasImage && item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          className="mb-3 h-36 w-full rounded-xl"
          resizeMode="cover"
        />
      )}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">
              {item.word}
            </Text>
            {hasAudio && (
              <WordAudioButton audioSource={item.audioUrl ?? undefined} word={item.word} size={18} />
            )}
          </View>
          <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {item.english}
          </Text>
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            {(item.type === "entry_audio" || item.type === "entry_meaning" || item.type === "entry_image") && (
              <View className={`rounded-full px-2 py-0.5 ${
                item.type === "entry_audio"
                  ? "bg-orange-100 dark:bg-orange-900/30"
                  : item.type === "entry_image"
                  ? "bg-violet-100 dark:bg-violet-900/30"
                  : "bg-teal-100 dark:bg-teal-900/30"
              }`}>
                <Text className={`text-xs font-semibold ${
                  item.type === "entry_audio"
                    ? "text-orange-600 dark:text-orange-400"
                    : item.type === "entry_image"
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-teal-600 dark:text-teal-400"
                }`}>
                  {item.type === "entry_audio"
                    ? t("myContributions.typeAudio")
                    : item.type === "entry_image"
                    ? t("myContributions.typeImage")
                    : t("myContributions.typeMeaning")}
                </Text>
              </View>
            )}
            {categoryLabel && (
              <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {categoryLabel}
                </Text>
              </View>
            )}
            <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                {getLanguageName(item.languageId)}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end gap-1">
          <View className={`rounded-full px-2.5 py-1 ${config.bg}`}>
            <Text className="text-xs font-semibold" style={{ color: config.color }}>
              {t(config.label as any)}
            </Text>
          </View>
          {item.status === "approved" && item.xpAwarded != null && (
            <View className="flex-row gap-1">
              <View className="rounded-full bg-blue-100 px-2 py-0.5 dark:bg-blue-900">
                <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  +{item.xpAwarded} XP
                </Text>
              </View>
              {item.bountyXpAwarded != null && item.bountyXpAwarded > 0 && (
                <View className="rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-900">
                  <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    +{item.bountyXpAwarded} {t("myContributions.bountyLabel")}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <StatusTimeline status={item.status} />

      {item.status === "submitted" && (
        <Text className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
          {t("myContributions.reviewEstimate")}
        </Text>
      )}

      {item.status === "approved" && item.practiceCount != null && item.practiceCount > 0 && (
        <Text className="mt-2 text-xs text-blue-500 dark:text-blue-400">
          {t(item.practiceCount === 1 ? "myContributions.practiceCount_one" : "myContributions.practiceCount_other", { count: item.practiceCount })}
        </Text>
      )}

      {item.status === "rejected" && item.reviewNote && (
        <View className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-900/20">
          <Text className="text-xs font-semibold uppercase tracking-wider text-red-400 dark:text-red-500">
            {t("myContributions.reviewerNote")}
          </Text>
          <Text className="mt-1 text-sm text-red-700 dark:text-red-300">
            {item.reviewNote}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function MyContributionsScreen() {
  const { data, isLoading, refetch } = useMyContributions();
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const submissions = data ?? [];
  const approvedCount = submissions.filter((c) => c.status === "approved").length;
  const pendingCount = submissions.filter((c) => c.status === "submitted").length;
  const totalXp = submissions.reduce(
    (sum, c) => sum + (c.xpAwarded ?? 0) + (c.bountyXpAwarded ?? 0),
    0
  );

  return (
    <>
      <Stack.Screen options={{ title: t("myContributions.title"), headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {/* Stats row */}
        {submissions.length > 0 && (
          <View className="flex-row border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-green-500">{approvedCount}</Text>
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">{t("myContributions.approvedLabel")}</Text>
            </View>
            <View className="w-[1px] bg-neutral-100 dark:bg-neutral-800" />
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-amber-500">{pendingCount}</Text>
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">{t("myContributions.pendingLabel")}</Text>
            </View>
            <View className="w-[1px] bg-neutral-100 dark:bg-neutral-800" />
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-neutral-700 dark:text-neutral-300">
                {submissions.length}
              </Text>
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">{t("myContributions.totalLabel")}</Text>
            </View>
            {totalXp > 0 && (
              <>
                <View className="w-[1px] bg-neutral-100 dark:bg-neutral-800" />
                <View className="flex-1 items-center">
                  <Text className="text-xl font-bold text-blue-500">{totalXp}</Text>
                  <Text className="text-xs text-neutral-400 dark:text-neutral-500">{t("myContributions.xpEarned")}</Text>
                </View>
              </>
            )}
          </View>
        )}

        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => <ContributionRow item={item} />}
          ListEmptyComponent={
            <View className="items-center px-8 py-20">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <IconSymbol name="doc.text" size={28} color="#9ca3af" />
              </View>
              <Text className="text-center text-base font-semibold text-neutral-500 dark:text-neutral-400">
                {isLoading ? t("common.loading") : t("myContributions.noContributions")}
              </Text>
              {!isLoading && (
                <Text className="mt-1 text-center text-sm text-neutral-400 dark:text-neutral-500">
                  {t("myContributions.submitMore")}
                </Text>
              )}
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}
