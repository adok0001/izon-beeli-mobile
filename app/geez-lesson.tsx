import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FidelGrid } from "@/components/geez/fidel-grid";
import { CharacterDetail } from "@/components/geez/character-detail";
import { TracingCanvas } from "@/components/geez/tracing-canvas";
import { useGeezStore } from "@/store/geez-store";
import { FIDEL_CHART, type GeezCharacter } from "@/lib/data/geez";
import { hapticSuccess } from "@/lib/haptics";

type Tab = "chart" | "practice";

const TOTAL_CHARS = FIDEL_CHART.length;

function TabSegment({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-lg py-2 ${
        active
          ? "bg-blue-500"
          : "bg-transparent"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          active ? "text-white" : "text-neutral-600 dark:text-neutral-400"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function GeezLessonScreen() {
  const [tab, setTab] = useState<Tab>("chart");
  const [selectedChar, setSelectedChar] = useState<GeezCharacter | null>(null);
  const { learnedIds, markLearned, hydrate, _hydrated } = useGeezStore();

  useEffect(() => {
    hydrate();
  }, []);

  const learnedCount = learnedIds.size;

  // Pick a random unlearned character for practice
  const practiceChar = useMemo(() => {
    const unlearned = FIDEL_CHART.filter((c) => !learnedIds.has(c.id));
    if (unlearned.length === 0) return FIDEL_CHART[0];
    return unlearned[Math.floor(Math.random() * unlearned.length)];
    // Re-pick when learnedIds changes
  }, [learnedIds]);

  const handleMarkLearned = useCallback(() => {
    if (selectedChar) {
      markLearned(selectedChar.id);
      hapticSuccess();
    }
  }, [selectedChar, markLearned]);

  if (!_hydrated) return null;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Learn Ge'ez Script",
          headerBackTitle: "Back",
        }}
      />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={[]}
      >
        {/* Progress indicator */}
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Progress
            </Text>
            <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {learnedCount}/{TOTAL_CHARS} characters learned
            </Text>
          </View>
          <View className="mt-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
            <View
              className="h-2 rounded-full bg-green-500"
              style={{
                width: `${
                  TOTAL_CHARS > 0 ? (learnedCount / TOTAL_CHARS) * 100 : 0
                }%`,
              }}
            />
          </View>
        </View>

        {/* Tab segments */}
        <View className="mx-5 mt-3 flex-row rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          <TabSegment
            active={tab === "chart"}
            onPress={() => setTab("chart")}
            label="Chart"
          />
          <TabSegment
            active={tab === "practice"}
            onPress={() => setTab("practice")}
            label="Practice"
          />
        </View>

        {/* Content */}
        {tab === "chart" ? (
          <FidelGrid learnedIds={learnedIds} onSelect={setSelectedChar} />
        ) : (
          <View className="flex-1 items-center justify-center px-5">
            <TracingCanvas character={practiceChar} />
          </View>
        )}

        {/* Character detail modal */}
        <CharacterDetail
          character={selectedChar}
          isLearned={selectedChar ? learnedIds.has(selectedChar.id) : false}
          onMarkLearned={handleMarkLearned}
          onClose={() => setSelectedChar(null)}
        />
      </SafeAreaView>
    </>
  );
}
