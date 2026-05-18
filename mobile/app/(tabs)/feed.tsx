import { IconSymbol } from "@/components/ui/icon-symbol";
import { hapticSuccess } from "@/lib/haptics";
import {
    useAddComment,
    useComments,
    useCreatePost,
    useFeed,
    useToggleLike,
    type FeedTypeFilter,
} from "@/lib/hooks/use-feed";
import i18n from "@/lib/i18n";
import { localizeField } from "@/lib/localize";
import { useAudioStore } from "@/store/audio-store";
import { useFeedLikesStore } from "@/store/feed-likes-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { AudioSource, FeedItem } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    Share,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return i18n.t("time.justNow");
  if (diffMins < 60) return i18n.t("time.minutesAgo", { count: diffMins });
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return i18n.t("time.hoursAgo", { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return i18n.t("time.daysAgo", { count: diffDays });
  return new Date(dateStr).toLocaleDateString(i18n.language, {
    month: "short",
    day: "numeric",
  });
}

const TYPE_CONFIG: Record<
  FeedItem["type"],
  { icon: string; color: string; label: string }
> = {
  lesson_completed: {
    icon: "checkmark.circle.fill",
    color: "#22c55e",
    label: "feed.typeLesson",
  },
  achievement: { icon: "trophy.fill", color: "#f59e0b", label: "feed.typeAchievement" },
  contribution: { icon: "mic.fill", color: "#3b82f6", label: "feed.typeContribution" },
  community: { icon: "text.bubble", color: "#8b5cf6", label: "feed.typeCommunity" },
};

// --- Audio preview for contribution cards ---
function AudioPreview({ audioUrl }: Readonly<{ audioUrl: AudioSource }>) {
  const { t } = useTranslation();
  const { currentTrackId, isPlaying, loadAndPlay, togglePlayback } =
    useAudioStore();
  const trackId = `feed-${audioUrl}`;
  const isCurrentTrack = currentTrackId === trackId;

  const handlePress = () => {
    if (isCurrentTrack) {
      togglePlayback();
    } else {
      loadAndPlay(trackId, audioUrl, "Contribution Audio");
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mb-3 flex-row items-center rounded-lg bg-blue-50 px-3 py-2.5 dark:bg-blue-900/30"
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={isCurrentTrack && isPlaying ? t("feed.playing") : t("feed.playAudio")}
      accessibilityHint="Tap to play or pause audio contribution"
    >
      <View
        className={`mr-3 h-8 w-8 items-center justify-center rounded-full ${
          isCurrentTrack ? "bg-blue-500" : "bg-blue-200 dark:bg-blue-800"
        }`}
      >
        <IconSymbol
          name={isCurrentTrack && isPlaying ? "pause.fill" : "play.fill"}
          size={14}
          color={isCurrentTrack ? "#ffffff" : "#3b82f6"}
        />
      </View>
      <IconSymbol name="waveform" size={18} color="#3b82f6" />
      <Text className="ml-2 flex-1 text-sm font-medium text-blue-600 dark:text-blue-400">
        {isCurrentTrack && isPlaying ? t("feed.playing") : t("feed.playAudio")}
      </Text>
    </Pressable>
  );
}

// --- Comment list modal ---
function CommentsModal({
  visible,
  feedItemId,
  onClose,
}: Readonly<{
  visible: boolean;
  feedItemId: string | null;
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const { data: commentsData } = useComments(feedItemId);
  const addComment = useAddComment();
  const [text, setText] = useState("");

  const comments = commentsData ?? [];

  const handleSend = () => {
    if (!text.trim() || !feedItemId) return;
    addComment.mutate({ feedItemId, text: text.trim() });
    setText("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white dark:bg-neutral-900"
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              {t("feed.comments")}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close comments"
            >
              <IconSymbol name="xmark" size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Comment list */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-5 pt-3 pb-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View className="items-center py-12">
                <IconSymbol name="message" size={36} color="#d1d5db" />
                <Text className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">
                  {t("feed.noComments")}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="mb-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {item.userName}
                  </Text>
                  <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                    {timeAgo(item.createdAt)}
                  </Text>
                </View>
                <Text className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                  {item.text}
                </Text>
              </View>
            )}
          />

          {/* Input bar */}
          <View className="flex-row items-center border-t border-neutral-200 px-4 py-2 dark:border-neutral-700">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t("feed.addComment")}
              placeholderTextColor="#9ca3af"
              className="mr-2 flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
              returnKeyType="send"
              onSubmitEditing={handleSend}
              accessibilityLabel={t("feed.addComment")}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim()}
              className={`h-9 w-9 items-center justify-center rounded-full ${
                text.trim() ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
              }`}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Send comment"
              accessibilityState={{ disabled: !text.trim() }}
            >
              <IconSymbol
                name="arrow.up.circle.fill"
                size={18}
                color={text.trim() ? "#ffffff" : "#9ca3af"}
              />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- New Post Modal ---
function NewPostModal({
  visible,
  onClose,
}: Readonly<{
  visible: boolean;
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const createPost = useCreatePost();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const canPost = title.trim().length > 0 && description.trim().length > 0;

  const handlePost = () => {
    if (!canPost) return;
    createPost.mutate(
      { title: title.trim(), description: description.trim() },
      { onSuccess: () => hapticSuccess() }
    );
    setTitle("");
    setDescription("");
    onClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white dark:bg-neutral-900"
      >
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t("feed.cancel")}
            >
              <Text className="text-base text-neutral-500">{t("feed.cancel")}</Text>
            </Pressable>
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">
              {t("feed.newPost")}
            </Text>
            <Pressable
              onPress={handlePost}
              disabled={!canPost}
              accessibilityRole="button"
              accessibilityLabel={t("feed.post")}
              accessibilityState={{ disabled: !canPost }}
            >
              <Text
                className={`text-base font-semibold ${
                  canPost
                    ? "text-blue-500"
                    : "text-neutral-300 dark:text-neutral-600"
                }`}
              >
                {t("feed.post")}
              </Text>
            </Pressable>
          </View>

          <View className="flex-1 px-5 pt-4">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t("feed.titlePlaceholder")}
              placeholderTextColor="#9ca3af"
              className="mb-4 border-b border-neutral-200 pb-3 text-xl font-bold text-neutral-900 dark:border-neutral-700 dark:text-white"
              accessibilityLabel={t("feed.titlePlaceholder")}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t("feed.contentPlaceholder")}
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              className="flex-1 text-base leading-6 text-neutral-700 dark:text-neutral-300"
              autoFocus
              accessibilityLabel={t("feed.contentPlaceholder")}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- Feed Card ---
function FeedCard({
  item,
  onOpenComments,
}: Readonly<{
  item: FeedItem;
  onOpenComments: (id: string) => void;
}>) {
  const { t } = useTranslation();
  const router = useRouter();
  const toggleLike = useToggleLike();
  const { uiLanguage } = useUiLanguageStore();
  const likeOverrides = useFeedLikesStore((s) => s.overrides);
  const config = TYPE_CONFIG[item.type];
  const liked = item.id in likeOverrides ? likeOverrides[item.id] : item.isLiked;

  const localTitle = localizeField(item.title, item.titleFr, uiLanguage);
  const localDescription = localizeField(item.description, item.descriptionFr, uiLanguage);

  // Parse "word → english" from single-word contribution titles
  const wordParts = item.type === "contribution" && item.title.includes(" → ")
    ? item.title.split(" → ")
    : null;
  const focusWord = wordParts?.[0]?.trim();
  const focusEnglish = wordParts?.[1]?.trim();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${localTitle}\n\n${localDescription}\n\n${t("feed.shareOnBeeli", { userName: item.userName })}`,
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <View
      className="mb-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800"
      style={{ borderTopWidth: 2, borderTopColor: config.color + "90" }}
    >
      {/* Header */}
      <View className="mb-2 flex-row items-center">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
          <Text className="text-sm font-bold text-neutral-600 dark:text-neutral-300">
            {item.userName.charAt(0)}
          </Text>
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
            {item.userName}
          </Text>
          <Text className="text-xs text-neutral-400 dark:text-neutral-500">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <View
          className="flex-row items-center rounded-full px-2 py-0.5"
          style={{ backgroundColor: config.color + "20" }}
        >
          <IconSymbol
            name={config.icon as any}
            size={12}
            color={config.color}
          />
          <Text className="ml-1 text-xs font-medium" style={{ color: config.color }}>
            {t(config.label as any)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text className="mb-1 text-base font-semibold text-neutral-900 dark:text-white">
        {localTitle}
      </Text>
      <Text className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
        {localDescription}
      </Text>

      {/* Audio preview for contributions */}
      {item.type === "contribution" && item.audioUrl && (
        <AudioPreview audioUrl={item.audioUrl} />
      )}

      {/* Practice CTA — only for single-word contributions */}
      {focusWord && focusEnglish && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/quiz",
              params: {
                focusWord,
                focusEnglish,
                ...(typeof item.audioUrl === "string" && item.audioUrl
                  ? { focusAudio: item.audioUrl }
                  : {}),
              },
            })
          }
          className="mb-3 flex-row items-center justify-center rounded-lg bg-emerald-50 py-2 active:opacity-70 dark:bg-emerald-900/20"
          accessibilityRole="button"
          accessibilityLabel={t("feed.practice", { word: focusWord })}
          accessibilityHint="Tap to practice this word in a quiz"
        >
          <IconSymbol name="brain.head.profile" size={14} color="#10b981" />
          <Text className="ml-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {t("feed.practice", { word: focusWord })}
          </Text>
        </Pressable>
      )}

      {/* Actions */}
      <View className="flex-row items-center border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <Pressable
          onPress={() => toggleLike.mutate(item.id)}
          className="mr-5 flex-row items-center"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={liked ? `Unlike, ${item.likes} likes` : `Like, ${item.likes} likes`}
          accessibilityState={{ selected: liked }}
        >
          <IconSymbol
            name={liked ? "heart.fill" : "heart"}
            size={18}
            color={liked ? "#ef4444" : "#9ca3af"}
          />
          <Text className="ml-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {item.likes}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onOpenComments(item.id)}
          className="mr-5 flex-row items-center"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${item.comments} comments`}
          accessibilityHint="Tap to view comments"
        >
          <IconSymbol name="message" size={18} color="#9ca3af" />
          <Text className="ml-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {item.comments}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleShare}
          className="flex-row items-center"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Share post"
        >
          <IconSymbol name="square.and.arrow.up" size={18} color="#9ca3af" />
        </Pressable>
      </View>
    </View>
  );
}

