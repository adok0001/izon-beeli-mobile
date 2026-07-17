import { useMuseumTheme } from "@/lib/use-museum-theme";
import { View, type ViewStyle } from "react-native";

/**
 * The standard Studio bordered card — used for both list rows and the
 * editor-form container. Pass `accentColor` for a left accent bar (e.g.
 * color-coding by content type); omit it for a plain card.
 */
export function StudioCard({
  children,
  accentColor,
  style,
}: Readonly<{ children: React.ReactNode; accentColor?: string; style?: ViewStyle }>) {
  const M = useMuseumTheme();

  return (
    <View
      style={{
        borderRadius: 16,
        backgroundColor: M.bg,
        borderWidth: 1,
        borderColor: M.border,
        ...(accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : {}),
        padding: 14,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
