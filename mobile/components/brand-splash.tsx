import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { fonts } from "@/constants/typography";
import { useMuseumTheme } from "@/lib/use-museum-theme";

const mascot = require("../public/mascot.jpg");

// Animation timeline (ms). The whole reveal runs ~2.2s so the brand registers
// even when fonts/auth resolve instantly.
const MASCOT_IN = 100;
const WORDMARK_IN = 420;
const SUBTITLE_IN = 720;
const UNDERLINE_IN = 920;
const HOLD_UNTIL = 1620; // start fading the overlay out
const FADE_MS = 400;

interface BrandSplashProps {
  /** Called once the overlay has fully faded out — unmount it then. */
  onFinish: () => void;
}

/**
 * Full-screen brand reveal shown once per cold start, layered above the app.
 * Its ink background matches the native splash (app.json) so the OS-drawn
 * first frame hands off to this animation with no flash, then it fades to
 * reveal whatever screen resolved underneath (auth loading or the app).
 */
export function BrandSplash({ onFinish }: BrandSplashProps) {
  const M = useMuseumTheme();
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const nativeSplashHidden = useRef(false);

  // Lift the native splash only once this ink overlay has laid out, so the
  // overlay is already covering the screen when the native splash fades —
  // closing the white-root-view gap that otherwise flashes for one frame.
  const handleLayout = () => {
    if (nativeSplashHidden.current) return;
    nativeSplashHidden.current = true;
    void SplashScreen.hideAsync().catch(() => {});
  };

  const container = useSharedValue(1);
  const mascotO = useSharedValue(0);
  const mascotScale = useSharedValue(0.82);
  const wordO = useSharedValue(0);
  const wordY = useSharedValue(14);
  const subO = useSharedValue(0);
  const lineX = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((rm) => {
        if (!cancelled) setReduceMotion(rm);
      })
      // If the query rejects, fall back to the full animation rather than
      // leaving reduceMotion null forever — which would stall onFinish and
      // strand the app behind the overlay.
      .catch(() => {
        if (!cancelled) setReduceMotion(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return; // wait until we know the preference

    const fadeOut = () =>
      withTiming(0, { duration: FADE_MS, easing: Easing.in(Easing.ease) }, (done) => {
        if (done) runOnJS(onFinish)();
      });

    if (reduceMotion) {
      // Static frame, then fade — no staged motion.
      mascotO.value = 1;
      mascotScale.value = 1;
      wordO.value = 1;
      wordY.value = 0;
      subO.value = 1;
      lineX.value = 1;
      container.value = withDelay(1000, fadeOut());
      return;
    }

    mascotO.value = withDelay(MASCOT_IN, withTiming(1, { duration: 500 }));
    mascotScale.value = withDelay(MASCOT_IN, withSpring(1, { damping: 12, stiffness: 120 }));
    wordO.value = withDelay(WORDMARK_IN, withTiming(1, { duration: 450 }));
    wordY.value = withDelay(WORDMARK_IN, withSpring(0, { damping: 14, stiffness: 130 }));
    subO.value = withDelay(SUBTITLE_IN, withTiming(1, { duration: 450 }));
    lineX.value = withDelay(
      UNDERLINE_IN,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    container.value = withSequence(
      withDelay(HOLD_UNTIL, withTiming(1, { duration: 0 })),
      fadeOut(),
    );
  }, [reduceMotion, container, mascotO, mascotScale, wordO, wordY, subO, lineX, onFinish]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: container.value }));
  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotO.value,
    transform: [{ scale: mascotScale.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordO.value,
    transform: [{ translateY: wordY.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subO.value }));
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: lineX.value }] }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: M.ink }, containerStyle]}
      pointerEvents="none"
      onLayout={handleLayout}
    >
      <Animated.View style={mascotStyle}>
        <Image source={mascot} style={styles.mascot} contentFit="contain" />
      </Animated.View>
      <Animated.Text style={[styles.wordmark, { color: M.accent }, wordStyle]}>Beeli</Animated.Text>
      <View style={styles.lineTrack}>
        <Animated.View style={[styles.line, { backgroundColor: M.accent }, lineStyle]} />
      </View>
      <Animated.Text style={[styles.subtitle, { color: M.sub }, subStyle]}>
        Learn African Languages
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  mascot: {
    width: 120,
    height: 72,
  },
  wordmark: {
    marginTop: 20,
    fontFamily: fonts.heading,
    fontSize: 34,
    letterSpacing: -0.5,
  },
  lineTrack: {
    marginTop: 12,
    width: 56,
    height: 2,
    alignItems: "flex-start",
  },
  line: {
    width: 56,
    height: 2,
    borderRadius: 1,
    transformOrigin: "left",
  },
  subtitle: {
    marginTop: 14,
    fontSize: 14,
  },
});
