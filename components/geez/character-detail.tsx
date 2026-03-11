import { View, Text, Pressable, Modal } from "react-native";
import type { GeezCharacter } from "@/lib/data/geez";

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
        className="flex-1 items-center justify-center bg-black/50"
      >
        <Pressable
          onPress={() => {}}
          className="mx-8 w-72 rounded-2xl bg-white p-6 dark:bg-neutral-800"
        >
          {/* Large character */}
          <View className="items-center pb-4">
            <Text className="text-[80px] leading-[96px] text-neutral-900 dark:text-white">
              {character.character}
            </Text>
            <Text className="mt-1 text-base font-semibold text-neutral-500 dark:text-neutral-400">
              {character.romanization}
            </Text>
          </View>

          {/* Info rows */}
          <View className="gap-2 pb-6">
            <View className="flex-row justify-between">
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                Consonant family
              </Text>
              <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                {character.baseConsonant}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                Vowel order
              </Text>
              <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                {ORDER_LABELS[character.order] ?? `${character.order}th`}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-2">
            <Pressable
              onPress={onPractice}
              className="items-center rounded-xl bg-blue-500 py-3 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">
                Practice tracing
              </Text>
            </Pressable>

            {isLearned ? (
              <View className="items-center rounded-xl bg-green-100 py-3 dark:bg-green-900/40">
                <Text className="text-sm font-semibold text-green-700 dark:text-green-300">
                  ✓ Learned
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={onMarkLearned}
                className="items-center rounded-xl border border-neutral-200 py-3 active:opacity-70 dark:border-neutral-700"
              >
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Mark as learned
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
