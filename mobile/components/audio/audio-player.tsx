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
import { useAudioStore } from "@/store/audio-store";
import { formatDuration } from "@/lib/mock-data";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export function AudioPlayer({ compact = false, position = "bottom", onPress }: { compact?: boolean; position?: "top" | "bottom"; onPress?: () => void }) {
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

  if (compact) {
    return (
      <View className={`bg-white px-4 py-2 dark:bg-neutral-900 ${position === "top" ? "border-b border-neutral-200 dark:border-neutral-700" : "border-t border-neutral-200 dark:border-neutral-700"}`}>
        <View className="flex-row items-center">
          <Pressable
            onPress={togglePlayback}
            className="mr-3"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
            accessibilityState={{ busy: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <IconSymbol
                name={isPlaying ? "pause.fill" : "play.fill"}
                size={24}
                color="#3b82f6"
              />
            )}
          </Pressable>
          <View className="flex-1">
            <Pressable
              onPress={onPress}
              disabled={!onPress}
              accessibilityRole="button"
              accessibilityLabel={currentTrackTitle ?? "Now Playing"}
              accessibilityHint="Open lesson"
            >
              <Text
                className="text-sm font-medium text-neutral-900 dark:text-white"
                numberOfLines={1}
              >
                {currentTrackTitle ?? "Now Playing"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSeek}
              onLayout={onBarLayout}
              className="mt-1 py-1"
              accessibilityRole="adjustable"
              accessibilityLabel="Seek audio"
              accessibilityHint="Tap to seek to position"
            >
              <View className="h-1 rounded-full bg-neutral-200 dark:bg-neutral-700">
                <View
                  className="h-1 rounded-full bg-blue-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
            </Pressable>
          </View>
          <Text className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
            {formatDuration(progress)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="border-t border-neutral-200 bg-white px-4 pb-6 pt-4 dark:border-neutral-700 dark:bg-neutral-900">
      {/* Track title */}
      <Text
        className="mb-3 text-center text-base font-semibold text-neutral-900 dark:text-white"
        numberOfLines={1}
      >
        {currentTrackTitle ?? "Now Playing"}
      </Text>

      {/* Progress bar */}
      <Pressable
        onPress={handleSeek}
        className="py-2"
        onLayout={onBarLayout}
        accessibilityRole="adjustable"
        accessibilityLabel={`Audio progress, ${formatDuration(progress)} of ${formatDuration(duration)}`}
        accessibilityHint="Tap to seek to position"
      >
        <View className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
          <View
            className="h-1.5 rounded-full bg-blue-500"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </Pressable>

      {/* Time labels */}
      <View className="mb-4 flex-row justify-between">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {formatDuration(progress)}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {formatDuration(duration)}
        </Text>
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-center gap-6">
        {/* Speed */}
        <Pressable
          onPress={cycleSpeed}
          hitSlop={8}
          className="min-w-[40px] items-center"
          accessibilityRole="button"
          accessibilityLabel={`Playback speed: ${playbackSpeed}x`}
          accessibilityHint="Tap to cycle through playback speeds"
        >
          <Text className="text-sm font-bold text-blue-500">{playbackSpeed}x</Text>
        </Pressable>

        {/* Skip backward */}
        <Pressable
          onPress={() => skipBackward(10)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip back 10 seconds"
        >
          <IconSymbol name="backward.fill" size={28} color="#6b7280" />
        </Pressable>

        {/* Play/Pause */}
        <Pressable
          onPress={togglePlayback}
          className="h-14 w-14 items-center justify-center rounded-full bg-blue-500"
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
          accessibilityState={{ busy: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol
              name={isPlaying ? "pause.fill" : "play.fill"}
              size={28}
              color="#ffffff"
            />
          )}
        </Pressable>

        {/* Skip forward */}
        <Pressable
          onPress={() => skipForward(10)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip forward 10 seconds"
        >
          <IconSymbol name="forward.fill" size={28} color="#6b7280" />
        </Pressable>

        {/* Spacer to balance speed button */}
        <View className="min-w-[40px]" />
      </View>
    </View>
  );
}
