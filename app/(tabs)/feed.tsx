import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAudioStore } from "@/store/audio-store";
import {
  useFeed,
  useCreatePost,
  useToggleLike,
  useComments,
  useAddComment,
} from "@/lib/hooks/use-feed";
import type { FeedItem, Comment, AudioSource } from "@/types";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
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
    label: "Lesson",
  },
  achievement: { icon: "trophy.fill", color: "#f59e0b", label: "Achievement" },
  contribution: { icon: "mic.fill", color: "#3b82f6", label: "Contribution" },
  community: { icon: "text.bubble", color: "#8b5cf6", label: "Community" },
};

// --- Audio preview for contribution cards ---
function AudioPreview({ audioUrl }: { audioUrl: AudioSource }) {
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
        {isCurrentTrack && isPlaying ? "Playing..." : "Play audio"}
      </Text>
    </Pressable>
  );
}

// --- Comment list modal ---
function CommentsModal({
  visible,
  feedItemId,
  onClose,
}: {
  visible: boolean;
  feedItemId: string | null;
  onClose: () => void;
}) {
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
              Comments
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
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
                  No comments yet. Be the first!
                </Text>
              </View>
            }
            renderItem={({ item }: { item: Comment }) => (
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
              placeholder="Add a comment..."
              placeholderTextColor="#9ca3af"
              className="mr-2 flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim()}
              className={`h-9 w-9 items-center justify-center rounded-full ${
                text.trim() ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
              }`}
              hitSlop={4}
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
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const createPost = useCreatePost();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const canPost = title.trim().length > 0 && description.trim().length > 0;

  const handlePost = () => {
    if (!canPost) return;
    createPost.mutate({ title: title.trim(), description: description.trim() });
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
            <Pressable onPress={handleClose}>
              <Text className="text-base text-neutral-500">Cancel</Text>
            </Pressable>
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">
              New Post
            </Text>
            <Pressable onPress={handlePost} disabled={!canPost}>
              <Text
                className={`text-base font-semibold ${
                  canPost
                    ? "text-blue-500"
                    : "text-neutral-300 dark:text-neutral-600"
                }`}
              >
                Post
              </Text>
            </Pressable>
          </View>

          <View className="flex-1 px-5 pt-4">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor="#9ca3af"
              className="mb-4 border-b border-neutral-200 pb-3 text-xl font-bold text-neutral-900 dark:border-neutral-700 dark:text-white"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Share something with the community..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              className="flex-1 text-base leading-6 text-neutral-700 dark:text-neutral-300"
              autoFocus
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
}: {
  item: FeedItem & { isLiked?: boolean };
  onOpenComments: (id: string) => void;
}) {
  const toggleLike = useToggleLike();
  const config = TYPE_CONFIG[item.type];
  const liked = (item as any).isLiked ?? false;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.title}\n\n${item.description}\n\n— ${item.userName} on Izon Beeli`,
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <View className="mb-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
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
        <View className="flex-row items-center rounded-full bg-neutral-200/50 px-2 py-0.5 dark:bg-neutral-700/50">
          <IconSymbol
            name={config.icon as any}
            size={12}
            color={config.color}
          />
          <Text className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
            {config.label}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text className="mb-1 text-base font-semibold text-neutral-900 dark:text-white">
        {item.title}
      </Text>
      <Text className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
        {item.description}
      </Text>

      {/* Audio preview for contributions */}
      {item.type === "contribution" && item.audioUrl && (
        <AudioPreview audioUrl={item.audioUrl} />
      )}

      {/* Actions */}
      <View className="flex-row items-center border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <Pressable
          onPress={() => toggleLike.mutate(item.id)}
          className="mr-5 flex-row items-center"
          hitSlop={8}
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
        >
          <IconSymbol name="square.and.arrow.up" size={18} color="#9ca3af" />
        </Pressable>
      </View>
    </View>
  );
}

// --- Feed Screen ---
export default function FeedScreen() {
  const router = useRouter();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFeed();
  const [commentsItemId, setCommentsItemId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            Feed
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Community updates and activity
          </Text>
        </View>
        <Pressable
          onPress={() => setShowNewPost(true)}
          className="h-10 w-10 items-center justify-center rounded-full bg-purple-500"
        >
          <IconSymbol name="plus" size={22} color="#ffffff" />
        </Pressable>
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
            <FeedCard item={item as any} onOpenComments={setCommentsItemId} />
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

      {/* Contribute FAB */}
      <Pressable
        onPress={() => router.push("/contribute")}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg active:opacity-80"
        style={{ elevation: 5 }}
      >
        <IconSymbol name="mic.fill" size={24} color="#ffffff" />
      </Pressable>

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
