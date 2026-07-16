import { IconSymbol } from "@/components/ui/icon-symbol";
import type { EducatorStoryChapter } from "@/lib/hooks/use-educator-panel";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { TFunction } from "i18next";
import { Pressable, Text, TextInput, View } from "react-native";

/** A season chapter (episode) being edited — the persisted row minus its id,
 *  plus a stable React key that survives reorders. */
export type ChapterDraft = Omit<EducatorStoryChapter, "id"> & { key: string };

/**
 * One episode card in the season editor: title, its linked lesson (chosen via
 * the searchable picker), and the narrative intro/outro that bookend the
 * episode. `error` highlights the card and shows the message when the parent's
 * inline validation flags it. Split out of `story-edit.tsx` to keep that screen
 * under the line-count lint threshold.
 */
export function ChapterEditor({
  index,
  chapter,
  lessonOptions,
  onChange,
  onDelete,
  onOpenLesson,
  onPickLesson,
  error,
  t,
}: Readonly<{
  index: number;
  chapter: ChapterDraft;
  lessonOptions: { id: string; title: string }[];
  onChange: (updated: ChapterDraft) => void;
  onDelete: () => void;
  onOpenLesson: (lessonId: string) => void;
  onPickLesson: () => void;
  error?: string;
  t: TFunction;
}>) {
  const M = useMuseumTheme();
  const selectedLesson = lessonOptions.find((l) => l.id === chapter.lessonId);
  return (
    <View className="mx-5 mb-4 rounded-2xl border p-4" style={{ backgroundColor: M.card, borderColor: error ? M.errorBorder : M.border }}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: M.warning }}>
          {t("educator.story.chapterLabel", { number: String(index + 1) })}
        </Text>
        <Pressable onPress={onDelete} hitSlop={8}>
          <IconSymbol name="trash" size={16} color={M.error} />
        </Pressable>
      </View>
      {error ? (
        <View className="mb-3 flex-row items-center gap-1.5">
          <IconSymbol name="exclamationmark.triangle.fill" size={12} color={M.error} />
          <Text className="flex-1 text-xs font-semibold" style={{ color: M.error }}>{error}</Text>
        </View>
      ) : null}

      <Text className="mb-1 text-xs font-semibold" style={{ color: M.sub }}>
        {t("educator.story.chapterTitleLabel")}
      </Text>
      <TextInput
        value={chapter.title}
        onChangeText={(v) => onChange({ ...chapter, title: v })}
        placeholder={t("educator.story.chapterTitlePlaceholder")}
        className="mb-3 rounded-xl border px-3 py-2.5 text-sm"
        style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
        placeholderTextColor={M.muted}
      />

      <Text className="mb-1 text-xs font-semibold" style={{ color: M.sub }}>
        {t("educator.story.chapterLessonLabel")}
      </Text>
      <Pressable
        onPress={onPickLesson}
        className="mb-3 flex-row items-center justify-between rounded-xl border px-3 py-2.5 active:opacity-70"
        style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder }}
      >
        <Text className="flex-1 text-sm" style={{ color: selectedLesson ? M.inputText : M.muted }} numberOfLines={1}>
          {selectedLesson ? selectedLesson.title : t("educator.story.chapterLessonChoose", { defaultValue: "Choose a lesson" })}
        </Text>
        <IconSymbol name="chevron.right" size={14} color={M.muted} />
      </Pressable>

      {selectedLesson ? (
        <Pressable
          onPress={() => onOpenLesson(chapter.lessonId)}
          className="mb-3 flex-row items-center gap-2.5 rounded-xl border px-3 py-2.5 active:opacity-70"
          style={{ backgroundColor: M.warningBg, borderColor: M.warningBorder }}
        >
          <IconSymbol name="waveform" size={16} color={M.warning} />
          <View className="flex-1">
            <Text className="text-xs font-bold" style={{ color: M.text }} numberOfLines={1}>
              {selectedLesson.title}
            </Text>
            <Text className="text-[11px]" style={{ color: M.muted }}>
              {t("educator.story.openLessonHint")}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={13} color={M.warning} />
        </Pressable>
      ) : null}

      <Text className="mb-1 text-xs font-semibold" style={{ color: M.sub }}>
        {t("educator.story.chapterNarrativeIntroLabel")}
      </Text>
      <TextInput
        value={chapter.narrativeIntro}
        onChangeText={(v) => onChange({ ...chapter, narrativeIntro: v })}
        placeholder={t("educator.story.chapterNarrativeIntroPlaceholder")}
        multiline
        numberOfLines={3}
        className="mb-3 rounded-xl border px-3 py-2.5 text-sm"
        style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
        placeholderTextColor={M.muted}
        textAlignVertical="top"
      />

      <Text className="mb-1 text-xs font-semibold" style={{ color: M.sub }}>
        {t("educator.story.chapterNarrativeOutroLabel")}
      </Text>
      <TextInput
        value={chapter.narrativeOutro}
        onChangeText={(v) => onChange({ ...chapter, narrativeOutro: v })}
        placeholder={t("educator.story.chapterNarrativeOutroPlaceholder")}
        multiline
        numberOfLines={3}
        className="rounded-xl border px-3 py-2.5 text-sm"
        style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
        placeholderTextColor={M.muted}
        textAlignVertical="top"
      />
    </View>
  );
}
