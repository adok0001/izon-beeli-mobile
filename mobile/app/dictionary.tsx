import { analytics } from "@/lib/analytics";
import { localize } from "@/lib/localize";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { NsibidiText } from "@/components/nsibidi/nsibidi-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { fonts } from "@/constants/typography";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { searchDictionary, type DictionaryEntry } from "@/lib/dictionary";
import {
  DOMAIN_ICONS,
  DOMAIN_LABELS,
  DOMAIN_ORDER,
  LEVEL_ORDER,
  POS_ABBR,
  POS_LABELS,
  POS_ORDER,
  TOPIC_ICONS,
  TOPIC_LABELS,
  TOPIC_ORDER,
  derivePos,
  deriveLevel,
  entryInDomain,
  entryInTopic,
  type CefrLevel,
  type Domain,
  type PartOfSpeech,
  type Topic,
} from "@/lib/dictionary-taxonomy";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useIgboSearch } from "@/lib/hooks/use-igbo-search";
import { useRecentlyViewed } from "@/lib/hooks/use-recently-viewed";
import { useRemoveWord, useSaveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { useDictionaryNavStore } from "@/store/dictionary-nav-store";
import { useLanguageStore } from "@/store/language-store";
import { Stack, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingScreen } from "@/components/loading-screen";
import {
  ActivityIndicator,
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
import { SafeAreaView } from "react-native-safe-area-context";

// ── Filter model ─────────────────────────────────────────────────────────────
type Filter =
  | { kind: "all" }
  | { kind: "saved" }
  | { kind: "history" }
  | { kind: "needs_audio" }
  | { kind: "topic"; topic: Topic }
  | { kind: "domain"; domain: Domain }
  | { kind: "pos"; pos: PartOfSpeech }
  | { kind: "level"; level: CefrLevel };

interface AlphaSection {
  title: string;
  data: DictionaryEntry[];
}

// ── Landing card ─────────────────────────────────────────────────────────────
function CategoryCard({
  icon,
  title,
  count,
  onPress,
}: {
  icon: string;
  title: string;
  count: number;
  onPress: () => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
      }}
      className="active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count}`}
    >
      <View
        style={{
          height: 40,
          width: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: M.accentGlow,
          borderWidth: 1,
          borderColor: M.accentBorder,
        }}
      >
        <IconSymbol name={icon as any} size={20} color={M.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: M.text }}>{title}</Text>
        <Text style={{ marginTop: 1, fontSize: 12, color: M.muted }}>
          {t("dictionaryPage.browse.countWords", { count })}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={M.muted} />
    </Pressable>
  );
}

function LandingSectionHeader({ title }: { title: string }) {
  const M = useMuseumTheme();
  return (
    <Text
      style={{
        marginTop: 20,
        marginBottom: 10,
        fontFamily: fonts.headingMedium,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: M.muted,
      }}
    >
      {title}
    </Text>
  );
}

