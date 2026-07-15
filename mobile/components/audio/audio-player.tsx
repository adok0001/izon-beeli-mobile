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
import { AnimatedProgress } from "@/components/audio/animated-progress";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { formatDuration } from "@/lib/mock-data";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** Approximate rendered height of the compact mini-player bar (px). Used by
 *  floating action buttons to clear the playback bar when a track is active. */
export const MINI_PLAYER_HEIGHT = 54;

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
    error,
    reset,
    togglePlayback,
    skipForward,
    skipBackward,
    setSpeed,
    seekTo,
  } = useAudioStore();
  const [barWidth, setBarWidth] = useState(0);

  if (!currentTrackId) return null;

  const progressFraction = duration > 0 ? progress / duration : 0;

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
            onPress={error ? reset : togglePlayback}
            style={{ marginRight: 12 }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={error ? "Dismiss audio error" : isPlaying ? "Pause audio" : "Play audio"}
            accessibilityState={{ busy: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={M.accent} />
            ) : (
              <IconSymbol
                name={error ? "xmark" : isPlaying ? "pause.fill" : "play.fill"}
                size={24}
                color={error ? M.error : M.accent}
              />
            )}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={onPress}
              disabled={!onPress}
              accessibilityRole="button"
              accessibilityLabel={currentTrackTitle ?? "Now Playing"}
              accessibilityHint={onPress ? "Open now playing" : undefined}
            >
              <Text style={{ fontSize: 14, fontWeight: "500", color: M.text }} numberOfLines={1}>
                {currentTrackTitle ?? "Now Playing"}
              </Text>
            </Pressable>
            {error ? (
              <Text style={{ marginTop: 4, fontSize: 12, color: M.error }} numberOfLines={1}>
                {error}
              </Text>
            ) : (
            <Pressable
              onPress={handleSeek}
              onLayout={onBarLayout}
              style={{ marginTop: 4, paddingVertical: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Seek audio"
              accessibilityHint="Tap to seek to position"
            >
              <AnimatedProgress fraction={progressFraction} isPlaying={isPlaying} height={4} />
            </Pressable>
            )}
          </View>
          <Text style={{ marginLeft: 8, fontSize: 12, color: M.sub }}>
            {formatDuration(progress)}
          </Text>
          <Pressable
            onPress={reset}
            style={{ marginLeft: 12 }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remove track"
            accessibilityHint="Stops playback and clears the player"
          >
            <IconSymbol name="xmark" size={18} color={M.sub} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[{ backgroundColor: M.card, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 }, borderPos]}>
      <Text style={{ marginBottom: 12, textAlign: "center", fontSize: 16, fontWeight: "600", color: M.text }} numberOfLines={1}>
        {currentTrackTitle ?? "Now Playing"}
      </Text>

      {error && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginBottom: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: M.errorBg,
            borderWidth: 1,
            borderColor: M.errorBorder,
          }}
          accessibilityRole="alert"
        >
          <IconSymbol name="exclamationmark.triangle.fill" size={16} color={M.error} />
          <Text style={{ fontSize: 13, color: M.error, flexShrink: 1 }}>{error}</Text>
        </View>
      )}

      <Pressable
        onPress={handleSeek}
        style={{ paddingVertical: 8 }}
        onLayout={onBarLayout}
        accessibilityRole="button"
        accessibilityLabel={`Audio progress, ${formatDuration(progress)} of ${formatDuration(duration)}`}
        accessibilityHint="Tap to seek to position"
      >
        <AnimatedProgress fraction={progressFraction} isPlaying={isPlaying} height={6} />
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
          onPress={error ? reset : togglePlayback}
          style={{ height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: 28, backgroundColor: error ? M.error : M.accent }}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={error ? "Dismiss audio error" : isPlaying ? "Pause audio" : "Play audio"}
          accessibilityState={{ busy: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={M.ink} />
          ) : (
            <IconSymbol name={error ? "xmark" : isPlaying ? "pause.fill" : "play.fill"} size={28} color={M.ink} />
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

        <Pressable
          onPress={reset}
          hitSlop={8}
          style={{ minWidth: 40, alignItems: "center" }}
          accessibilityRole="button"
          accessibilityLabel="Remove track"
          accessibilityHint="Stops playback and clears the player"
        >
          <IconSymbol name="xmark" size={22} color={M.sub} />
        </Pressable>
      </View>
    </View>
  );
}
