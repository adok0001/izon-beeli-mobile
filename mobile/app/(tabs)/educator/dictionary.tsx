import { useMuseumTheme } from "@/lib/use-museum-theme";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput, toLocalizedText } from "@/components/ui/localized-text-input";
import type { LocalizedText } from "@/types";
import { useStudioAccess } from "@/components/studio/studio-gate";
import {
    canPublishContent,
    canSubmitForReview,
    EducatorDictionaryCategory,
    EducatorDictionaryEntry,
    STATUS_LABEL,
    STATUS_TONE,
    useDeleteEducatorDictionaryEntry,
    useEducatorDictionary,
    usePublishContent,
    useSubmitEducatorDictionaryForReview,
    useUpsertEducatorDictionary,
} from "@/lib/hooks/use-educator-panel";
import { friendlyError } from "@/lib/api";
import { DICTIONARY_CATEGORY_VALUES, splitList, type DialectalVariant } from "@/lib/dictionary";
import { useDictionaryCoverage } from "@/lib/hooks/use-contributions";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES: EducatorDictionaryCategory[] = [...DICTIONARY_CATEGORY_VALUES];

type EditorState = {
  id?: string;
  word: string;
  translations: LocalizedText;
  category: EducatorDictionaryCategory;
  pronunciation: string;
  example: string;
  exampleTranslations: LocalizedText;
  /** Comma-separated in-language synonyms. */
  synonyms: string;
  /** Comma-separated in-language antonyms. */
  antonyms: string;
  semanticDomain: string;
  dialectalVariants: DialectalVariant[];
};

