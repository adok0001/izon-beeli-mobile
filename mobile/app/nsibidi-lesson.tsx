import { NsibidiDetail } from "@/components/nsibidi/nsibidi-detail";
import { NsibidiGrid } from "@/components/nsibidi/nsibidi-grid";
import { NSIBIDI_CHARACTERS, type NsibidiCharacter } from "@/lib/data/nsibidi";
import { hapticSuccess } from "@/lib/haptics";
import { useNsibidiStore } from "@/store/nsibidi-store";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TOTAL = NSIBIDI_CHARACTERS.length;
const ACCENT = "#f59e0b";

export default function NsibidiLessonScreen() {
  const [selected, setSelected] = useState<NsibidiCharacter | null>(null);
  const { learnedIds, markLearned, hydrate, _hydrated } = useNsibidiStore();

  useEffect(() => { hydrate(); }, []);

  const learnedCount = learnedIds.size;

  const handleMarkLearned = useCallback(() => {
    if (selected) {
      markLearned(selected.id);
      hapticSuccess();
      setSelected(null);
    }
  }, [selected, markLearned]);

  if (!_hydrated) return null;

  return (
    <>
      <Stack.Screen options={{ title: "Nsịbịdị Script", headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>

        {/* Progress */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>Characters learned</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151" }}>
              {learnedCount} / {TOTAL}
            </Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: "#f3f4f6", overflow: "hidden" }}>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: ACCENT,
                width: `${TOTAL > 0 ? (learnedCount / TOTAL) * 100 : 0}%`,
              }}
            />
          </View>
          <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 8, lineHeight: 16 }}>
            Nsịbịdị is an indigenous Igbo script with ~2,572 characters. Rendered using the Akagu font.
          </Text>
        </View>

        <NsibidiGrid learnedIds={learnedIds} onSelect={setSelected} />

        {learnedCount === TOTAL && TOTAL > 0 && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: ACCENT }}>All learned!</Text>
            <Pressable onPress={() => {}} style={{ marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(245,158,11,0.1)" }}>
              <Text style={{ fontWeight: "700", color: ACCENT }}>Review again</Text>
            </Pressable>
          </View>
        )}

        <NsibidiDetail
          character={selected}
          isLearned={selected ? learnedIds.has(selected.id) : false}
          onMarkLearned={handleMarkLearned}
          onClose={() => setSelected(null)}
        />
      </SafeAreaView>
    </>
  );
}