// ── Word row (drilldown) ─────────────────────────────────────────────────────
function DictWordRow({
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
  const M = useMuseumTheme();
  const pos = derivePos(entry);
  const level = deriveLevel(entry);
  const definition = ((): string => {
    const eng = localize(entry.english, "en");
    return eng.includes(";") ? eng.split(";").map((m) => m.trim()).filter(Boolean).join(" · ") : eng;
  })();

  return (
    <Pressable
      onPress={onPress}
      style={{ borderBottomWidth: 1, borderBottomColor: M.border, backgroundColor: M.card, paddingHorizontal: 20, paddingVertical: 14 }}
      className="active:opacity-80"
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: M.text }}>{entry.word}</Text>
            <Text style={{ fontSize: 12, fontStyle: "italic", color: M.muted }}>{POS_ABBR[pos]}</Text>
            <View style={{ borderRadius: 6, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder, paddingHorizontal: 6, paddingVertical: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: M.accent }}>{level}</Text>
            </View>
          </View>
          {entry.pronunciation && !entry.pronunciation.startsWith("http") ? (
            <Text style={{ marginTop: 2, fontSize: 12, fontStyle: "italic", color: M.muted }}>/{entry.pronunciation}/</Text>
          ) : null}
          <Text style={{ marginTop: 3, fontSize: 14, color: M.sub }}>{definition}</Text>
          {entry.example ? (
            <Text style={{ marginTop: 4, fontSize: 13, fontStyle: "italic", color: M.muted }} numberOfLines={2}>
              “{entry.example}”
            </Text>
          ) : null}
          {entry.nsibidi ? (
            <NsibidiText size={18} color={M.accent} style={{ marginTop: 3 }}>
              {entry.nsibidi}
            </NsibidiText>
          ) : null}
        </View>
        <View style={{ alignItems: "center", gap: 8 }}>
          <WordAudioButton audioSource={entry.audioUrl} word={entry.word} />
          <Pressable onPress={onToggle} hitSlop={10} accessibilityRole="button" accessibilityLabel="Toggle save">
            <IconSymbol name={saved ? "star.fill" : "star"} size={22} color={saved ? M.accent : M.border} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function DictionaryScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter | null>(null);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { selectedLanguageId } = useLanguageStore();
  const { data: localEntries = [], isLoading, refetch } = useDictionary(selectedLanguageId);
  const { data: savedIds } = useWordBank();
  const saveWord = useSaveWord();
  const removeWord = useRemoveWord();
  const recentIds = useRecentlyViewed();
  const setNavContext = useDictionaryNavStore((s) => s.setContext);
  const { data: currentUser } = useCurrentUser();
  const isEducator = !!(currentUser && canAccessEducatorPanel(currentUser));

  const isIgbo = selectedLanguageId === "igbo";
  const { data: igboApiResults = [], isFetching: igboFetching } = useIgboSearch(isIgbo ? query : "");

  // Merge live Igbo API matches that aren't already covered by local data.
  const allEntries = useMemo(() => {
    if (!isIgbo || igboApiResults.length === 0) return localEntries;
    const localWords = new Set(localEntries.map((e) => e.word.toLowerCase()));
    return [...localEntries, ...igboApiResults.filter((e) => !localWords.has(e.word.toLowerCase()))];
  }, [isIgbo, localEntries, igboApiResults]);

  const savedSet = useMemo(() => new Set(savedIds ?? []), [savedIds]);
  const recentIdSet = useMemo(() => new Set(recentIds.map((r) => r.id)), [recentIds]);

  const matches = useCallback(
    (e: DictionaryEntry, f: Filter): boolean => {
      switch (f.kind) {
        case "all":
          return true;
        case "saved":
          return savedSet.has(e.id);
        case "history":
          return recentIdSet.has(e.id);
        case "needs_audio":
          return !e.audioUrl;
        case "topic":
          return entryInTopic(e, f.topic);
        case "domain":
          return entryInDomain(e, f.domain);
        case "pos":
          return derivePos(e) === f.pos;
        case "level":
          return deriveLevel(e) === f.level;
      }
    },
    [savedSet, recentIdSet]
  );

  const count = useCallback((f: Filter) => allEntries.filter((e) => matches(e, f)).length, [allEntries, matches]);

  const filterTitle = useCallback(
    (f: Filter): string => {
      switch (f.kind) {
        case "all":
          return t("dictionaryPage.browse.allWords");
        case "saved":
          return t("dictionaryPage.browse.savedWords");
        case "history":
          return t("dictionaryPage.browse.history");
        case "needs_audio":
          return t("dictionaryPage.browse.needsAudio");
        case "topic":
          return TOPIC_LABELS[f.topic];
        case "domain":
          return DOMAIN_LABELS[f.domain];
        case "pos":
          return POS_LABELS[f.pos];
        case "level":
          return `${t("dictionaryPage.browse.level")} ${f.level}`;
      }
    },
    [t]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openCategory = useCallback((f: Filter) => {
    setFilter(f);
    setQuery("");
  }, []);

  const handleToggle = useCallback(
    (entryId: string) => {
      if (savedSet.has(entryId)) {
        removeWord.mutate(entryId);
      } else {
        saveWord.mutate(entryId);
        analytics.wordSaved(entryId, selectedLanguageId);
      }
    },
    [savedSet, removeWord, saveWord, selectedLanguageId]
  );

  // Filtered + alphabetized entries for the drilldown list.
  const { sections, listIds } = useMemo(() => {
    if (!filter) return { sections: [] as AlphaSection[], listIds: [] as string[] };
    const filtered = allEntries.filter((e) => matches(e, filter));
    const searched = query.trim() ? searchDictionary(query, filtered) : filtered;
    const byLetter = new Map<string, DictionaryEntry[]>();
    for (const e of searched) {
      const letter = (e.word[0] ?? "#").toUpperCase();
      const bucket = byLetter.get(letter) ?? [];
      bucket.push(e);
      byLetter.set(letter, bucket);
    }
    const out: AlphaSection[] = [...byLetter.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((letter) => ({
        title: letter,
        data: byLetter.get(letter)!.sort((a, b) => a.word.localeCompare(b.word)),
      }));
    return { sections: out, listIds: searched.map((e) => e.id) };
  }, [filter, allEntries, matches, query]);

  const handleWordPress = useCallback(
    (item: DictionaryEntry) => {
      setNavContext(listIds, item.id, item.languageId);
      router.push({ pathname: "/word/[id]", params: { id: item.id, languageId: item.languageId } });
    },
    [listIds, setNavContext, router]
  );

  // ── Landing ────────────────────────────────────────────────────────────────
  if (!filter) {
    const quickAccess: { filter: Filter; icon: string }[] = [
      { filter: { kind: "all" }, icon: "book.fill" },
      { filter: { kind: "saved" }, icon: "star.fill" },
      { filter: { kind: "history" }, icon: "clock" },
      ...(isEducator && count({ kind: "needs_audio" }) > 0 ? [{ filter: { kind: "needs_audio" } as Filter, icon: "mic.fill" }] : []),
    ];
    const topics = TOPIC_ORDER.map((topic) => ({ filter: { kind: "topic", topic } as Filter, icon: TOPIC_ICONS[topic] })).filter(
      (x) => count(x.filter) > 0
    );
    const domains = DOMAIN_ORDER.map((domain) => ({ filter: { kind: "domain", domain } as Filter, icon: DOMAIN_ICONS[domain] })).filter(
      (x) => count(x.filter) > 0
    );
    const partsOfSpeech = POS_ORDER.map((pos) => ({ filter: { kind: "pos", pos } as Filter, icon: "list.bullet" })).filter(
      (x) => count(x.filter) > 0
    );
    const levels = LEVEL_ORDER.map((level) => ({ filter: { kind: "level", level } as Filter, icon: "graduationcap.fill" })).filter(
      (x) => count(x.filter) > 0
    );

    return (
      <>
        <Stack.Screen options={{ title: t("dictionaryPage.title"), headerBackTitle: t("common.back") }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
            >
              <LandingSectionHeader title={t("dictionaryPage.browse.sectionQuickAccess")} />
              {quickAccess.map(({ filter: f, icon }) => (
                <CategoryCard key={f.kind} icon={icon} title={filterTitle(f)} count={count(f)} onPress={() => openCategory(f)} />
              ))}

              {topics.length > 0 && <LandingSectionHeader title={t("dictionaryPage.browse.sectionTopics")} />}
              {topics.map(({ filter: f, icon }) => (
                <CategoryCard key={`topic-${(f as any).topic}`} icon={icon} title={filterTitle(f)} count={count(f)} onPress={() => openCategory(f)} />
              ))}

              {domains.length > 0 && <LandingSectionHeader title={t("dictionaryPage.browse.sectionDomains")} />}
              {domains.map(({ filter: f, icon }) => (
                <CategoryCard key={`domain-${(f as any).domain}`} icon={icon} title={filterTitle(f)} count={count(f)} onPress={() => openCategory(f)} />
              ))}

              {partsOfSpeech.length > 0 && <LandingSectionHeader title={t("dictionaryPage.browse.sectionPartOfSpeech")} />}
              {partsOfSpeech.map(({ filter: f, icon }) => (
                <CategoryCard key={`pos-${(f as any).pos}`} icon={icon} title={filterTitle(f)} count={count(f)} onPress={() => openCategory(f)} />
              ))}

              {levels.length > 0 && <LandingSectionHeader title={t("dictionaryPage.browse.sectionLevel")} />}
              {levels.map(({ filter: f, icon }) => (
                <CategoryCard key={`level-${(f as any).level}`} icon={icon} title={filterTitle(f)} count={count(f)} onPress={() => openCategory(f)} />
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </>
    );
  }

  // ── Drilldown list ───────────────────────────────────────────────────────────
  const title = filterTitle(filter);
  return (
    <>
      <Stack.Screen options={{ title, headerBackTitle: t("common.back") }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          {/* Back to categories + title */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingTop: 8 }}>
            <Pressable
              onPress={() => setFilter(null)}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingRight: 6 }}
              accessibilityRole="button"
              accessibilityLabel={t("dictionaryPage.browse.back")}
            >
              <IconSymbol name="chevron.left" size={22} color={M.accent} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: M.accent }}>{t("dictionaryPage.browse.back")}</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Text style={{ fontSize: 13, color: M.muted }}>{t("dictionaryPage.browse.countWords", { count: listIds.length })}</Text>
          </View>

          {/* Search */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: M.card, paddingHorizontal: 12, borderWidth: 1, borderColor: M.border }}>
              <IconSymbol name="magnifyingglass" size={18} color={M.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("dictionaryPage.browse.searchInCategory", { category: title })}
                placeholderTextColor={M.inputPlaceholder}
                style={{ marginLeft: 8, flex: 1, paddingVertical: 10, fontSize: 16, color: M.inputText }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {igboFetching && isIgbo && query.length >= 2 && <ActivityIndicator size="small" color={M.accent} style={{ marginRight: 4 }} />}
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <IconSymbol name="xmark" size={16} color={M.muted} />
                </Pressable>
              )}
            </View>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderSectionHeader={({ section }) => (
              <View style={{ backgroundColor: M.bg, paddingHorizontal: 20, paddingVertical: 6 }}>
                <Text style={{ fontFamily: fonts.headingMedium, fontSize: 13, fontWeight: "700", color: M.accent }}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <DictWordRow entry={item} saved={savedSet.has(item.id)} onToggle={() => handleToggle(item.id)} onPress={() => handleWordPress(item)} />
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 64 }}>
                <IconSymbol name={filter.kind === "saved" ? "star.fill" : "magnifyingglass"} size={40} color={M.border} />
                <Text style={{ marginTop: 16, textAlign: "center", fontSize: 15, color: M.sub }}>
                  {query.trim()
                    ? t("dictionaryPage.noResults")
                    : filter.kind === "saved"
                      ? t("dictionaryPage.noSavedWords")
                      : t("dictionaryPage.browse.emptyCategory")}
                </Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
