import { LinearGradient } from "expo-linear-gradient";
import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { tWithVars } from "@/lib/i18n-dynamic";
import { JOURNEY, STOP_GRADIENT, type JourneyCheckpointNode } from "@/lib/journey";
import { MUSEUM } from "@/lib/use-museum-theme";

const DISC = 58;
const WRAP = 132;

/**
 * A checkpoint gate on the journey map.
 *
 * Deliberately *not* a lesson disc: gates are diamonds, not circles, so a
 * learner reading the path can tell at a glance that this stop is a different
 * kind of thing — something to clear, not something to study. The bronze
 * palette is shared with the lesson discs so it still reads as part of the same
 * trail rather than a foreign object.
 */

/** Pulsing halo — mirrors the active lesson node's "you are here" signal. */
function ReadyHalo({ lively }: { lively: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!lively) return;
    p.value = withRepeat(withTiming(1, { duration: 1800 }), -1, false);
  }, [lively, p]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - p.value),
    transform: [{ rotate: "45deg" }, { scale: 1 + p.value * 0.6 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: DISC,
          height: DISC,
          borderRadius: 14,
          borderWidth: 3,
          borderColor: "rgba(244,206,132,0.9)",
        },
        ring,
      ]}
    />
  );
}

/** Flag (cleared / ready) or padlock (locked), counter-rotated upright. */
function GateGlyph({ status, isGame }: { status: JourneyCheckpointNode["checkpoint"]["status"]; isGame: boolean }) {
  if (status === "locked") {
    return (
      <Svg viewBox="0 0 24 24" width={22} height={22} fill="none">
        <Rect x={4} y={11} width={16} height={9} rx={2} stroke="#A89880" strokeWidth={2.2} />
        <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#A89880" strokeWidth={2.2} />
      </Svg>
    );
  }
  if (status === "done") {
    return (
      <Svg viewBox="0 0 24 24" width={24} height={24} fill="none">
        <Path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  // A gate that runs a mini-game wears the controller so the map says so.
  return <IconSymbol name={isGame ? "gamecontroller.fill" : "flag.fill"} size={22} color="#fff" />;
}

export const CheckpointNodeView = memo(function CheckpointNodeView({
  node,
  lively,
  onPress,
}: {
  node: JourneyCheckpointNode;
  lively: boolean;
  onPress: (node: JourneyCheckpointNode) => void;
}) {
  const { t } = useTranslation();
  const { checkpoint } = node;
  const { status } = checkpoint;
  const locked = status === "locked";

  const label =
    checkpoint.kind === "intro"
      ? t("checkpoint.introNodeLabel")
      : checkpoint.gameKey
        ? tWithVars(t, "checkpoint.gameNodeLabel", { n: checkpoint.ordinal })
        : tWithVars(t, "checkpoint.nodeLabel", { n: checkpoint.ordinal });
  const stateLabel =
    status === "done" ? t("checkpoint.mapDone") : locked ? t("checkpoint.mapLocked") : t("checkpoint.mapReady");

  return (
    <Pressable
      onPress={() => onPress(node)}
      style={{
        position: "absolute",
        left: node.x - WRAP / 2,
        top: node.y - DISC / 2,
        width: WRAP,
        alignItems: "center",
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${stateLabel}`}
      accessibilityHint={locked ? t("checkpoint.sheetLockedBody") : t("checkpoint.sheetBody")}
    >
      <View style={{ width: DISC, height: DISC, alignItems: "center", justifyContent: "center" }}>
        {status === "active" && <ReadyHalo lively={lively} />}
        <LinearGradient
          colors={STOP_GRADIENT[status]}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: DISC,
            height: DISC,
            borderRadius: 14,
            transform: [{ rotate: "45deg" }],
            borderWidth: status === "active" ? 3 : 2,
            borderColor: locked ? JOURNEY.discLockedBorder : status === "active" ? "#FFFFFF" : JOURNEY.discDoneBorder,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: JOURNEY.bronze,
            shadowOpacity: locked ? 0.18 : 0.45,
            shadowRadius: status === "active" ? 16 : 10,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          {/* Counter-rotate so the glyph sits upright inside the diamond. */}
          <View style={{ transform: [{ rotate: "-45deg" }] }}>
            <GateGlyph status={status} isGame={!!checkpoint.gameKey && checkpoint.kind === "checkpoint"} />
          </View>
        </LinearGradient>
      </View>

      <View
        style={{
          marginTop: 14,
          maxWidth: 124,
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderRadius: 9,
          borderWidth: 1,
          borderColor: locked ? "rgba(200,185,160,0.5)" : "rgba(196,134,42,0.45)",
          backgroundColor: locked ? "rgba(244,239,228,0.66)" : "rgba(253,250,245,0.92)",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 10,
            fontWeight: "800",
            letterSpacing: 0.8,
            textAlign: "center",
            color: locked ? JOURNEY.capLocked : MUSEUM.accentDark,
          }}
        >
          {label.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
});
