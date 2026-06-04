import { View, Text, Pressable, Modal } from "react-native";
import type { GeezCharacter } from "@/lib/data/geez";
import { useMuseumTheme } from "@/lib/use-museum-theme";

const ORDER_LABELS: Record<number, string> = {
  1: "1st (Ge'ez)",
  2: "2nd",
  3: "3rd",
  4: "4th",
  5: "5th",
  6: "6th",
  7: "7th",
};

interface CharacterDetailProps {
  character: GeezCharacter | null;
  isLearned: boolean;
  onMarkLearned: () => void;
  onPractice: () => void;
  onClose: () => void;
}

export function CharacterDetail({
  character,
  isLearned,
  onMarkLearned,
  onPractice,
  onClose,
}: CharacterDetailProps) {
  const M = useMuseumTheme();

  if (!character) return null;

  return (
    <Modal
      visible={!!character}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <Pressable
          onPress={() => {}}
          style={{ marginHorizontal: 32, width: 288, borderRadius: 16, backgroundColor: M.card, padding: 24, borderWidth: 1, borderColor: M.border }}
        >
          <View style={{ alignItems: "center", paddingBottom: 16 }}>
            <Text style={{ fontSize: 80, lineHeight: 96, color: M.text }}>
              {character.character}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 15, fontWeight: "600", color: M.sub }}>
              {character.romanization}
            </Text>
          </View>

          <View style={{ gap: 8, paddingBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, color: M.sub }}>Consonant family</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>{character.baseConsonant}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, color: M.sub }}>Vowel order</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>
                {ORDER_LABELS[character.order] ?? `${character.order}th`}
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Pressable
              onPress={onPractice}
              style={{ alignItems: "center", borderRadius: 12, backgroundColor: M.accent, paddingVertical: 12 }}
              className="active:opacity-80"
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: M.ink }}>Practice tracing</Text>
            </Pressable>

            {isLearned ? (
              <View style={{ alignItems: "center", borderRadius: 12, backgroundColor: "#22c55e20", paddingVertical: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#22c55e" }}>✓ Learned</Text>
              </View>
            ) : (
              <Pressable
                onPress={onMarkLearned}
                style={{ alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: M.border, paddingVertical: 12 }}
                className="active:opacity-70"
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: M.sub }}>Mark as learned</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