const FILTER_OPTIONS: { id: FeedTypeFilter; label: string }[] = [
  { id: "all", label: "feed.filterAll" },
  { id: "achievement", label: "feed.filterAchievements" },
  { id: "contribution", label: "feed.filterContributions" },
  { id: "community", label: "feed.filterCommunity" },
];

// --- Feed Screen ---
export default function FeedScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FeedTypeFilter>("all");
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFeed(activeFilter);
  const [commentsItemId, setCommentsItemId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { t } = useTranslation();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-neutral-900"
      edges={["top"]}
    >
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View>
          <Text className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
            {t("feed.title")}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t("feed.subtitle")}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push("/contribute")}
            className="h-10 w-10 items-center justify-center rounded-full bg-blue-500 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Record audio contribution"
          >
            <IconSymbol name="mic.fill" size={18} color="#ffffff" />
          </Pressable>
          <Pressable
            onPress={() => setShowNewPost(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-purple-500 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Create new post"
          >
            <IconSymbol name="plus" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Filter bar */}
      <View className="flex-row gap-2 px-5 pb-2">
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => setActiveFilter(opt.id)}
            className={`rounded-full px-3.5 py-1.5 active:opacity-70 ${
              activeFilter === opt.id
                ? "bg-blue-500"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
            accessibilityRole="button"
            accessibilityLabel={t(opt.label as any)}
            accessibilityState={{ selected: activeFilter === opt.id }}
          >
            <Text
              className={`text-xs font-semibold ${
                activeFilter === opt.id
                  ? "text-white"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {t(opt.label as any)}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8 pt-2"
          renderItem={({ item }) => (
            <FeedCard item={item} onOpenComments={setCommentsItemId} />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color="#3b82f6" className="py-4" />
            ) : null
          }
        />
      )}

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsItemId !== null}
        feedItemId={commentsItemId}
        onClose={() => setCommentsItemId(null)}
      />

      {/* New Post Modal */}
      <NewPostModal
        visible={showNewPost}
        onClose={() => setShowNewPost(false)}
      />
    </SafeAreaView>
  );
}
