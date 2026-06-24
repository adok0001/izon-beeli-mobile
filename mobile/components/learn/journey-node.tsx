import { LinearGradient } from "expo-linear-gradient";
import { memo, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ActiveFlag, NodeGlyph } from "@/components/learn/journey-icons";
import { JOURNEY, type JourneyNode, type NodeStatus } from "@/lib/journey";
import { localize } from "@/lib/localize";
import type { UiLanguage } from "@/store/ui-language-store";

const DISC = 64;
const WRAP = 124;

const DISC_GRADIENT: Record<NodeStatus, [string, string]> = {
  done: ["#EFC479", "#A66E1C"],
  active: ["#F6D08A", "#B5781E"],
  open: ["#F2D9A0", "#C4862A"],
  locked: ["#EDE6D6", "#D6CAB2"],
};

const DISC_BORDER: Record<NodeStatus, { color: string; width: number }> = {
  done: { color: JOURNEY.discDoneBorder, width: 2 },
  active: { color: "#FFFFFF", width: 3 },
  open: { color: JOURNEY.discDoneBorder, width: 2 },
  locked: { color: JOURNEY.discLockedBorder, width: 2 },
};

/** Pulsing halo ring behind the active node. */
function ActiveHalo({ lively }: { lively: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!lively) return;
    p.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
  }, [lively, p]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - p.value),
    transform: [{ scale: 1 + p.value * 0.7 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: DISC,
          height: DISC,
          borderRadius: DISC / 2,
          borderWidth: 3,
          borderColor: "rgba(244,206,132,0.9)",
        },
        ring,
      ]}
    />
  );
}

/** Gentle bob applied to the active disc. */
function useBob(lively: boolean) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!lively) return;
    y.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1300 }),
        withTiming(0, { duration: 1300 })
      ),
      -1,
      false
    );
  }, [lively, y]);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
}

interface JourneyNodeViewProps {
  node: JourneyNode;
  uiLanguage: UiLanguage;
  lively: boolean;
  onPress: (node: JourneyNode) => void;
}

export const JourneyNodeView = memo(function JourneyNodeView({
  node,
  uiLanguage,
  lively,
  onPress,
}: JourneyNodeViewProps) {
  const { status } = node;
  const border = DISC_BORDER[status];
  const bob = useBob(status === "active" && lively);
  const title = localize(node.title, uiLanguage);

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
      accessibilityLabel={`${title}${status === "done" ? ", completed" : status === "active" ? ", up next" : status === "locked" ? ", locked" : ", available"}`}
      accessibilityHint="Tap to open lesson details"
    >
      <View style={{ width: DISC, height: DISC, alignItems: "center", justifyContent: "center" }}>
        {status === "active" && <ActiveHalo lively={lively} />}
        {status === "active" && (
          <View style={{ position: "absolute", top: -26 }}>
            <ActiveFlag />
          </View>
        )}
        <Animated.View style={status === "active" ? bob : undefined}>
          <LinearGradient
            colors={DISC_GRADIENT[status]}
            start={{ x: 0.3, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: DISC,
              height: DISC,
              borderRadius: DISC / 2,
              borderWidth: border.width,
              borderColor: border.color,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: JOURNEY.bronze,
              shadowOpacity: status === "locked" ? 0.18 : 0.45,
              shadowRadius: status === "active" ? 16 : 10,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <NodeGlyph status={status} />
          </LinearGradient>
        </Animated.View>
      </View>

      <View
        style={{
          marginTop: 9,
          maxWidth: 116,
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderRadius: 9,
          borderWidth: 1,
          borderColor: status === "locked" ? "rgba(200,185,160,0.5)" : "rgba(196,134,42,0.45)",
          backgroundColor: status === "locked" ? "rgba(244,239,228,0.66)" : "rgba(253,250,245,0.92)",
        }}
      >
        <Text
          numberOfLines={2}
          style={{
            fontSize: 11,
            fontWeight: "700",
            textAlign: "center",
            lineHeight: 14,
            color: status === "locked" ? "#8A7C66" : "#2A2018",
          }}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
});
