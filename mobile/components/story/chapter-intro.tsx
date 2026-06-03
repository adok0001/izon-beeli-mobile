import { Modal, View, Text, Pressable } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { StoryChapter } from "@/types";
import { useTranslation } from "react-i18next";

interface Props {
  visible: boolean;
  chapter: StoryChapter;
  onStart: () => void;
  onClose: () => void;
}

export function ChapterIntro({ visible, chapter, onStart, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-neutral-900">
          {/* Close button */}
          <Pressable
            onPress={onClose}
            className="absolute right-4 top-4 h-8 w-8 items-center justify-center rounded-full bg-neutral-100 active:opacity-70 dark:bg-neutral-800"
          >
            <IconSymbol name="xmark" size={16} color="#9ca3af" />
          </Pressable>

          {/* Chapter number */}
          <Text className="mb-1 text-sm font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400">
            {t("educator.story.chapterLabel", { number: chapter.order })}
          </Text>

          {/* Title */}
          <Text className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
            {chapter.title}
          </Text>

          {/* Narrative intro */}
          <View className="mb-6 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/30">
            <Text className="text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
              {chapter.narrativeIntro}
            </Text>
          </View>

          {/* Begin button */}
          <Pressable
            onPress={onStart}
            className="items-center rounded-xl bg-blue-500 py-4 active:opacity-80 dark:bg-blue-600"
          >
            <Text className="text-base font-bold text-white">
              {t("educator.story.beginChapter")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
