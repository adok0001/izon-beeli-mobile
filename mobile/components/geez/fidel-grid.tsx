import { useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import {
  FIDEL_CHART,
  FAMILY_GROUPS,
  FAMILY_LABELS,
  type GeezCharacter,
} from "@/lib/data/geez";
import { useMuseumTheme } from "@/lib/use-museum-theme";

const VOWEL_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

interface FidelGridProps {
  learnedIds: Set<string>;
  onSelect: (character: GeezCharacter) => void;
}

export function FidelGrid({ learnedIds, onSelect }: FidelGridProps) {
  const M = useMuseumTheme();

  const getChar = useCallback(
    (consonant: string, order: number) =>
      FIDEL_CHART.find(
        (c) => c.baseConsonant === consonant && c.order === order
      ),
    []
  );

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
                <Text style={{ fontSize: 15, color: M.sub }}>{FAMILY_LABELS[family]}</Text>
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
