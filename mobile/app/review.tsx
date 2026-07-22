import { tWithVars } from "@/lib/i18n-dynamic";
import { ContributionCard } from "@/components/review/contribution-card";
import { CoverageWordCard } from "@/components/review/coverage-word-card";
import { LessonContributionCard } from "@/components/review/lesson-contribution-card";
import { TabPill } from "@/components/review/tab-pill";
import { useReviewAction } from "@/components/review/use-review-action";
import { useReviewQueues } from "@/components/review/use-review-queues";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  useDictionaryCoverage,
  useReviewContribution,
  useReviewLessonContribution,
} from "@/lib/hooks/use-contributions";
import { getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function ReviewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const M = useMuseumTheme();

  const [activeTab, setActiveTab] = useState<"words" | "lessons" | "coverage">("words");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    canReview,
    loadingWords,
    loadingLessons,
    refetchWords,
    refetchLessons,
    wordCount,
    lessonCount,
    visibleWords,
    visibleLessons,
    coverageLanguages,
    languageIds,
  } = useReviewQueues(activeTab, selectedLang);

  const reviewWord = useReviewContribution();
  const reviewLesson = useReviewLessonContribution();

  const handleReviewWord = useReviewAction(reviewWord, {
    rejectTitle: "review.rejectWordTitle",
    rejectMessage: "review.rejectWordMsg",
    approveTitle: "review.approveWordTitle",
    approveMessage: "review.approveWordMsg",
  });
  const handleReviewLesson = useReviewAction(reviewLesson, {
    rejectTitle: "review.rejectLessonTitle",
    rejectMessage: "review.rejectLessonMsg",
    approveTitle: "review.approveLessonTitle",
    approveMessage: "review.approveLessonMsg",
  });

  const coverageLang = activeTab === "coverage" ? (selectedLang ?? coverageLanguages[0] ?? null) : null;
  const { data: coverage, isLoading: loadingCoverage } = useDictionaryCoverage(coverageLang);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchWords(), refetchLessons()]);
    setRefreshing(false);
  }, [refetchWords, refetchLessons]);

  if (!canReview) {
    return (
      <>
        <Stack.Screen options={{ title: t("review.title") }} />
        <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-900" edges={[]}>
          <View className="h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <IconSymbol name="lock.fill" size={28} color={M.muted} />
          </View>
          <Text className="mt-4 text-base font-semibold text-neutral-500 dark:text-neutral-400">
            {t("review.adminRequired")}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 rounded-2xl bg-neutral-100 px-6 py-3 active:opacity-80 dark:bg-neutral-800"
          >
            <Text className="font-semibold text-neutral-700 dark:text-neutral-300">{t("common.goBack")}</Text>
          </Pressable>
        </SafeAreaView>
      </>
    );
  }

  const emptyIcon = activeTab === "words" ? "character.book.closed" : "waveform";
  const emptyLabel = activeTab === "words"
    ? (loadingWords ? t("common.loading") : t("review.noPendingWords"))
    : (loadingLessons ? t("common.loading") : t("review.noPendingLessons"));

  return (
    <>
      <Stack.Screen options={{ title: t("review.title") }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {/* Header */}
        <View className="px-5 pb-3 pt-2">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            {t("review.title")}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t("review.pendingCount", { count: wordCount + lessonCount })}
          </Text>
        </View>

        {/* Tab pills */}
        <View className="flex-row px-5 pb-3">
          <TabPill
            label={t("review.tabWords")}
            count={wordCount}
            active={activeTab === "words"}
            onPress={() => { setActiveTab("words"); setSelectedLang(null); }}
          />
          <TabPill
            label={t("review.tabLessons")}
            count={lessonCount}
            active={activeTab === "lessons"}
            onPress={() => { setActiveTab("lessons"); setSelectedLang(null); }}
          />
          <TabPill
            label={t("review.tabCoverage")}
            count={activeTab === "coverage" ? coverage?.missing.length ?? 0 : 0}
            active={activeTab === "coverage"}
            onPress={() => { setActiveTab("coverage"); setSelectedLang(null); }}
          />
        </View>

        {/* Language filter chips */}
        {languageIds.length > 0 && (() => {
          const chips = (
          <>
            {activeTab !== "coverage" && (
            <Pressable
              onPress={() => setSelectedLang(null)}
              className={`rounded-full px-3 py-1.5 ${
                selectedLang === null
                  ? "bg-neutral-700 dark:bg-neutral-200"
                  : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <Text className={`text-xs font-semibold ${
                selectedLang === null
                  ? "text-white dark:text-neutral-900"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}>
                {t("review.filterAll")}
              </Text>
            </Pressable>
            )}
            {languageIds.map((lid) => {
              const isSelected = activeTab === "coverage" ? coverageLang === lid : selectedLang === lid;
              return (
              <Pressable
                key={lid}
                onPress={() => setSelectedLang(lid)}
                className={`rounded-full px-3 py-1.5 ${
                  isSelected
                    ? "bg-neutral-700 dark:bg-neutral-200"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                <Text className={`text-xs font-semibold ${
                  isSelected
                    ? "text-white dark:text-neutral-900"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}>
                  {getLanguageName(lid)}
                </Text>
              </Pressable>
              );
            })}
          </>
          );
          return activeTab === "coverage" ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-grow-0"
              contentContainerClassName="flex-row gap-2 px-5 pb-3"
            >
              {chips}
            </ScrollView>
          ) : (
            <View className="flex-row flex-wrap gap-2 px-5 pb-3">{chips}</View>
          );
        })()}

        {/* Words tab */}
        {activeTab === "words" && (
          <FlatList
            data={visibleWords}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />
            }
            renderItem={({ item }) => (
              <ContributionCard
                item={item}
                onApprove={() => handleReviewWord(item.id, "approve")}
                onReject={() => handleReviewWord(item.id, "reject")}
                isPending={reviewWord.isPending}
              />
            )}
            ListEmptyComponent={
              <View className="items-center px-8 py-20">
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <IconSymbol name={emptyIcon} size={24} color={M.muted} />
                </View>
                <Text className="text-center text-sm text-neutral-400 dark:text-neutral-500">
                  {emptyLabel}
                </Text>
              </View>
            }
          />
        )}

        {/* Lessons tab */}
        {activeTab === "lessons" && (
          <FlatList
            data={visibleLessons}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />
            }
            renderItem={({ item }) => (
              <LessonContributionCard
                item={item}
                onApprove={() => handleReviewLesson(item.id, "approve")}
                onReject={() => handleReviewLesson(item.id, "reject")}
                isPending={reviewLesson.isPending}
              />
            )}
            ListEmptyComponent={
              <View className="items-center px-8 py-20">
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <IconSymbol name={emptyIcon} size={24} color={M.muted} />
                </View>
                <Text className="text-center text-sm text-neutral-400 dark:text-neutral-500">
                  {emptyLabel}
                </Text>
              </View>
            }
          />
        )}

        {/* Coverage tab */}
        {activeTab === "coverage" && (
          <FlatList
            data={coverage?.missing ?? []}
            keyExtractor={(item) => item.word}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              coverage && coverage.distinctWords > 0 ? (
                <View className="mx-5 mb-3 rounded-2xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
                  <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {tWithVars(t, "review.coverageSummary", {
                      covered: coverage.coveredWords,
                      total: coverage.distinctWords,
                      percent: Math.round((coverage.coveredWords / coverage.distinctWords) * 100),
                    })}
                  </Text>
                  {coverage.missing.length > 0 && (
                    <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {t("review.coverageUsageHint")}
                    </Text>
                  )}
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <CoverageWordCard
                item={item}
                languageId={coverageLang ?? ""}
                onContribute={() =>
                  router.push({
                    pathname: "/contribute",
                    params: { languageId: coverageLang ?? "", word: item.word },
                  })
                }
              />
            )}
            ListEmptyComponent={
              <View className="items-center px-8 py-20">
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <IconSymbol
                    name={loadingCoverage ? "clock" : "checkmark.seal.fill"}
                    size={24}
                    color={loadingCoverage ? M.muted : M.success}
                  />
                </View>
                <Text className="text-center text-sm text-neutral-400 dark:text-neutral-500">
                  {loadingCoverage ? t("common.loading") : t("review.coverageComplete")}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
