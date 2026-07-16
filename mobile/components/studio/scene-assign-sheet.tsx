import { GhostButton, LabeledInput, PrimaryButton } from "@/components/studio/editor-form";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { deriveId } from "@/lib/studio/derive-id";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type SceneOption = Readonly<{
  /** Scene slug, e.g. "house.kitchen" */
  scene: string;
  /** Display title, e.g. "Kitchen" */
  sceneTitle: string | null;
  sceneOrder: number | null;
  lessonCount: number;
}>;

/**
 * Assign a lesson to a scene within its course — the journey's grouping unit
 * (lessons.scene / sceneTitle / sceneOrder). Pick one of the course's existing
 * scenes, create a new one (slug auto-derived from the title, then frozen),
 * or clear the assignment. Commits once via `onCommit`; nothing is written
 * until then.
 */
export function SceneAssignSheet({
  visible,
  lessonTitle,
  currentScene,
  scenes,
  onCommit,
  onClose,
}: Readonly<{
  visible: boolean;
  lessonTitle: string;
  currentScene: string | null;
  /** The course's existing scenes, in sceneOrder. */
  scenes: SceneOption[];
  onCommit: (assignment: { scene: string | null; sceneTitle: string | null; sceneOrder: number | null }) => void;
  onClose: () => void;
}>) {
  const M = useMuseumTheme();
  const [selected, setSelected] = useState<string | null>(currentScene);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (visible) {
      setSelected(currentScene);
      setNewTitle("");
    }
  }, [visible, currentScene]);

  const newSlug = useMemo(
    () => (newTitle.trim() ? deriveId(newTitle, scenes.map((s) => s.scene), "scene") : ""),
    [newTitle, scenes],
  );

  const commit = () => {
    if (newTitle.trim()) {
      // New scene: slug derived once here, order appended after existing scenes.
      const maxOrder = scenes.reduce((max, s) => Math.max(max, s.sceneOrder ?? 0), 0);
      onCommit({ scene: newSlug, sceneTitle: newTitle.trim(), sceneOrder: maxOrder + 1 });
    } else if (selected) {
      const s = scenes.find((sc) => sc.scene === selected);
      onCommit({ scene: selected, sceneTitle: s?.sceneTitle ?? null, sceneOrder: s?.sceneOrder ?? null });
    } else {
      onCommit({ scene: null, sceneTitle: null, sceneOrder: null });
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>Assign scene</Text>
            <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: M.muted }}>{lessonTitle}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
            <IconSymbol name="xmark" size={20} color={M.sub} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }} keyboardShouldPersistTaps="handled">
          {/* No scene */}
          <Pressable
            onPress={() => { setSelected(null); setNewTitle(""); }}
            style={{ borderRadius: 12, borderWidth: 1, padding: 14, borderColor: selected === null && !newTitle ? M.accent : M.border, backgroundColor: M.card }}
            className="active:opacity-70"
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: M.text }}>No scene</Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>Lesson stays a flat item in the course.</Text>
          </Pressable>

          {/* Existing scenes */}
          {scenes.map((s) => {
            const isSel = selected === s.scene && !newTitle;
            return (
              <Pressable
                key={s.scene}
                onPress={() => { setSelected(s.scene); setNewTitle(""); }}
                style={{ borderRadius: 12, borderWidth: 1, padding: 14, borderColor: isSel ? M.accent : M.border, backgroundColor: M.card }}
                className="active:opacity-70"
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: isSel ? M.accent : M.text }}>
                    {s.sceneTitle ?? s.scene}
                  </Text>
                  {isSel ? <IconSymbol name="checkmark.circle.fill" size={18} color={M.accent} /> : null}
                </View>
                <Text style={{ marginTop: 2, fontSize: 11, color: M.muted }}>
                  {s.scene} · {s.lessonCount} lesson{s.lessonCount === 1 ? "" : "s"}
                </Text>
              </Pressable>
            );
          })}

          {/* New scene */}
          <View style={{ borderRadius: 12, borderWidth: 1, padding: 14, borderColor: newTitle ? M.accent : M.border, backgroundColor: M.card, gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: M.muted }}>
              New scene
            </Text>
            <LabeledInput label="Scene title (e.g. Kitchen)" value={newTitle} onChange={setNewTitle} />
            {newSlug ? (
              <Text style={{ fontSize: 11, color: M.muted }}>id: {newSlug} · appended after existing scenes</Text>
            ) : null}
          </View>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: M.border }}>
          <PrimaryButton label="Assign" onPress={commit} M={M} />
          <GhostButton label="Cancel" onPress={onClose} M={M} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
