import { useState, useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWordBankStore } from "@/store/wordbank-store";
import {
  IZON_DICTIONARY,
  searchDictionary,
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  type DictionaryEntry,
  type DictionaryCategory,
} from "@/lib/dictionary";

type ViewMode = "all" | "saved";

function WordRow({ entry }: { entry: DictionaryEntry }) {
  const { isSaved, toggle } = useWordBankStore();
  const saved = isSaved(entry.id);

  return (
    <View className="flex-row items-center border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
      <View className="flex-1">
        <Text className="text-base font-semibold text-neutral-900 dark:text-white">
          {entry.izon}
        </Text>
        <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
          {entry.english}
        </Text>
      </View>
      <Pressable onPress={() => toggle(entry.id)} hitSlop={8}>
        <IconSymbol
          name={saved ? "star.fill" : "star.fill"}
          size={20}
          color={saved ? "#f59e0b" : "#d1d5db"}
        />
      </Pressable>
    </View>
  );
}

export default function DictionaryScreen() {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const { savedIds, count } = useWordBankStore();

  const sections = useMemo(() => {
    const filtered =
      query.trim().length > 0
        ? searchDictionary(query)
        : IZON_DICTIONARY;

    const entries =
      viewMode === "saved"
        ? filtered.filter((e) => savedIds.has(e.id))
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
  }, [query, viewMode, savedIds]);

  const savedCount = count();

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
              placeholder="Search Izon or English..."
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
                All Words ({IZON_DICTIONARY.length})
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
          renderSectionHeader={({ section }) => (
            <View className="bg-neutral-50 px-5 py-2 dark:bg-neutral-800/80">
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => <WordRow entry={item} />}
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
