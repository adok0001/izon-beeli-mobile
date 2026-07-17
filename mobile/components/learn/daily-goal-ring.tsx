import { EASE_OUT } from "@/constants/motion";
import { bronze, type MuseumTheme, useMuseumTheme } from "@/lib/use-museum-theme";
import { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Challenges issued per day — see CHALLENGE_POOL slots on the server. */
export const GOAL_TARGET = 3;
const SIZE = 32;
const STROKE_WIDTH = 3;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Sweeps the arc to its target and, when the goal is met, gilds the ring: the
 * stroke settles to the completed (green) semantic while a bronze-gold glow and
 * scale bump pulse once and settle. Below 100% the arc stays the accent color.
 */
function useGoalRingAnimation(pct: number, M: MuseumTheme) {
  const reduceMotion = useReducedMotion();
  const isComplete = pct >= 1;

  const fill = useSharedValue(0); // 0→1 portion of the ring drawn
  const gild = useSharedValue(0); // 0→1 accent→completed stroke + gild gate
  const glow = useSharedValue(0); // bronze-gold shadow pulse behind the ring
  const pop = useSharedValue(1); // scale bump on completion

  useEffect(() => {
    if (reduceMotion) {
      // Honor reduce-motion: land on the finished look, no travel or pulse.
      fill.value = pct;
      gild.value = isComplete ? 1 : 0;
      glow.value = isComplete ? 0.4 : 0;
      return;
    }
    fill.value = withSpring(pct, { damping: 15, stiffness: 120, mass: 0.7 });
    gild.value = withTiming(isComplete ? 1 : 0, { duration: 420, easing: EASE_OUT });
    if (isComplete) {
      pop.value = withSequence(
        withTiming(1.12, { duration: 160, easing: EASE_OUT }),
        withSpring(1, { damping: 8, stiffness: 180, mass: 0.6 })
      );
      glow.value = withDelay(
        120,
        withSequence(withTiming(1, { duration: 220 }), withTiming(0.4, { duration: 640 }))
      );
    } else {
      glow.value = withTiming(0, { duration: 300 });
      pop.value = withTiming(1, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, reduceMotion]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - fill.value),
    stroke: interpolateColor(gild.value, [0, 1], [M.accent, M.success]),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
    shadowColor: M.accent,
    shadowOpacity: glow.value * 0.9,
    shadowRadius: 4 + glow.value * 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: glow.value * 8,
  }));

  return { arcProps, ringStyle };
}

/** Small circular progress ring showing today's completed challenges out of 3. */
export function DailyGoalRing({ completedToday }: { completedToday: number }) {
  const M = useMuseumTheme();
  const pct = Math.min(completedToday / GOAL_TARGET, 1);
  const { arcProps, ringStyle } = useGoalRingAnimation(pct, M);
  const color = pct >= 1 ? M.success : M.accent;

  return (
    <Animated.View
      style={[
        { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
        ringStyle,
      ]}
    >
      <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          stroke={bronze(0.38)} strokeWidth={STROKE_WIDTH} fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          strokeWidth={STROKE_WIDTH} fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeLinecap="round"
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
          animatedProps={arcProps}
        />
      </Svg>
      <Text style={{ fontSize: 8, fontWeight: "800", color }}>
        {completedToday}/{GOAL_TARGET}
      </Text>
    </Animated.View>
  );
}
