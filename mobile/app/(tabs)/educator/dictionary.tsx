import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput, toLocalizedText } from "@/components/ui/localized-text-input";
import type { LocalizedText } from "@/types";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { ActiveToggle } from "@/components/studio/active-toggle";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { StudioSearchInput } from "@/components/studio/studio-search-input";
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
import { DICTIONARY_CATEGORY_VALUES, splitList, type DialectalVariant, type DictionaryEntry } from "@/lib/dictionary";
import { useDictionaryCoverage } from "@/lib/hooks/use-contributions";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { usePreviewStore } from "@/store/preview-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Educator/admin dictionary rows carry nullable fields; the learner-facing
 * DictionaryEntry type (shared with the real word screen) doesn't — bridge
 * the two so the Studio preview can reuse the exact same renderer. */
function toPreviewEntry(item: EducatorDictionaryEntry): DictionaryEntry {
  return {
    id: item.id,
    word: item.word,
    english: item.english,
    translations: item.translations ?? undefined,
    french: item.french ?? undefined,
    category: item.category,
    languageId: item.languageId,
    pronunciation: item.pronunciation ?? undefined,
    example: item.example ?? undefined,
    exampleTranslation: item.exampleTranslation ?? undefined,
    exampleTranslations: item.exampleTranslations ?? undefined,
    exampleTranslationFr: item.exampleTranslationFr ?? undefined,
    audioUrl: item.audioUrl ?? undefined,
    imageUrl: item.imageUrl ?? undefined,
    synonyms: item.synonyms ?? undefined,
    antonyms: item.antonyms ?? undefined,
    semanticDomain: item.semanticDomain ?? undefined,
    dialectalVariants: item.dialectalVariants ?? undefined,
  };
}

const CATEGORIES: EducatorDictionaryCategory[] = [...DICTIONARY_CATEGORY_VALUES];

