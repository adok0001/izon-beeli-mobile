import { analytics } from "@/lib/analytics";
import { localize } from "@/lib/localize";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { NsibidiText } from "@/components/nsibidi/nsibidi-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
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
import { useWordProgress } from "@/lib/hooks/use-word-progress";
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

function SwipeActions({ saved, onToggle, side }: { saved: boolean; onToggle: () => void; side: "left" | "right" }) {
  const M = useMuseumTheme();
  if (side === "right" && saved) return null;
  if (side === "left" && !saved) return null;

  return (
    <Pressable
      onPress={onToggle}
      style={{ width: 64, alignItems: "center", justifyContent: "center", backgroundColor: side === "right" ? M.accent : M.border }}
    >
      <IconSymbol
        name={side === "right" ? "star.fill" : "star.slash"}
        size={22}
        color={side === "right" ? M.ink : M.sub}
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
  const M = useMuseumTheme();
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
        style={{ borderBottomWidth: 1, borderBottomColor: M.border, backgroundColor: M.card, paddingHorizontal: 20, paddingVertical: 12 }}
        className="active:opacity-80"
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: M.text }}>
                {entry.word}
              </Text>
              {isEducator && !hasAudio && (
                <View style={{ borderRadius: 4, backgroundColor: "#f9731620", paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: "#f97316" }}>
                    {t("dictionaryPage.needsAudio")}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ marginTop: 2, fontSize: 13, color: M.sub }}>
              {((): string => {
                const eng = localize(entry.english, "en");
                return eng.includes(";") ? eng.split(";").map((m) => m.trim()).filter(Boolean).join(" · ") : eng;
              })()}
            </Text>
            {!!entry.nsibidi && (
              <NsibidiText size={18} color={M.accent} style={{ marginTop: 2 }}>
                {entry.nsibidi}
              </NsibidiText>
            )}
          </View>
          <WordAudioButton audioSource={entry.audioUrl} word={entry.word} />
          <Pressable onPress={onToggle} hitSlop={8} style={{ marginLeft: 4 }}>
            <IconSymbol
              name={saved ? "star.fill" : "star"}
              size={20}
              color={saved ? M.accent : M.border}
            />
          </Pressable>
        </View>
      </Pressable>
    </Swipeable>
  );
}

