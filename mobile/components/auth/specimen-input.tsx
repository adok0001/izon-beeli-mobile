import { type } from "@/constants/typography";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export interface SpecimenInputProps
  extends Pick<
    TextInputProps,
    | "value"
    | "onChangeText"
    | "placeholder"
    | "secureTextEntry"
    | "keyboardType"
    | "autoComplete"
    | "autoCapitalize"
    | "editable"
    | "onSubmitEditing"
    | "returnKeyType"
    | "autoFocus"
    | "maxLength"
    | "textAlign"
  > {
  label: string;
  /** Draws the underline in the error tone regardless of focus. */
  error?: boolean;
  hint?: string;
  hintTone?: "warning" | "error";
  /** Larger, letter-spaced digits — for OTP-style codes. */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Museum "specimen label" field: an overline caption above a bronze
 * underline, in place of a boxed SaaS input — the auth flow's own register,
 * distinct from the card-heavy treatment used through the rest of the app.
 */
export function SpecimenInput({
  label,
  error = false,
  hint,
  hintTone = "error",
  large = false,
  style,
  ...inputProps
}: SpecimenInputProps) {
  const M = useMuseumTheme();
  const [focused, setFocused] = useState(false);
  const lineHeight = useSharedValue(1.5);

  const tone = error ? M.error : focused ? M.accent : M.border;

  const lineStyle = useAnimatedStyle(() => ({ height: lineHeight.value }));

  return (
    <View style={[{ marginBottom: hint ? 20 : 18 }, style]}>
      <Text style={{ ...type.overline, color: focused ? M.accent : M.sub, marginBottom: 8 }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        {...inputProps}
        onFocus={() => {
          setFocused(true);
          lineHeight.value = withTiming(2.5, { duration: 160 });
        }}
        onBlur={() => {
          setFocused(false);
          lineHeight.value = withTiming(1.5, { duration: 160 });
        }}
        placeholderTextColor={M.muted}
        style={{
          paddingBottom: 10,
          fontSize: large ? 26 : 16,
          letterSpacing: large ? 6 : undefined,
          fontWeight: large ? "700" : "400",
          color: M.text,
        }}
      />
      <Animated.View style={[{ backgroundColor: tone, borderRadius: 1 }, lineStyle]} />
      {hint ? (
        <Text
          style={{
            fontSize: 11,
            color: hintTone === "warning" ? M.warning : M.error,
            marginTop: 6,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
