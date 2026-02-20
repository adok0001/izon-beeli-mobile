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

interface Props {
  chapters: StoryChapter[];
  completedIds: string[];
  currentChapterId?: string;
}

function PulsingDot() {
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
      style={animatedStyle}
      className="h-5 w-5 rounded-full bg-blue-500 dark:bg-blue-400"
    />
  );
}

export function StoryProgressBar({
  chapters,
  completedIds,
  currentChapterId,
}: Props) {
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
          <View key={chapter.id} className="flex-row items-start">
            <View className="items-center" style={{ width: 72 }}>
              {/* Dot */}
              <View className="h-5 w-5 items-center justify-center">
                {isCurrent ? (
                  <PulsingDot />
                ) : isCompleted ? (
                  <View className="h-5 w-5 rounded-full bg-green-500 dark:bg-green-400" />
                ) : (
                  <View className="h-5 w-5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                )}
              </View>
              {/* Label */}
              <Text
                className={`mt-1.5 text-center text-[10px] leading-tight ${
                  isCurrent
                    ? "font-semibold text-blue-600 dark:text-blue-400"
                    : isCompleted
                    ? "font-medium text-green-700 dark:text-green-400"
                    : "text-neutral-400 dark:text-neutral-500"
                }`}
                numberOfLines={2}
              >
                {chapter.title}
              </Text>
            </View>
            {/* Connector line */}
            {!isLast && (
              <View className="mt-2 h-0.5 w-6 self-start bg-neutral-300 dark:bg-neutral-600" />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
