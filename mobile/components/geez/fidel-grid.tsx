import { useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import type { GeezCharacter } from "@/types/scripts";
import { useMuseumTheme } from "@/lib/use-museum-theme";

const VOWEL_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

// Fixed linguistic grouping for the grid header — a display convention, not
// content, so it stays in code independent of which characters are loaded.
const FAMILY_GROUPS: { label: string; families: string[] }[] = [
  { label: "Basic", families: ["ha", "la", "hha", "ma", "ra", "sa", "sha"] },
  { label: "Velars", families: ["qa", "ba", "va"] },
  { label: "Dentals", families: ["ta", "cha"] },
  { label: "Nasals & Glides", families: ["na", "nya", "a", "ka", "wa", "aa"] },
  { label: "Sibilants", families: ["za", "zha", "ya"] },
  { label: "Stops", families: ["da", "ja", "ga"] },
  { label: "Ejectives", families: ["tha", "Cha", "pha", "tsa"] },
  { label: "Labials", families: ["fa", "pa"] },
];

interface FidelGridProps {
  characters: GeezCharacter[];
  learnedIds: Set<string>;
  onSelect: (character: GeezCharacter) => void;
}

export function FidelGrid({ characters, learnedIds, onSelect }: FidelGridProps) {
  const M = useMuseumTheme();

  const getChar = useCallback(
    (consonant: string, order: number) =>
      characters.find((c) => c.baseConsonant === consonant && c.order === order),
    [characters]
  );

  // The 1st-order glyph of each family, for the grid's left-hand label column.
  const familyLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const c of characters) {
      if (c.order === 1) labels[c.baseConsonant] = c.character;
    }
    return labels;
  }, [characters]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View style={{ flexDirection: "row", paddingHorizontal: 8, paddingBottom: 4, paddingTop: 16 }}>
        <View style={{ width: 40 }} />
        {VOWEL_LABELS.map((label) => (
          <View key={label} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 10, fontWeight: "500", color: M.muted }}>{label}</Text>
          </View>
        ))}
      </View>

      {FAMILY_GROUPS.map((group) => (
        <View key={group.label}>
          <View style={{ paddingHorizontal: 8, paddingBottom: 4, paddingTop: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
              {group.label}
            </Text>
          </View>

          {group.families.map((family) => (
            <View key={family} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 2 }}>
              <View style={{ width: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 15, color: M.sub }}>{familyLabels[family]}</Text>
              </View>

              {[1, 2, 3, 4, 5, 6, 7].map((order) => {
                const char = getChar(family, order);
                if (!char) return <View key={order} style={{ flex: 1 }} />;
                const learned = learnedIds.has(char.id);
                return (
                  <Pressable
                    key={char.id}
                    onPress={() => onSelect(char)}
                    style={{ marginHorizontal: 2, flex: 1, alignItems: "center", borderRadius: 8, paddingVertical: 6, backgroundColor: learned ? M.successBg : M.card }}
                    className="active:opacity-70"
                  >
                    <Text style={{ fontSize: 20, color: learned ? M.success : M.text }}>
                      {char.character}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
