import { useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import {
  FIDEL_CHART,
  FAMILY_GROUPS,
  FAMILY_LABELS,
  type GeezCharacter,
} from "@/lib/data/geez";

const VOWEL_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

interface FidelGridProps {
  learnedIds: Set<string>;
  onSelect: (character: GeezCharacter) => void;
}

export function FidelGrid({ learnedIds, onSelect }: FidelGridProps) {
  const getChar = useCallback(
    (consonant: string, order: number) =>
      FIDEL_CHART.find(
        (c) => c.baseConsonant === consonant && c.order === order
      ),
    []
  );

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-8"
    >
      {/* Vowel order header */}
      <View className="flex-row px-2 pb-1 pt-4">
        <View className="w-10" />
        {VOWEL_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center">
            <Text className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Character rows grouped by consonant family group */}
      {FAMILY_GROUPS.map((group) => (
        <View key={group.label}>
          {/* Group label */}
          <View className="px-2 pb-1 pt-3">
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {group.label}
            </Text>
          </View>

          {group.families.map((family) => (
            <View key={family} className="flex-row items-center px-2 py-0.5">
              {/* Family label — shows the 1st-order character */}
              <View className="w-10 items-center">
                <Text className="text-base text-neutral-600 dark:text-neutral-300">
                  {FAMILY_LABELS[family]}
                </Text>
              </View>

              {[1, 2, 3, 4, 5, 6, 7].map((order) => {
                const char = getChar(family, order);
                if (!char) return <View key={order} className="flex-1" />;
                const learned = learnedIds.has(char.id);
                return (
                  <Pressable
                    key={char.id}
                    onPress={() => onSelect(char)}
                    className={`mx-0.5 flex-1 items-center rounded-lg py-1.5 active:opacity-70 ${
                      learned
                        ? "bg-green-100 dark:bg-green-900/40"
                        : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-xl ${
                        learned
                          ? "text-green-800 dark:text-green-200"
                          : "text-neutral-900 dark:text-white"
                      }`}
                    >
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
