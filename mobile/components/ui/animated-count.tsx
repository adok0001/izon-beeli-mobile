import { EASE_OUT } from "@/constants/motion";
import { useEffect } from "react";
import { type StyleProp, TextInput, type TextStyle } from "react-native";
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// `text` isn't animatable by default — whitelist it so the tween stays on the
// UI thread (the same trick the rest of the spell system uses for native props).
Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCountProps {
  value: number;
  /** Roll duration in ms. */
  duration?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * A number that rolls up to `value` on mount (and whenever `value` changes) —
 * the "exhibit lights come on" beat for dashboard stats. Renders a non-editable
 * TextInput so the count stays on the UI thread; honors reduce-motion by landing
 * on the final value with no travel.
 */
export function AnimatedCount({ value, duration = 900, style }: AnimatedCountProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = value;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(value, { duration, easing: EASE_OUT });
  }, [value, duration, reduceMotion, progress]);

  const animatedProps = useAnimatedProps(() => {
    return { text: String(Math.round(progress.value)) } as never;
  });

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      defaultValue="0"
      animatedProps={animatedProps}
      style={[{ padding: 0, includeFontPadding: false } as TextStyle, style]}
      accessible
      accessibilityLabel={String(value)}
      pointerEvents="none"
    />
  );
}
