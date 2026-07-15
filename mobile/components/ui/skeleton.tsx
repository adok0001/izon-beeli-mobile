import { bronze, glass, useMuseumTheme } from "@/lib/use-museum-theme";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import {
  type DimensionValue,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SkeletonProps {
  /** Any RN dimension — number of px or a percentage string. Defaults to full width. */
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A branded loading placeholder: a rounded Museum-card surface with a highlight
 * that sweeps left→right. The sweep band is measured to the block's own width
 * (via onLayout → shared value) and moved with `translateX` only, so it clips
 * cleanly under `overflow: hidden` on Fabric — no percentage offsets.
 * Honors reduce-motion by rendering a static surface.
 */
export function Skeleton({ width = "100%", height = 16, radius = 8, style }: SkeletonProps) {
  const M = useMuseumTheme();
  const reduceMotion = useReducedMotion();
  const w = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [reduceMotion, progress]);

  // Band spans one block-width and travels from fully off-left to fully off-right.
  const sweepStyle = useAnimatedStyle(() => ({
    width: w.value,
    transform: [{ translateX: -w.value + progress.value * w.value * 2 }],
  }));

  const highlight = M.isDark ? glass(0.13) : bronze(0.09);

  return (
    <View
      onLayout={(e) => {
        w.value = e.nativeEvent.layout.width;
      }}
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.border,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {!reduceMotion && (
        <Animated.View style={[styles.sweep, sweepStyle]}>
          <LinearGradient
            colors={[glass(0), highlight, glass(0)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

/** Minimal vertical stack so several Skeletons read as one crafted block. */
export function SkeletonGroup({ children, gap = 12, style }: SkeletonGroupProps) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  sweep: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
});
