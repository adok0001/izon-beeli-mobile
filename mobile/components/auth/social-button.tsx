import { AppleMark, GoogleMark } from "@/components/auth/brand-marks";
import { fonts } from "@/constants/typography";
import { usePressScale } from "@/hooks/use-press-scale";
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SocialProvider = "google" | "apple";

export interface SocialButtonProps {
  provider: SocialProvider;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Both providers permit a white colourway, which is the only one legible on the
 * Museum's near-black auth background (Apple's black button and Google's #131314
 * button would both sink into #0D0F1A). Colours are hardcoded on purpose — the
 * usual "never hardcode hex" rule assumes a token can flex with the theme, but
 * these are fixed by Google's and Apple's brand guidelines and must render
 * identically in light and dark. Geometry still tracks the Button primitive so
 * these sit in the same rhythm as the rest of the flow.
 */
const BRAND = {
  google: { bg: "#FFFFFF", border: "#DADCE0", text: "#1F1F1F" },
  apple: { bg: "#FFFFFF", border: "#FFFFFF", text: "#000000" },
} as const;

export function SocialButton({
  provider,
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
}: SocialButtonProps) {
  const isDisabled = disabled || loading;
  const pressScale = usePressScale({ baseOpacity: isDisabled ? 0.5 : 1 });
  const c = BRAND[provider];

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
          gap: 10,
          borderRadius: 14,
          borderWidth: 1.5,
          // Apple requires a 44pt minimum target; this lands at ~48.
          paddingVertical: 14,
          paddingHorizontal: 20,
          backgroundColor: c.bg,
          borderColor: c.border,
          alignSelf: "stretch",
        },
        pressScale.style,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={c.text} />
      ) : (
        <>
          {provider === "google" ? (
            <GoogleMark size={18} />
          ) : (
            // The Apple glyph's bounding box is bottom-heavy, so centring it on
            // the box leaves it sitting visibly low against the cap height.
            <View style={{ marginTop: -2 }}>
              <AppleMark size={18} color={c.text} />
            </View>
          )}
          <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: c.text }}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}
