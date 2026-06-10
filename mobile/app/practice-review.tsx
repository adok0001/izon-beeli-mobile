import { ListeningQuestion } from "@/components/quiz/listening-question";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Button } from "@/components/ui/button";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useWordProgress } from "@/lib/hooks/use-word-progress";
import { useLanguageStore } from "@/store/language-store";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DictionaryEntry } from "@/lib/dictionary";

const BOX_LABELS = ["", "New", "Learning", "Familiar", "Proficient", "Mastered"];

function WordCard({ entry, box }: { entry: DictionaryEntry; box: number }) {
  const M = useMuseumTheme();
  const router = useRouter();

  const boxColor =
    box <= 1 ? M.error :
    box === 2 ? M.warning :
    box === 3 ? M.accent :
    box === 4 ? M.info :
    M.success;

  return (
    <Pressable
      onPress={() => router.push(`/word/${entry.id}`)}
      style={{
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: M.card,
        padding: 16,
        borderWidth: 1,
        borderColor: M.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: M.text }}>{entry.word}</Text>
          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: `${boxColor}22` }}>
            <Text style={{ fontSize: 10, fontWeight: "600", color: boxColor }}>{BOX_LABELS[box] ?? "New"}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: M.sub }}>{entry.english}</Text>
        {entry.example && (
          <Text style={{ marginTop: 4, fontSize: 11, fontStyle: "italic", color: M.muted }}>
            {entry.example}
          </Text>
        )}
      </View>
      {entry.audioUrl && (
        <ListeningQuestion audioSource={entry.audioUrl} />
      )}
    </Pressable>
  );
}

export default function PracticeReviewScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const { data: entries = [] } = useDictionary(selectedLanguageId);
  const { data: progressData } = useWordProgress(selectedLanguageId);

  const progressMap = new Map<string, number>();
  for (const row of progressData?.rows ?? []) {
    progressMap.set(row.wordId, row.box);
  }

  // Show words the user has seen (has a progress record) sorted by box ascending
  const reviewWords = entries
    .filter((e) => progressMap.has(e.id))
    .map((e) => ({ entry: e, box: progressMap.get(e.id) ?? 1 }))
    .sort((a, b) => a.box - b.box);

  const weakWords = reviewWords.filter((w) => w.box <= 2);
  const allWords = reviewWords;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Practice Review",
          headerShown: true,
          presentation: "modal",
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        {allWords.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <IconSymbol name="book.closed" size={48} color={M.muted} />
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: "600", color: M.text, textAlign: "center" }}>
              No words to review yet
            </Text>
            <Text style={{ marginTop: 8, fontSize: 13, color: M.sub, textAlign: "center" }}>
              Complete a quiz to start tracking your word progress.
            </Text>
            <Button
              label="Start a Quiz"
              onPress={() => router.replace("/quiz")}
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          <FlatList
            data={allWords}
            keyExtractor={(item) => item.entry.id}
            renderItem={({ item }) => <WordCard entry={item.entry} box={item.box} />}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
            ListHeaderComponent={
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: M.sub }}>
                  {weakWords.length > 0
                    ? `${weakWords.length} word${weakWords.length !== 1 ? "s" : ""} need more practice`
                    : "All studied words are doing well!"}
                </Text>
                {progressData && (
                  <Text style={{ marginTop: 4, fontSize: 12, color: M.muted }}>
                    {progressData.masteredCount} of {entries.length} words mastered
                  </Text>
                )}
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
}
