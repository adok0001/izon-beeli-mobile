import { useEffect } from "react";
import { Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";

interface Props {
  title: string;
  body: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function NotificationBanner({
  title,
  body,
  visible,
  onDismiss,
  duration = 5000,
}: Props) {
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      // Auto-dismiss
      translateY.value = withDelay(
        duration,
        withTiming(-100, { duration: 300 }, (finished) => {
          if (finished) runOnJS(onDismiss)();
        })
      );
    } else {
      translateY.value = withTiming(-100, { duration: 300 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: "absolute",
          top: 50,
          left: 16,
          right: 16,
          zIndex: 999,
        },
      ]}
    >
      <Pressable
        onPress={onDismiss}
        className="rounded-xl bg-white px-4 py-3 shadow-lg dark:bg-neutral-800"
        style={{ elevation: 8 }}
      >
        <Text
          className="text-sm font-semibold text-neutral-900 dark:text-white"
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400"
          numberOfLines={2}
        >
          {body}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
