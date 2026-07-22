import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { TranscriptPlaybackBar } from "./transcript-playback-bar";
import { TranscriptSegmentCard } from "./transcript-segment-card";
import type { ContributionStore, Segment } from "./types";

type TranscriptStepProps = Readonly<{
  store: ContributionStore;
  segments: Segment[];
  onMarkSegment: (index: number) => void;
  onUpdateSegment: (index: number, field: keyof Segment, value: string) => void;
  onAddSegment: () => void;
  onRemoveSegment: (index: number) => void;
}>;

export function TranscriptStep({
  store,
  segments,
  onMarkSegment,
  onUpdateSegment,
  onAddSegment,
  onRemoveSegment,
}: TranscriptStepProps) {
  const { t } = useTranslation();

  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
        {t("contribute.addTranscript")}
      </Text>
      <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        {t("contribute.addTranscriptDesc")}
      </Text>

      {/* Playback controls */}
      <TranscriptPlaybackBar store={store} />

      {/* Segments */}
      {segments.map((seg, index) => (
        <TranscriptSegmentCard
          key={index}
          segment={seg}
          index={index}
          canRemove={segments.length > 1}
          onMark={onMarkSegment}
          onUpdate={onUpdateSegment}
          onRemove={onRemoveSegment}
        />
      ))}

      <Pressable
        onPress={onAddSegment}
        className="mb-8 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-4 active:opacity-70 dark:border-neutral-700"
      >
        <IconSymbol name="plus.circle.fill" size={18} color={getAccent("blue").solid} />
        <Text className="ml-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
          {t("contribute.addSegment")}
        </Text>
      </Pressable>
    </View>
  );
}
