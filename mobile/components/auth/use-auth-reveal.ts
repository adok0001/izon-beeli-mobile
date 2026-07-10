import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

/**
 * Fade + rise used for the form beneath an AuthHeader. `delay` should land
 * after the header's own reveal (mascot → title → underline → subtitle)
 * so the whole screen reads as one sequence, not two competing animations.
 */
export function useAuthReveal(delay = 480) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
    y.value = withDelay(delay, withTiming(0, { duration: 380 }));
  }, [opacity, y, delay]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));
}
