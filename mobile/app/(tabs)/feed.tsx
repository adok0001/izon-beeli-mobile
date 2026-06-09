import { FeedbackModal } from "@/components/feedback-modal";
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
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { LoadingScreen } from "@/components/loading-screen";
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
  return new Date(dateStr).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
}

function useTypeConfig(M: ReturnType<typeof useMuseumTheme>): Record<FeedItem["type"], { icon: string; color: string; label: string }> {
  return {
    lesson_completed: { icon: "checkmark.circle.fill", color: M.success, label: "feed.typeLesson" },
    achievement: { icon: "trophy.fill", color: "#C4862A", label: "feed.typeAchievement" },
    contribution: { icon: "mic.fill", color: "#60a5fa", label: "feed.typeContribution" },
    community: { icon: "text.bubble", color: "#a78bfa", label: "feed.typeCommunity" },
  };
}

function AudioPreview({ audioUrl }: Readonly<{ audioUrl: AudioSource }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { currentTrackId, isPlaying, loadAndPlay, togglePlayback } = useAudioStore();
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
      style={{
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "rgba(96, 165, 250, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.2)",
        gap: 10,
      }}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={isCurrentTrack && isPlaying ? t("feed.playing") : t("feed.playAudio")}
    >
      <View
        style={{
          width: 30, height: 30, borderRadius: 15,
          alignItems: "center", justifyContent: "center",
          backgroundColor: isCurrentTrack ? "#60a5fa" : "rgba(96, 165, 250, 0.15)",
        }}
      >
        <IconSymbol
          name={isCurrentTrack && isPlaying ? "pause.fill" : "play.fill"}
          size={12}
          color={isCurrentTrack ? M.ink : "#60a5fa"}
        />
      </View>
      <IconSymbol name="waveform" size={16} color="#60a5fa" />
      <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: "#60a5fa" }}>
        {isCurrentTrack && isPlaying ? t("feed.playing") : t("feed.playAudio")}
      </Text>
    </Pressable>
  );
}

