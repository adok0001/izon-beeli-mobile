import { CHECK_LEN, CHECK_PATH, EASE_OUT } from "@/constants/motion";
import { type MuseumTheme, useMuseumTheme } from "@/lib/use-museum-theme";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  type SharedValue,
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

export type OptionState = "default" | "correct" | "incorrect" | "dimmed";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// The cross is local to the verdict badge; the check + ease come from the shared
// motion constants. Dash length runs slightly long so the mark hides fully.
const CROSS_PATH = "M6 6 L18 18 M18 6 L6 18";
const CROSS_LEN = 36;

const BADGE = 24;

/** The trailing verdict badge — a stroke that draws itself into a ring. */
function VerdictBadge({
  kind,
  draw,
  pop,
  color,
}: {
  kind: "check" | "cross";
  draw: SharedValue<number>;
  pop: SharedValue<number>;
  color: string;
}) {
  const len = kind === "check" ? CHECK_LEN : CROSS_LEN;
  const path = kind === "check" ? CHECK_PATH : CROSS_PATH;

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.4 + pop.value * 0.6 }],
  }));

  const strokeProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - draw.value) * len,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          width: BADGE,
          height: BADGE,
          borderRadius: BADGE / 2,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
          borderColor: color,
        },
        badgeStyle,
      ]}
    >
      <Svg width={BADGE} height={BADGE} viewBox="0 0 24 24" fill="none">
        <AnimatedPath
          d={path}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={len}
          animatedProps={strokeProps}
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * Drives every beat of the answer-lock spell. Correct/incorrect are terminal
 * states, so the card only ever travels from its default look to one verdict
 * palette — no reverse transitions to handle.
 */
function useVerdictAnimation(state: OptionState, M: MuseumTheme) {
  const reduceMotion = useReducedMotion();
  const isCorrect = state === "correct";
  const isIncorrect = state === "incorrect";

  // Dimmed also-rans fade via opacity, so their text stays M.text.
  const restBg = isCorrect ? M.successBg : isIncorrect ? M.errorBg : M.card;
  const restBorder = isCorrect ? M.success : isIncorrect ? M.error : M.border;
  const restText = isCorrect ? M.success : isIncorrect ? M.error : M.text;

  const reveal = useSharedValue(0); // default palette → verdict palette
  const pop = useSharedValue(1); // container spring pop on lock
  const press = useSharedValue(0); // tactile press-in while selectable
  const shake = useSharedValue(0); // horizontal shake for a wrong answer
  const flash = useSharedValue(0); // red flash overlay for a wrong answer
  const glow = useSharedValue(0); // bronze glow settling behind a correct card
  const gild = useSharedValue(0); // gold sweep reveal for a correct card
  const badge = useSharedValue(0); // trailing verdict badge scale-in
  const draw = useSharedValue(0); // stroke-draw progress of the mark
  const dim = useSharedValue(1); // opacity for the dimmed also-rans
  const cardW = useSharedValue(0);

  useEffect(() => {
    // Only the also-rans dim; every other state stays at its initial opacity,
    // so non-dimmed cards never run a no-op 1→1 animation.
    if (state === "dimmed") dim.value = withTiming(0.45, { duration: 260 });

    if (state !== "correct" && state !== "incorrect") {
      // Returned to a neutral state — reverse any verdict visuals so a card
      // that briefly rendered a verdict (e.g. an echo frame on question change)
      // never keeps its glow or tint. Guarded so a fresh default mount is a no-op.
      if (reveal.value !== 0 || glow.value !== 0) {
        reveal.value = withTiming(0, { duration: 200 });
        glow.value = withTiming(0, { duration: 200 });
        gild.value = 0;
        badge.value = 0;
        draw.value = 0;
      }
      return;
    }

    if (reduceMotion) {
      // Honor reduce-motion: land on the final look, no travel.
      reveal.value = 1;
      if (isCorrect) gild.value = 1;
      badge.value = 1;
      draw.value = 1;
      return;
    }

    reveal.value = withTiming(1, { duration: 380, easing: EASE_OUT });
    pop.value = withSequence(
      withTiming(1.05, { duration: 130, easing: EASE_OUT }),
      withSpring(1, { damping: 9, stiffness: 190, mass: 0.6 })
    );
    badge.value = withDelay(160, withSpring(1, { damping: 11, stiffness: 200 }));
    draw.value = withDelay(220, withTiming(1, { duration: 420, easing: EASE_OUT }));

    if (isCorrect) {
      // The gilding: liquid gold sweeps L→R, then dissolves into the
      // correct-green rest state, leaving a soft bronze glow behind.
      gild.value = withTiming(1, { duration: 620, easing: EASE_OUT });
      glow.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.32, { duration: 640 })
      );
    } else {
      // The rejection: a tight shake and a red flash that settles.
      shake.value = withSequence(
        withTiming(-6, { duration: 55 }),
        withTiming(6, { duration: 55 }),
        withTiming(-5, { duration: 55 }),
        withTiming(4, { duration: 55 }),
        withTiming(0, { duration: 55 })
      );
      flash.value = withSequence(
        withTiming(1, { duration: 110 }),
        withTiming(0, { duration: 420 })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const wrapperStyle = useAnimatedStyle(() => {
    const glowV = glow.value;
    return {
      opacity: dim.value,
      transform: [
        { translateX: shake.value },
        { scale: pop.value * (1 - press.value * 0.03) },
      ],
      shadowColor: M.accent,
      shadowOpacity: glowV * 0.5,
      shadowRadius: 6 + glowV * 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: glowV * 8,
    };
  });

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(reveal.value, [0, 1], [M.card, restBg]),
    borderColor: interpolateColor(reveal.value, [0, 1], [M.border, restBorder]),
  }));

  const gildStyle = useAnimatedStyle(() => ({
    width: cardW.value * interpolate(gild.value, [0, 0.6, 1], [0, 1, 1], "clamp"),
    opacity: interpolate(gild.value, [0, 0.55, 1], [0.9, 0.9, 0.14], "clamp"),
  }));

  // The gradient renders at full card width so the clip above reveals it
  // left→right instead of stretching it.
  const gildInnerStyle = useAnimatedStyle(() => ({ width: cardW.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.55 }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(reveal.value, [0, 1], [M.text, restText]),
  }));

  return {
    reduceMotion,
    press,
    cardW,
    badge,
    draw,
    wrapperStyle,
    cardStyle,
    gildStyle,
    gildInnerStyle,
    flashStyle,
    textStyle,
  };
}

