import { NsibidiDetail } from "@/components/nsibidi/nsibidi-detail";
import { NsibidiGrid } from "@/components/nsibidi/nsibidi-grid";
import { ALL_NSIBIDI_CHARACTERS, type NsibidiCharacter } from "@/lib/data/nsibidi";
import { hapticSuccess } from "@/lib/haptics";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useNsibidiStore } from "@/store/nsibidi-store";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TOTAL = ALL_NSIBIDI_CHARACTERS.length;

export default function NsibidiLessonScreen() {
  const M = useMuseumTheme();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>

        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: M.sub }}>Characters learned</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: M.text }}>
              {learnedCount} / {TOTAL}
            </Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: M.border, overflow: "hidden" }}>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: M.accent,
                width: `${TOTAL > 0 ? (learnedCount / TOTAL) * 100 : 0}%`,
              }}
            />
          </View>
          <Text style={{ fontSize: 11, color: M.muted, marginTop: 8, lineHeight: 16 }}>
            Nsịbịdị is an indigenous Igbo script with ~2,572 characters. Rendered using the Akagu font.
          </Text>
        </View>

        <NsibidiGrid learnedIds={learnedIds} onSelect={setSelected} />

        {learnedCount === TOTAL && TOTAL > 0 && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: M.accent }}>All learned!</Text>
            <Pressable
              onPress={() => {}}
              style={{ marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}
            >
              <Text style={{ fontWeight: "700", color: M.accent }}>Review again</Text>
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
