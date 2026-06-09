import { IconSymbol } from "@/components/ui/icon-symbol";
import { CATEGORY_LABELS, type DictionaryCategory } from "@/lib/dictionary";
import {
  usePendingContributions,
  usePendingLessonContributions,
  useReviewContribution,
  useReviewLessonContribution,
  type PendingContribution,
  type PendingLessonContribution,
} from "@/lib/hooks/use-contributions";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { getLanguageName } from "@/lib/mock-data";
import { Audio } from "expo-av";
import { Stack, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

// ---------- Tab pill ----------

function TabPill({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 flex-row items-center rounded-full px-4 py-2 ${
        active ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          active ? "text-white" : "text-neutral-600 dark:text-neutral-400"
        }`}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          className={`ml-1.5 h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 ${
            active ? "bg-white/25" : "bg-neutral-200 dark:bg-neutral-700"
          }`}
        >
          <Text
            className={`text-[11px] font-bold ${
              active ? "text-white" : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------- Swipe action backgrounds ----------

function SwipeApprove() {
  const { t } = useTranslation();
  return (
    <View className="mb-3 mx-5 flex-1 items-start justify-center rounded-2xl bg-green-500 pl-6">
      <IconSymbol name="checkmark.circle.fill" size={28} color="#fff" />
      <Text className="mt-1 text-xs font-bold text-white">{t("common.approve")}</Text>
    </View>
  );
}

function SwipeReject() {
  const { t } = useTranslation();
  return (
    <View className="mb-3 mx-5 flex-1 items-end justify-center rounded-2xl bg-red-500 pr-6">
      <IconSymbol name="xmark.circle.fill" size={28} color="#fff" />
      <Text className="mt-1 text-xs font-bold text-white">{t("common.reject")}</Text>
    </View>
  );
}

// ---------- Word ContributionCard ----------

function ContributionCard({
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
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const togglePlay = async () => {
    if (!item.audioUrl) return;
    try {
      if (isPlaying) {
        await soundRef.current?.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!soundRef.current) {
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync(
            { uri: item.audioUrl },
            { shouldPlay: true }
          );
          sound.setOnPlaybackStatusUpdate((s) => {
            if (s.isLoaded && s.didJustFinish) {
              setIsPlaying(false);
              sound.unloadAsync();
              soundRef.current = null;
            }
          });
          soundRef.current = sound;
        } else {
          await soundRef.current.playAsync();
        }
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

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
                    color={isPlaying ? "white" : "#f97316"}
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

          {item.pronunciation && (
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

// ---------- Lesson ContributionCard ----------

function LessonContributionCard({
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
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const togglePlay = async () => {
    try {
      if (isPlaying) {
        await soundRef.current?.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!soundRef.current) {
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync(
            { uri: item.audioUrl },
            { shouldPlay: true }
          );
          sound.setOnPlaybackStatusUpdate((s) => {
            if (s.isLoaded && s.didJustFinish) {
              setIsPlaying(false);
              soundRef.current = null;
            }
          });
          soundRef.current = sound;
        } else {
          await soundRef.current.playAsync();
        }
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

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

// ---------- Main Screen ----------

export default function ReviewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.isAdmin ?? false;
  const canReview = isAdmin || (currentUser?.isReviewer ?? false);

  const [activeTab, setActiveTab] = useState<"words" | "lessons">("words");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: pending, isLoading: loadingWords, refetch: refetchWords } = usePendingContributions();
  const { data: pendingLessons, isLoading: loadingLessons, refetch: refetchLessons } = usePendingLessonContributions();

  const reviewWord = useReviewContribution();
  const reviewLesson = useReviewLessonContribution();

  const allowedLanguages = isAdmin
    ? null
    : new Set(currentUser?.reviewerLanguages ?? []);

  const scopedWords = allowedLanguages
    ? (pending ?? []).filter((c) => allowedLanguages.has(c.languageId))
    : (pending ?? []);
  const scopedLessons = allowedLanguages
    ? (pendingLessons ?? []).filter((c) => allowedLanguages.has(c.languageId))
    : (pendingLessons ?? []);

  const wordCount = scopedWords.length;
  const lessonCount = scopedLessons.length;

  const visibleWords = selectedLang ? scopedWords.filter((c) => c.languageId === selectedLang) : scopedWords;
  const visibleLessons = selectedLang ? scopedLessons.filter((c) => c.languageId === selectedLang) : scopedLessons;

  const languageIds = useMemo(() => {
    const ids = activeTab === "words"
      ? [...new Set(scopedWords.map((c) => c.languageId))]
      : [...new Set(scopedLessons.map((c) => c.languageId))];
    return ids;
  }, [activeTab, scopedWords, scopedLessons]);

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

  const handleReviewWord = (id: string, action: "approve" | "reject") => {
    const label = action === "approve" ? t("common.approve") : t("common.reject");
    if (action === "reject") {
      Alert.prompt(
        t("review.rejectWordTitle"),
        t("review.rejectWordMsg"),
        (note) => reviewWord.mutate({ id, action, note: note?.trim() || undefined }),
        "plain-text",
        "",
        "default"
      );
    } else {
      Alert.alert(
        t("review.approveWordTitle"),
        t("review.approveWordMsg"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: label, onPress: () => reviewWord.mutate({ id, action }) },
        ]
      );
    }
  };

  const handleReviewLesson = (id: string, action: "approve" | "reject") => {
    const label = action === "approve" ? t("common.approve") : t("common.reject");
    if (action === "reject") {
      Alert.prompt(
        t("review.rejectLessonTitle"),
        t("review.rejectLessonMsg"),
        (note) => reviewLesson.mutate({ id, action, note: note?.trim() || undefined }),
        "plain-text",
        "",
        "default"
      );
    } else {
      Alert.alert(
        t("review.approveLessonTitle"),
        t("review.approveLessonMsg"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: label, onPress: () => reviewLesson.mutate({ id, action }) },
        ]
      );
    }
  };

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
        </View>

        {/* Language filter chips */}
        {languageIds.length > 0 && (
          <View className="flex-row flex-wrap gap-2 px-5 pb-3">
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
            {languageIds.map((lid) => (
              <Pressable
                key={lid}
                onPress={() => setSelectedLang(lid)}
                className={`rounded-full px-3 py-1.5 ${
                  selectedLang === lid
                    ? "bg-neutral-700 dark:bg-neutral-200"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                <Text className={`text-xs font-semibold ${
                  selectedLang === lid
                    ? "text-white dark:text-neutral-900"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}>
                  {getLanguageName(lid)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Words tab */}
        {activeTab === "words" && (
          <FlatList
            data={visibleWords}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                  <IconSymbol name={emptyIcon as any} size={24} color={M.muted} />
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                  <IconSymbol name={emptyIcon as any} size={24} color={M.muted} />
                </View>
                <Text className="text-center text-sm text-neutral-400 dark:text-neutral-500">
                  {emptyLabel}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
