import { useMuseumTheme } from "@/lib/use-museum-theme";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { DictionaryEntryEditorModal, VariantRows } from "@/components/studio/dictionary-entry-editor-modal";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput } from "@/components/ui/localized-text-input";
import { useStudioAccess } from "@/components/studio/studio-gate";
import {
    EducatorDictionaryCategory,
    EducatorDictionaryEntry,
    STATUS_LABEL,
    STATUS_TONE,
    useEducatorDictionary,
    useUpsertEducatorDictionary,
} from "@/lib/hooks/use-educator-panel";
import { friendlyError } from "@/lib/api";
import { DICTIONARY_CATEGORY_VALUES, splitList, type DialectalVariant } from "@/lib/dictionary";
import { useDictionaryCoverage } from "@/lib/hooks/use-contributions";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import type { LocalizedText } from "@/types";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES: EducatorDictionaryCategory[] = [...DICTIONARY_CATEGORY_VALUES];

type NewEntryForm = {
  word: string;
  translations: LocalizedText;
  category: EducatorDictionaryCategory;
  pronunciation: string;
  example: string;
  exampleTranslations: LocalizedText;
  synonyms: string;
  antonyms: string;
  semanticDomain: string;
  dialectalVariants: DialectalVariant[];
};

const EMPTY_NEW_ENTRY: NewEntryForm = {
  word: "",
  translations: {},
  category: "nouns",
  pronunciation: "",
  example: "",
  exampleTranslations: {},
  synonyms: "",
  antonyms: "",
  semanticDomain: "",
  dialectalVariants: [],
};

