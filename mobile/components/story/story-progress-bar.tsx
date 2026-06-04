import { useRef, useEffect } from "react";
import { ScrollView, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { StoryChapter } from "@/types";
import { useMuseumTheme } from "@/lib/use-museum-theme";

interface Props {
  chapters: StoryChapter[];
  completedIds: string[];
  currentChapterId?: string;
}

function PulsingDot() {
  const M = useMuseumTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, { height: 20, width: 20, borderRadius: 10, backgroundColor: M.accent }]}
    />
  );
}

export function StoryProgressBar({
  chapters,
  completedIds,
  currentChapterId,
}: Props) {
  const M = useMuseumTheme();
  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
    >
      {sorted.map((chapter, index) => {
        const isCompleted = completedIds.includes(chapter.id);
        const isCurrent = chapter.id === currentChapterId;
        const isLast = index === sorted.length - 1;

        return (
          <View key={chapter.id} style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ alignItems: "center", width: 72 }}>
              <View style={{ height: 20, width: 20, alignItems: "center", justifyContent: "center" }}>
                {isCurrent ? (
                  <PulsingDot />
                ) : isCompleted ? (
                  <View style={{ height: 20, width: 20, borderRadius: 10, backgroundColor: "#22c55e" }} />
                ) : (
                  <View style={{ height: 20, width: 20, borderRadius: 10, backgroundColor: M.border }} />
                )}
              </View>
              <Text
                style={{ marginTop: 6, textAlign: "center", fontSize: 10, lineHeight: 14, color: isCurrent ? M.accent : isCompleted ? "#22c55e" : M.muted, fontWeight: isCurrent || isCompleted ? "600" : "400" }}
                numberOfLines={2}
              >
                {chapter.title}
              </Text>
            </View>
            {!isLast && (
              <View style={{ marginTop: 8, height: 2, width: 24, alignSelf: "flex-start", backgroundColor: M.border }} />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
