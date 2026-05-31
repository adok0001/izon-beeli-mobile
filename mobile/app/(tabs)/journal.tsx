import { IconSymbol } from "@/components/ui/icon-symbol";
import {
    useCreateJournalEntry,
    useDeleteJournalEntry,
    useJournal,
    useUpdateJournalEntry,
} from "@/lib/hooks/use-journal";
import i18n from "@/lib/i18n";
// TODO: Legacy tour import (soft-retired) — remove after full deprecation
import { useTourStore } from "@/store/tour-store";
import type { JournalEntry } from "@/types";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TextInput as TextInputType } from "react-native";
import { useTranslation } from "react-i18next";
import { LoadingScreen } from "@/components/loading-screen";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(i18n.language, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function EntryCard({
  entry,
  onPress,
}: {
  entry: JournalEntry;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const count = wordCount(entry.content);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={entry.title}
      accessibilityHint={t("journal.editEntry")}
      className="mb-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4 active:opacity-75 dark:border-neutral-700/50 dark:bg-neutral-800"
    >
      <Text className="text-base font-semibold text-neutral-900 dark:text-white" numberOfLines={1}>
        {entry.title}
      </Text>
      <Text
        className="mt-2 text-sm leading-5 text-neutral-600 dark:text-neutral-300"
        numberOfLines={3}
      >
        {entry.content}
      </Text>
      <View className="mt-3 flex-row items-center gap-3">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {formatDate(entry.createdAt)}
        </Text>
        {entry.updatedAt !== entry.createdAt && (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            · {t("journal.edited")}
          </Text>
        )}
        <View className="flex-1" />
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {t("journal.words", { count, defaultValue: `${count} words` })}
        </Text>
      </View>
    </Pressable>
  );
}

export default function JournalScreen() {
  const { data: entries, isLoading, refetch } = useJournal();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const originalTitle = useRef("");
  const originalContent = useRef("");
  const contentInputRef = useRef<TextInputType>(null);
  const { bottom: bottomInset } = useSafeAreaInsets();

  const isEditing = editingId !== null;
  const canSave = title.trim().length > 0 && content.trim().length > 0;
  const isDirty =
    title.trim() !== originalTitle.current || content.trim() !== originalContent.current;
  const { t } = useTranslation();
  const showTour = useTourStore((s) => s.showTour);
  const hasSeen = useTourStore((s) => s.hasSeen);
  const isFocused = useIsFocused();

  const openNew = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    originalTitle.current = "";
    originalContent.current = "";
    setShowModal(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    originalTitle.current = entry.title.trim();
    originalContent.current = entry.content.trim();
    setShowModal(true);
  };

  const handleSave = () => {
    if (!canSave) return;
    if (isEditing) {
      updateEntry.mutate({ id: editingId, title: title.trim(), content: content.trim() });
    } else {
      createEntry.mutate({ title: title.trim(), content: content.trim() });
      if (!hasSeen("feed")) {
        setTimeout(() => showTour("feed"), 1000);
      }
    }
    setTitle("");
    setContent("");
    setEditingId(null);
    setShowModal(false);
  };

  const handleClose = () => {
    if (isDirty && (title.trim() || content.trim())) {
      Alert.alert(
        t("journal.discardTitle", { defaultValue: "Discard changes?" }),
        t("journal.discardBody", { defaultValue: "Your unsaved changes will be lost." }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("journal.discard", { defaultValue: "Discard" }),
            style: "destructive",
            onPress: () => {
              setShowModal(false);
              setEditingId(null);
              setTitle("");
              setContent("");
            },
          },
        ]
      );
    } else {
      setShowModal(false);
      setEditingId(null);
      setTitle("");
      setContent("");
    }
  };

  const handleDelete = (id: string, entryTitle: string) => {
    Alert.alert(t("journal.deleteTitle"), t("journal.deleteConfirm", { title: entryTitle }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteEntry.mutate(id);
          setShowModal(false);
          setEditingId(null);
          setTitle("");
          setContent("");
        },
      },
    ]);
  };

  const entryCount = entries?.length ?? 0;
  const editorWordCount = wordCount(content);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      {/* Header */}
      <View className="px-5 pb-3 pt-4">
        <Text className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
          {t("journal.title")}
        </Text>
        <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
          {entryCount > 0
            ? t("journal.entryCount", { count: entryCount, defaultValue: `${entryCount} ${entryCount === 1 ? "entry" : "entries"}` })
            : t("journal.subtitle")}
        </Text>
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : !entries || entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
            <IconSymbol name="pencil.and.list.clipboard" size={36} color="#10b981" />
          </View>
          <Text className="text-center text-base font-semibold text-neutral-700 dark:text-neutral-300">
            {t("journal.emptyTitle", { defaultValue: "Nothing written yet" })}
          </Text>
          <Text className="mt-1 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {t("journal.emptyBody", { defaultValue: "Capture your thoughts after a lesson. It helps things stick." })}
          </Text>
          <Pressable
            onPress={openNew}
            accessibilityRole="button"
            accessibilityLabel={t("journal.newEntry")}
            className="mt-6 flex-row items-center rounded-full bg-emerald-500 px-6 py-3 active:opacity-80"
          >
            <IconSymbol name="plus" size={18} color="#ffffff" />
            <Text className="ml-2 font-semibold text-white">
              {t("journal.writeFirst", { defaultValue: "Write your first entry" })}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-28 pt-2"
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() => openEdit(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Floating action button */}
      {entries && entries.length > 0 && (
        <Pressable
          onPress={openNew}
          accessibilityRole="button"
          accessibilityLabel={t("journal.newEntry")}
          className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-emerald-500 active:opacity-80"
          style={{
            bottom: bottomInset + 72,
            elevation: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
          }}
        >
          <IconSymbol name="plus" size={26} color="#ffffff" />
        </Pressable>
      )}

      {/* Create / Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white dark:bg-neutral-900"
        >
          <SafeAreaView className="flex-1">
            {/* Modal nav bar */}
            <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
              <Pressable onPress={handleClose} hitSlop={8}>
                <Text className="text-base text-neutral-500">{t("common.cancel")}</Text>
              </Pressable>
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {isEditing ? t("journal.editEntry") : t("journal.newEntry")}
              </Text>
              <Pressable onPress={handleSave} disabled={!canSave} hitSlop={8}>
                <Text
                  className={`text-base font-semibold ${
                    canSave ? "text-emerald-500" : "text-neutral-300 dark:text-neutral-600"
                  }`}
                >
                  {t("common.save")}
                </Text>
              </Pressable>
            </View>

            {/* Editor */}
            <View className="flex-1 px-5 pt-4">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t("journal.titlePlaceholder")}
                placeholderTextColor="#9ca3af"
                returnKeyType="next"
                autoFocus
                onSubmitEditing={() => contentInputRef.current?.focus()}
                blurOnSubmit={false}
                className="mb-4 border-b border-neutral-200 pb-3 text-xl font-bold text-neutral-900 dark:border-neutral-700 dark:text-white"
              />
              <TextInput
                ref={contentInputRef}
                value={content}
                onChangeText={setContent}
                placeholder={t("journal.contentPlaceholder")}
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                className="flex-1 text-base leading-6 text-neutral-700 dark:text-neutral-300"
              />
            </View>

            {/* Editor footer */}
            <View className="flex-row items-center justify-between border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("journal.words", { count: editorWordCount, defaultValue: `${editorWordCount} words` })}
              </Text>
              {isEditing && (
                <Pressable
                  onPress={() => handleDelete(editingId!, title)}
                  hitSlop={16}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.delete")}
                  className="flex-row items-center gap-1.5 active:opacity-70"
                >
                  <IconSymbol name="trash" size={15} color="#dc2626" />
                  <Text className="text-xs font-medium text-red-600 dark:text-red-400">
                    {t("common.delete")}
                  </Text>
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
