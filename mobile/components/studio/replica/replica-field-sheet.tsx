import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Shared bottom-sheet Modal shell for replica field editors — same house
 * pattern as `components/audio/word-lookup-sheet.tsx` (no bottom-sheet
 * library is installed; this is the established mobile "popover"). */
export function ReplicaFieldSheet({ visible, onClose, title, children }: Props) {
  const M = useMuseumTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }} onPress={onClose}>
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
          }}
        >
          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: M.border, marginBottom: 16 }} />
          {title ? (
            <Text style={{ fontSize: 15, fontWeight: "800", color: M.text, marginBottom: 14 }}>{title}</Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
