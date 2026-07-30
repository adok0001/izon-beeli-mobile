import { tWithVars } from "@/lib/i18n-dynamic";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput } from "@/components/ui/localized-text-input";
import type { LocalizedText } from "@/types";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { ActiveToggle } from "@/components/studio/active-toggle";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioDropdown } from "@/components/studio/studio-dropdown";
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
    toPreviewEntry,
    useSubmitEducatorDictionaryForReview,
    useUpsertEducatorDictionary,
} from "@/lib/hooks/use-educator-panel";
import { friendlyError } from "@/lib/api";
import { DICTIONARY_CATEGORY_VALUES, splitList, type DialectalVariant } from "@/lib/dictionary";
import { useDictionaryCoverage } from "@/lib/hooks/use-contributions";
import { useToast } from "@/lib/hooks/use-toast";
import { getLanguageName } from "@/lib/mock-data";
import { useLanguages } from "@/store/languages-store";
import { usePreviewStore } from "@/store/preview-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES: EducatorDictionaryCategory[] = [...DICTIONARY_CATEGORY_VALUES];

/** "nouns" -> "Nouns" — for filter-pill labels; category values render as-is elsewhere. */
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}


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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<EducatorDictionaryCategory | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);
  const languages = useLanguages();

  const allowedLanguages = useMemo(() => {
    if (!currentUser) return [] as string[];
    if (currentUser.isAdmin) return languages.map((l) => l.id);
    return currentUser.reviewerLanguages;
  }, [currentUser, languages]);

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
  // Create-only: existing entries are edited on the replica screen, so the form
  // never enters an "update" mode.
  let saveButtonLabel = "Create";
  if (upsertEntry.isPending) saveButtonLabel = t("common.loading");

  const resetEditor = () => {
    setEditor(EMPTY_EDITOR);
    setFormOpen(false);
  };

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
        translations: editor.translations,
        category: editor.category,
        pronunciation: editor.pronunciation.trim() || undefined,
        example: editor.example.trim() || undefined,
        exampleTranslations: editor.exampleTranslations,
        synonyms: splitList(editor.synonyms),
        antonyms: splitList(editor.antonyms),
        semanticDomain: editor.semanticDomain.trim() || undefined,
        dialectalVariants: editor.dialectalVariants.filter((v) => v.dialect.trim() && v.form.trim()),
      },
      {
        onSuccess: () => {
          resetEditor();
          toastSuccess("Entry created", `"${editor.word}" saved to dictionary.`);
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
    setPreview({
      kind: "dictionary",
      entry: toPreviewEntry(item),
      uiLanguage,
      // Contribution-sourced rows aren't `dictionary_entries` rows, so the
      // PATCH the replica editor issues would 404 on them.
      editable: !item._source,
    });
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
          {/* Editing an existing entry happens on the replica screen, not by
              prefilling the create form — one way in, and it shows the educator
              what a learner sees. The form below is now create-only. */}
          <ActionPill icon="pencil" label={t("common.edit")} onPress={() => openPreview(item)} />
          <ActionPill icon="trash.fill" label={t("common.delete")} tone="danger" onPress={() => confirmDelete(item.id)} />
        </View>
      </StudioCard>
    ),
    [confirmDelete, openPreview, submitForReview, publishEntry, currentUser, t, M, toastSuccess, toastError],
  );

  const listHeader = (
    <View>
      <View className="mt-4 px-5">
        <StudioDropdown
          label="Language"
          icon="globe"
          value={activeLanguageId}
          options={allowedLanguages.map((languageId) => ({ id: languageId, label: getLanguageName(languageId) }))}
          onChange={setSelectedLanguageId}
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
                    : tWithVars(t, "review.coverageSummary", {
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
            className="flex-row items-center justify-between"
          >
            <Text className="text-base font-semibold" style={{ color: M.text }}>
              New Entry
            </Text>
            <IconSymbol name={formOpen ? "chevron.up" : "chevron.down"} size={14} color={M.muted} />
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
            <StudioDropdown
              label="Category"
              icon="square.grid.2x2"
              value={editor.category}
              options={CATEGORIES.map((category) => ({ id: category as string, label: capitalize(category) }))}
              onChange={(category) => setEditor((prev) => ({ ...prev, category: category as EducatorDictionaryCategory }))}
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
            <Pressable
              onPress={resetEditor}
              className="rounded-xl px-4 py-3 active:opacity-80"
              style={{ backgroundColor: M.pillBg }}
            >
              <Text className="font-semibold" style={{ color: M.text }}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
          </>
          ) : null}
        </StudioCard>
      </View>

      <View className="mt-5 px-5">
        <StudioSearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search entries…" />
      </View>

      <View className="mt-3 px-5 pb-1">
        <StudioDropdown
          label="Category"
          icon="square.grid.2x2"
          value={filterCategory ?? "all"}
          options={[
            { id: "all", label: `All categories (${entries.length})` },
            ...CATEGORIES.filter((cat) => entries.some((e) => e.category === cat)).map((category) => ({
              id: category as string,
              label: capitalize(category),
              annotation: String(entries.filter((e) => e.category === category).length),
            })),
          ]}
          onChange={(id) => setFilterCategory(id === "all" ? undefined : (id as EducatorDictionaryCategory))}
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
          action={{
            label: "Bulk edit",
            icon: "square.and.pencil",
            onPress: () =>
              router.push({
                pathname: "/educator/bulk-import",
                params: { mode: "edit", languageId: activeLanguageId, category: filterCategory ?? "" },
              }),
          }}
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
