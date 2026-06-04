import { View } from "react-native";
import { useMuseumTheme } from "@/lib/use-museum-theme";

export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const M = useMuseumTheme();
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <View
      style={{ marginHorizontal: 20, marginTop: 8, height: 8, borderRadius: 999, backgroundColor: M.border }}
      accessibilityRole="progressbar"
      accessibilityLabel="Quiz progress"
      accessibilityValue={{ min: 0, max: total, now: current }}
    >
      <View
        style={{ height: 8, borderRadius: 999, backgroundColor: M.accent, width: `${pct}%` }}
      />
    </View>
  );
}