export function OptionCard({
  label,
  state,
  onPress,
}: {
  label: string;
  state: OptionState;
  onPress: () => void;
}) {
  const M = useMuseumTheme();
  const isCorrect = state === "correct";
  const isIncorrect = state === "incorrect";
  const a = useVerdictAnimation(state, M);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (state === "default" && !a.reduceMotion)
          a.press.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        a.press.value = withTiming(0, { duration: 160 });
      }}
      disabled={state !== "default"}
      accessibilityRole="button"
      accessibilityLabel={
        isCorrect ? `${label}, correct` : isIncorrect ? `${label}, incorrect` : label
      }
      accessibilityHint={state === "default" ? "Tap to select this answer" : undefined}
      accessibilityState={{ disabled: state !== "default", selected: isCorrect || isIncorrect }}
    >
      <Animated.View style={[styles.wrapper, a.wrapperStyle]}>
        <Animated.View
          style={[styles.card, a.cardStyle]}
          onLayout={(e) => {
            a.cardW.value = e.nativeEvent.layout.width;
          }}
        >
          {/* Gold gilding sweep — clipped to the card, revealed left→right. */}
          {isCorrect && (
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
          {/* Red rejection flash. */}
          {isIncorrect && (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: M.error }, a.flashStyle]}
            />
          )}

          <View style={styles.row}>
            <Animated.Text style={[styles.label, a.textStyle]}>{label}</Animated.Text>
            {(isCorrect || isIncorrect) && (
              <VerdictBadge
                kind={isCorrect ? "check" : "cross"}
                draw={a.draw}
                pop={a.badge}
                color={isCorrect ? M.success : M.error}
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 16,
    overflow: "hidden",
  },
  gild: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  gildInner: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});
