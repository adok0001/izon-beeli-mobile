import type { SceneKind } from "@/components/learn/journey-scenery";
import type { SceneOption } from "@/components/studio/scene-assign-sheet";
import { GhostButton, LabeledInput, PrimaryButton } from "@/components/studio/editor-form";
import { SceneIllustrationPicker } from "@/components/studio/scene-illustration-picker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Edit a scene's title/illustration or delete it (ungroup its lessons) — the
 * bulk counterpart to SceneAssignSheet's per-lesson assignment, used by the
 * standalone Scenes tool.
 */
export function SceneEditSheet({
  visible,
  scene,
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
}: Readonly<{
  visible: boolean;
  scene: SceneOption | null;
  onClose: () => void;
  onSave: (fields: { sceneTitle: string; sceneIllustration: SceneKind; sceneIllustrationUrl: string | null }) => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}>) {
  const M = useMuseumTheme();
  const [title, setTitle] = useState("");
  const [illustration, setIllustration] = useState<SceneKind>("village");
  const [illustrationUrl, setIllustrationUrl] = useState<string | null>(null);

  useEffect(() => {
    if (visible && scene) {
      setTitle(scene.sceneTitle ?? "");
      setIllustration((scene.sceneIllustration as SceneKind) ?? "village");
      setIllustrationUrl(scene.sceneIllustrationUrl ?? null);
    }
  }, [visible, scene]);

  if (!scene) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>Edit scene</Text>
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
            <IconSymbol name="xmark" size={20} color={M.sub} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          <LabeledInput label="Scene title" value={title} onChange={setTitle} />
          <Text style={{ fontSize: 11, color: M.muted }}>
            {scene.scene} · {scene.lessonCount} lesson{scene.lessonCount === 1 ? "" : "s"}
          </Text>

          <View>
            <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", color: M.muted, marginBottom: 6 }}>
              Background illustration
            </Text>
            <SceneIllustrationPicker
              value={illustration}
              onChange={setIllustration}
              customUrl={illustrationUrl}
              onCustomUrlChange={setIllustrationUrl}
            />
          </View>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: M.border }}>
          <PrimaryButton
            label={saving ? "Saving…" : "Save"}
            onPress={() => onSave({ sceneTitle: title.trim(), sceneIllustration: illustration, sceneIllustrationUrl: illustrationUrl })}
            M={M}
            disabled={saving || !title.trim()}
          />
          <GhostButton label="Cancel" onPress={onClose} M={M} />
        </View>
        <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          <Pressable
            onPress={onDelete}
            disabled={deleting}
            style={{
              borderRadius: 12,
              paddingVertical: 11,
              alignItems: "center",
              backgroundColor: M.errorBg,
              borderWidth: 1,
              borderColor: M.errorBorder,
              opacity: deleting ? 0.5 : 1,
            }}
            className="active:opacity-70"
          >
            <Text style={{ fontWeight: "800", color: M.error, fontSize: 14 }}>
              {deleting ? "Removing…" : "Delete scene (ungroup lessons)"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
