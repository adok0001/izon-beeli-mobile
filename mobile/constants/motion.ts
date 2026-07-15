import { Easing } from "react-native-reanimated";

/** The Museum "settle" curve — the decisive out-ease used across the spell system. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * A checkmark path inside a 24×24 box. `CHECK_LEN` is the stroke-dash length —
 * slightly longer than the path so it is fully hidden at offset = length and
 * fully drawn at offset = 0 (used with an animated `strokeDashoffset`).
 */
export const CHECK_PATH = "M5 13 L10 18 L20 7";
export const CHECK_LEN = 24;
