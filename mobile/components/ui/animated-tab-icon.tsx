import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ComponentProps, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type IconName = ComponentProps<typeof IconSymbol>["name"];

interface AnimatedTabIconProps {
  name: IconName;
  color: string;
  focused: boolean;
  size?: number;
}

/**
 * Tab bar icon that springs a quick scale pop the moment it becomes the
 * focused tab. Honors reduce-motion by skipping the bounce — the tint swap
 * alone signals selection. The wrapper is non-interactive so it never
 * swallows the underlying HapticTab press or shifts the tab bar layout.
 */
export function AnimatedTabIcon({ name, color, focused, size = 28 }: AnimatedTabIconProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!focused || reduceMotion) return;
    scale.value = withSequence(
      withTiming(1.18, { duration: 140 }),
      withSpring(1, { damping: 8, stiffness: 220, mass: 0.6 })
    );
  }, [focused, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View pointerEvents="none" style={style}>
      <IconSymbol size={size} name={name} color={color} />
    </Animated.View>
  );
}
