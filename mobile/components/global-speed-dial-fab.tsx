import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { hapticTap } from "@/lib/haptics";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useSpeedDialStore } from "@/store/speed-dial-store";
import { useTourStore } from "@/store/tour-store";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SPRING = { damping: 16, stiffness: 220 };

function DialAction({
  icon,
  label,
  color,
  index,
  progress,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const M = useMuseumTheme();

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 * (index + 1) }],
  }));

  return (
    <Animated.View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10, marginBottom: 12 }, style]}>
      <View
        style={{
          borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
          backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: M.text }}>{label}</Text>
      </View>
      <Pressable
        onPress={onPress}
        style={{
          width: 44, height: 44, borderRadius: 22,
          alignItems: "center", justifyContent: "center",
          backgroundColor: color,
          ...styles.shadow,
        }}
        className="active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <IconSymbol name={icon as never} size={19} color={M.ink} />
      </Pressable>
    </Animated.View>
  );
}

export function GlobalSpeedDialFab() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const activeTour = useTourStore((s) => s.activeTour);
  const open = useSpeedDialStore((s) => s.open);
  const setOpen = useSpeedDialStore((s) => s.setOpen);
  const progress = useSharedValue(0);

  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 45}deg` }],
  }));

  // Keep out of the way while a feature tour is highlighting UI.
  if (activeTour) return null;

  const toggle = () => {
    hapticTap();
    const next = !open;
    setOpen(next);
    progress.value = next
      ? withDelay(20, withSpring(1, SPRING))
      : withTiming(0, { duration: 140 });
  };

  const close = () => {
    setOpen(false);
    progress.value = withTiming(0, { duration: 140 });
  };

  const navigate = (route: string) => {
    close();
    router.push(route as never);
  };

  return (
    <>
      {open && (
        <Pressable
          onPress={close}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t("common.close")}
        />
      )}
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", right: 16, bottom: 72 + insets.bottom, zIndex: 50, alignItems: "flex-end" }}
      >
        {open && (
          <View pointerEvents="box-none">
            <DialAction
              icon="pencil.and.list.clipboard"
              label={t("tabs.journal")}
              color={getAccent("amber").solid}
              index={1}
              progress={progress}
              onPress={() => navigate("/journal")}
            />
            <DialAction
              icon="mic.fill"
              label={t("tabs.contribute")}
              color={M.accent}
              index={0}
              progress={progress}
              onPress={() => navigate("/contribute")}
            />
          </View>
        )}

        <Animated.View>
          <Pressable
            onPress={toggle}
            style={{
              width: 52, height: 52, borderRadius: 26,
              alignItems: "center", justifyContent: "center",
              backgroundColor: M.accent,
              ...styles.shadow,
            }}
            className="active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={t("speedDial.label")}
            accessibilityState={{ expanded: open }}
          >
            <Animated.View style={plusStyle}>
              <IconSymbol name="plus" size={24} color={M.ink} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});