const EMPTY_EDITOR: EditorState = {
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

/** Repeatable dialect / form / region rows for editing dialectal variants. */
function VariantRows({ value, onChange }: { value: DialectalVariant[]; onChange: (v: DialectalVariant[]) => void }) {
  const M = useMuseumTheme();
  const update = (i: number, patch: Partial<DialectalVariant>) =>
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const inputClass = "flex-1 rounded-lg bg-white px-3 py-2 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white";
  return (
    <View className="mt-2">
      <Text className="mb-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Dialectal variants (optional)</Text>
      {value.map((variant, i) => (
        <View key={i} className="mb-2 flex-row items-center gap-1.5">
          <TextInput value={variant.dialect} onChangeText={(dialect) => update(i, { dialect })} placeholder="Dialect" placeholderTextColor={M.muted} className={inputClass} />
          <TextInput value={variant.form} onChangeText={(form) => update(i, { form })} placeholder="Form" placeholderTextColor={M.muted} className={inputClass} />
          <TextInput value={variant.region ?? ""} onChangeText={(region) => update(i, { region })} placeholder="Region" placeholderTextColor={M.muted} className={inputClass} />
          <Pressable onPress={() => onChange(value.filter((_, idx) => idx !== i))} hitSlop={8} className="rounded-full bg-red-100 p-2 dark:bg-red-900/40">
            <IconSymbol name="xmark" size={12} color={M.error} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => onChange([...value, { dialect: "", form: "" }])} className="mt-1 flex-row items-center self-start rounded-full bg-neutral-200 px-3 py-1.5 dark:bg-neutral-700">
        <IconSymbol name="plus" size={12} color={M.text} />
        <Text className="ml-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300">Add variant</Text>
      </Pressable>
    </View>
  );
}

export default function EducatorDictionaryScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { user: currentUser, canAccess } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [isEditing, setIsEditing] = useState(false);
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
  const upsertEntry = useUpsertEducatorDictionary();
  const deleteEntry = useDeleteEducatorDictionaryEntry();
  const submitForReview = useSubmitEducatorDictionaryForReview();
  const publishEntry = usePublishContent("dictionary_entries", [["educator", "dictionary"]]);
  let saveButtonLabel = "Create";
  if (isEditing) saveButtonLabel = t("common.save");
  if (upsertEntry.isPending) saveButtonLabel = t("common.loading");

  const resetEditor = () => {
    setEditor(EMPTY_EDITOR);
    setIsEditing(false);
  };

  const startEdit = useCallback((entry: EducatorDictionaryEntry) => {
    setEditor({
      id: entry.id,
      word: entry.word,
      translations: toLocalizedText(entry.translations ?? entry.english, entry.french),
      category: entry.category,
      pronunciation: entry.pronunciation ?? "",
      example: entry.example ?? "",
      exampleTranslations: toLocalizedText(
        entry.exampleTranslations ?? entry.exampleTranslation,
        entry.exampleTranslationFr,
      ),
      synonyms: (entry.synonyms ?? []).join(", "),
      antonyms: (entry.antonyms ?? []).join(", "),
      semanticDomain: entry.semanticDomain ?? "",
      dialectalVariants: entry.dialectalVariants ?? [],
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setIsEditing(true);
  }, []);

  const submit = () => {
    const english = editor.translations.en?.trim() ?? "";
    if (!editor.word.trim() || !english) {
      toastError("Missing fields", "Word and meaning (English) are required.");
      return;
    }

    upsertEntry.mutate(
      {
        id: editor.id,
        languageId: activeLanguageId,
        word: editor.word.trim(),
        english,
        french: editor.translations.fr?.trim() || undefined,
        translations: editor.translations,
        category: editor.category,
        pronunciation: editor.pronunciation.trim() || undefined,
        example: editor.example.trim() || undefined,
        exampleTranslation: editor.exampleTranslations.en?.trim() || undefined,
        exampleTranslationFr: editor.exampleTranslations.fr?.trim() || undefined,
        exampleTranslations: editor.exampleTranslations,
        synonyms: splitList(editor.synonyms),
        antonyms: splitList(editor.antonyms),
        semanticDomain: editor.semanticDomain.trim() || undefined,
        dialectalVariants: editor.dialectalVariants.filter((v) => v.dialect.trim() && v.form.trim()),
      },
      {
        onSuccess: () => {
          resetEditor();
          toastSuccess(isEditing ? "Entry updated" : "Entry created", `"${editor.word}" saved to dictionary.`);
        },
        onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
      },
    );
  };

  const confirmDelete = useCallback((id: string) => {
    Alert.alert("Delete entry", "This will permanently delete this dictionary entry.", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () =>
          deleteEntry.mutate(id, {
            onSuccess: () => toastSuccess("Entry deleted"),
            onError: (err: Error) => toastError("Delete failed", friendlyError(err)),
          }),
      },
    ]);
  }, [deleteEntry, toastSuccess, toastError, t]);

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
      <View className="mx-5 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">{item.word}</Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{item.english}</Text>
          </View>
          <View className="flex-row gap-2">
            {canSubmitForReview(item.status) ? (
              <Pressable
                onPress={() => submitForReview.mutate(item.id)}
                disabled={submitForReview.isPending}
                className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/40"
              >
                <IconSymbol name="paperplane.fill" size={14} color={M.warning} />
              </Pressable>
            ) : null}
            {currentUser && canPublishContent(item.status, item.createdBy, {
              isAdmin: currentUser.isAdmin, reviewerRole: currentUser.reviewerRole, userId: currentUser.id,
            }) ? (
              <Pressable
                onPress={() => publishEntry.mutate(item.id)}
                disabled={publishEntry.isPending}
                className="rounded-full bg-green-100 p-2 dark:bg-green-900/40"
              >
                <IconSymbol name="checkmark.circle.fill" size={14} color={M.success} />
              </Pressable>
            ) : null}
            <Pressable onPress={() => startEdit(item)} className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
              <IconSymbol name="gearshape.fill" size={14} color={M.muted} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(item.id)} className="rounded-full bg-red-100 p-2 dark:bg-red-900/40">
              <IconSymbol name="xmark.circle.fill" size={14} color={M.error} />
            </Pressable>
          </View>
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
      </View>
    ),
    [startEdit, confirmDelete, submitForReview, publishEntry, currentUser],
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
                      setEditor({ ...EMPTY_EDITOR, word: m.word });
                      setIsEditing(false);
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
        <View className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {isEditing ? "Edit Entry" : "New Entry"}
          </Text>

          <TextInput
            value={editor.word}
            onChangeText={(word) => setEditor((prev) => ({ ...prev, word }))}
            placeholder="Word"
            placeholderTextColor={M.muted}
            className="mt-3 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <View className="mt-3">
            <LocalizedTextInput
              label={t("admin.dictionary.fieldMeaning")}
              value={editor.translations}
              onChange={(translations) => setEditor((prev) => ({ ...prev, translations }))}
              required
            />
          </View>
          <TextInput
            value={editor.pronunciation}
            onChangeText={(pronunciation) => setEditor((prev) => ({ ...prev, pronunciation }))}
            placeholder="Pronunciation (optional)"
            placeholderTextColor={M.muted}
            className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <TextInput
            value={editor.example}
            onChangeText={(example) => setEditor((prev) => ({ ...prev, example }))}
            placeholder="Example sentence (optional)"
            placeholderTextColor={M.muted}
            multiline
            className="mt-2 min-h-[44px] rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <View className="mt-2">
            <LocalizedTextInput
              label={t("admin.dictionary.fieldExampleTranslation")}
              value={editor.exampleTranslations}
              onChange={(exampleTranslations) => setEditor((prev) => ({ ...prev, exampleTranslations }))}
              multiline
            />
          </View>

          <TextInput
            value={editor.synonyms}
            onChangeText={(synonyms) => setEditor((prev) => ({ ...prev, synonyms }))}
            placeholder="Synonyms (comma-separated, optional)"
            placeholderTextColor={M.muted}
            className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <TextInput
            value={editor.antonyms}
            onChangeText={(antonyms) => setEditor((prev) => ({ ...prev, antonyms }))}
            placeholder="Antonyms (comma-separated, optional)"
            placeholderTextColor={M.muted}
            className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <TextInput
            value={editor.semanticDomain}
            onChangeText={(semanticDomain) => setEditor((prev) => ({ ...prev, semanticDomain }))}
            placeholder="Semantic domain, e.g. body > senses (optional)"
            placeholderTextColor={M.muted}
            className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <VariantRows
            value={editor.dialectalVariants}
            onChange={(dialectalVariants) => setEditor((prev) => ({ ...prev, dialectalVariants }))}
          />

          <View className="mt-3 flex-row flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const active = editor.category === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setEditor((prev) => ({ ...prev, category }))}
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
              onPress={submit}
              disabled={upsertEntry.isPending}
              className="flex-1 rounded-xl bg-blue-500 py-3 active:opacity-80"
            >
              <Text className="text-center font-semibold text-white">{saveButtonLabel}</Text>
            </Pressable>
            {isEditing ? (
              <Pressable
                onPress={resetEditor}
                className="rounded-xl bg-neutral-200 px-4 py-3 active:opacity-80 dark:bg-neutral-700"
              >
                <Text className="font-semibold text-neutral-700 dark:text-neutral-300">{t("common.cancel")}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
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
    </>
  );
}
