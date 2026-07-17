import { type } from "@/constants/typography";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

/** `accent` is a real navigational link; `quiet` is a de-emphasised escape hatch. */
export type AuthLinkTone = "accent" | "quiet";

export interface AuthLinkProps {
  label: string;
  /** Grey prose set before the link — the "Don't have an account?" half of a
   *  cross-link. Kept separate from `label` so only the call to action takes
   *  the accent, and so translators aren't forced to bury a CTA mid-sentence. */
  prompt?: string;
  /** Navigates via expo-router. Use `onPress` instead for in-place actions. */
  href?: Href;
  onPress?: () => void;
  tone?: AuthLinkTone;
  disabled?: boolean;
  align?: "center" | "end";
  style?: StyleProp<ViewStyle>;
}

/**
 * The one text-link treatment for the auth flow. These links had drifted into
 * nine different looks across six screens — sizes 12/13/14, in accent, sub,
 * text and muted, with a lone underline and a lone uppercase overline — which
 * left the sign-in/sign-up cross-links reading as grey caption text while the
 * guest opt-out shouted louder than either.
 *
 * Bronze accent plus weight is the affordance, matching the platform
 * convention of colour-as-link rather than an underline.
 */
export function AuthLink({
  label,
  prompt,
  href,
  onPress,
  tone = "accent",
  disabled = false,
  align = "center",
  style,
}: AuthLinkProps) {
  const M = useMuseumTheme();

  const base: ViewStyle = {
    alignSelf: align === "end" ? "flex-end" : "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    // Pull the padding box back over the container edge so an end-aligned link
    // stays optically flush with the field underline above it. `marginEnd`
    // rather than `marginRight` so this still resolves to the trailing side
    // under RTL (ar).
    marginEnd: align === "end" ? -12 : 0,
    opacity: disabled ? 0.4 : 1,
  };

  // Must stay a flat object, never an array: under `href` this Pressable is the
  // child of expo-router's `<Link asChild>`, whose Radix Slot merges style with
  // an object spread (`{...slotStyle, ...childStyle}`). Spreading an array there
  // yields `{0: {...}, 1: {...}}` and every rule is silently dropped.
  const containerStyle = StyleSheet.flatten<ViewStyle>([base, style]);

  const body = (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="link"
      accessibilityLabel={prompt ? `${prompt} ${label}` : label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={containerStyle}
    >
      {/* Nested rather than a flex row so the prompt and label reflow and
          reorder as one bidirectional run under RTL (ar). */}
      <Text style={{ ...type.caption, textAlign: "center" }}>
        {prompt ? <Text style={{ color: M.sub, fontWeight: "400" }}>{prompt} </Text> : null}
        <Text style={{ color: tone === "quiet" ? M.muted : M.accent, fontWeight: "600" }}>
          {label}
        </Text>
      </Text>
    </Pressable>
  );

  return href ? (
    <Link href={href} asChild>
      {body}
    </Link>
  ) : (
    body
  );
}
