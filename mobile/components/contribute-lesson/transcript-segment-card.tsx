import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { Segment } from "./types";

type TranscriptSegmentCardProps = Readonly<{
  segment: Segment;
  index: number;
  canRemove: boolean;
  onMark: (index: number) => void;
  onUpdate: (index: number, field: keyof Segment, value: string) => void;
  onRemove: (index: number) => void;
}>;

export function TranscriptSegmentCard({
  segment,
  index,
  canRemove,
  onMark,
  onUpdate,
  onRemove,
}: TranscriptSegmentCardProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700">
      {/* Segment header */}
      <View className="flex-row items-center justify-between bg-neutral-50 px-4 py-2.5 dark:bg-neutral-800">
        <View className="flex-row items-center">
          <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Text className="text-xs font-bold text-blue-700 dark:text-blue-300">
              {index + 1}
            </Text>
          </View>
          {segment.startTime ? (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {segment.startTime}s — {segment.endTime || "..."}s
            </Text>
          ) : (
            <Text className="text-xs text-neutral-400 dark:text-neutral-500">
              {t("contribute.noTimingSet")}
            </Text>
          )}
        </View>
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={() => onMark(index)}
            className="flex-row items-center rounded-full bg-blue-500 px-3 py-1.5 active:opacity-80"
          >
            <IconSymbol name="hand.tap.fill" size={12} color="white" />
            <Text className="ml-1 text-xs font-semibold text-white">
              {t("contribute.mark")}
            </Text>
          </Pressable>
          {canRemove && (
            <Pressable
              onPress={() => onRemove(index)}
              className="rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700"
            >
              <IconSymbol name="xmark" size={10} color={M.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Segment body */}
      <View className="p-3">
        <TextInput
          value={segment.text}
          onChangeText={(v) => onUpdate(index, "text", v)}
          placeholder="Spoken text in the language..."
          placeholderTextColor={M.muted}
          multiline
          className="mb-2 min-h-[40px] rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
        />
        <TextInput
          value={segment.translation}
          onChangeText={(v) => onUpdate(index, "translation", v)}
          placeholder="English translation (optional)"
          placeholderTextColor={M.muted}
          multiline
          className="mb-2 min-h-[36px] rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
        />

        {/* Time inputs row */}
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center rounded-xl bg-neutral-50 px-3 dark:bg-neutral-800">
            <Text className="mr-2 text-xs text-neutral-400">Start</Text>
            <TextInput
              value={segment.startTime}
              onChangeText={(v) => onUpdate(index, "startTime", v)}
              placeholder="0.0"
              placeholderTextColor={M.muted}
              keyboardType="decimal-pad"
              className="flex-1 py-2 text-sm text-neutral-900 dark:text-white"
            />
          </View>
          <View className="flex-1 flex-row items-center rounded-xl bg-neutral-50 px-3 dark:bg-neutral-800">
            <Text className="mr-2 text-xs text-neutral-400">End</Text>
            <TextInput
              value={segment.endTime}
              onChangeText={(v) => onUpdate(index, "endTime", v)}
              placeholder="0.0"
              placeholderTextColor={M.muted}
              keyboardType="decimal-pad"
              className="flex-1 py-2 text-sm text-neutral-900 dark:text-white"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
