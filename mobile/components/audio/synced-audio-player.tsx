import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { JOURNEY } from "@/lib/journey";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { formatDuration } from "@/lib/mock-data";
import { getCachedAudioSource } from "@/lib/audio-cache";
import { useAudioStore } from "@/store/audio-store";
import { hapticTap } from "@/lib/haptics";
import type { AudioSource } from "@/types";

/** Cycling playback speeds, in the order the design specifies. */
const SPEED_CYCLE = [1, 1.25, 1.5, 0.75] as const;
const BAR_COUNT = 44;

interface Props {
  trackId: string;
  source: AudioSource;
  title?: string;
  route?: string;
  onFinish?: () => void;
}

/** Deterministic pseudo-waveform so the bars look organic but never reflow. */
function barHeights(): number[] {
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const wave = Math.sin(i * 0.9) * 0.5 + Math.sin(i * 0.37 + 1.5) * 0.5;
    out.push(0.32 + (wave + 1) / 2 * 0.68);
  }
  return out;
}

export function SyncedAudioPlayer({ trackId, source, title, route, onFinish }: Props) {
  const M = useMuseumTheme();
  const {
    loadAndPlay,
    togglePlayback,
    seekTo,
    skipBackward,
    setSpeed,
    isPlaying,
    isLoading,
    currentTrackId,
    progress,
    duration,
    playbackSpeed,
    error,
    reset,
  } = useAudioStore();

  const isCurrent = currentTrackId === trackId;
  const pos = isCurrent ? progress : 0;
  const dur = isCurrent ? duration : 0;

  const [dragFrac, setDragFrac] = useState<number | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const widthRef = useRef(0);
  const durRef = useRef(0);
  durRef.current = dur;

  const bars = useMemo(barHeights, []);
  const playedFrac = dragFrac ?? (dur > 0 ? Math.min(1, pos / dur) : 0);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  };

  const seekToX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0 || durRef.current <= 0) return;
    const frac = Math.max(0, Math.min(1, x / w));
    setDragFrac(frac);
    seekTo(frac * durRef.current);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => seekToX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => seekToX(e.nativeEvent.locationX),
      onPanResponderRelease: () => setDragFrac(null),
      onPanResponderTerminate: () => setDragFrac(null),
    })
  ).current;

  const handlePlayPause = async () => {
    hapticTap();
    if (error) {
      reset();
      return;
    }
    if (isCurrent) {
      togglePlayback();
      return;
    }
    setIsResolving(true);
    const resolved = await getCachedAudioSource(trackId, source);
    setIsResolving(false);
    loadAndPlay(trackId, resolved ?? source, title, route, { onFinish });
  };

  const cycleSpeed = () => {
    hapticTap();
    const i = SPEED_CYCLE.indexOf(playbackSpeed as (typeof SPEED_CYCLE)[number]);
    setSpeed(SPEED_CYCLE[(i + 1) % SPEED_CYCLE.length]);
  };

  const filledBars = Math.round(playedFrac * BAR_COUNT);

  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: JOURNEY.hairline,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 16,
        shadowColor: JOURNEY.sheetTitle,
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      }}
    >
      {/* Waveform scrubber */}
      <View
        {...pan.panHandlers}
        onLayout={onTrackLayout}
        style={{ flexDirection: "row", alignItems: "center", height: 56, gap: 3 }}
        accessibilityRole="adjustable"
        accessibilityLabel="Audio scrubber"
        accessibilityValue={{ now: Math.round(playedFrac * 100), min: 0, max: 100 }}
      >
        {bars.map((h, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: `${h * 100}%`,
              borderRadius: 999,
              backgroundColor: i < filledBars ? JOURNEY.bronzeMid : JOURNEY.trackEmpty,
            }}
          />
        ))}
      </View>

      {/* Time row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6, marginBottom: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: JOURNEY.capLocked, fontVariant: ["tabular-nums"] }}>
          {formatDuration(pos)}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: "600", color: JOURNEY.capLocked, fontVariant: ["tabular-nums"] }}>
          {dur > 0 ? formatDuration(dur) : "--:--"}
        </Text>
      </View>

      {error ? (
        <Text style={{ textAlign: "center", fontSize: 12, color: M.error, marginBottom: 12 }}>{error}</Text>
      ) : null}

      {/* Controls */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28 }}>
        {/* Speed */}
        <Pressable
          onPress={cycleSpeed}
          hitSlop={10}
          style={{ minWidth: 52, alignItems: "center" }}
          accessibilityRole="button"
          accessibilityLabel={`Playback speed ${playbackSpeed}×`}
        >
          <Text style={{ fontSize: 15, fontWeight: "800", color: JOURNEY.bronze }}>{playbackSpeed}×</Text>
        </Pressable>

        {/* −5s replay */}
        <Pressable
          onPress={() => {
            hapticTap();
            skipBackward(5);
          }}
          hitSlop={10}
          disabled={!isCurrent}
          style={{ alignItems: "center", justifyContent: "center", opacity: isCurrent ? 1 : 0.4 }}
          accessibilityRole="button"
          accessibilityLabel="Replay 5 seconds"
        >
          <IconSymbol name="gobackward.5" size={30} color={JOURNEY.sheetTitle} />
        </Pressable>

        {/* Play / pause */}
        <Pressable
          onPress={handlePlayPause}
          style={{
            height: 60,
            width: 60,
            borderRadius: 30,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: error ? M.error : JOURNEY.bronze,
            shadowColor: JOURNEY.bronze,
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }}
          accessibilityRole="button"
          accessibilityLabel={error ? "Dismiss error" : isPlaying && isCurrent ? "Pause" : "Play"}
          accessibilityState={{ busy: isResolving || (isLoading && isCurrent) }}
        >
          {isResolving || (isLoading && isCurrent) ? (
            <ActivityIndicator color={JOURNEY.sheetBg} />
          ) : (
            <IconSymbol
              name={error ? "xmark" : isPlaying && isCurrent ? "pause.fill" : "play.fill"}
              size={26}
              color={JOURNEY.sheetBg}
            />
          )}
        </Pressable>

        {/* +10s skip — balances the layout and complements the −5s replay */}
        <Pressable
          onPress={() => {
            hapticTap();
            useAudioStore.getState().skipForward(10);
          }}
          hitSlop={10}
          disabled={!isCurrent}
          style={{ alignItems: "center", justifyContent: "center", opacity: isCurrent ? 1 : 0.4 }}
          accessibilityRole="button"
          accessibilityLabel="Skip forward 10 seconds"
        >
          <IconSymbol name="goforward.10" size={30} color={JOURNEY.sheetTitle} />
        </Pressable>

        {/* Spacer to mirror the speed control width and keep the cluster centered */}
        <View style={{ minWidth: 52 }} />
      </View>
    </View>
  );
}
