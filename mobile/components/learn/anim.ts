import { useEffect, useRef } from "react";
import { Animated } from "react-native";

/** Staggered fade/slide-in for `count` elements, started once on mount. */
export function useMountAnimation(count = 1, stagger = 80) {
  const anims = useRef(
    Array.from({ length: count }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.stagger(
      stagger,
      anims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })
      )
    ).start();
  }, []);

  return anims;
}

/** Opacity + upward translate driven by a 0→1 animated value. */
export function animStyle(anim: Animated.Value, offsetY = 18) {
  return {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [offsetY, 0],
        }),
      },
    ],
  };
}
