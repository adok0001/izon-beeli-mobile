import { EASE_OUT } from "@/constants/motion";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type MuseumTheme, useMuseumTheme } from "@/lib/use-museum-theme";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const ICON = 16;
const PARTICLE_COUNT = 6;
const PARTICLE_SIZE = 5;
const BURST_RADIUS = 22;
// Even spokes around the heart — the burst radiates symmetrically.
const ANGLES = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => (i / PARTICLE_COUNT) * Math.PI * 2
);

/** One dot of the burst — flies out along `angle`, blooms, then fades. */
function Particle({
  angle,
  progress,
  color,
}: {
  angle: number;
  progress: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const dist = interpolate(p, [0, 1], [0, BURST_RADIUS]);
    return {
      opacity: interpolate(p, [0, 0.1, 0.7, 1], [0, 1, 0.9, 0]),
      transform: [
        { translateX: Math.cos(angle) * dist },
        { translateY: Math.sin(angle) * dist },
        { scale: interpolate(p, [0, 0.25, 1], [0.4, 1, 0.3]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: color }, style]}
    />
  );
}

/** Drives the like/un-like spell: heart spring + one-shot particle burst. */
function useLikeSpell(reduceMotion: boolean) {
  const scale = useSharedValue(1);
  const burst = useSharedValue(0);

  const fireLike = useCallback(() => {
    if (reduceMotion) return;
    // Pop from nothing — the overshooting spring peaks near 1.3 then settles.
    scale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1, { damping: 8, stiffness: 220, mass: 0.6 })
    );
    // Reset to 0 first so a repeat like re-runs (a 1→1 tween is a no-op).
    burst.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: 420, easing: EASE_OUT })
    );
  }, [reduceMotion, scale, burst]);

  const fireUnlike = useCallback(() => {
    if (reduceMotion) return;
    scale.value = withSequence(
      withTiming(0.8, { duration: 90 }),
      withSpring(1, { damping: 14, stiffness: 240 })
    );
  }, [reduceMotion, scale]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { burst, fireLike, fireUnlike, heartStyle };
}

export function LikeButton({
  liked,
  count,
  onToggle,
}: Readonly<{
  liked: boolean;
  count: number;
  onToggle: () => void;
}>) {
  const M: MuseumTheme = useMuseumTheme();
  const reduceMotion = useReducedMotion();
  const spell = useLikeSpell(reduceMotion);

  const handlePress = useCallback(() => {
    // Medium impact on every toggle — fires on iOS and Android, but not web.
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (liked) spell.fireUnlike();
    else spell.fireLike();
    onToggle();
  }, [liked, onToggle, spell]);

  return (
    <Pressable
      onPress={handlePress}
      style={styles.row}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={liked ? `Unlike, ${count}` : `Like, ${count}`}
    >
      <View style={styles.iconSlot}>
        <Animated.View style={spell.heartStyle}>
          <IconSymbol
            name={liked ? "heart.fill" : "heart"}
            size={ICON}
            color={liked ? M.accent : M.muted}
          />
        </Animated.View>
        {/* Burst overlay — never clipped, particles radiate from center. */}
        <View style={styles.burst} pointerEvents="none">
          <View style={styles.anchor}>
            {ANGLES.map((angle, i) => (
              <Particle
                key={i}
                angle={angle}
                progress={spell.burst}
                color={M.accent}
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={{ fontSize: 12, color: M.muted }}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  iconSlot: {
    width: ICON,
    height: ICON,
    alignItems: "center",
    justifyContent: "center",
  },
  burst: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  anchor: {
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
    marginLeft: -PARTICLE_SIZE / 2,
    marginTop: -PARTICLE_SIZE / 2,
  },
});
