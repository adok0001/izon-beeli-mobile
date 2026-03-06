import { useState, useCallback, useRef } from "react";
import { View, Text, Pressable, FlatList, Alert, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Audio } from "expo-av";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  usePendingContributions,
  useReviewContribution,
  usePendingLessonContributions,
  useReviewLessonContribution,
  type PendingContribution,
  type PendingLessonContribution,
} from "@/lib/hooks/use-contributions";
import { CATEGORY_LABELS, type DictionaryCategory } from "@/lib/dictionary";
import { getLanguageName } from "@/lib/mock-data";

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
  return (
    <View className="mx-5 mb-3 overflow-hidden rounded-2xl bg-neutral-50 dark:bg-neutral-800">
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              {item.word}
            </Text>
            <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {item.english}
            </Text>
          </View>
          <View className="rounded-full bg-blue-100 px-2.5 py-1 dark:bg-blue-900">
            <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {item.type}
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
      </View>

      {/* Action bar */}
      <View className="flex-row border-t border-neutral-200 dark:border-neutral-700">
        <Pressable
          onPress={onReject}
          disabled={isPending}
          className="flex-1 flex-row items-center justify-center py-3 active:opacity-70"
        >
          <IconSymbol name="xmark.circle.fill" size={16} color="#ef4444" />
          <Text className="ml-1.5 text-sm font-semibold text-red-500">Reject</Text>
        </Pressable>
        <View className="w-[1px] bg-neutral-200 dark:bg-neutral-700" />
        <Pressable
          onPress={onApprove}
          disabled={isPending}
          className="flex-1 flex-row items-center justify-center py-3 active:opacity-70"
        >
          <IconSymbol name="checkmark.circle.fill" size={16} color="#22c55e" />
          <Text className="ml-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
            Approve
          </Text>
        </Pressable>
      </View>
    </View>
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
              color={isPlaying ? "white" : "#3b82f6"}
            />
          </Pressable>

          <View className="flex-1">
            <Text className="text-base font-bold text-neutral-900 dark:text-white">
              {item.title}
            </Text>
            <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              by {item.userName ?? "Unknown"}
            </Text>
          </View>

          <View className="rounded-full bg-purple-100 px-2.5 py-1 dark:bg-purple-900">
            <Text className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              lesson
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
              {segmentCount} segments {timedCount > 0 ? `(${timedCount} timed)` : ""}
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
                Transcript
              </Text>
              <IconSymbol
                name={transcriptExpanded ? "chevron.up" : "chevron.down"}
                size={12}
                color="#9ca3af"
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
                {segmentCount > 2 ? ` +${segmentCount - 2} more` : ""}
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Action bar */}
      <View className="flex-row border-t border-neutral-200 dark:border-neutral-700">
        <Pressable
          onPress={onReject}
          disabled={isPending}
          className="flex-1 flex-row items-center justify-center py-3 active:opacity-70"
        >
          <IconSymbol name="xmark.circle.fill" size={16} color="#ef4444" />
          <Text className="ml-1.5 text-sm font-semibold text-red-500">Reject</Text>
        </Pressable>
        <View className="w-[1px] bg-neutral-200 dark:bg-neutral-700" />
        <Pressable
          onPress={onApprove}
          disabled={isPending}
          className="flex-1 flex-row items-center justify-center py-3 active:opacity-70"
        >
          <IconSymbol name="checkmark.circle.fill" size={16} color="#22c55e" />
          <Text className="ml-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
            Approve
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------- Main Screen ----------

export default function ReviewScreen() {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const [activeTab, setActiveTab] = useState<"words" | "lessons">("words");
  const [refreshing, setRefreshing] = useState(false);

  const { data: pending, isLoading: loadingWords, refetch: refetchWords } = usePendingContributions();
  const { data: pendingLessons, isLoading: loadingLessons, refetch: refetchLessons } = usePendingLessonContributions();

  const reviewWord = useReviewContribution();
  const reviewLesson = useReviewLessonContribution();

  const wordCount = pending?.length ?? 0;
  const lessonCount = pendingLessons?.length ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchWords(), refetchLessons()]);
    setRefreshing(false);
  }, [refetchWords, refetchLessons]);

  if (!isAdmin) {
    return (
      <>
        <Stack.Screen options={{ title: "Review" }} />
        <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-900" edges={[]}>
          <View className="h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <IconSymbol name="lock.fill" size={28} color="#9ca3af" />
          </View>
          <Text className="mt-4 text-base font-semibold text-neutral-500 dark:text-neutral-400">
            Admin access required
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 rounded-2xl bg-neutral-100 px-6 py-3 active:opacity-80 dark:bg-neutral-800"
          >
            <Text className="font-semibold text-neutral-700 dark:text-neutral-300">Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </>
    );
  }

  const handleReviewWord = (id: string, action: "approve" | "reject") => {
    const label = action === "approve" ? "Approve" : "Reject";
    Alert.alert(
      `${label} this contribution?`,
      action === "approve"
        ? "This word will be added to the dictionary."
        : "This contribution will be rejected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: action === "reject" ? "destructive" : "default",
          onPress: () => reviewWord.mutate({ id, action }),
        },
      ]
    );
  };

  const handleReviewLesson = (id: string, action: "approve" | "reject") => {
    const label = action === "approve" ? "Approve" : "Reject";
    Alert.alert(
      `${label} this lesson?`,
      action === "approve"
        ? "This lesson will be published and added to the course."
        : "This lesson will be rejected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: action === "reject" ? "destructive" : "default",
          onPress: () => reviewLesson.mutate({ id, action }),
        },
      ]
    );
  };

  const emptyIcon = activeTab === "words" ? "character.book.closed" : "waveform";
  const emptyLabel = activeTab === "words"
    ? (loadingWords ? "Loading..." : "No pending words")
    : (loadingLessons ? "Loading..." : "No pending lessons");

  return (
    <>
      <Stack.Screen options={{ title: "Review" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {/* Header */}
        <View className="px-5 pb-3 pt-2">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            Review
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {wordCount + lessonCount} pending contributions
          </Text>
        </View>

        {/* Tab pills */}
        <View className="flex-row px-5 pb-3">
          <TabPill
            label="Words"
            count={wordCount}
            active={activeTab === "words"}
            onPress={() => setActiveTab("words")}
          />
          <TabPill
            label="Lessons"
            count={lessonCount}
            active={activeTab === "lessons"}
            onPress={() => setActiveTab("lessons")}
          />
        </View>

        {/* Words tab */}
        {activeTab === "words" && (
          <FlatList
            data={pending ?? []}
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
                  <IconSymbol name={emptyIcon as any} size={24} color="#9ca3af" />
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
            data={pendingLessons ?? []}
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
                  <IconSymbol name={emptyIcon as any} size={24} color="#9ca3af" />
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
