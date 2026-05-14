import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import {
    EducatorDictionaryCategory,
    EducatorDictionaryEntry,
    useDeleteEducatorDictionaryEntry,
    useEducatorDictionary,
    useUpsertEducatorDictionary,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES: EducatorDictionaryCategory[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "greeting",
  "phrase",
  "number",
  "color",
  "body",
  "food",
  "family",
  "nature",
  "animal",
  "place",
  "other",
];

type EditorState = {
  id?: string;
  word: string;
  english: string;
  category: EducatorDictionaryCategory;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
};

const EMPTY_EDITOR: EditorState = {
  word: "",
  english: "",
  category: "noun",
  pronunciation: "",
  example: "",
  exampleTranslation: "",
};

export default function EducatorDictionaryScreen() {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<EducatorDictionaryCategory | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);

  const canAccess = currentUser ? canAccessEducatorPanel(currentUser) : false;
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
  const upsertEntry = useUpsertEducatorDictionary();
  const deleteEntry = useDeleteEducatorDictionaryEntry();
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
      english: entry.english,
      category: entry.category,
      pronunciation: entry.pronunciation ?? "",
      example: entry.example ?? "",
      exampleTranslation: entry.exampleTranslation ?? "",
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setIsEditing(true);
  }, []);

  const submit = () => {
    if (!editor.word.trim() || !editor.english.trim()) {
      toastError("Missing fields", "Word and English are required.");
      return;
    }

    upsertEntry.mutate(
      {
        id: editor.id,
        languageId: activeLanguageId,
        word: editor.word.trim(),
        english: editor.english.trim(),
        category: editor.category,
        pronunciation: editor.pronunciation.trim() || undefined,
        example: editor.example.trim() || undefined,
        exampleTranslation: editor.exampleTranslation.trim() || undefined,
      },
      {
        onSuccess: () => {
          resetEditor();
          toastSuccess(isEditing ? "Entry updated" : "Entry created", `"${editor.word}" saved to dictionary.`);
        },
        onError: (err: Error) => toastError("Save failed", err.message),
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
            onError: (err: Error) => toastError("Delete failed", err.message),
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
            <Pressable onPress={() => startEdit(item)} className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
              <IconSymbol name="gearshape.fill" size={14} color="#6b7280" />
            </Pressable>
            <Pressable onPress={() => confirmDelete(item.id)} className="rounded-full bg-red-100 p-2 dark:bg-red-900/40">
              <IconSymbol name="xmark.circle.fill" size={14} color="#ef4444" />
            </Pressable>
          </View>
        </View>
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          <View className="rounded-full bg-neutral-100 px-2 py-1 dark:bg-neutral-800">
            <Text className="text-[10px] font-semibold uppercase text-neutral-600 dark:text-neutral-400">{item.category}</Text>
          </View>
          {item._source === "contribution" ? (
            <View className="rounded-full bg-amber-100 px-2 py-1 dark:bg-amber-900/40">
              <Text className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400">contribution</Text>
            </View>
          ) : null}
        </View>
      </View>
    ),
    [startEdit, confirmDelete],
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

      <View className="mt-5 px-5">
        <View className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {isEditing ? "Edit Entry" : "New Entry"}
          </Text>

          <TextInput
            value={editor.word}
            onChangeText={(word) => setEditor((prev) => ({ ...prev, word }))}
            placeholder="Word"
            placeholderTextColor="#9ca3af"
            className="mt-3 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <TextInput
            value={editor.english}
            onChangeText={(english) => setEditor((prev) => ({ ...prev, english }))}
            placeholder="English translation"
            placeholderTextColor="#9ca3af"
            className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <TextInput
            value={editor.pronunciation}
            onChangeText={(pronunciation) => setEditor((prev) => ({ ...prev, pronunciation }))}
            placeholder="Pronunciation (optional)"
            placeholderTextColor="#9ca3af"
            className="mt-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <TextInput
            value={editor.example}
            onChangeText={(example) => setEditor((prev) => ({ ...prev, example }))}
            placeholder="Example sentence (optional)"
            placeholderTextColor="#9ca3af"
            multiline
            className="mt-2 min-h-[44px] rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
          />
          <TextInput
            value={editor.exampleTranslation}
            onChangeText={(exampleTranslation) => setEditor((prev) => ({ ...prev, exampleTranslation }))}
            placeholder="Example translation (optional)"
            placeholderTextColor="#9ca3af"
            multiline
            className="mt-2 min-h-[44px] rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white"
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
          <IconSymbol name="magnifyingglass" size={16} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search entries…"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="ml-2 flex-1 py-2.5 text-sm text-neutral-900 dark:text-white"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <IconSymbol name="xmark" size={14} color="#9ca3af" />
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
          <IconSymbol name="magnifyingglass" size={32} color="#d1d5db" />
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

  if (!canAccess) {
    return (
      <>
        <Stack.Screen options={{ title: t("educator.nav.dictionary") }} />
        <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t("review.adminRequired")}</Text>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("educator.nav.dictionary"), headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
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
      </SafeAreaView>
    </>
  );
}
