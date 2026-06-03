import { Text, type TextProps, type TextStyle } from "react-native";

interface NsibidiTextProps extends Omit<TextProps, "style"> {
  children: string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

// Renders Nsịbịdị script characters using the Akagu PUA font.
// Requires mobile/assets/fonts/Akagu.ttf to be loaded in app/_layout.tsx.
export function NsibidiText({ children, size = 28, color, style, ...props }: NsibidiTextProps) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: "Akagu",
          fontSize: size,
          lineHeight: size * 1.4,
          includeFontPadding: false,
        },
        color ? { color } : undefined,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
