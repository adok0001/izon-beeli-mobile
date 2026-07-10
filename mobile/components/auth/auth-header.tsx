import { type } from "@/constants/typography";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const mascot = require("../../public/mascot.jpg");

const MASCOT_SIZE = {
  hero: { width: 80, height: 54 },
  compact: { width: 56, height: 38 },
} as const;

export interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  /** "hero" for the true front door (sign in / sign up); "compact" for utility screens. */
  size?: "hero" | "compact";
}

/**
 * The same reveal grammar as BrandSplash — mascot spring-in, title drop,
 * a bronze underline that draws from the left, subtitle fade — carried into
 * every auth screen so the cold-start splash hands off into one continuous
 * entrance rather than being thrown away after 2.2s.
 */
export function AuthHeader({ title, subtitle, size = "hero" }: AuthHeaderProps) {
  const M = useMuseumTheme();

  const mascotO = useSharedValue(0);
  const mascotScale = useSharedValue(0.82);
  const titleO = useSharedValue(0);
  const titleY = useSharedValue(14);
  const lineX = useSharedValue(0);
  const subO = useSharedValue(0);

  useEffect(() => {
    mascotO.value = withTiming(1, { duration: 420 });
    mascotScale.value = withSpring(1, { damping: 14, stiffness: 140 });
    titleO.value = withDelay(160, withTiming(1, { duration: 380 }));
    titleY.value = withDelay(160, withSpring(0, { damping: 16, stiffness: 150 }));
    lineX.value = withDelay(340, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    subO.value = withDelay(420, withTiming(1, { duration: 380 }));
  }, [mascotO, mascotScale, titleO, titleY, lineX, subO]);

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotO.value,
    transform: [{ scale: mascotScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleO.value,
    transform: [{ translateY: titleY.value }],
  }));
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: lineX.value }] }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subO.value }));

  const mascotDims = MASCOT_SIZE[size];
  const titleType = size === "hero" ? type.display : type.h2;

  return (
    <View style={{ alignItems: "center", marginBottom: size === "hero" ? 36 : 28 }}>
      <Animated.View
        style={[
          {
            borderRadius: 20,
            padding: 3,
            borderWidth: 1,
            borderColor: M.accentBorder,
            marginBottom: size === "hero" ? 16 : 12,
          },
          mascotStyle,
        ]}
      >
        <Image
          source={mascot}
          style={{ width: mascotDims.width, height: mascotDims.height, borderRadius: 17 }}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.Text style={[{ ...titleType, color: M.text, textAlign: "center" }, titleStyle]}>
        {title}
      </Animated.Text>

      <View style={styles.lineTrack}>
        <Animated.View style={[styles.line, { backgroundColor: M.accent }, lineStyle]} />
      </View>

      {subtitle ? (
        <Animated.Text
          style={[{ fontSize: 13, color: M.sub, marginTop: 10, textAlign: "center" }, subStyle]}
        >
          {subtitle}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lineTrack: {
    marginTop: 10,
    width: 40,
    height: 2,
    alignItems: "flex-start",
  },
  line: {
    width: 40,
    height: 2,
    borderRadius: 1,
    transformOrigin: "left",
  },
});
