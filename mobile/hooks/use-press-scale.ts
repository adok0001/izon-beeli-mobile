import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface PressScaleOptions {
  /** How far the target shrinks while held (0.04 = 4%). */
  scale?: number;
  /** Resting opacity to press against — pass the caller's disabled opacity. */
  baseOpacity?: number;
}

/**
 * Tactile press-scale for any Pressable — the Museum default for CTAs. Spread
 * the handlers onto the Pressable and apply `style` to it (wrap in
 * `Animated.createAnimatedComponent(Pressable)`). The scale is skipped under
 * reduce-motion; the subtle press-dim stays so the tap still registers.
 */
export function usePressScale({ scale = 0.04, baseOpacity = 1 }: PressScaleOptions = {}) {
  const reduceMotion = useReducedMotion();
  const press = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    opacity: baseOpacity - press.value * 0.12,
    transform: [{ scale: 1 - press.value * (reduceMotion ? 0 : scale) }],
  }));

  const onPressIn = () => {
    press.value = withTiming(1, { duration: 90 });
  };
  const onPressOut = () => {
    press.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  return { onPressIn, onPressOut, style };
}
