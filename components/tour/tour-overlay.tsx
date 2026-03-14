import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTourStore, TOUR_STEPS } from "@/store/tour-store";

const SPOTLIGHT_PADDING = 10;

function useStepAnimation(stepIndex: number) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [stepIndex]);

  return opacity;
}

/** Four rectangles that surround a spotlight rect, creating a cutout effect */
function SpotlightCutout({
  spotX,
  spotY,
  spotW,
  spotH,
}: {
  spotX: number;
  spotY: number;
  spotW: number;
  spotH: number;
}) {
  const { width: sw, height: sh } = Dimensions.get("window");
  const OVERLAY = "rgba(0,0,0,0.72)";

  return (
    <>
      {/* Top */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: spotY,
          backgroundColor: OVERLAY,
        }}
      />
      {/* Bottom */}
      <View
        style={{
          position: "absolute",
          top: spotY + spotH,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: OVERLAY,
        }}
      />
      {/* Left */}
      <View
        style={{
          position: "absolute",
          top: spotY,
          left: 0,
          width: spotX,
          height: spotH,
          backgroundColor: OVERLAY,
        }}
      />
      {/* Right */}
      <View
        style={{
          position: "absolute",
          top: spotY,
          left: spotX + spotW,
          right: 0,
          height: spotH,
          backgroundColor: OVERLAY,
        }}
      />
      {/* Rounded border around spotlight */}
      <View
        style={{
          position: "absolute",
          top: spotY,
          left: spotX,
          width: spotW,
          height: spotH,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.35)",
        }}
        pointerEvents="none"
      />
    </>
  );
}

function TooltipCard({
  title,
  description,
  stepIndex,
  total,
  tooltipPosition,
  spotY,
  spotH,
  onNext,
  onSkip,
}: {
  title: string;
  description: string;
  stepIndex: number;
  total: number;
  tooltipPosition: "above" | "below" | "center";
  spotY: number;
  spotH: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const isLast = stepIndex === total - 1;
  const { width: sw } = Dimensions.get("window");
  const insets = useSafeAreaInsets();

  const card = (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
      }}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: "700",
          color: "#111827",
          marginBottom: 6,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#6b7280",
          lineHeight: 20,
          marginBottom: 16,
        }}
      >
        {description}
      </Text>

      {/* Progress dots */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginBottom: 16,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              height: 6,
              width: i === stepIndex ? 20 : 6,
              borderRadius: 3,
              backgroundColor: i === stepIndex ? "#3b82f6" : "#e5e7eb",
            }}
          />
        ))}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {!isLast ? (
          <Pressable onPress={onSkip} hitSlop={8}>
            <Text style={{ fontSize: 14, color: "#9ca3af" }}>Skip tour</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          onPress={onNext}
          style={{
            backgroundColor: "#3b82f6",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
            {isLast ? "Get started →" : "Next →"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (tooltipPosition === "center") {
    return (
      <View style={{ position: "absolute", bottom: 60 + insets.bottom, left: 0, right: 0 }}>
        {card}
      </View>
    );
  }

  if (tooltipPosition === "above") {
    // Position card above the spotlight
    return (
      <View
        style={{
          position: "absolute",
          bottom: Dimensions.get("window").height - spotY + 12,
          left: 0,
          right: 0,
        }}
      >
        {card}
      </View>
    );
  }

  // below
  return (
    <View
      style={{
        position: "absolute",
        top: spotY + spotH + 12,
        left: 0,
        right: 0,
      }}
    >
      {card}
    </View>
  );
}

export function TourOverlay() {
  const { active, stepIndex, next, skip, tabBarLayout } = useTourStore();
  const opacity = useStepAnimation(stepIndex);

  if (!active) return null;

  const step = TOUR_STEPS[stepIndex];
  const { width: sw, height: sh } = Dimensions.get("window");
  const TAB_COUNT = 5;

  // Compute spotlight rect
  let spotX = 0,
    spotY = 0,
    spotW = sw,
    spotH = sh;
  let hasSpot = false;

  if (step.tabIndex !== null && tabBarLayout) {
    const tabW = tabBarLayout.screenWidth / TAB_COUNT;
    const padding = SPOTLIGHT_PADDING;
    spotX = step.tabIndex * tabW - padding;
    spotY = tabBarLayout.y - padding;
    spotW = tabW + padding * 2;
    spotH = tabBarLayout.height + padding * 2;
    hasSpot = true;
  }

  return (
    <Modal transparent animationType="none" visible={active} statusBarTranslucent>
      <Animated.View style={{ flex: 1, opacity }}>
        {/* Full dark overlay for centered (no-spotlight) steps */}
        {!hasSpot && (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "rgba(0,0,0,0.72)",
            }}
          />
        )}

        {/* Spotlight cutout for tab-targeted steps */}
        {hasSpot && (
          <SpotlightCutout
            spotX={spotX}
            spotY={spotY}
            spotW={spotW}
            spotH={spotH}
          />
        )}

        {/* Tap anywhere on overlay to advance */}
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={next}
        />

        {/* Tooltip card (rendered on top so touches work) */}
        <TooltipCard
          title={step.title}
          description={step.description}
          stepIndex={stepIndex}
          total={TOUR_STEPS.length}
          tooltipPosition={step.tooltipPosition}
          spotY={spotY}
          spotH={spotH}
          onNext={next}
          onSkip={skip}
        />
      </Animated.View>
    </Modal>
  );
}

// Inline StyleSheet to avoid a separate import
const StyleSheet = {
  absoluteFillObject: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
};
