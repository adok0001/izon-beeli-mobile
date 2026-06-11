import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDiscover } from "@/lib/hooks/use-discover";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export { ErrorBoundary } from "@/components/screen-error-boundary";

function openExternal(url: string) {
  if (Platform.OS === "web") {
    (window as Window).open(url, "_blank");
  } else {
    Linking.openURL(url).catch(() => {});
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function formatDuration(seconds: number, type: "blog" | "podcast" | "film"): string {
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

function Paragraphs({ text, M }: { text: string; M: ReturnType<typeof useMuseumTheme> }) {
  const paras = text.split("\n\n").filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <Text
          key={i}
          style={{ fontSize: 15, lineHeight: 24, color: M.text, marginBottom: 16 }}
        >
          {p}
        </Text>
      ))}
    </>
  );
}

export default function DiscoverContentScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { all } = useDiscover("all");
  const item = all.find((i) => i.id === id);

  const { currentTrackId, isPlaying, loadAndPlay, togglePlayback } = useAudioStore();
  const isCurrentPodcast = item?.type === "podcast" && currentTrackId === item.id;

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0F1A", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 32, marginBottom: 16 }}>🎬</Text>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#F7F2E8", marginBottom: 8 }}>
          Content not found
        </Text>
        <Text style={{ fontSize: 13, color: "#9A9480", textAlign: "center", marginBottom: 24 }}>
          This piece of content couldn't be loaded.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            borderRadius: 999,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: "#C4862A",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#0D0F1A" }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const TYPE_COLOR: Record<string, string> = {
    blog: "#38bdf8",
    podcast: "#a78bfa",
    film: "#fb923c",
  };
  const typeColor = TYPE_COLOR[item.type] ?? "#C4862A";
  const typeLabel = item.type.toUpperCase();

  const bodyText =
    item.type === "blog"
      ? item.body
      : item.type === "podcast"
      ? item.showNotes
      : null;

  function handleAudio() {
    if (!item?.audioUrl) return;
    if (isCurrentPodcast) {
      togglePlayback();
    } else {
      loadAndPlay(item.id, item.audioUrl, item.title, `/discover-content/${item.id}`);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0F1A" }}>
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: 56,
          left: 16,
          zIndex: 20,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(13,15,26,0.75)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#2E3245",
        }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <IconSymbol name="chevron.left" size={16} color="#F7F2E8" />
      </Pressable>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero block */}
        <View
          style={{
            height: 180,
            backgroundColor: item.coverGradient[0],
            alignItems: "flex-start",
            justifyContent: "flex-end",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative emoji */}
          <Text
            style={{
              position: "absolute",
              fontSize: 90,
              opacity: 0.08,
              bottom: -10,
              right: -10,
              userSelect: "none" as never,
            }}
          >
            {item.coverEmoji}
          </Text>

          {/* Type badge */}
          <View
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: "rgba(13,15,26,0.65)",
              borderWidth: 1,
              borderColor: `${typeColor}50`,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: typeColor }}>
              {typeLabel}
            </Text>
          </View>

          {/* Title + author */}
          <View style={{ padding: 16, paddingBottom: 18, gap: 4 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: "#F7F2E8",
                lineHeight: 26,
                letterSpacing: -0.3,
              }}
              numberOfLines={3}
            >
              {item.title}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(247,242,232,0.6)", fontWeight: "600" }}>
              {item.author}
            </Text>
          </View>
        </View>

        {/* Meta row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: M.border,
          }}
        >
          <Text style={{ fontSize: 11, color: M.muted }}>
            {item.author}
          </Text>
          <Text style={{ fontSize: 11, color: M.muted }}>·</Text>
          <Text style={{ fontSize: 11, color: M.muted }}>
            {formatDate(item.publishedAt)}
          </Text>
          <Text style={{ fontSize: 11, color: M.muted }}>·</Text>
          <Text style={{ fontSize: 11, color: M.muted }}>
            {formatDuration(item.duration, item.type)}
          </Text>
        </View>

        {/* Audio controls — podcasts with audioUrl */}
        {item.type === "podcast" && item.audioUrl && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              borderRadius: 12,
              backgroundColor: M.card,
              borderWidth: 1,
              borderColor: M.border,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Pressable
              onPress={handleAudio}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#a78bfa",
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel={isCurrentPodcast && isPlaying ? "Pause" : "Play"}
            >
              <IconSymbol
                name={isCurrentPodcast && isPlaying ? "pause.fill" : "play.fill"}
                size={18}
                color="#fff"
              />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 11, color: M.muted, marginTop: 2 }}>
                {isCurrentPodcast && isPlaying ? "Now playing" : "Tap to listen"}
              </Text>
            </View>
          </View>
        )}

        {/* Content body */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {bodyText ? (
            <Paragraphs text={bodyText} M={M} />
          ) : item.type === "film" ? (
            <>
              <Text style={{ fontSize: 15, lineHeight: 24, color: M.text, marginBottom: 16 }}>
                {item.description}
              </Text>
              <Text style={{ fontSize: 14, color: M.muted, fontStyle: "italic" }}>
                Full film coming soon.
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 14, color: M.muted }}>{item.description}</Text>
          )}
        </View>

        {/* Footer */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 24,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: M.border,
            gap: 12,
          }}
        >
          {item.contentUrl && (
            <Pressable onPress={() => openExternal(item.contentUrl!)} accessibilityRole="link">
              <Text style={{ fontSize: 12, color: M.muted, textAlign: "center" }}>
                Also available on the web —{" "}
                <Text style={{ color: "#C4862A", textDecorationLine: "underline" }}>
                  {item.contentUrl.replace(/^https?:\/\//, "")}
                </Text>
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.back()}
            style={{
              borderRadius: 999,
              paddingVertical: 12,
              backgroundColor: "#C4862A",
              alignItems: "center",
            }}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#0D0F1A", letterSpacing: 0.3 }}>
              Return to Culture
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
