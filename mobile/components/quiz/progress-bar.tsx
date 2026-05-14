import { View } from "react-native";

export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <View
      className="mx-5 mt-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700"
      accessibilityRole="progressbar"
      accessibilityLabel={`Question ${current} of ${total}`}
      accessibilityValue={{ min: 0, max: total, now: current }}
    >
      <View
        className="h-2 rounded-full bg-blue-500"
        style={{ width: `${pct}%` }}
      />
    </View>
  );
}
