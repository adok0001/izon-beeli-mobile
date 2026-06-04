import { Modal, View, Text, Pressable } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { StoryChapter } from "@/types";
import { useTranslation } from "react-i18next";

interface Props {
  visible: boolean;
  chapter: StoryChapter;
  onStart: () => void;
  onClose: () => void;
}

export function ChapterIntro({ visible, chapter, onStart, onClose }: Props) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: M.card, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 24, borderTopWidth: 1, borderColor: M.border }}>
          <Pressable
            onPress={onClose}
            style={{ position: "absolute", right: 16, top: 16, height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: M.border }}
            className="active:opacity-70"
          >
            <IconSymbol name="xmark" size={16} color={M.muted} />
          </Pressable>

          <Text style={{ marginBottom: 4, fontSize: 13, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: M.accent }}>
            {t("educator.story.chapterLabel", { number: chapter.order })}
          </Text>

          <Text style={{ marginBottom: 16, fontSize: 22, fontWeight: "700", color: M.text }}>
            {chapter.title}
          </Text>

          <View style={{ marginBottom: 24, borderRadius: 16, backgroundColor: M.accentGlow, padding: 16, borderWidth: 1, borderColor: M.accentBorder }}>
            <Text style={{ fontSize: 15, lineHeight: 24, color: M.text }}>
              {chapter.narrativeIntro}
            </Text>
          </View>

          <Pressable
            onPress={onStart}
            style={{ alignItems: "center", borderRadius: 12, backgroundColor: M.accent, paddingVertical: 16 }}
            className="active:opacity-80"
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>
              {t("educator.story.beginChapter")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
