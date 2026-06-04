import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { formatDuration } from "@/lib/mock-data";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export function AudioPlayer({ compact = false, position = "bottom", onPress }: { compact?: boolean; position?: "top" | "bottom"; onPress?: () => void }) {
  const M = useMuseumTheme();
  const {
    isPlaying,
    isLoading,
    currentTrackId,
    currentTrackTitle,
    progress,
    duration,
    playbackSpeed,
    togglePlayback,
    skipForward,
    skipBackward,
    setSpeed,
    seekTo,
  } = useAudioStore();
  const [barWidth, setBarWidth] = useState(0);

  if (!currentTrackId) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const cycleSpeed = () => {
    const currentIndex = SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    setSpeed(SPEEDS[nextIndex]);
  };

  const handleSeek = (e: GestureResponderEvent) => {
    if (duration <= 0 || barWidth <= 0) return;
    const { locationX } = e.nativeEvent;
    const percent = Math.max(0, Math.min(1, locationX / barWidth));
    seekTo(percent * duration);
  };

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  const borderPos = position === "top"
    ? { borderBottomWidth: 1, borderBottomColor: M.border }
    : { borderTopWidth: 1, borderTopColor: M.border };

  if (compact) {
    return (
      <View style={[{ backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 8 }, borderPos]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={togglePlayback}
            style={{ marginRight: 12 }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
            accessibilityState={{ busy: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={M.accent} />
            ) : (
              <IconSymbol
                name={isPlaying ? "pause.fill" : "play.fill"}
                size={24}
                color={M.accent}
              />
            )}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={onPress}
              disabled={!onPress}
              accessibilityRole="button"
              accessibilityLabel={currentTrackTitle ?? "Now Playing"}
              accessibilityHint={onPress ? "Open lesson" : undefined}
            >
              <Text style={{ fontSize: 14, fontWeight: "500", color: M.text }} numberOfLines={1}>
                {currentTrackTitle ?? "Now Playing"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSeek}
              onLayout={onBarLayout}
              style={{ marginTop: 4, paddingVertical: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Seek audio"
              accessibilityHint="Tap to seek to position"
            >
              <View style={{ height: 4, borderRadius: 999, backgroundColor: M.border }}>
                <View style={{ height: 4, borderRadius: 999, backgroundColor: M.accent, width: `${progressPercent}%` }} />
              </View>
            </Pressable>
          </View>
          <Text style={{ marginLeft: 8, fontSize: 12, color: M.sub }}>
            {formatDuration(progress)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[{ backgroundColor: M.card, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 }, borderPos]}>
      <Text style={{ marginBottom: 12, textAlign: "center", fontSize: 16, fontWeight: "600", color: M.text }} numberOfLines={1}>
        {currentTrackTitle ?? "Now Playing"}
      </Text>

      <Pressable
        onPress={handleSeek}
        style={{ paddingVertical: 8 }}
        onLayout={onBarLayout}
        accessibilityRole="button"
        accessibilityLabel={`Audio progress, ${formatDuration(progress)} of ${formatDuration(duration)}`}
        accessibilityHint="Tap to seek to position"
      >
        <View style={{ height: 6, borderRadius: 999, backgroundColor: M.border }}>
          <View style={{ height: 6, borderRadius: 999, backgroundColor: M.accent, width: `${progressPercent}%` }} />
        </View>
      </Pressable>

      <View style={{ marginBottom: 16, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, color: M.sub }}>{formatDuration(progress)}</Text>
        <Text style={{ fontSize: 12, color: M.sub }}>{formatDuration(duration)}</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <Pressable
          onPress={cycleSpeed}
          hitSlop={8}
          style={{ minWidth: 40, alignItems: "center" }}
          accessibilityRole="button"
          accessibilityLabel={`Playback speed: ${playbackSpeed}x`}
          accessibilityHint="Tap to cycle through playback speeds"
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: M.accent }}>{playbackSpeed}x</Text>
        </Pressable>

        <Pressable
          onPress={() => skipBackward(10)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip back 10 seconds"
        >
          <IconSymbol name="backward.fill" size={28} color={M.sub} />
        </Pressable>

        <Pressable
          onPress={togglePlayback}
          style={{ height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: 28, backgroundColor: M.accent }}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
          accessibilityState={{ busy: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={M.ink} />
          ) : (
            <IconSymbol name={isPlaying ? "pause.fill" : "play.fill"} size={28} color={M.ink} />
          )}
        </Pressable>

        <Pressable
          onPress={() => skipForward(10)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip forward 10 seconds"
        >
          <IconSymbol name="forward.fill" size={28} color={M.sub} />
        </Pressable>

        <View style={{ minWidth: 40 }} />
      </View>
    </View>
  );
}
