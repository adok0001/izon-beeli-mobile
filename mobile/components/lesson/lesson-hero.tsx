import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { fonts } from "@/constants/typography";
import { MUSEUM } from "@/lib/use-museum-theme";

interface LessonHeroProps {
  title: string;
  overline: string;
  accentColor: string;
  /** Matches `Lesson.scene` — used to pick the scene illustration. Currently only "village" is illustrated; others fall back to the same silhouette. */
  scene?: string | null;
}

/** Village silhouette — the default scene illustration. */
const VillageScene = memo(function VillageScene({ width, accent }: { width: number; accent: string }) {
  const h = 120;
  const cx = width / 2;
  return (
    <Svg width={width} height={h} style={{ position: "absolute", bottom: 0 }}>
      <Rect x={0} y={h - 20} width={width} height={20} fill={`${accent}22`} />

      <Path
        d={`M ${cx - 90} ${h - 20} L ${cx - 90} ${h - 56} L ${cx - 68} ${h - 72} L ${cx - 46} ${h - 56} L ${cx - 46} ${h - 20} Z`}
        fill={`${accent}44`}
      />
      <Path d={`M ${cx - 92} ${h - 54} L ${cx - 68} ${h - 76} L ${cx - 44} ${h - 54} Z`} fill={`${accent}66`} />

      <Path
        d={`M ${cx - 28} ${h - 20} L ${cx - 28} ${h - 68} L ${cx} ${h - 92} L ${cx + 28} ${h - 68} L ${cx + 28} ${h - 20} Z`}
        fill={`${accent}55`}
      />
      <Path d={`M ${cx - 32} ${h - 66} L ${cx} ${h - 98} L ${cx + 32} ${h - 66} Z`} fill={`${accent}77`} />
      <Rect x={cx - 9} y={h - 42} width={18} height={22} rx={9} fill={`${accent}99`} />

      <Path
        d={`M ${cx + 46} ${h - 20} L ${cx + 46} ${h - 52} L ${cx + 68} ${h - 68} L ${cx + 90} ${h - 52} L ${cx + 90} ${h - 20} Z`}
        fill={`${accent}44`}
      />
      <Path d={`M ${cx + 44} ${h - 50} L ${cx + 68} ${h - 72} L ${cx + 92} ${h - 50} Z`} fill={`${accent}66`} />

      <Ellipse cx={cx} cy={22} rx={44} ry={44} fill={`${accent}18`} />
      <Circle cx={cx} cy={22} r={26} fill={`${accent}44`} />
      <Circle cx={cx} cy={22} r={16} fill="#FFEFB8" />
    </Svg>
  );
});

export function LessonHero({ title, overline, accentColor, scene: _scene }: LessonHeroProps) {
  const { width } = useWindowDimensions();
  // `_scene` accepted for future illustration dispatch (kitchen, market, creek, etc.)

  return (
    <View style={{ height: 220, overflow: "hidden", backgroundColor: MUSEUM.inkDeep }}>
      <LinearGradient
        colors={[MUSEUM.inkRaised, MUSEUM.inkDeep, MUSEUM.ink]}
        style={{ position: "absolute", inset: 0 }}
      />
      <LinearGradient
        colors={[`${accentColor}28`, "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 110 }}
      />

      <VillageScene width={width} accent={accentColor} />

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 22,
          paddingBottom: 18,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.headingMedium,
            fontSize: 9,
            letterSpacing: 2,
            color: accentColor,
            marginBottom: 4,
          }}
        >
          {overline}
        </Text>
        <Text
          style={{
            fontFamily: fonts.heading,
            fontSize: 30,
            fontWeight: "800",
            color: MUSEUM.parchment,
            lineHeight: 34,
            letterSpacing: -0.5,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
