import { CharacterDetail } from "@/components/geez/character-detail";
import { FidelGrid } from "@/components/geez/fidel-grid";
import { TracingCanvas } from "@/components/geez/tracing-canvas";
import { FIDEL_CHART, type GeezCharacter } from "@/lib/data/geez";
import { hapticSuccess } from "@/lib/haptics";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useGeezStore } from "@/store/geez-store";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "chart" | "practice";

const TOTAL_CHARS = FIDEL_CHART.length;

function TabSegment({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", borderRadius: 8, paddingVertical: 8, backgroundColor: active ? M.accent : "transparent" }}
      className="active:opacity-80"
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: active ? M.ink : M.sub }}>{label}</Text>
    </Pressable>
  );
}

export default function GeezLessonScreen() {
  const M = useMuseumTheme();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 13, color: M.sub }}>{t("geez.progress")}</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>
              {t("geez.learnedCount", { count: learnedCount, total: TOTAL_CHARS })}
            </Text>
          </View>
          <View style={{ marginTop: 8, height: 6, borderRadius: 999, backgroundColor: M.border }}>
            <View style={{ height: 6, borderRadius: 999, backgroundColor: M.success, width: `${TOTAL_CHARS > 0 ? (learnedCount / TOTAL_CHARS) * 100 : 0}%` }} />
          </View>
        </View>

        <View style={{ marginHorizontal: 20, marginTop: 12, flexDirection: "row", borderRadius: 10, backgroundColor: M.card, padding: 4, borderWidth: 1, borderColor: M.border }}>
          <TabSegment active={tab === "chart"} onPress={() => setTab("chart")} label={t("geez.chart", { count: TOTAL_CHARS })} />
          <TabSegment
            active={tab === "practice"}
            onPress={() => setTab("practice")}
            label={allLearned ? t("geez.practiceComplete") : t("geez.practiceTab", { remaining: unlearnedChars.length })}
          />
        </View>

        {tab === "chart" ? (
          <FidelGrid learnedIds={learnedIds} onSelect={setSelectedChar} />
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            {allLearned ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
                <Text style={{ fontSize: 48 }}>🎉</Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: M.text }}>
                  {t("geez.allLearned", { count: TOTAL_CHARS })}
                </Text>
                <Pressable
                  onPress={() => setTab("chart")}
                  style={{ marginTop: 8, borderRadius: 12, backgroundColor: M.accent, paddingHorizontal: 24, paddingVertical: 12 }}
                  className="active:opacity-80"
                >
                  <Text style={{ fontWeight: "600", color: M.ink }}>{t("geez.backToChart")}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 }}>
                  <Pressable
                    onPress={handlePrev}
                    disabled={practiceIndex <= 0}
                    style={{ borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, opacity: practiceIndex <= 0 ? 0.3 : 1 }}
                    className="active:opacity-70"
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: M.sub }}>{t("geez.prev")}</Text>
                  </Pressable>

                  <Text style={{ fontSize: 11, color: M.muted }}>
                    {t("geez.remaining", { current: practiceIndex + 1, total: unlearnedChars.length })}
                  </Text>

                  <Pressable
                    onPress={handleNext}
                    disabled={unlearnedChars.length <= 1}
                    style={{ borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, opacity: unlearnedChars.length <= 1 ? 0.3 : 1 }}
                    className="active:opacity-70"
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: M.sub }}>{t("geez.next")}</Text>
                  </Pressable>
                </View>

                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <TracingCanvas character={practiceChar} />
                </View>

                <View style={{ gap: 8, paddingBottom: 24, paddingTop: 8 }}>
                  <Pressable
                    onPress={handleMarkPracticeLearned}
                    style={{ alignItems: "center", borderRadius: 16, backgroundColor: M.success, paddingVertical: 16 }}
                    className="active:opacity-80"
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>{t("geez.gotItMarkLearned")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleNext}
                    disabled={unlearnedChars.length <= 1}
                    style={{ alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: M.border, paddingVertical: 12 }}
                    className="active:opacity-70"
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: M.sub }}>{t("geez.skipNext")}</Text>
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
