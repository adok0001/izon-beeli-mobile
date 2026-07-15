import { CHECK_LEN, CHECK_PATH, EASE_OUT } from "@/constants/motion";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { hapticTap } from "@/lib/haptics";
import { type MuseumTheme, useMuseumTheme } from "@/lib/use-museum-theme";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** When the gild hands off to the summary — the check has just landed. */
const HANDOFF_MS = 480;

/** The gild-into-a-checkmark choreography for the Mark-complete button. */
function useGildComplete(M: MuseumTheme) {
  const gild = useSharedValue(0);
  const fade = useSharedValue(1);
  const draw = useSharedValue(0);
  const pop = useSharedValue(1);
  const glow = useSharedValue(0);
  const cardW = useSharedValue(0);

  const run = () => {
    pop.value = withSequence(
      withTiming(1.03, { duration: 110, easing: EASE_OUT }),
      withSpring(1, { damping: 10, stiffness: 180 })
    );
    gild.value = withTiming(1, { duration: 520, easing: EASE_OUT });
    fade.value = withDelay(120, withTiming(0, { duration: 180 }));
    draw.value = withDelay(240, withTiming(1, { duration: 360, easing: EASE_OUT }));
    glow.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0.4, { duration: 520 })
    );
  };

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
    shadowColor: M.accent,
    shadowOpacity: glow.value * 0.5,
    shadowRadius: 6 + glow.value * 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: glow.value * 8,
  }));
  const gildStyle = useAnimatedStyle(() => ({ width: cardW.value * gild.value }));
  const gildInnerStyle = useAnimatedStyle(() => ({ width: cardW.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - draw.value) * CHECK_LEN,
  }));

  return { run, cardW, wrapStyle, gildStyle, gildInnerStyle, contentStyle, checkProps };
}

/**
 * Secondary "Mark complete" CTA. On tap it gilds gold left→right, dissolves its
 * label, and stroke-draws a checkmark before handing off to `onComplete` (which
 * carries the heavy haptic, finish sound, and summary hand-off).
 */
export function MarkCompleteButton({
  label,
  onComplete,
}: {
  label: string;
  onComplete: () => void;
}) {
  const M = useMuseumTheme();
  const reduceMotion = useReducedMotion();
  const [completing, setCompleting] = useState(false);
  const a = useGildComplete(M);
  const handoff = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (handoff.current) clearTimeout(handoff.current); }, []);

  const handlePress = () => {
    if (completing) return;
    setCompleting(true);
    hapticTap();
    if (reduceMotion) {
      onComplete();
      return;
    }
    a.run();
    handoff.current = setTimeout(onComplete, HANDOFF_MS);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={completing}
      style={styles.press}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: completing }}
    >
      <Animated.View style={[styles.wrap, a.wrapStyle]}>
        <Animated.View
          style={[styles.btn, { borderColor: M.successBorder, backgroundColor: M.successBg }]}
          onLayout={(e) => { a.cardW.value = e.nativeEvent.layout.width; }}
        >
          {/* Gold gilding sweep — clipped to the button, revealed left→right. */}
          {completing && (
            <Animated.View style={[styles.gild, a.gildStyle]} pointerEvents="none">
              <Animated.View style={[styles.gildInner, a.gildInnerStyle]}>
                <LinearGradient
                  colors={[M.accentLight, "#E7B65B", M.accent]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>
          )}

          <Animated.View style={[styles.row, a.contentStyle]}>
            <IconSymbol name="checkmark.circle.fill" size={14} color={M.success} />
            <Animated.Text style={{ fontSize: 13, fontWeight: "700", color: M.success }}>
              {label}
            </Animated.Text>
          </Animated.View>

          {/* The checkmark that draws itself onto the gilded surface. */}
          {completing && (
            <Animated.View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                <AnimatedPath
                  d={CHECK_PATH}
                  stroke={M.parchment}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={CHECK_LEN}
                  animatedProps={a.checkProps}
                />
              </Svg>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { marginTop: 10 },
  wrap: { borderRadius: 14 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  gild: { position: "absolute", left: 0, top: 0, bottom: 0, overflow: "hidden" },
  gildInner: { position: "absolute", left: 0, top: 0, bottom: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 7 },
  center: { alignItems: "center", justifyContent: "center" },
});
