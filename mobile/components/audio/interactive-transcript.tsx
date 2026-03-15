import { useRef, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useAudioStore } from "@/store/audio-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { TranscriptSegment } from "@/types";

interface Props {
  segments: TranscriptSegment[];
  onSegmentPress?: (segment: TranscriptSegment) => void;
}

export function InteractiveTranscript({ segments, onSegmentPress }: Props) {
  const { progress, seekTo, currentTrackId } = useAudioStore();
  const { uiLanguage } = useUiLanguageStore();
  const scrollRef = useRef<ScrollView>(null);

  const activeIndex = segments.findIndex(
    (seg) => progress >= seg.startTime && progress < seg.endTime
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeIndex >= 0 && scrollRef.current) {
      // Approximate: each segment row is about 80px
      scrollRef.current.scrollTo({
        y: Math.max(0, activeIndex * 80 - 100),
        animated: true,
      });
    }
  }, [activeIndex]);

  if (segments.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-sm text-neutral-400 dark:text-neutral-500">
          No transcript available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
      {segments.map((segment, index) => {
        const isActive = index === activeIndex;

        return (
          <Pressable
            key={segment.id}
            onPress={() => {
              if (currentTrackId) {
                seekTo(segment.startTime);
              }
              onSegmentPress?.(segment);
            }}
            className={`border-l-2 px-4 py-3 ${
              isActive
                ? "border-l-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-l-transparent"
            }`}
          >
            <Text
              className={`text-base leading-6 ${
                isActive
                  ? "font-semibold text-blue-700 dark:text-blue-300"
                  : "text-neutral-800 dark:text-neutral-200"
              }`}
            >
              {segment.text}
            </Text>
            {(segment.translation || segment.translationFr) && (
              <Text
                className={`mt-1 text-sm ${
                  isActive
                    ? "text-blue-500 dark:text-blue-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {uiLanguage === "fr"
                  ? (segment.translationFr ?? segment.translation)
                  : segment.translation}
              </Text>
            )}
          </Pressable>
        );
      })}
      <View className="h-20" />
    </ScrollView>
  );
}
