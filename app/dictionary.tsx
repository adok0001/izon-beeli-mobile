import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  searchDictionary,
  type DictionaryCategory,
  type DictionaryEntry,
} from "@/lib/dictionary";
import { getDictionaryForLanguage } from "@/lib/data";
import { useApprovedWords } from "@/lib/hooks/use-contributions";
import { useRemoveWord, useSaveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { useLanguageStore } from "@/store/language-store";
import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ViewMode = "all" | "saved";

function WordRow({ entry, saved, onToggle }: { entry: DictionaryEntry; saved: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = !!(entry.pronunciation || entry.example);

  return (
    <Pressable
      onPress={hasDetails ? () => setExpanded((v) => !v) : undefined}
      className="border-b border-neutral-100 px-5 py-3 dark:border-neutral-800"
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {entry.word}
          </Text>
          <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {entry.english}
          </Text>
        </View>
        {entry.audioUrl && (
          <WordAudioButton audioSource={entry.audioUrl} />
        )}
        <Pressable onPress={onToggle} hitSlop={8}>
          <IconSymbol
            name={saved ? "star.fill" : "star"}
            size={20}
            color={saved ? "#f59e0b" : "#d1d5db"}
          />
        </Pressable>
      </View>

      {expanded && (
        <View className="mt-2">
          {entry.pronunciation && (
            <Text className="text-sm italic text-neutral-500 dark:text-neutral-400">
              /{entry.pronunciation}/
            </Text>
          )}
          {entry.example && (
            <View className="mt-1.5 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
              <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                {entry.example}
              </Text>
              {entry.exampleTranslation && (
                <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {entry.exampleTranslation}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function DictionaryScreen() {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const { data: savedIds } = useWordBank();
  const saveWord = useSaveWord();
  const removeWord = useRemoveWord();
  const { selectedLanguageId } = useLanguageStore();
  const { data: approvedWords, refetch: refetchApproved } = useApprovedWords(selectedLanguageId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchApproved();
    setRefreshing(false);
  }, [refetchApproved]);

  const savedSet = new Set(savedIds ?? []);

  const handleToggle = (entryId: string) => {
    if (savedSet.has(entryId)) {
      removeWord.mutate(entryId);
    } else {
      saveWord.mutate(entryId);
    }
  };

  // Merge local dictionary (for Izon) with API-sourced approved contributions
  const allEntries = useMemo(() => {
    const local = getDictionaryForLanguage(selectedLanguageId);
    const contributed = approvedWords ?? [];
    return [...local, ...contributed];
  }, [selectedLanguageId, approvedWords]);

  const sections = useMemo(() => {
    const filtered =
      query.trim().length > 0
        ? searchDictionary(query, allEntries)
        : allEntries;

    const entries =
      viewMode === "saved"
        ? filtered.filter((e) => savedSet.has(e.id))
        : filtered;

    // Group by category
    const grouped = new Map<DictionaryCategory, DictionaryEntry[]>();
    for (const e of entries) {
      const existing = grouped.get(e.category) ?? [];
      existing.push(e);
      grouped.set(e.category, existing);
    }

    // Sort categories by predefined order
    return ALL_CATEGORIES
      .filter((cat) => grouped.has(cat))
      .map((cat) => ({
        title: CATEGORY_LABELS[cat],
        data: grouped.get(cat)!,
      }));
  }, [query, viewMode, savedSet.size]);

  const savedCount = savedSet.size;

  return (
    <>
      <Stack.Screen options={{ title: "Dictionary", headerBackTitle: "Back" }} />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={[]}
      >
        {/* Search bar */}
        <View className="border-b border-neutral-200 px-5 pb-3 pt-2 dark:border-neutral-700">
          <View className="flex-row items-center rounded-xl bg-neutral-100 px-3 dark:bg-neutral-800">
            <IconSymbol name="magnifyingglass" size={18} color="#9ca3af" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for a word..."
              placeholderTextColor="#9ca3af"
              className="ml-2 flex-1 py-2.5 text-base text-neutral-900 dark:text-white"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <IconSymbol name="xmark" size={16} color="#9ca3af" />
              </Pressable>
            )}
          </View>

          {/* View toggle */}
          <View className="mt-3 flex-row gap-2">
            <Pressable
              onPress={() => setViewMode("all")}
              className={`flex-1 items-center rounded-lg py-2 ${
                viewMode === "all"
                  ? "bg-blue-500"
                  : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  viewMode === "all"
                    ? "text-white"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                All Words ({allEntries.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode("saved")}
              className={`flex-1 items-center rounded-lg py-2 ${
                viewMode === "saved"
                  ? "bg-amber-500"
                  : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  viewMode === "saved"
                    ? "text-white"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                My Words ({savedCount})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Word list */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderSectionHeader={({ section }) => (
            <View className="bg-neutral-50 px-5 py-2 dark:bg-neutral-800/80">
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <WordRow
              entry={item}
              saved={savedSet.has(item.id)}
              onToggle={() => handleToggle(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <IconSymbol
                name={viewMode === "saved" ? "star.fill" : "magnifyingglass"}
                size={40}
                color="#d1d5db"
              />
              <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
                {viewMode === "saved"
                  ? "No saved words yet. Tap the star on any word to save it."
                  : "No results found. Try a different search term."}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}