function CommentsModal({
  visible,
  feedItemId,
  onClose,
}: Readonly<{ visible: boolean; feedItemId: string | null; onClose: () => void }>) {
  const M = useMuseumTheme();
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: M.ink }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              borderBottomWidth: 1, borderBottomColor: M.border,
              paddingHorizontal: 20, paddingVertical: 14,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: M.parchment }}>
              {t("feed.comments")}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
              <IconSymbol name="xmark" size={18} color={M.muted} />
            </Pressable>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <IconSymbol name="message" size={32} color={M.muted} />
                <Text style={{ marginTop: 10, fontSize: 13, color: M.muted }}>
                  {t("feed.noComments")}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={{
                  marginBottom: 10, borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 10,
                  backgroundColor: M.card,
                  borderWidth: 1, borderColor: M.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: M.text }}>{item.userName}</Text>
                  <Text style={{ fontSize: 10, color: M.muted }}>{timeAgo(item.createdAt)}</Text>
                </View>
                <Text style={{ marginTop: 4, fontSize: 13, color: M.sub, lineHeight: 18 }}>{item.text}</Text>
              </View>
            )}
          />

          <View
            style={{
              flexDirection: "row", alignItems: "center",
              borderTopWidth: 1, borderTopColor: M.border,
              paddingHorizontal: 16, paddingVertical: 10, gap: 10,
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t("feed.addComment")}
              placeholderTextColor={M.muted}
              style={{
                flex: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
                fontSize: 13, backgroundColor: M.card, color: M.text,
                borderWidth: 1, borderColor: M.border,
              }}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim()}
              style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: "center", justifyContent: "center",
                backgroundColor: text.trim() ? M.accent : M.card,
                borderWidth: 1,
                borderColor: text.trim() ? M.accent : M.border,
              }}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Send comment"
            >
              <IconSymbol name="arrow.up.circle.fill" size={16} color={text.trim() ? M.ink : M.muted} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function NewPostModal({ visible, onClose }: Readonly<{ visible: boolean; onClose: () => void }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const createPost = useCreatePost();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const canPost = title.trim().length > 0 && description.trim().length > 0;

  const handlePost = () => {
    if (!canPost) return;
    createPost.mutate({ title: title.trim(), description: description.trim() }, { onSuccess: () => hapticSuccess() });
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: M.ink }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              borderBottomWidth: 1, borderBottomColor: M.border,
              paddingHorizontal: 20, paddingVertical: 14,
            }}
          >
            <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel={t("feed.cancel")}>
              <Text style={{ fontSize: 14, color: M.textDim }}>{t("feed.cancel")}</Text>
            </Pressable>
            <Text style={{ fontSize: 15, fontWeight: "800", color: M.parchment }}>{t("feed.newPost")}</Text>
            <Pressable onPress={handlePost} disabled={!canPost} accessibilityRole="button">
              <Text style={{ fontSize: 14, fontWeight: "800", color: canPost ? M.accent : M.muted }}>
                {t("feed.post")}
              </Text>
            </Pressable>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t("feed.titlePlaceholder")}
              placeholderTextColor={M.muted}
              style={{
                marginBottom: 16, paddingBottom: 14,
                borderBottomWidth: 1, borderBottomColor: M.border,
                fontSize: 20, fontWeight: "800", color: M.parchment,
              }}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t("feed.contentPlaceholder")}
              placeholderTextColor={M.textDimDark}
              multiline
              textAlignVertical="top"
              style={{ flex: 1, fontSize: 14, lineHeight: 22, color: M.textDim }}
              autoFocus
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FeedCard({ item, onOpenComments }: Readonly<{ item: FeedItem; onOpenComments: (id: string) => void }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const toggleLike = useToggleLike();
  const { uiLanguage } = useUiLanguageStore();
  const likeOverrides = useFeedLikesStore((s) => s.overrides);
  const typeConfig = useTypeConfig(M);
  const config = typeConfig[item.type];
  const liked = item.id in likeOverrides ? likeOverrides[item.id] : item.isLiked;

  const localTitle = localizeField(item.title, item.titleFr, uiLanguage);
  const localDescription = localizeField(item.description, item.descriptionFr, uiLanguage);

  const wordParts =
    item.type === "contribution" && item.title.includes(" → ") ? item.title.split(" → ") : null;
  const focusWord = wordParts?.[0]?.trim();
  const focusEnglish = wordParts?.[1]?.trim();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${localTitle}\n\n${localDescription}\n\n${t("feed.shareOnBeeli", { userName: item.userName })}`,
      });
    } catch {}
  };

  return (
    <View
      style={{
        marginBottom: 10,
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        borderTopWidth: 3,
        borderTopColor: config.color + "80",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, paddingBottom: 10 }}>
        <View
          style={{
            width: 36, height: 36, borderRadius: 18,
            alignItems: "center", justifyContent: "center",
            backgroundColor: `${config.color}15`,
            borderWidth: 1, borderColor: `${config.color}30`,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: config.color }}>
            {item.userName.charAt(0)}
          </Text>
        </View>
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>{item.userName}</Text>
          <Text style={{ fontSize: 10, color: M.muted }}>{timeAgo(item.createdAt)}</Text>
        </View>
        <View
          style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
            backgroundColor: `${config.color}15`,
          }}
        >
          <IconSymbol name={config.icon as any} size={10} color={config.color} />
          <Text style={{ fontSize: 9, fontWeight: "700", letterSpacing: 1, color: config.color }}>
            {t(config.label as any).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: M.text, marginBottom: 4 }}>
          {localTitle}
        </Text>
        <Text style={{ fontSize: 13, color: M.sub, lineHeight: 18 }}>{localDescription}</Text>

        {item.type === "contribution" && item.audioUrl && (
          <View style={{ marginTop: 10 }}>
            <AudioPreview audioUrl={item.audioUrl} />
          </View>
        )}

        {focusWord && focusEnglish && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/quiz",
                params: {
                  focusWord,
                  focusEnglish,
                  ...(item.languageId ? { focusLanguageId: item.languageId } : {}),
                  ...(typeof item.audioUrl === "string" && item.audioUrl
                    ? { focusAudio: item.audioUrl }
                    : {}),
                },
              })
            }
            style={{
              marginTop: 8,
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              borderRadius: 10, paddingVertical: 8,
              backgroundColor: M.successBg,
              borderWidth: 1, borderColor: M.successBorder,
              gap: 6,
            }}
            accessibilityRole="button"
            accessibilityLabel={t("feed.practice", { word: focusWord })}
          >
            <IconSymbol name="brain.head.profile" size={13} color={M.success} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: M.success }}>
              {t("feed.practice", { word: focusWord })}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Actions */}
      <View
        style={{
          flexDirection: "row", alignItems: "center",
          borderTopWidth: 1, borderTopColor: M.border,
          paddingHorizontal: 14, paddingVertical: 10, gap: 20,
        }}
      >
        <Pressable
          onPress={() => toggleLike.mutate(item.id)}
          style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={liked ? `Unlike, ${item.likes}` : `Like, ${item.likes}`}
        >
          <IconSymbol name={liked ? "heart.fill" : "heart"} size={16} color={liked ? M.error : M.muted} />
          <Text style={{ fontSize: 12, color: M.muted }}>{item.likes}</Text>
        </Pressable>
        <Pressable
          onPress={() => onOpenComments(item.id)}
          style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${item.comments} comments`}
        >
          <IconSymbol name="message" size={16} color={M.muted} />
          <Text style={{ fontSize: 12, color: M.muted }}>{item.comments}</Text>
        </Pressable>
        <Pressable onPress={handleShare} hitSlop={8} accessibilityRole="button" accessibilityLabel="Share">
          <IconSymbol name="square.and.arrow.up" size={16} color={M.muted} />
        </Pressable>
      </View>
    </View>
  );
}