/** "nouns" -> "Nouns" — for filter-pill labels; category values render as-is elsewhere. */
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type CategoryFilter = "all" | EducatorDictionaryCategory;

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
  const inputClass = "flex-1 rounded-lg px-3 py-2 text-sm";
  const inputStyle = { backgroundColor: M.inputBg, color: M.inputText };
  return (
    <View className="mt-2">
      <Text className="mb-1 text-xs font-semibold" style={{ color: M.sub }}>Dialectal variants (optional)</Text>
      {value.map((variant, i) => (
        <View key={i} className="mb-2 flex-row items-center gap-1.5">
          <TextInput value={variant.dialect} onChangeText={(dialect) => update(i, { dialect })} placeholder="Dialect" placeholderTextColor={M.muted} className={inputClass} style={inputStyle} />
          <TextInput value={variant.form} onChangeText={(form) => update(i, { form })} placeholder="Form" placeholderTextColor={M.muted} className={inputClass} style={inputStyle} />
          <TextInput value={variant.region ?? ""} onChangeText={(region) => update(i, { region })} placeholder="Region" placeholderTextColor={M.muted} className={inputClass} style={inputStyle} />
          <Pressable onPress={() => onChange(value.filter((_, idx) => idx !== i))} hitSlop={8} className="rounded-full p-2" style={{ backgroundColor: M.errorBg }}>
            <IconSymbol name="xmark" size={12} color={M.error} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => onChange([...value, { dialect: "", form: "" }])} className="mt-1 flex-row items-center self-start rounded-full px-3 py-1.5" style={{ backgroundColor: M.pillBg }}>
        <IconSymbol name="plus" size={12} color={M.text} />
        <Text className="ml-1 text-xs font-semibold" style={{ color: M.text }}>Add variant</Text>
      </Pressable>
    </View>
  );
}

export default function EducatorDictionaryScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const setPreview = usePreviewStore((s) => s.setPreview);
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

  const { data: entries = [], isLoading, refetch } = useEducatorDictionary(activeLanguageId, undefined, canAccess);
  const { data: coverage } = useDictionaryCoverage(canAccess ? activeLanguageId : null);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  // Leaving with the editor panel open risks losing an unsaved entry.
  useUnsavedGuard(formOpen);
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
    setFormOpen(false);
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
    setFormOpen(true);
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

  const openPreview = useCallback((item: EducatorDictionaryEntry) => {
    setPreview({ kind: "dictionary", entry: toPreviewEntry(item), uiLanguage });
    router.push("/admin/preview" as never);
  }, [setPreview, uiLanguage, router]);

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
      <StudioCard style={{ marginHorizontal: 20 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold" style={{ color: M.text }}>{item.word}</Text>
            <Text className="text-sm" style={{ color: M.sub }}>{item.english}</Text>
          </View>
        </View>
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          <View className="rounded-full px-2 py-1" style={{ backgroundColor: M.pillBg }}>
            <Text className="text-[10px] font-semibold uppercase" style={{ color: M.sub }}>{item.category}</Text>
          </View>
          {item.status ? <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} /> : null}
          {item._source === "contribution" ? (
            <View className="rounded-full px-2 py-1" style={{ backgroundColor: M.warningBg }}>
              <Text className="text-[10px] font-semibold uppercase" style={{ color: M.warning }}>contribution</Text>
            </View>
          ) : null}
        </View>
        <View
          style={{
            flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8,
            marginTop: 12, paddingTop: 10,
            borderTopWidth: 1, borderTopColor: M.border,
          }}
        >
          <ActiveToggle
            entityType="dictionary_entries"
            id={item.id}
            isActive={item.isActive ?? true}
            invalidateKeys={[["educator", "dictionary"]]}
            M={M}
            onToast={{ success: toastSuccess, error: toastError }}
          />
          {canSubmitForReview(item.status) ? (
            <ActionPill
              icon="paperplane.fill"
              label="Submit"
              tone="accent"
              disabled={submitForReview.isPending}
              onPress={() => submitForReview.mutate(item.id)}
            />
          ) : null}
          {currentUser && canPublishContent(item.status, item.createdBy, {
            isAdmin: currentUser.isAdmin, reviewerRole: currentUser.reviewerRole, userId: currentUser.id,
          }) ? (
            <ActionPill
              icon="checkmark.circle.fill"
              label="Publish"
              tone="success"
              disabled={publishEntry.isPending}
              onPress={() => publishEntry.mutate(item.id)}
            />
          ) : null}
          <View style={{ flex: 1 }} />
          <ActionPill icon="eye.fill" label="Preview" onPress={() => openPreview(item)} />
          <ActionPill icon="pencil" label={t("common.edit")} onPress={() => startEdit(item)} />
          <ActionPill icon="trash.fill" label={t("common.delete")} tone="danger" onPress={() => confirmDelete(item.id)} />
        </View>
      </StudioCard>
    ),
    [startEdit, confirmDelete, openPreview, submitForReview, publishEntry, currentUser, t, M, toastSuccess, toastError],
  );

  const listHeader = (
    <View>
      <View className="mt-4 px-5">
        <StudioFilterPills
          options={allowedLanguages.map((languageId) => ({ id: languageId, label: getLanguageName(languageId) }))}
          value={activeLanguageId}
          onChange={setSelectedLanguageId}
          scrollable
        />
      </View>

      {coverage && coverage.distinctWords > 0 ? (
        <View className="mt-4 px-5">
          <View
            className="rounded-2xl border p-4"
            style={
              coverage.missing.length === 0
                ? { backgroundColor: M.successBg, borderColor: M.successBorder }
                : { backgroundColor: M.warningBg, borderColor: M.warningBorder }
            }
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
                <Text className="text-sm font-semibold" style={{ color: M.text }}>
                  {coverage.missing.length === 0
                    ? t("review.coverageComplete")
                    : t("review.coverageSummary", {
                        covered: coverage.coveredWords,
                        total: coverage.distinctWords,
                        percent: Math.round((coverage.coveredWords / coverage.distinctWords) * 100),
                      })}
                </Text>
                {coverage.missing.length > 0 ? (
                  <Text className="mt-0.5 text-xs" style={{ color: M.sub }}>
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
                      setFormOpen(true);
                      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    }}
                    className="flex-row items-center rounded-full px-3 py-1.5"
                    style={{ backgroundColor: M.card }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: M.text }}>{m.word}</Text>
                    <Text className="ml-1 text-[10px]" style={{ color: M.muted }}>×{m.count}</Text>
                  </Pressable>
                ))}
                {coverage.missing.length > 40 ? (
                  <View className="justify-center px-1">
                    <Text className="text-xs" style={{ color: M.sub }}>
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
        <StudioCard>
          <Pressable
            onPress={() => setFormOpen((o) => !o)}
            disabled={isEditing}
            className="flex-row items-center justify-between"
          >
            <Text className="text-base font-semibold" style={{ color: M.text }}>
              {isEditing ? "Edit Entry" : "New Entry"}
            </Text>
            {!isEditing ? (
              <IconSymbol name={formOpen ? "chevron.up" : "chevron.down"} size={14} color={M.muted} />
            ) : null}
          </Pressable>

          {formOpen ? (
          <>
          <TextInput
            value={editor.word}
            onChangeText={(word) => setEditor((prev) => ({ ...prev, word }))}
            placeholder="Word"
            placeholderTextColor={M.muted}
            className="mt-3 rounded-xl px-3.5 py-2.5 text-sm"
            style={{ backgroundColor: M.inputBg, color: M.inputText }}
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
            className="mt-2 rounded-xl px-3.5 py-2.5 text-sm"
            style={{ backgroundColor: M.inputBg, color: M.inputText }}
          />
          <TextInput
            value={editor.example}
            onChangeText={(example) => setEditor((prev) => ({ ...prev, example }))}
            placeholder="Example sentence (optional)"
            placeholderTextColor={M.muted}
            multiline
            className="mt-2 min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm"
            style={{ backgroundColor: M.inputBg, color: M.inputText }}
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
            className="mt-2 rounded-xl px-3.5 py-2.5 text-sm"
            style={{ backgroundColor: M.inputBg, color: M.inputText }}
          />
          <TextInput
            value={editor.antonyms}
            onChangeText={(antonyms) => setEditor((prev) => ({ ...prev, antonyms }))}
            placeholder="Antonyms (comma-separated, optional)"
            placeholderTextColor={M.muted}
            className="mt-2 rounded-xl px-3.5 py-2.5 text-sm"
            style={{ backgroundColor: M.inputBg, color: M.inputText }}
          />
          <TextInput
            value={editor.semanticDomain}
            onChangeText={(semanticDomain) => setEditor((prev) => ({ ...prev, semanticDomain }))}
            placeholder="Semantic domain, e.g. body > senses (optional)"
            placeholderTextColor={M.muted}
            className="mt-2 rounded-xl px-3.5 py-2.5 text-sm"
            style={{ backgroundColor: M.inputBg, color: M.inputText }}
          />
          <VariantRows
            value={editor.dialectalVariants}
            onChange={(dialectalVariants) => setEditor((prev) => ({ ...prev, dialectalVariants }))}
          />

          <View className="mt-3">
            <StudioFilterPills
              options={CATEGORIES.map((category) => ({ id: category, label: capitalize(category) }))}
              value={editor.category}
              onChange={(category) => setEditor((prev) => ({ ...prev, category }))}
              scrollable
            />
          </View>

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={submit}
              disabled={upsertEntry.isPending}
              className="flex-1 rounded-xl bg-brand-500 py-3 active:opacity-80"
            >
              <Text className="text-center font-semibold text-white">{saveButtonLabel}</Text>
            </Pressable>
            {isEditing ? (
              <Pressable
                onPress={resetEditor}
                className="rounded-xl px-4 py-3 active:opacity-80"
                style={{ backgroundColor: M.pillBg }}
              >
                <Text className="font-semibold" style={{ color: M.text }}>{t("common.cancel")}</Text>
              </Pressable>
            ) : null}
          </View>
          </>
          ) : null}
        </StudioCard>
      </View>

      <View className="mt-5 px-5">
        <StudioSearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search entries…" />
      </View>

      <View className="mt-3 px-5 pb-1">
        <StudioFilterPills
          options={[
            { id: "all" as const, label: "All" },
            ...CATEGORIES.filter((cat) => entries.some((e) => e.category === cat)).map((category) => ({
              id: category as CategoryFilter,
              label: capitalize(category),
            })),
          ]}
          value={filterCategory ?? "all"}
          onChange={(id) => setFilterCategory(id === "all" ? undefined : id)}
          scrollable
        />
      </View>

      <View className="mt-4 px-5">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.4px]" style={{ color: M.muted }}>
          {isFiltered ? `Entries (${filteredEntries.length} of ${entries.length})` : `Entries (${entries.length})`}
        </Text>
      </View>
    </View>
  );

  const listEmpty = (
    <View className="px-5">
      {isLoading ? (
        <Text className="text-sm" style={{ color: M.sub }}>{t("common.loading")}</Text>
      ) : isFiltered ? (
        <View className="items-center py-12">
          <IconSymbol name="magnifyingglass" size={32} color={M.border} />
          <Text className="mt-3 text-center text-sm" style={{ color: M.muted }}>No entries match your search.</Text>
          <Pressable
            onPress={() => { setSearchQuery(""); setFilterCategory(undefined); }}
            className="mt-3 rounded-full px-4 py-2"
            style={{ backgroundColor: M.pillBg }}
          >
            <Text className="text-sm font-semibold" style={{ color: M.text }}>Clear filters</Text>
          </Pressable>
        </View>
      ) : (
        <Text className="text-sm" style={{ color: M.sub }}>No entries yet for this language.</Text>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: t("educator.nav.dictionary"), headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.ink }} edges={["top"]}>
        <StudioScreenHeader
          title={t("educator.nav.dictionary")}
          subtitle="Create, edit, and maintain reviewed vocabulary."
        />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: M.card }}>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
        />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
