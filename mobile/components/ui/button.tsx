import { fonts } from "@/constants/typography";
import { usePressScale } from "@/hooks/use-press-scale";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Optional leading element (icon). */
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 },
  md: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 17 },
};

/**
 * Museum button primitive. Consolidates the accent / secondary / ghost button
 * patterns that were re-implemented inline across quiz, matching-game, lesson,
 * onboarding, etc. Theme-driven and dark-safe.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const M = useMuseumTheme();
  const s = SIZES[size];
  const isDisabled = disabled || loading;
  const pressScale = usePressScale({ baseOpacity: isDisabled ? 0.5 : 1 });

  const palette: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
    primary:   { bg: M.accent,       border: M.accent,       text: "#1A1520" },
    secondary: { bg: M.card,         border: M.border,       text: M.text },
    ghost:     { bg: "transparent",  border: "transparent",  text: M.accent },
    danger:    { bg: M.errorBg,      border: M.errorBorder,  text: M.error },
  };
  const c = palette[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={isDisabled ? undefined : pressScale.onPressIn}
      onPressOut={pressScale.onPressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 14,
          borderWidth: 1.5,
          backgroundColor: c.bg,
          borderColor: c.border,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        pressScale.style,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={c.text} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text style={{ fontFamily: fonts.heading, fontSize: s.fontSize, color: c.text }}>
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
