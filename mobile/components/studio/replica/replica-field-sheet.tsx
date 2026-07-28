import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";

interface ShellProps {
  visible: boolean;
  title: string;
  /** Blocks backdrop-dismiss while a save is in flight. */
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}

interface Props {
  visible: boolean;
  title: string;
  /** Disables both actions and shows a spinner in place of the Save label. */
  saving?: boolean;
  /** Save is inert until something actually changed. */
  dirty?: boolean;
  onCancel: () => void;
  onSave: () => void;
  children: ReactNode;
}

/**
 * Bare bottom-sheet chrome — backdrop, grabber, title, keyboard avoidance.
 * Same house pattern as `components/audio/word-lookup-sheet.tsx` (no
 * bottom-sheet library is installed; this is the established mobile "popover").
 * Used directly by editors that commit through their own actions (the audio
 * sheet) rather than a Save button.
 */
export function ReplicaSheetShell({ visible, title, busy, onClose, children }: ShellProps) {
  const M = useMuseumTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={busy ? undefined : onClose}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: M.card,
              borderWidth: 1,
              borderColor: M.border,
              paddingHorizontal: 22,
              paddingTop: 14,
              paddingBottom: 34,
              maxHeight: "85%",
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: M.border,
                marginBottom: 16,
              }}
            />
            <Text style={{ fontSize: 15, fontWeight: "800", color: M.text, marginBottom: 14 }}>{title}</Text>
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Bottom sheet for replica field editors, with an explicit Save/Cancel footer.
 *
 * Editing happens *here* rather than inline on the replica for two reasons the
 * first version got wrong: a sheet survives a background refetch re-rendering
 * the screen underneath it, and it can lift itself above the keyboard. It also
 * gives the edit an explicit Cancel, so tapping a field by mistake can't write
 * to published content.
 */
export function ReplicaFieldSheet({ visible, title, saving, dirty, onCancel, onSave, children }: Props) {
  const M = useMuseumTheme();

  return (
    <ReplicaSheetShell visible={visible} title={title} busy={saving} onClose={onCancel}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
        {children}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
        <Pressable
          onPress={onCancel}
          disabled={saving}
          accessibilityRole="button"
          style={{
            flex: 1,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: M.border,
            paddingVertical: 12,
            alignItems: "center",
            opacity: saving ? 0.5 : 1,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: M.sub }}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          disabled={saving || !dirty}
          accessibilityRole="button"
          style={{
            flex: 1,
            borderRadius: 12,
            backgroundColor: M.accent,
            paddingVertical: 12,
            alignItems: "center",
            opacity: saving || !dirty ? 0.5 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={M.ink} />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "700", color: M.ink }}>Save</Text>
          )}
        </Pressable>
      </View>
    </ReplicaSheetShell>
  );
}
