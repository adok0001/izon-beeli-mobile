import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { NsibidiText } from "@/components/nsibidi/nsibidi-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ActivityIndicator } from "react-native";
import {
  ALL_CATEGORIES,
  searchDictionary,
  type DictionaryCategory,
  type DictionaryEntry,
} from "@/lib/dictionary";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useIgboSearch } from "@/lib/hooks/use-igbo-search";
import { useRecentlyViewed } from "@/lib/hooks/use-recently-viewed";
import { useRemoveWord, useSaveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { useDictionaryNavStore } from "@/store/dictionary-nav-store";
import { useLanguageStore } from "@/store/language-store";
import { Stack, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingScreen } from "@/components/loading-screen";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type ViewMode = "all" | "saved" | "needs_audio";

type Section = {
  title: string;
  category: DictionaryCategory;
  data: DictionaryEntry[];
};

function SwipeActions({
  saved,
  onToggle,
  side,
}: {
  saved: boolean;
  onToggle: () => void;
  side: "left" | "right";
}) {
  if (side === "right" && saved) return null;
  if (side === "left" && !saved) return null;

  return (
    <Pressable
      onPress={onToggle}
      className={`w-16 items-center justify-center ${
        side === "right" ? "bg-amber-400" : "bg-neutral-200 dark:bg-neutral-700"
      }`}
    >
      <IconSymbol
        name={side === "right" ? "star.fill" : "star.slash"}
        size={22}
        color={side === "right" ? "#fff" : "#9ca3af"}
      />
    </Pressable>
  );
}

function WordRow({
  entry,
  saved,
  isEducator,
  onToggle,
  onPress,
}: {
  entry: DictionaryEntry;
  saved: boolean;
  isEducator: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const hasAudio = !!entry.audioUrl;
  const swipeRef = useRef<Swipeable>(null);

  const handleToggle = () => {
    onToggle();
    swipeRef.current?.close();
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={() =>
        !saved ? (
          <SwipeActions saved={saved} onToggle={handleToggle} side="right" />
        ) : null
      }
      renderLeftActions={() =>
        saved ? (
          <SwipeActions saved={saved} onToggle={handleToggle} side="left" />
        ) : null
      }
      overshootRight={false}
      overshootLeft={false}
      onSwipeableOpen={(direction) => {
        if (direction === "right" && !saved) handleToggle();
        if (direction === "left" && saved) handleToggle();
      }}
    >
      <Pressable
        onPress={onPress}
        className="border-b border-neutral-100 bg-white px-5 py-3 active:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800/60"
      >
        <View className="flex-row items-center">
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {entry.word}
              </Text>
              {isEducator && !hasAudio && (
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
            {!!entry.nsibidi && (
              <NsibidiText size={18} color="#f59e0b" style={{ marginTop: 2 }}>
                {entry.nsibidi}
              </NsibidiText>
            )}
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
    </Swipeable>
  );
}

function RecentlyViewedStrip({
  entries,
  onPress,
}: {
  entries: DictionaryEntry[];
  onPress: (entry: DictionaryEntry) => void;
}) {
  const { t } = useTranslation();
  if (entries.length === 0) return null;

  return (
    <View className="border-b border-neutral-100 py-3 dark:border-neutral-800">
      <Text className="mb-2 px-5 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        {t("dictionaryPage.recentlyViewed")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {entries.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => onPress(entry)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 active:opacity-70 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
              {entry.word}
            </Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {entry.english.split(";")[0].trim()}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function DictionaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedCategory, setSelectedCategory] = useState<DictionaryCategory | null>(null);
  const { data: savedIds } = useWordBank();
  const saveWord = useSaveWord();
  const removeWord = useRemoveWord();
  const { selectedLanguageId } = useLanguageStore();
  const { data: localEntries = [], isLoading: localLoading, refetch } = useDictionary(selectedLanguageId);
  const isIgbo = selectedLanguageId === "igbo";
  const { data: igboApiResults = [], isFetching: igboFetching } = useIgboSearch(isIgbo ? query : "");
  const [refreshing, setRefreshing] = useState(false);

  // Merge: local entries first, then API results not already present by word (case-insensitive)
  const allEntries = useMemo(() => {
    if (!isIgbo || igboApiResults.length === 0) return localEntries;
    const localWords = new Set(localEntries.map((e) => e.word.toLowerCase()));
    const novel = igboApiResults.filter((e) => !localWords.has(e.word.toLowerCase()));
    return [...localEntries, ...novel];
  }, [isIgbo, localEntries, igboApiResults]);

  const isLoading = localLoading;
  const { data: currentUser } = useCurrentUser();
  const isEducator = !!(currentUser && canAccessEducatorPanel(currentUser));
  const setNavContext = useDictionaryNavStore((s) => s.setContext);
  const recentIds = useRecentlyViewed();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const savedSet = useMemo(() => new Set(savedIds ?? []), [savedIds]);

  const handleToggle = (entryId: string) => {
    if (savedSet.has(entryId)) {
      removeWord.mutate(entryId);
    } else {
      saveWord.mutate(entryId);
    }
  };

  const sections = useMemo<Section[]>(() => {
    const filtered =
      query.trim().length > 0 ? searchDictionary(query, allEntries) : allEntries;

    const entries =
      viewMode === "saved"
        ? filtered.filter((e) => savedSet.has(e.id))
        : viewMode === "needs_audio"
          ? filtered.filter((e) => !e.audioUrl)
          : filtered;

    const categoryFiltered =
      selectedCategory ? entries.filter((e) => e.category === selectedCategory) : entries;

    const grouped = new Map<DictionaryCategory, DictionaryEntry[]>();
    for (const e of categoryFiltered) {
      const existing = grouped.get(e.category) ?? [];
      existing.push(e);
      grouped.set(e.category, existing);
    }

    type CategoryI18nKey = `dictionaryPage.categoryLabels.${DictionaryCategory}`;
    return ALL_CATEGORIES.filter((cat) => grouped.has(cat)).map((cat) => ({
      title: t(`dictionaryPage.categoryLabels.${cat}` as CategoryI18nKey),
      category: cat,
      data: grouped.get(cat)!,
    }));
  }, [query, viewMode, selectedCategory, allEntries, savedSet, t]);

  const savedCount = allEntries.filter((e) => savedSet.has(e.id)).length;
  const needsAudioCount = allEntries.filter((e) => !e.audioUrl).length;

  const recentEntries = useMemo(() => {
    return recentIds
      .map(({ id }) => allEntries.find((e) => e.id === id))
      .filter((e): e is DictionaryEntry => !!e)
      .slice(0, 5);
  }, [recentIds, allEntries]);

  const presentCategories = useMemo(
    () => sections.map((s) => ({ category: s.category, title: s.title })),
    [sections]
  );

  const handleWordPress = useCallback(
    (item: DictionaryEntry) => {
      const allIds = sections.flatMap((s) => s.data.map((e) => e.id));
      setNavContext(allIds, item.id, item.languageId);
      router.push({ pathname: "/word/[id]", params: { id: item.id, languageId: item.languageId } });
    },
    [sections, setNavContext, router]
  );

  const handleCategoryChip = (cat: DictionaryCategory) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
  };

  return (
    <>
      <Stack.Screen options={{ title: "Dictionary", headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        {/* Search bar */}
        <View className="border-b border-neutral-200 px-5 pb-3 pt-2 dark:border-neutral-700">
          <View className="flex-row items-center rounded-xl bg-neutral-100 px-3 dark:bg-neutral-800">
            <IconSymbol name="magnifyingglass" size={18} color="#9ca3af" />
            <TextInput
              value={query}
              onChangeText={(v) => { setQuery(v); setSelectedCategory(null); }}
              placeholder={t("dictionaryPage.searchPlaceholderMobile")}
              placeholderTextColor="#9ca3af"
              className="ml-2 flex-1 py-2.5 text-base text-neutral-900 dark:text-white"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {igboFetching && isIgbo && query.length >= 2 && (
              <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: 4 }} />
            )}
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <IconSymbol name="xmark" size={16} color="#9ca3af" />
              </Pressable>
            )}
          </View>

          {/* View toggle — All / My Words / Needs Audio (educator only) */}
          <View className="mt-3 flex-row gap-2">
            <Pressable
              onPress={() => setViewMode("all")}
              className={`flex-1 items-center rounded-lg py-2 ${
                viewMode === "all" ? "bg-sky-500" : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  viewMode === "all" ? "text-white" : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {t("dictionaryPage.allWordsCount", { count: allEntries.length })}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode("saved")}
              className={`flex-1 items-center rounded-lg py-2 ${
                viewMode === "saved" ? "bg-amber-500" : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  viewMode === "saved" ? "text-white" : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {t("dictionaryPage.myWordsCount", { count: savedCount })}
              </Text>
            </Pressable>
            {isEducator && needsAudioCount > 0 && (
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

          {/* Review CTA */}
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

          {/* Contribute CTA — educator only */}
          {isEducator && viewMode === "needs_audio" && needsAudioCount > 0 && (
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

        {/* Category chip row */}
        {!isLoading && presentCategories.length > 0 && (
          <View className="border-b border-neutral-100 dark:border-neutral-800">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
            >
              <Pressable
                key="all"
                onPress={() => setSelectedCategory(null)}
                className={`rounded-full px-3.5 py-1.5 ${
                  selectedCategory === null
                    ? "bg-sky-500"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedCategory === null
                      ? "text-white"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {t("dictionaryPage.allCategory")}
                </Text>
              </Pressable>
              {presentCategories.map(({ category, title }) => (
                <Pressable
                  key={category}
                  onPress={() => handleCategoryChip(category)}
                  className={`rounded-full px-3.5 py-1.5 ${
                    selectedCategory === category
                      ? "bg-sky-500"
                      : "bg-neutral-100 dark:bg-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedCategory === category
                        ? "text-white"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loading state */}
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={
              query === "" && viewMode === "all" && recentEntries.length > 0 ? (
                <RecentlyViewedStrip
                  entries={recentEntries}
                  onPress={(entry) => {
                    const allIds = sections.flatMap((s) => s.data.map((e) => e.id));
                    setNavContext(allIds, entry.id, entry.languageId);
                    router.push({
                      pathname: "/word/[id]",
                      params: { id: entry.id, languageId: entry.languageId },
                    });
                  }}
                />
              ) : null
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
                isEducator={isEducator}
                onToggle={() => handleToggle(item.id)}
                onPress={() => handleWordPress(item)}
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
