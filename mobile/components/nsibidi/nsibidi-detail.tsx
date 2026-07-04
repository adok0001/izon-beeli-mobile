import { Modal, Pressable, View, Text } from "react-native";
import type { NsibidiCharacter } from "@/types/scripts";
import { NsibidiText } from "./nsibidi-text";
import { NSIBIDI_CATEGORY_LABELS } from "@/types/scripts";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";

const ACCENT = getAccent("amber").solid;

interface NsibidiDetailProps {
  character: NsibidiCharacter | null;
  isLearned: boolean;
  onMarkLearned: () => void;
  onClose: () => void;
}

export function NsibidiDetail({ character, isLearned, onMarkLearned, onClose }: NsibidiDetailProps) {
  const M = useMuseumTheme();

  if (!character) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: 300, borderRadius: 20, backgroundColor: M.card, padding: 24, alignItems: "center", gap: 12, borderWidth: 1, borderColor: M.border }}>
          <NsibidiText size={72} color={ACCENT}>{character.character}</NsibidiText>

          <Text style={{ fontSize: 20, fontWeight: "800", color: M.text, textAlign: "center" }}>
            {character.name}
          </Text>

          <Text style={{ fontSize: 13, color: M.sub, textAlign: "center", lineHeight: 20 }}>
            {character.meaning}
          </Text>

          <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: "rgba(245, 158, 11, 0.12)", borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: ACCENT, letterSpacing: 0.8 }}>
              {NSIBIDI_CATEGORY_LABELS[character.category].toUpperCase()}
            </Text>
          </View>

          <Text style={{ fontSize: 10, color: M.muted }}>
            U+{character.codePoint.toString(16).toUpperCase().padStart(4, "0")} · Akagu
          </Text>

          {!isLearned ? (
            <Pressable
              onPress={onMarkLearned}
              style={{ width: "100%", borderRadius: 14, backgroundColor: ACCENT, paddingVertical: 14, alignItems: "center", marginTop: 4 }}
              className="active:opacity-80"
            >
              <Text style={{ fontWeight: "700", color: "#fff", fontSize: 15 }}>Mark as Learned</Text>
            </Pressable>
          ) : (
            <View style={{ width: "100%", borderRadius: 14, backgroundColor: "rgba(245, 158, 11, 0.1)", paddingVertical: 14, alignItems: "center", marginTop: 4 }}>
              <Text style={{ fontWeight: "700", color: ACCENT, fontSize: 15 }}>✓ Learned</Text>
            </View>
          )}

          <Pressable onPress={onClose} className="active:opacity-60">
            <Text style={{ fontSize: 13, color: M.muted }}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
