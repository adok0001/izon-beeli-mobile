import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FidelGrid } from "@/components/geez/fidel-grid";
import { CharacterDetail } from "@/components/geez/character-detail";
import { TracingCanvas } from "@/components/geez/tracing-canvas";
import { useGeezStore } from "@/store/geez-store";
import { FIDEL_CHART, type GeezCharacter } from "@/lib/data/geez";
import { hapticSuccess } from "@/lib/haptics";
import { useTranslation } from "react-i18next";

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
        active ? "bg-blue-500" : "bg-transparent"
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
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("chart");
  const [selectedChar, setSelectedChar] = useState<GeezCharacter | null>(null);
  // Pinned character: set when user taps "Practice tracing" from the detail modal.
  // null = auto-pick next unlearned.
  const [pinnedChar, setPinnedChar] = useState<GeezCharacter | null>(null);
  const { learnedIds, markLearned, hydrate, _hydrated } = useGeezStore();

  useEffect(() => {
    hydrate();
  }, []);

  const learnedCount = learnedIds.size;

  // Ordered list of all unlearned characters
  const unlearnedChars = useMemo(
    () => FIDEL_CHART.filter((c) => !learnedIds.has(c.id)),
    [learnedIds]
  );

  // The character currently being practiced
  const practiceChar = useMemo(() => {
    if (pinnedChar) return pinnedChar;
    return unlearnedChars[0] ?? FIDEL_CHART[0];
  }, [pinnedChar, unlearnedChars]);

  // Index within unlearned list (for Next navigation)
  const practiceIndex = useMemo(
    () => unlearnedChars.findIndex((c) => c.id === practiceChar.id),
    [unlearnedChars, practiceChar]
  );

  const handleMarkLearned = useCallback(() => {
    if (selectedChar) {
      markLearned(selectedChar.id);
      hapticSuccess();
      setSelectedChar(null);
    }
  }, [selectedChar, markLearned]);

  const handlePracticeFromDetail = useCallback(() => {
    if (selectedChar) {
      setPinnedChar(selectedChar);
      setSelectedChar(null);
      setTab("practice");
    }
  }, [selectedChar]);

  const handleMarkPracticeLearned = useCallback(() => {
    markLearned(practiceChar.id);
    hapticSuccess();
    // Advance to next unlearned
    setPinnedChar(null);
  }, [practiceChar, markLearned]);

  const handleNext = useCallback(() => {
    const next = unlearnedChars[practiceIndex + 1] ?? unlearnedChars[0];
    if (next) setPinnedChar(next);
  }, [unlearnedChars, practiceIndex]);

  const handlePrev = useCallback(() => {
    if (practiceIndex <= 0) return;
    setPinnedChar(unlearnedChars[practiceIndex - 1]);
  }, [unlearnedChars, practiceIndex]);

  if (!_hydrated) return null;

  const allLearned = unlearnedChars.length === 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: t("geez.title"),
          headerBackTitle: t("common.back"),
        }}
      />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={[]}
      >
        {/* Progress bar */}
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("geez.progress")}
            </Text>
            <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {t("geez.learnedCount", { count: learnedCount, total: TOTAL_CHARS })}
            </Text>
          </View>
          <View className="mt-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
            <View
              className="h-2 rounded-full bg-green-500"
              style={{
                width: `${TOTAL_CHARS > 0 ? (learnedCount / TOTAL_CHARS) * 100 : 0}%`,
              }}
            />
          </View>
        </View>

        {/* Tab segments */}
        <View className="mx-5 mt-3 flex-row rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          <TabSegment
            active={tab === "chart"}
            onPress={() => setTab("chart")}
            label={t("geez.chart", { count: TOTAL_CHARS })}
          />
          <TabSegment
            active={tab === "practice"}
            onPress={() => setTab("practice")}
            label={
              allLearned
                ? t("geez.practiceComplete")
                : t("geez.practiceTab", { remaining: unlearnedChars.length })
            }
          />
        </View>

        {/* Content */}
        {tab === "chart" ? (
          <FidelGrid learnedIds={learnedIds} onSelect={setSelectedChar} />
        ) : (
          <View className="flex-1 px-5">
            {allLearned ? (
              <View className="flex-1 items-center justify-center gap-3">
                <Text className="text-5xl">🎉</Text>
                <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                  {t("geez.allLearned", { count: TOTAL_CHARS })}
                </Text>
                <Pressable
                  onPress={() => setTab("chart")}
                  className="mt-2 rounded-xl bg-blue-500 px-6 py-3 active:opacity-80"
                >
                  <Text className="font-semibold text-white">{t("geez.backToChart")}</Text>
                </Pressable>
              </View>
            ) : (
              <View className="flex-1">
                {/* Navigation header */}
                <View className="flex-row items-center justify-between py-3">
                  <Pressable
                    onPress={handlePrev}
                    disabled={practiceIndex <= 0}
                    className={`rounded-lg px-4 py-2 ${
                      practiceIndex <= 0
                        ? "opacity-30"
                        : "bg-neutral-100 active:opacity-70 dark:bg-neutral-800"
                    }`}
                  >
                    <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      {t("geez.prev")}
                    </Text>
                  </Pressable>

                  <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t("geez.remaining", { current: practiceIndex + 1, remaining: unlearnedChars.length })}
                  </Text>

                  <Pressable
                    onPress={handleNext}
                    disabled={unlearnedChars.length <= 1}
                    className={`rounded-lg px-4 py-2 ${
                      unlearnedChars.length <= 1
                        ? "opacity-30"
                        : "bg-neutral-100 active:opacity-70 dark:bg-neutral-800"
                    }`}
                  >
                    <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      {t("geez.next")}
                    </Text>
                  </Pressable>
                </View>

                {/* Tracing canvas */}
                <View className="flex-1 items-center justify-center">
                  <TracingCanvas character={practiceChar} />
                </View>

                {/* Actions */}
                <View className="gap-2 pb-6 pt-2">
                  <Pressable
                    onPress={handleMarkPracticeLearned}
                    className="items-center rounded-2xl bg-green-500 py-4 active:opacity-80"
                  >
                    <Text className="text-base font-bold text-white">
                      {t("geez.gotItMarkLearned")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleNext}
                    disabled={unlearnedChars.length <= 1}
                    className="items-center rounded-2xl border border-neutral-200 py-3 active:opacity-70 dark:border-neutral-700"
                  >
                    <Text className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                      {t("geez.skipNext")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Character detail modal */}
        <CharacterDetail
          character={selectedChar}
          isLearned={selectedChar ? learnedIds.has(selectedChar.id) : false}
          onMarkLearned={handleMarkLearned}
          onPractice={handlePracticeFromDetail}
          onClose={() => setSelectedChar(null)}
        />
      </SafeAreaView>
    </>
  );
}
