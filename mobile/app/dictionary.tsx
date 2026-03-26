import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  ALL_CATEGORIES,
  searchDictionary,
  type DictionaryCategory,
  type DictionaryEntry,
} from "@/lib/dictionary";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useRemoveWord, useSaveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { useLanguageStore } from "@/store/language-store";
import { Stack, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ViewMode = "all" | "saved" | "needs_audio";

function WordRow({
  entry,
  saved,
  onToggle,
  onPress,
}: {
  entry: DictionaryEntry;
  saved: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const hasAudio = !!entry.audioUrl;

  return (
    <Pressable
      onPress={onPress}
      className="border-b border-neutral-100 px-5 py-3 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800/60"
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">
              {entry.word}
            </Text>
            {!hasAudio && (
              <View className="rounded bg-orange-100 px-1.5 py-0.5 dark:bg-orange-900/30">
                <Text className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                  {t("dictionaryPage.needsAudio")}
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {entry.english.includes(";")
              ? entry.english.split(";").map((m) => m.trim()).filter(Boolean).join(" · ")
              : entry.english}
          </Text>
        </View>
        <WordAudioButton audioSource={entry.audioUrl} word={entry.word} />
        <Pressable onPress={onToggle} hitSlop={8} className="ml-1">
          <IconSymbol
            name={saved ? "star.fill" : "star"}
            size={20}
            color={saved ? "#f59e0b" : "#d1d5db"}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function DictionaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const { data: savedIds } = useWordBank();
  const saveWord = useSaveWord();
  const removeWord = useRemoveWord();
  const { selectedLanguageId } = useLanguageStore();
  const { data: allEntries = [], isLoading, refetch } = useDictionary(selectedLanguageId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const savedSet = new Set(savedIds ?? []);

  const handleToggle = (entryId: string) => {
    if (savedSet.has(entryId)) {
      removeWord.mutate(entryId);
    } else {
      saveWord.mutate(entryId);
    }
  };

  const sections = useMemo(() => {
    const filtered =
      query.trim().length > 0
        ? searchDictionary(query, allEntries)
        : allEntries;

    const entries =
      viewMode === "saved"
        ? filtered.filter((e) => savedSet.has(e.id))
        : viewMode === "needs_audio"
          ? filtered.filter((e) => !e.audioUrl)
          : filtered;

    // Group by category
    const grouped = new Map<DictionaryCategory, DictionaryEntry[]>();
    for (const e of entries) {
      const existing = grouped.get(e.category) ?? [];
      existing.push(e);
      grouped.set(e.category, existing);
    }

    // Sort categories by predefined order
    type CategoryI18nKey = `dictionaryPage.categoryLabels.${DictionaryCategory}`;
    return ALL_CATEGORIES
      .filter((cat) => grouped.has(cat))
      .map((cat) => ({
        title: t(`dictionaryPage.categoryLabels.${cat}` as CategoryI18nKey),
        data: grouped.get(cat)!,
      }));
  }, [query, viewMode, allEntries, savedIds, t]);

  const savedCount = allEntries.filter((e) => savedSet.has(e.id)).length;
  const needsAudioCount = allEntries.filter((e) => !e.audioUrl).length;

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
              placeholder={t("dictionaryPage.searchPlaceholderMobile")}
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
                {t("dictionaryPage.allWordsCount", { count: allEntries.length })}
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
                {t("dictionaryPage.myWordsCount", { count: savedCount })}
              </Text>
            </Pressable>
            {needsAudioCount > 0 && (
              <Pressable
                onPress={() => setViewMode("needs_audio")}
                className={`flex-1 items-center rounded-lg py-2 ${
                  viewMode === "needs_audio"
                    ? "bg-orange-500"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    viewMode === "needs_audio"
                      ? "text-white"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {t("dictionaryPage.needsAudioCount", { count: needsAudioCount })}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Review CTA — visible when viewing saved words */}
          {viewMode === "saved" && savedCount > 0 && (
            <Pressable
              onPress={() => router.push("/word-review")}
              className="mt-3 flex-row items-center justify-center rounded-xl bg-emerald-500 py-2.5 active:opacity-80"
            >
              <IconSymbol name="brain.head.profile" size={16} color="#fff" />
              <Text className="ml-2 text-sm font-semibold text-white">
                {t("dictionaryPage.reviewSavedWords")}
              </Text>
            </Pressable>
          )}

          {/* Contribute CTA — visible when viewing needs_audio */}
          {viewMode === "needs_audio" && needsAudioCount > 0 && (
            <View className="mt-3 rounded-xl bg-orange-50 px-4 py-3 dark:bg-orange-900/20">
              <Text className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {t("dictionaryPage.needsAudioCta", { count: needsAudioCount })}
              </Text>
              <Text className="mt-0.5 text-xs text-orange-600 dark:text-orange-400">
                {t("dictionaryPage.needsAudioCtaDesc")}
              </Text>
            </View>
          )}
        </View>

        {/* Loading state */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          /* Word list */
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
                onPress={() =>
                  router.push({
                    pathname: "/word/[id]",
                    params: { id: item.id, languageId: item.languageId },
                  })
                }
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
                    ? t("dictionaryPage.noSavedWords")
                    : t("dictionaryPage.noResults")}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
