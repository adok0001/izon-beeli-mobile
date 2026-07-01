import { View, Text } from "react-native";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";

interface LessonSectionHeaderProps {
  label: string;
  accentColor: string;
  /** Horizontal padding applied to the header row. Defaults to 22. */
  paddingHorizontal?: number;
}

/** Left-aligned hairline · bronze overline · trailing full hairline used in all lesson sections. */
export function LessonSectionHeader({ label, accentColor, paddingHorizontal = 22 }: LessonSectionHeaderProps) {
  const M = useMuseumTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        paddingHorizontal,
      }}
    >
      <View style={{ width: 16, height: 1, backgroundColor: `${accentColor}60` }} />
      <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.8, color: MUSEUM.accentDark }}>
        {label.toUpperCase()}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
    </View>
  );
}