function FeedbackBanner({ onPress }: Readonly<{ onPress: () => void }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginBottom: 12, borderRadius: 14,
        backgroundColor: M.card,
        borderWidth: 1, borderColor: M.border,
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 14, paddingVertical: 12, gap: 12,
      }}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={t("feedback.title")}
    >
      <View
        style={{
          width: 38, height: 38, borderRadius: 10,
          alignItems: "center", justifyContent: "center",
          backgroundColor: `${M.accent}18`,
          borderWidth: 1, borderColor: `${M.accent}30`,
        }}
      >
        <IconSymbol name="megaphone.fill" size={17} color={M.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>
          {t("feedback.title")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
          <IconSymbol name="lock.fill" size={9} color={M.muted} />
          <Text style={{ fontSize: 11, color: M.muted }}>
            {t("feedback.adminOnlyNotice")}
          </Text>
        </View>
      </View>
      <IconSymbol name="chevron.right" size={12} color={M.muted} />
    </Pressable>
  );
}

const FILTER_OPTIONS: { id: FeedTypeFilter; label: string }[] = [
  { id: "all", label: "feed.filterAll" },
  { id: "achievement", label: "feed.filterAchievements" },
  { id: "contribution", label: "feed.filterContributions" },
  { id: "community", label: "feed.filterCommunity" },
];

export default function FeedScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FeedTypeFilter>("all");
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFeed(activeFilter);
  const [commentsItemId, setCommentsItemId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
              {t("feed.title")}
            </Text>
            <Text style={{ fontSize: 13, color: M.textDim, marginTop: 4 }}>
              {t("feed.subtitle")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <Pressable
              onPress={() => router.push("/contribute")}
              style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(96, 165, 250, 0.15)",
                borderWidth: 1, borderColor: "rgba(96, 165, 250, 0.3)",
              }}
              accessibilityRole="button"
              accessibilityLabel="Record audio contribution"
            >
              <IconSymbol name="mic.fill" size={16} color="#60a5fa" />
            </Pressable>
            <Pressable
              onPress={() => setShowNewPost(true)}
              style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: "center", justifyContent: "center",
                backgroundColor: `${M.accent}20`,
                borderWidth: 1, borderColor: `${M.accent}40`,
              }}
              accessibilityRole="button"
              accessibilityLabel="Create new post"
            >
              <IconSymbol name="plus" size={18} color={M.accent} />
            </Pressable>
          </View>
        </View>

        {/* Filter pills */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          {FILTER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => setActiveFilter(opt.id)}
              style={{
                borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
                backgroundColor: activeFilter === opt.id ? M.accent : M.card,
                borderWidth: 1,
                borderColor: activeFilter === opt.id ? M.accent : M.border,
              }}
              accessibilityRole="button"
              accessibilityLabel={t(opt.label as any)}
              accessibilityState={{ selected: activeFilter === opt.id }}
            >
              <Text
                style={{
                  fontSize: 11, fontWeight: "700",
                  color: activeFilter === opt.id ? M.ink : M.sub,
                }}
              >
                {t(opt.label as any)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: M.card }}>
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 }}
            ListHeaderComponent={<FeedbackBanner onPress={() => setShowFeedback(true)} />}
            renderItem={({ item }) => <FeedCard item={item} onOpenComments={setCommentsItemId} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={M.accent}
                colors={[M.accent]}
              />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator size="small" color={M.accent} style={{ paddingVertical: 16 }} />
              ) : null
            }
          />
        )}
      </View>

      <CommentsModal
        visible={commentsItemId !== null}
        feedItemId={commentsItemId}
        onClose={() => setCommentsItemId(null)}
      />
      <NewPostModal visible={showNewPost} onClose={() => setShowNewPost(false)} />
      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} />
    </SafeAreaView>
  );
}
