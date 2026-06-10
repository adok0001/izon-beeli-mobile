import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import type { DiscoverItem } from "@/types";
import { useRouter } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";

export const DISCOVER_TYPE_CONFIG = {
  blog: {
    color: "#38bdf8",
    icon: "doc.text.fill" as const,
    label: "BLOG",
    cta: "Read Article",
    accentDim: "rgba(56, 189, 248, 0.12)",
    accentBorder: "rgba(56, 189, 248, 0.25)",
  },
  podcast: {
    color: "#a78bfa",
    icon: "headphones" as const,
    label: "PODCAST",
    cta: "Listen",
    accentDim: "rgba(167, 139, 250, 0.12)",
    accentBorder: "rgba(167, 139, 250, 0.25)",
  },
  film: {
    color: "#fb923c",
    icon: "play.circle.fill" as const,
    label: "FILM",
    cta: "Watch",
    accentDim: "rgba(251, 146, 60, 0.12)",
    accentBorder: "rgba(251, 146, 60, 0.25)",
  },
} as const;

function formatDuration(seconds: number, type: DiscoverItem["type"]): string {
  if (type === "blog") {
    const mins = Math.round(seconds / 60);
    return `${mins} min read`;
  }
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} min`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

interface DiscoverCardProps {
  item: DiscoverItem;
  onStoryPress?: (storyId: string) => void;
  compact?: boolean;
}

export function DiscoverCard({ item, onStoryPress, compact = false }: DiscoverCardProps) {
  const M = useMuseumTheme();
  const cfg = DISCOVER_TYPE_CONFIG[item.type];
  const router = useRouter();
  const { currentTrackId, isPlaying, loadAndPlay, togglePlayback } = useAudioStore();
  const isCurrentPodcast = item.type === "podcast" && currentTrackId === item.id;

  function handlePress() {
    if (item.type === "film" && item.storyId && onStoryPress) {
      onStoryPress(item.storyId);
    } else if (item.type === "podcast" && item.audioUrl) {
      if (isCurrentPodcast) {
        togglePlayback();
      } else {
        loadAndPlay(item.id, item.audioUrl, item.title);
      }
    } else {
      router.push(`/discover-content/${item.id}` as never);
    }
  }

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        style={{
          width: 156,
          borderRadius: 14,
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.border,
          overflow: "hidden",
          ...(Platform.OS === "web" ? { cursor: "pointer" as never } : {}),
        }}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        {/* Gradient header area */}
        <View
          style={{
            height: 88,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: item.coverGradient[0],
          }}
        >
          <Text style={{ fontSize: 36 }}>{item.coverEmoji}</Text>
        </View>

        <View style={{ padding: 10 }}>
          {/* Type badge */}
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              borderRadius: 999,
              paddingHorizontal: 7,
              paddingVertical: 3,
              backgroundColor: cfg.accentDim,
              marginBottom: 6,
            }}
          >
            <IconSymbol name={cfg.icon} size={9} color={cfg.color} />
            <Text style={{ fontSize: 8, fontWeight: "800", letterSpacing: 0.8, color: cfg.color }}>
              {cfg.label}
            </Text>
          </View>

          <Text
            numberOfLines={2}
            style={{ fontSize: 12, fontWeight: "700", color: M.text, lineHeight: 16, marginBottom: 4 }}
          >
            {item.title}
          </Text>
          <Text style={{ fontSize: 10, color: M.muted }}>
            {formatDuration(item.duration, item.type)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={{
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        borderLeftWidth: 3,
        borderLeftColor: cfg.color,
        overflow: "hidden",
        ...(Platform.OS === "web" ? { cursor: "pointer" as never } : {}),
      }}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Emoji thumbnail */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: item.coverGradient[0],
              flexShrink: 0,
            }}
          >
            {item.type === "film" ? (
              <View
                style={{
                  position: "absolute",
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: "rgba(251, 146, 60, 0.9)",
                  alignItems: "center",
                  justifyContent: "center",
                  bottom: 4,
                  right: 4,
                  zIndex: 1,
                }}
              >
                <IconSymbol name="play.fill" size={9} color="#fff" />
              </View>
            ) : null}
            <Text style={{ fontSize: 24 }}>{item.coverEmoji}</Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            {/* Type badge + duration row */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  backgroundColor: cfg.accentDim,
                }}
              >
                <IconSymbol name={cfg.icon} size={9} color={cfg.color} />
                <Text style={{ fontSize: 8, fontWeight: "800", letterSpacing: 1, color: cfg.color }}>
                  {cfg.label}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: M.muted }}>
                {formatDuration(item.duration, item.type)}
              </Text>
            </View>

            <Text
              numberOfLines={2}
              style={{ fontSize: 14, fontWeight: "700", color: M.text, lineHeight: 19, marginBottom: 3 }}
            >
              {item.title}
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 12, color: M.sub, lineHeight: 16 }}>
              {item.description}
            </Text>
          </View>
        </View>

        {/* Meta row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: M.border,
          }}
        >
          <Text style={{ fontSize: 11, color: M.muted }}>
            {item.author} · {formatDate(item.publishedAt)}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: cfg.accentDim,
              borderWidth: 1,
              borderColor: cfg.accentBorder,
            }}
          >
            <IconSymbol
              name={
                item.type === "podcast"
                  ? isCurrentPodcast && isPlaying
                    ? "pause.fill"
                    : "play.fill"
                  : item.type === "film"
                  ? "play.circle.fill"
                  : "chevron.right"
              }
              size={10}
              color={cfg.color}
            />
            <Text style={{ fontSize: 11, fontWeight: "700", color: cfg.color }}>
              {item.type === "podcast" && isCurrentPodcast && isPlaying ? "Playing" : cfg.cta}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
