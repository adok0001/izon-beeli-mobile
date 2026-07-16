import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton } from "@/components/studio/editor-form";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * A generic drag-to-reorder sheet for Studio editors.
 *
 * Unlike `courses.tsx`, which mutates the server per row on drop, this reorders
 * a **local draft** and commits the whole order once via `onCommit` when the
 * author taps Done — so a reorder is a single atomic save, and closing without
 * Done discards. Drag is **handle-only** (the grip icon), leaving the row body
 * free for taps.
 *
 * Flat by design: to reorder lessons within a scene, pass that scene's items;
 * moving an item *between* scenes is the entity-picker's job, not this sheet's.
 */
export function ReorderSheet<T>({
  visible,
  title,
  items,
  getId,
  getLabel,
  getSublabel,
  onCommit,
  onClose,
  doneLabel = "Done",
  hint = "Drag the handle to reorder.",
}: Readonly<{
  visible: boolean;
  title: string;
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getSublabel?: (item: T) => string | undefined;
  /** Called with the reordered array when the author taps Done. */
  onCommit: (ordered: T[]) => void;
  onClose: () => void;
  doneLabel?: string;
  hint?: string;
}>) {
  const M = useMuseumTheme();
  const [draft, setDraft] = useState<T[]>(items);

  // Reset the draft to the source order each time the sheet opens, so an
  // abandoned reorder never leaks into the next session.
  useEffect(() => {
    if (visible) setDraft(items);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderItem = ({ item, drag, isActive }: RenderItemParams<T>) => {
    const sub = getSublabel?.(item);
    return (
      <ScaleDecorator>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 20,
            marginVertical: 4,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isActive ? M.accent : M.border,
            backgroundColor: M.card,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: M.text }}>
              {getLabel(item)}
            </Text>
            {sub ? (
              <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: M.muted }}>
                {sub}
              </Text>
            ) : null}
          </View>
          <Pressable
            onLongPress={drag}
            delayLongPress={120}
            hitSlop={10}
            style={{ paddingLeft: 12, paddingVertical: 4 }}
            className="active:opacity-60"
          >
            <IconSymbol name="line.3.horizontal" size={22} color={M.muted} />
          </Pressable>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: M.border,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
            <IconSymbol name="xmark" size={20} color={M.sub} />
          </Pressable>
        </View>

        {hint ? (
          <Text style={{ paddingHorizontal: 20, paddingTop: 12, fontSize: 12, color: M.muted }}>{hint}</Text>
        ) : null}

        <DraggableFlatList<T>
          data={draft}
          keyExtractor={getId}
          onDragEnd={({ data }) => setDraft(data)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />

        <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: M.border }}>
          <PrimaryButton
            label={doneLabel}
            M={M}
            onPress={() => {
              onCommit(draft);
              onClose();
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