function RecentlyViewedStrip({ entries, onPress }: { entries: DictionaryEntry[]; onPress: (entry: DictionaryEntry) => void }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  if (entries.length === 0) return null;

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: M.border, paddingVertical: 12 }}>
      <Text style={{ marginBottom: 8, paddingHorizontal: 20, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
        {t("dictionaryPage.recentlyViewed")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {entries.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => onPress(entry)}
            style={{ borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, paddingHorizontal: 12, paddingVertical: 8 }}
            className="active:opacity-70"
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>{entry.word}</Text>
            <Text style={{ fontSize: 11, color: M.sub }}>{localize(entry.english, "en").split(";")[0].trim()}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function DictionaryScreen() {
  const M = useMuseumTheme();
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
  const { data: wordProgressData } = useWordProgress(selectedLanguageId);
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
      analytics.wordSaved(entryId, selectedLanguageId);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Search bar */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 12, borderWidth: 1, borderColor: M.border }}>
            <IconSymbol name="magnifyingglass" size={18} color={M.muted} />
            <TextInput
              value={query}
              onChangeText={(v) => { setQuery(v); setSelectedCategory(null); }}
              placeholder={t("dictionaryPage.searchPlaceholderMobile")}
              placeholderTextColor={M.inputPlaceholder}
              style={{ marginLeft: 8, flex: 1, paddingVertical: 10, fontSize: 16, color: M.inputText }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {igboFetching && isIgbo && query.length >= 2 && (
              <ActivityIndicator size="small" color={M.accent} style={{ marginRight: 4 }} />
            )}
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <IconSymbol name="xmark" size={16} color={M.muted} />
              </Pressable>
            )}
          </View>

          <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
            {[
              { mode: "all" as ViewMode, label: t("dictionaryPage.allWordsCount", { count: allEntries.length }), activeColor: M.accent },
              { mode: "saved" as ViewMode, label: t("dictionaryPage.myWordsCount", { count: savedCount }), activeColor: M.accent },
              ...(isEducator && needsAudioCount > 0 ? [{ mode: "needs_audio" as ViewMode, label: t("dictionaryPage.needsAudioCount", { count: needsAudioCount }), activeColor: "#f97316" }] : []),
            ].map(({ mode, label, activeColor }) => (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                style={{ flex: 1, alignItems: "center", borderRadius: 8, paddingVertical: 8, backgroundColor: viewMode === mode ? activeColor : M.card, borderWidth: 1, borderColor: viewMode === mode ? activeColor : M.border }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: viewMode === mode ? M.ink : M.sub }}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {viewMode === "saved" && savedCount > 0 && (
            <Pressable
              onPress={() => router.push("/word-review")}
              style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: M.success, paddingVertical: 10 }}
              className="active:opacity-80"
            >
              <IconSymbol name="brain.head.profile" size={16} color={M.ink} />
              <Text style={{ marginLeft: 8, fontSize: 13, fontWeight: "600", color: M.ink }}>
                {t("dictionaryPage.reviewSavedWords")}
              </Text>
            </Pressable>
          )}

          {wordProgressData && wordProgressData.masteredCount > 0 && (
            <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, backgroundColor: M.successBg, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: M.successBorder }}>
              <IconSymbol name="checkmark.seal.fill" size={16} color={M.success} />
              <Text style={{ fontSize: 13, fontWeight: "500", color: M.success }}>
                {wordProgressData.masteredCount} of {allEntries.length} words mastered
              </Text>
            </View>
          )}

          {isEducator && viewMode === "needs_audio" && needsAudioCount > 0 && (
            <View style={{ marginTop: 12, borderRadius: 12, backgroundColor: "#f9731615", paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: "#f9731630" }}>
              <Text style={{ fontSize: 13, fontWeight: "500", color: "#f97316" }}>
                {t("dictionaryPage.needsAudioCta", { count: needsAudioCount })}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 11, color: "#f97316" }}>
                {t("dictionaryPage.needsAudioCtaDesc")}
              </Text>
            </View>
          )}
        </View>

        {/* Category chip row */}
        {!isLoading && presentCategories.length > 0 && (
          <View style={{ borderBottomWidth: 1, borderBottomColor: M.border }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
              {[{ category: null, title: t("dictionaryPage.allCategory") }, ...presentCategories].map(({ category, title }) => {
                const active = selectedCategory === category;
                return (
                  <Pressable
                    key={category ?? "all"}
                    onPress={() => setSelectedCategory(category as DictionaryCategory | null)}
                    style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: active ? M.accent : M.card, borderWidth: 1, borderColor: active ? M.accent : M.border }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: active ? M.ink : M.sub }}>{title}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />
            }
            ListHeaderComponent={
              query === "" && viewMode === "all" && recentEntries.length > 0 ? (
                <RecentlyViewedStrip
                  entries={recentEntries}
                  onPress={(entry) => {
                    const allIds = sections.flatMap((s) => s.data.map((e) => e.id));
                    setNavContext(allIds, entry.id, entry.languageId);
                    router.push({ pathname: "/word/[id]", params: { id: entry.id, languageId: entry.languageId } });
                  }}
                />
              ) : null
            }
            renderSectionHeader={({ section }) => (
              <View style={{ backgroundColor: M.bg, paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: M.border }}>
                <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
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
              <View style={{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 64 }}>
                <IconSymbol name={viewMode === "saved" ? "star.fill" : "magnifyingglass"} size={40} color={M.border} />
                <Text style={{ marginTop: 16, textAlign: "center", fontSize: 15, color: M.sub }}>
                  {viewMode === "saved" ? t("dictionaryPage.noSavedWords") : t("dictionaryPage.noResults")}
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
