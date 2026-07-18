import { LinearGradient } from "expo-linear-gradient";
import { View, Text, useWindowDimensions } from "react-native";
import { SvgUri } from "react-native-svg";
import { SceneIllustration, SCENE_KINDS, type SceneKind } from "@/components/learn/journey-scenery";
import { fonts } from "@/constants/typography";
import { MUSEUM } from "@/lib/use-museum-theme";

interface LessonHeroProps {
  title: string;
  overline: string;
  accentColor: string;
  /** Educator-picked background illustration (SceneKind). Unset/unrecognized falls back to "village". */
  sceneIllustration?: string | null;
  /** Educator-uploaded custom SVG URL — takes precedence over `sceneIllustration` when set. */
  sceneIllustrationUrl?: string | null;
}

function resolveSceneKind(value?: string | null): SceneKind {
  return (SCENE_KINDS as string[]).includes(value ?? "") ? (value as SceneKind) : "village";
}

export function LessonHero({ title, overline, accentColor, sceneIllustration, sceneIllustrationUrl }: LessonHeroProps) {
  const { width } = useWindowDimensions();
  const kind = resolveSceneKind(sceneIllustration);

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

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 160 }}>
        {sceneIllustrationUrl ? (
          <SvgUri uri={sceneIllustrationUrl} width={width} height={160} />
        ) : (
          <SceneIllustration kind={kind} width={width} height={160} />
        )}
      </View>

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
