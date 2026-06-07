import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

/** Small circular progress ring showing today's completed challenges out of 3. */
export function DailyGoalRing({ completedToday }: { completedToday: number }) {
  const M = useMuseumTheme();
  const target = 3;
  const pct = Math.min(completedToday / target, 1);
  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  const color = pct >= 1 ? "#4ade80" : M.accent;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 8, fontWeight: "800", color }}>
        {completedToday}/{target}
      </Text>
    </View>
  );
}
