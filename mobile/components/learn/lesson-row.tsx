import { IconSymbol } from "@/components/ui/icon-symbol";
import { localizeField } from "@/lib/localize";
import { formatDuration } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Lesson } from "@/types";
import { Pressable, Text, View } from "react-native";

export function LessonRow({
  lesson,
  completed,
  onPress,
}: {
  lesson: Lesson;
  completed: boolean;
  onPress: () => void;
}) {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();

  return (
    <Pressable
      onPress={onPress}
      style={{ borderTopWidth: 1, borderTopColor: M.border }}
      className="flex-row items-center py-3 active:opacity-60"
      accessibilityRole="button"
      accessibilityLabel={`${localizeField(lesson.title, lesson.titleFr, uiLanguage)}${completed ? ", completed" : ""}`}
      accessibilityHint="Tap to open lesson"
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: completed ? "rgba(74, 222, 128, 0.15)" : "transparent",
          borderWidth: 1.5,
          borderColor: completed ? M.success : M.border,
        }}
      >
        {completed && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: M.success }} />
        )}
      </View>
      <View className="ml-3 flex-1">
        <Text
          style={{
            fontSize: 13,
            fontWeight: completed ? "500" : "600",
            color: completed ? M.muted : M.text,
            opacity: completed ? 0.6 : 1,
          }}
          numberOfLines={1}
        >
          {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
        </Text>
        {lesson.description ? (
          <Text style={{ fontSize: 11, color: M.textDimDark, marginTop: 1 }} numberOfLines={1}>
            {localizeField(lesson.description, lesson.descriptionFr, uiLanguage)}
          </Text>
        ) : null}
      </View>
      {lesson.duration && (
        <Text style={{ fontSize: 11, color: M.textDimDark, marginRight: 6 }}>
          {formatDuration(lesson.duration)}
        </Text>
      )}
      <IconSymbol name="chevron.right" size={14} color={M.textDimDark} />
    </Pressable>
  );
}
