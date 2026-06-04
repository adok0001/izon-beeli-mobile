import { useHeaderHeight } from "@react-navigation/elements";
import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info" | "warning";

interface Props {
  title: string;
  body: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  type?: ToastType;
}

const TYPE_BAR_COLORS: Record<ToastType, string> = {
  success: "#22c55e",
  error:   "#ef4444",
  warning: "#f59e0b",
  info:    "#C4862A",
};

export function NotificationBanner({
  title,
  body,
  visible,
  onDismiss,
  duration = 4000,
  type = "info",
}: Props) {
  const M = useMuseumTheme();
  const barColor = TYPE_BAR_COLORS[type];
  const translateY = useSharedValue(-150);
  const headerHeight = useHeaderHeight();
  const { top: topInset } = useSafeAreaInsets();
  const topPosition = Math.max(headerHeight, topInset) + 8;

  useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(0, { duration: 300 }),
        withDelay(
          duration,
          withTiming(-100, { duration: 300 }, (finished) => {
            if (finished) runOnJS(onDismiss)();
          })
        )
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
          top: topPosition,
          left: 16,
          right: 16,
          zIndex: 999,
        },
      ]}
    >
      <Pressable
        onPress={onDismiss}
        style={{ overflow: "hidden", borderRadius: 12, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, elevation: 8 }}
      >
        <Animated.View style={{ height: 3, width: "100%", backgroundColor: barColor }} />
        <Animated.View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }} numberOfLines={1}>
            {title}
          </Text>
          {body ? (
            <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }} numberOfLines={2}>
              {body}
            </Text>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
