import { IconSymbol } from "@/components/ui/icon-symbol";
import { type } from "@/constants/typography";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
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
    // iOS-only autofill hints: "oneTimeCode" is what surfaces an emailed code
    // in the QuickType bar, and "newPassword" triggers the strong-password
    // suggestion. autoComplete alone covers Android.
    | "textContentType"
  > {
  /** Overline caption above the field, and its accessible name. */
  label: string;
  /** Visible in-field hint, shown inside the box alongside the label above it. */
  placeholder: string;
  /** Draws the border in the error tone regardless of focus. */
  error?: boolean;
  hint?: string;
  hintTone?: "warning" | "error";
  /** Larger, letter-spaced, centered digits — for OTP-style codes. */
  large?: boolean;
  /** Forwarded to the inner TextInput, so a form can chain focus field to field. */
  ref?: Ref<TextInput>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Museum "filled field": an overline label above a bordered, filled box with
 * an inline placeholder — the underline "specimen label" register's border
 * moved off the baseline and onto a full box, with a placeholder added
 * alongside the label rather than replacing it.
 */
export function SpecimenInput({
  label,
  placeholder,
  error = false,
  hint,
  hintTone = "error",
  large = false,
  ref,
  style,
  secureTextEntry,
  ...inputProps
}: SpecimenInputProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const borderWidth = useSharedValue(1.5);

  const tone = error ? M.error : focused ? M.accent : M.inputBorder;

  const boxStyle = useAnimatedStyle(() => ({ borderWidth: borderWidth.value }));

  return (
    <View style={[{ marginBottom: hint ? 22 : 14 }, style]}>
      <Text style={{ ...type.overline, color: focused ? M.accent : M.sub, marginBottom: 6 }}>
        {label.toUpperCase()}
      </Text>
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: M.inputBg,
            borderColor: tone,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 13,
          },
          boxStyle,
        ]}
      >
        <TextInput
          {...inputProps}
          placeholder={placeholder}
          accessibilityLabel={label}
          secureTextEntry={secureTextEntry && !revealed}
          ref={ref}
          onFocus={() => {
            setFocused(true);
            borderWidth.value = withTiming(2, { duration: 160 });
          }}
          onBlur={() => {
            setFocused(false);
            borderWidth.value = withTiming(1.5, { duration: 160 });
          }}
          placeholderTextColor={M.inputPlaceholder}
          style={{
            flex: 1,
            fontSize: large ? 22 : 15,
            letterSpacing: large ? 4 : undefined,
            fontWeight: large ? "700" : "400",
            color: M.inputText,
          }}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={revealed ? t("auth.hidePassword") : t("auth.showPassword")}
            style={{ paddingLeft: 12 }}
          >
            <IconSymbol name={revealed ? "eye.slash" : "eye.fill"} size={20} color={M.sub} />
          </Pressable>
        ) : null}
      </Animated.View>
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
