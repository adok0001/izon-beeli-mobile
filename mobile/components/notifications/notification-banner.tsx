import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

type ToastType = "success" | "error" | "info" | "warning";

interface Props {
  title: string;
  body: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  type?: ToastType;
}

const TYPE_CLASSES: Record<ToastType, { bar: string; bg: string }> = {
  success: { bar: "bg-emerald-500", bg: "bg-white dark:bg-neutral-800" },
  error:   { bar: "bg-red-500",     bg: "bg-white dark:bg-neutral-800" },
  warning: { bar: "bg-amber-500",   bg: "bg-white dark:bg-neutral-800" },
  info:    { bar: "bg-blue-500",    bg: "bg-white dark:bg-neutral-800" },
};

export function NotificationBanner({
  title,
  body,
  visible,
  onDismiss,
  duration = 4000,
  type = "info",
}: Props) {
  const translateY = useSharedValue(-100);
  const { bar, bg } = TYPE_CLASSES[type];

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
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
        className={`overflow-hidden rounded-xl shadow-lg ${bg}`}
        style={{ elevation: 8 }}
      >
        <Animated.View className={`h-1 w-full ${bar}`} />
        <Animated.View className="px-4 py-3">
          <Text
            className="text-sm font-semibold text-neutral-900 dark:text-white"
            numberOfLines={1}
          >
            {title}
          </Text>
          {body ? (
            <Text
              className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400"
              numberOfLines={2}
            >
              {body}
            </Text>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
