import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import DraggableFlatList, { type RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Drag-to-reorder sheet for a season's episodes. Handle-only drag; the row
 * renumbers live as it moves. Reorders a LOCAL copy of the draft and commits it
 * on "Done" — the parent's save writes `order: i + 1` from array position, so no
 * schema or hook change is needed. Generic over the row shape so the season
 * editor keeps its own `ChapterDraft` type.
 */
export function ChapterReorderSheet<T extends { key: string; title: string; lessonId: string }>({
  visible,
  chapters,
  lessonTitleFor,
  onClose,
  onReorder,
}: Readonly<{
  visible: boolean;
  chapters: T[];
  lessonTitleFor: (lessonId: string) => string | undefined;
  onClose: () => void;
  onReorder: (chapters: T[]) => void;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  // Local order — a mid-drag list the parent doesn't see until "Done".
  const [order, setOrder] = useState<T[]>(chapters);
  useEffect(() => {
    if (visible) setOrder(chapters);
  }, [visible, chapters]);

  function commit() {
    onReorder(order);
    onClose();
  }

  function renderRow({ item, drag, isActive, getIndex }: RenderItemParams<T>) {
    const number = (getIndex() ?? 0) + 1;
    const lessonTitle = lessonTitleFor(item.lessonId);
    return (
      <ScaleDecorator>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 14,
              borderWidth: 1,
              backgroundColor: M.card,
              borderColor: isActive ? M.accent : M.border,
            }}
          >
            <View style={{ width: 34, alignItems: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: M.sub }}>{number}</Text>
            </View>
            <View style={{ flex: 1, paddingVertical: 12, paddingRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }} numberOfLines={1}>
                {item.title.trim() || t("educator.story.reorderUntitled", { defaultValue: "Untitled episode" })}
              </Text>
              {lessonTitle ? (
                <Text style={{ fontSize: 11.5, color: M.muted, marginTop: 2 }} numberOfLines={1}>
                  {lessonTitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPressIn={drag}
              hitSlop={8}
              className="active:opacity-60"
              style={{ paddingHorizontal: 14, paddingVertical: 14, justifyContent: "center" }}
              accessibilityLabel={t("educator.story.reorderHandle", { defaultValue: "Drag to reorder" })}
            >
              <IconSymbol name="line.3.horizontal" size={18} color={M.muted} />
            </Pressable>
          </View>
        </View>
      </ScaleDecorator>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
            <Text style={{ fontSize: 15, fontWeight: "600", color: M.sub }}>{t("common.cancel")}</Text>
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "700", color: M.text }}>
            {t("educator.story.reorderTitle", { defaultValue: "Reorder episodes" })}
          </Text>
          <Pressable onPress={commit} hitSlop={8} className="active:opacity-60">
            <Text style={{ fontSize: 15, fontWeight: "700", color: M.accent }}>{t("common.done")}</Text>
          </Pressable>
        </View>

        <DraggableFlatList<T>
          data={order}
          keyExtractor={(item) => item.key}
          onDragEnd={({ data }) => setOrder(data)}
          renderItem={renderRow}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </SafeAreaView>
    </Modal>
  );
}
