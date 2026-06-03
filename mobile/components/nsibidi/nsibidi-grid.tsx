import { ScrollView, View, Text, Pressable } from "react-native";
import { NSIBIDI_CHARACTERS, NSIBIDI_CATEGORY_LABELS, type NsibidiCharacter, type NsibidiCategory } from "@/lib/data/nsibidi";
import { NsibidiText } from "./nsibidi-text";

const CATEGORIES = Object.keys(NSIBIDI_CATEGORY_LABELS) as NsibidiCategory[];

const ACCENT = "#f59e0b"; // amber — distinct from Ge'ez green and Adinkra purple

interface NsibidiGridProps {
  learnedIds: Set<string>;
  onSelect: (character: NsibidiCharacter) => void;
}

export function NsibidiGrid({ learnedIds, onSelect }: NsibidiGridProps) {
  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}
    >
      {CATEGORIES.map((category) => {
        const chars = NSIBIDI_CHARACTERS.filter((c) => c.category === category);
        if (chars.length === 0) return null;
        return (
          <View key={category} style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, color: ACCENT, marginBottom: 10 }}>
              {NSIBIDI_CATEGORY_LABELS[category].toUpperCase()}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {chars.map((char) => {
                const learned = learnedIds.has(char.id);
                return (
                  <Pressable
                    key={char.id}
                    onPress={() => onSelect(char)}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: learned ? "rgba(245, 158, 11, 0.12)" : "rgba(245, 158, 11, 0.04)",
                      borderWidth: 1.5,
                      borderColor: learned ? ACCENT : "rgba(245, 158, 11, 0.2)",
                    }}
                    className="active:opacity-70"
                  >
                    <NsibidiText size={30} color={learned ? ACCENT : "#6b7280"}>
                      {char.character}
                    </NsibidiText>
                    {learned && (
                      <View style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT }} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
