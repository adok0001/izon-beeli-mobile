import { useEffect } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useMuseumTheme } from "@/lib/use-museum-theme";

/**
 * The listening spell. The bronze fill glides between store position updates
 * instead of snapping (a short linear timing that tracks real playback), and a
 * soft play-head glow breathes while playing — settling flat when paused. The
 * fill is pixel-width animated off a measured container so the leading glow can
 * simply ride the fill's right edge; reduce-motion keeps the glide, drops the pulse.
 */
export function AnimatedProgress({
  fraction,
  isPlaying,
  height,
}: {
  fraction: number;
  isPlaying: boolean;
  height: number;
}) {
  const M = useMuseumTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(Math.max(0, Math.min(1, fraction)));
  const containerW = useSharedValue(0);
  const pulse = useSharedValue(0);
  const dot = height * 2.4;

  // Glide toward each new store position rather than snapping on every update.
  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, fraction));
    progress.value = withTiming(clamped, { duration: 250, easing: Easing.linear });
  }, [fraction, progress]);

  // Breathe the play head while playing; settle still when paused or reduced.
  useEffect(() => {
    if (isPlaying && !reduceMotion) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(0, { duration: 320 });
    }
  }, [isPlaying, reduceMotion, pulse]);

  const fillStyle = useAnimatedStyle(() => ({
    width: progress.value * containerW.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value * 0.9,
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.85, 1.25]) }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    containerW.value = e.nativeEvent.layout.width;
  };

  return (
    <View
      onLayout={onLayout}
      style={{ height, borderRadius: 999, backgroundColor: M.border, overflow: "visible" }}
    >
      <Animated.View style={[{ height, borderRadius: 999, backgroundColor: M.accent }, fillStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              right: -dot / 2,
              top: (height - dot) / 2,
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: M.accent,
              shadowColor: M.accent,
              shadowOpacity: 0.8,
              shadowRadius: dot / 2,
              shadowOffset: { width: 0, height: 0 },
            },
            dotStyle,
          ]}
        />
      </Animated.View>
    </View>
  );
}
