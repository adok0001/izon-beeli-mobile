import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MatchingBoard } from "@/components/quiz/matching-board";
import { useMatchingStore } from "@/store/matching-store";
import { generateMatchingPairs } from "@/lib/quiz-engine";
import { useLanguageStore } from "@/store/language-store";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { getLanguageName } from "@/lib/mock-data";
import { hapticHeavy } from "@/lib/haptics";
import { playFinishSound } from "@/lib/sounds";

export default function MatchingGameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string }>();
  const { selectedLanguageId } = useLanguageStore();
  const { data: dictionaryEntries = [], isLoading: isDictLoading } = useDictionary(selectedLanguageId);
  const { phase, startGame, getResult, reset } = useMatchingStore();
  const [isEmpty, setIsEmpty] = useState(false);
  const initialized = useRef(false);

  const languageName = getLanguageName(selectedLanguageId);

  useEffect(() => {
    if (initialized.current) return;
    if (isDictLoading) return;
    initialized.current = true;

    const pairs = generateMatchingPairs(
      {
        languageId: selectedLanguageId,
        courseId: params.courseId,
        pairCount: 8,
      },
      dictionaryEntries
    );

    if (pairs.length === 0) {
      setIsEmpty(true);
    } else {
      startGame(pairs);
    }
  }, [isDictLoading]);

  useEffect(() => {
    if (phase === "results") {
      hapticHeavy();
      playFinishSound();
    }
  }, [phase]);

  const handlePlayAgain = useCallback(() => {
    const pairs = generateMatchingPairs(
      {
        languageId: selectedLanguageId,
        courseId: params.courseId,
        pairCount: 8,
      },
      dictionaryEntries
    );
    if (pairs.length > 0) {
      startGame(pairs);
    }
  }, [selectedLanguageId, params.courseId, dictionaryEntries, startGame]);

  const result = phase === "results" ? getResult() : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: `${languageName} Matching`,
          headerShown: true,
          presentation: "modal",
          headerLeft: () => (
            <Pressable
              onPress={() => {
                reset();
                router.back();
              }}
              hitSlop={8}
            >
              <IconSymbol name="xmark" size={22} color="#9ca3af" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {isEmpty ? (
          <View className="flex-1 items-center justify-center px-8">
            <IconSymbol name="rectangle.grid.2x2" size={56} color="#d1d5db" />
            <Text className="mt-4 text-center text-lg font-semibold text-neutral-700 dark:text-neutral-300">
              Not enough vocabulary yet
            </Text>
            <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
              This language needs at least 8 dictionary entries to play the matching game.
            </Text>
            <Pressable
              onPress={() => {
                reset();
                router.back();
              }}
              className="mt-6 rounded-xl bg-blue-500 px-8 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-white">Go Back</Text>
            </Pressable>
          </View>
        ) : phase === "results" && result ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
              <Text className="text-3xl font-bold text-green-600 dark:text-green-400">
                {result.accuracy}%
              </Text>
            </View>

            <Text className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
              All Matched!
            </Text>
            <Text className="mb-1 text-base text-neutral-500 dark:text-neutral-400">
              {result.totalPairs} pairs in {result.attempts} attempts
            </Text>
            <Text className="mb-6 text-base text-neutral-500 dark:text-neutral-400">
              Time: {result.timeElapsed}s
            </Text>

            <View className="w-full gap-3">
              <Pressable
                onPress={handlePlayAgain}
                className="items-center rounded-xl bg-blue-500 py-4 active:opacity-80"
              >
                <Text className="text-base font-semibold text-white">
                  Play Again
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  reset();
                  router.back();
                }}
                className="items-center rounded-xl border-2 border-neutral-200 py-4 active:opacity-80 dark:border-neutral-700"
              >
                <Text className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                  Back to Learn
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="flex-1 px-5 pt-4">
            <Text className="mb-4 text-center text-base text-neutral-600 dark:text-neutral-400">
              Match each word with its English translation
            </Text>
            <MatchingBoard />
          </View>
        )}
      </SafeAreaView>
    </>
  );
}