export default function EducatorDictionaryScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user: currentUser, canAccess } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [newEntry, setNewEntry] = useState<NewEntryForm>(EMPTY_NEW_ENTRY);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EducatorDictionaryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<EducatorDictionaryCategory | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);

  const allowedLanguages = useMemo(() => {
    if (!currentUser) return [] as string[];
    if (currentUser.isAdmin) return LANGUAGES.map((l) => l.id);
    return currentUser.reviewerLanguages;
  }, [currentUser]);

  const activeLanguageId = selectedLanguageId ?? allowedLanguages[0] ?? currentUser?.selectedLanguageId ?? "izon";

  useEffect(() => {
    setSearchQuery("");
    setFilterCategory(undefined);
  }, [activeLanguageId]);

  const { data: entries = [], isLoading } = useEducatorDictionary(activeLanguageId, undefined, canAccess);
  const { data: coverage } = useDictionaryCoverage(canAccess ? activeLanguageId : null);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const createEntry = useUpsertEducatorDictionary();
  const actor = currentUser
    ? { isAdmin: currentUser.isAdmin, reviewerRole: currentUser.reviewerRole, userId: currentUser.id }
    : { isAdmin: false, reviewerRole: null, userId: null };

  // Keep the open editor's entry in sync with the freshly-fetched list (e.g.
  // after a replica field save invalidates the query) rather than showing a
  // stale snapshot from when the modal opened.
  useEffect(() => {
    if (!editingEntry) return;
    const fresh = entries.find((e) => e.id === editingEntry.id);
    if (fresh && fresh !== editingEntry) setEditingEntry(fresh);
  }, [entries, editingEntry]);

  const resetCreator = () => {
    setNewEntry(EMPTY_NEW_ENTRY);
    setCreatorOpen(false);
  };

  const submitNewEntry = () => {
    const english = newEntry.translations.en?.trim() ?? "";
    if (!newEntry.word.trim() || !english) {
      toastError("Missing fields", "Word and meaning (English) are required.");
      return;
    }

    createEntry.mutate(
      {
        languageId: activeLanguageId,
        word: newEntry.word.trim(),
        english,
        french: newEntry.translations.fr?.trim() || undefined,
        translations: newEntry.translations,
        category: newEntry.category,
        pronunciation: newEntry.pronunciation.trim() || undefined,
        example: newEntry.example.trim() || undefined,
        exampleTranslation: newEntry.exampleTranslations.en?.trim() || undefined,
        exampleTranslationFr: newEntry.exampleTranslations.fr?.trim() || undefined,
        exampleTranslations: newEntry.exampleTranslations,
        synonyms: splitList(newEntry.synonyms),
        antonyms: splitList(newEntry.antonyms),
        semanticDomain: newEntry.semanticDomain.trim() || undefined,
        dialectalVariants: newEntry.dialectalVariants.filter((v) => v.dialect.trim() && v.form.trim()),
      },
      {
        onSuccess: () => {
          resetCreator();
          toastSuccess("Entry created", `"${newEntry.word}" saved to dictionary.`);
        },
        onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
      },
    );
  };

  const filteredEntries = useMemo(() => {
    let result = entries;
    const q = searchQuery.toLowerCase().trim();
    if (q) result = result.filter((e) => e.word.toLowerCase().includes(q) || e.english.toLowerCase().includes(q));
    if (filterCategory !== undefined) result = result.filter((e) => e.category === filterCategory);
    return result;
  }, [entries, searchQuery, filterCategory]);

  const isFiltered = searchQuery.trim().length > 0 || filterCategory !== undefined;

  const renderItem = useCallback(
    ({ item }: { item: EducatorDictionaryEntry }) => (
      <Pressable
        onPress={() => setEditingEntry(item)}
        className="mx-5 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">{item.word}</Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{item.english}</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={M.muted} />
        </View>
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          <View className="rounded-full bg-neutral-100 px-2 py-1 dark:bg-neutral-800">
            <Text className="text-[10px] font-semibold uppercase text-neutral-600 dark:text-neutral-400">{item.category}</Text>
          </View>
          {item.status ? <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} /> : null}
          {item._source === "contribution" ? (
            <View className="rounded-full bg-amber-100 px-2 py-1 dark:bg-amber-900/40">
              <Text className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400">contribution</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    ),
    [M],
  );

  const listHeader = (
    <View>
      <View className="px-5 pt-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-white">{t("educator.nav.dictionary")}</Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Create, edit, and maintain reviewed vocabulary.
        </Text>
      </View>

      <View className="mt-4 px-5">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {allowedLanguages.map((languageId) => {
            const active = languageId === activeLanguageId;
            return (
              <Pressable
                key={languageId}
                onPress={() => setSelectedLanguageId(languageId)}
                className={`mr-2 rounded-full px-4 py-2 ${active ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"}`}
              >
                <Text className={`text-sm font-semibold ${active ? "text-white" : "text-neutral-700 dark:text-neutral-300"}`}>
                  {getLanguageName(languageId)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {coverage && coverage.distinctWords > 0 ? (
        <View className="mt-4 px-5">
          <View
            className={`rounded-2xl border p-4 ${
              coverage.missing.length === 0
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20"
            }`}
          >
            <Pressable
              onPress={() => setCoverageOpen((o) => !o)}
              disabled={coverage.missing.length === 0}
              className="flex-row items-center"
            >
              <IconSymbol
                name={coverage.missing.length === 0 ? "checkmark.seal.fill" : "exclamationmark.triangle.fill"}
                size={16}
                color={coverage.missing.length === 0 ? M.success : M.warning}
              />
              <View className="ml-2 flex-1">
                <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {coverage.missing.length === 0
                    ? t("review.coverageComplete")
                    : t("review.coverageSummary", {
                        covered: coverage.coveredWords,
                        total: coverage.distinctWords,
                        percent: Math.round((coverage.coveredWords / coverage.distinctWords) * 100),
                      })}
                </Text>
                {coverage.missing.length > 0 ? (
                  <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {t("review.coverageTapHint")}
                  </Text>
                ) : null}
              </View>
              {coverage.missing.length > 0 ? (
                <IconSymbol name={coverageOpen ? "chevron.up" : "chevron.down"} size={14} color={M.muted} />
              ) : null}
            </Pressable>
            {coverageOpen && coverage.missing.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {coverage.missing.slice(0, 40).map((m) => (
                  <Pressable
                    key={m.word}
                    onPress={() => {
                      setNewEntry({ ...EMPTY_NEW_ENTRY, word: m.word });
                      setCreatorOpen(true);
                      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    }}
                    className="flex-row items-center rounded-full bg-white px-3 py-1.5 dark:bg-neutral-900"
                  >
                    <Text className="text-xs font-semibold text-neutral-900 dark:text-white">{m.word}</Text>
                    <Text className="ml-1 text-[10px] text-neutral-400 dark:text-neutral-500">×{m.count}</Text>
                  </Pressable>
                ))}
                {coverage.missing.length > 40 ? (
                  <View className="justify-center px-1">
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                      +{coverage.missing.length - 40}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View className="mt-5 px-5">
        {!creatorOpen && (
          <Pressable
            onPress={() => setCreatorOpen(true)}
            className="flex-row items-center justify-center gap-1.5 rounded-xl bg-blue-500 py-3 active:opacity-80"
          >
            <IconSymbol name="plus" size={14} color="#fff" />
            <Text className="text-sm font-semibold text-white">New Entry</Text>
          </Pressable>
        )}
        {creatorOpen && (
          <View className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">New Entry</Text>

            <TextInput
              value={newEntry.word}
              onChangeText={(word) => setNewEntry((prev) => ({ ...prev, word }))}
              placeholder="Word"
              placeholderTextColor={M.muted}
              className="mt-3 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
            />
            <View className="mt-3">
              <LocalizedTextInput
                label={t("admin.dictionary.fieldMeaning")}
                value={newEntry.translations}
                onChange={(translations) => setNewEntry((prev) => ({ ...prev, translations }))}
                required
              />
            </View>
            <TextInput
              value={newEntry.pronunciation}
              onChangeText={(pronunciation) => setNewEntry((prev) => ({ ...prev, pronunciation }))}
              placeholder="Pronunciation (optional)"
              placeholderTextColor={M.muted}
              className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
            />
            <TextInput
              value={newEntry.example}
              onChangeText={(example) => setNewEntry((prev) => ({ ...prev, example }))}
              placeholder="Example sentence (optional)"
              placeholderTextColor={M.muted}
              multiline
              className="mt-2 min-h-[44px] rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
            />
            <View className="mt-2">
              <LocalizedTextInput
                label={t("admin.dictionary.fieldExampleTranslation")}
                value={newEntry.exampleTranslations}
                onChange={(exampleTranslations) => setNewEntry((prev) => ({ ...prev, exampleTranslations }))}
                multiline
              />
            </View>

            <TextInput
              value={newEntry.synonyms}
              onChangeText={(synonyms) => setNewEntry((prev) => ({ ...prev, synonyms }))}
              placeholder="Synonyms (comma-separated, optional)"
              placeholderTextColor={M.muted}
              className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
            />
            <TextInput
              value={newEntry.antonyms}
              onChangeText={(antonyms) => setNewEntry((prev) => ({ ...prev, antonyms }))}
              placeholder="Antonyms (comma-separated, optional)"
              placeholderTextColor={M.muted}
              className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
            />
            <TextInput
              value={newEntry.semanticDomain}
              onChangeText={(semanticDomain) => setNewEntry((prev) => ({ ...prev, semanticDomain }))}
              placeholder="Semantic domain, e.g. body > senses (optional)"
              placeholderTextColor={M.muted}
              className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
            />
            <VariantRows
              value={newEntry.dialectalVariants}
              onChange={(dialectalVariants) => setNewEntry((prev) => ({ ...prev, dialectalVariants }))}
            />

            <View className="mt-3 flex-row flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const active = newEntry.category === category;
                return (
                  <Pressable
                    key={category}
                    onPress={() => setNewEntry((prev) => ({ ...prev, category }))}
                    className={`rounded-full px-3 py-1.5 ${active ? "bg-blue-500" : "bg-white dark:bg-neutral-900"}`}
                  >
                    <Text className={`text-xs font-semibold uppercase ${active ? "text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={submitNewEntry}
                disabled={createEntry.isPending}
                className="flex-1 rounded-xl bg-blue-500 py-3 active:opacity-80"
              >
                <Text className="text-center font-semibold text-white">
                  {createEntry.isPending ? t("common.loading") : "Create"}
                </Text>
              </Pressable>
              <Pressable
                onPress={resetCreator}
                className="rounded-xl bg-neutral-200 px-4 py-3 active:opacity-80 dark:bg-neutral-700"
              >
                <Text className="font-semibold text-neutral-700 dark:text-neutral-300">{t("common.cancel")}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <View className="mt-5 px-5">
        <View className="flex-row items-center rounded-xl bg-neutral-100 px-3 dark:bg-neutral-800">
          <IconSymbol name="magnifyingglass" size={16} color={M.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search entries…"
            placeholderTextColor={M.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="ml-2 flex-1 py-2.5 text-sm text-neutral-900 dark:text-white"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <IconSymbol name="xmark" size={14} color={M.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="mt-3 pb-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => setFilterCategory(undefined)}
            className={`mr-2 rounded-full px-3 py-1.5 ${filterCategory === undefined ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"}`}
          >
            <Text className={`text-xs font-semibold uppercase ${filterCategory === undefined ? "text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
              All
            </Text>
          </Pressable>
          {CATEGORIES.filter((cat) => entries.some((e) => e.category === cat)).map((category) => {
            const active = filterCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setFilterCategory(active ? undefined : category)}
                className={`mr-2 rounded-full px-3 py-1.5 ${active ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"}`}
              >
                <Text className={`text-xs font-semibold uppercase ${active ? "text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="mt-4 px-5">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.4px] text-neutral-400 dark:text-neutral-500">
          {isFiltered ? `Entries (${filteredEntries.length} of ${entries.length})` : `Entries (${entries.length})`}
        </Text>
      </View>
    </View>
  );

  const listEmpty = (
    <View className="px-5">
      {isLoading ? (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t("common.loading")}</Text>
      ) : isFiltered ? (
        <View className="items-center py-12">
          <IconSymbol name="magnifyingglass" size={32} color={M.border} />
          <Text className="mt-3 text-center text-sm text-neutral-400 dark:text-neutral-500">No entries match your search.</Text>
          <Pressable
            onPress={() => { setSearchQuery(""); setFilterCategory(undefined); }}
            className="mt-3 rounded-full bg-neutral-100 px-4 py-2 dark:bg-neutral-800"
          >
            <Text className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Clear filters</Text>
          </Pressable>
        </View>
      ) : (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">No entries yet for this language.</Text>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: t("educator.nav.dictionary"), headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <View className="flex-row items-center px-5 pb-1 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12} className="-ml-1 p-1 active:opacity-60">
            <IconSymbol name="chevron.left" size={22} color={M.text} />
          </Pressable>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <FlatList
          ref={flatListRef}
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
        />
        </KeyboardAvoidingView>
      </SafeAreaView>
      {editingEntry && (
        <DictionaryEntryEditorModal
          entry={editingEntry}
          actor={actor}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </>
  );
}
