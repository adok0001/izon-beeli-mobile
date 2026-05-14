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
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
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

function EntryCard({
  entry,
  onPress,
  onDelete,
}: {
  entry: JournalEntry;
  onPress: () => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const confirmDelete = () => {
    Alert.alert(t("journal.deleteTitle"), t("journal.deleteConfirm", { title: entry.title }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => onDelete(entry.id) },
    ]);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={confirmDelete}
      className="mb-3 rounded-xl bg-neutral-50 p-4 active:opacity-80 dark:bg-neutral-800"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {entry.title}
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
            {formatDate(entry.createdAt)}
            {entry.updatedAt !== entry.createdAt && ` · ${t("journal.edited")}`}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
      </View>
      <Text
        className="mt-2 text-sm leading-5 text-neutral-700 dark:text-neutral-300"
        numberOfLines={3}
      >
        {entry.content}
      </Text>
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

  const isEditing = editingId !== null;
  const canSave = title.trim().length > 0 && content.trim().length > 0;
  const { t } = useTranslation();
  const showTour = useTourStore((s) => s.showTour);
  const hasSeen = useTourStore((s) => s.hasSeen);
  const activeTour = useTourStore((s) => s.activeTour);
  const isFocused = useIsFocused();

  // TODO: Legacy tour trigger (soft-retired) — remove after full deprecation
  // showTour('journal') is disabled; welcome checklist now handles onboarding

  const openNew = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setShowModal(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!canSave) return;
    if (isEditing) {
      updateEntry.mutate({ id: editingId, title: title.trim(), content: content.trim() });
    } else {
      createEntry.mutate({ title: title.trim(), content: content.trim() });
      // Show feed tour after first journal entry
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
    setShowModal(false);
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  const handleDelete = (id: string) => {
    deleteEntry.mutate(id);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View>
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            {t("journal.title")}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t("journal.subtitle")}
          </Text>
        </View>
        <Pressable
          onPress={openNew}
          className="h-10 w-10 items-center justify-center rounded-full bg-blue-500"
        >
          <IconSymbol name="plus" size={22} color="#ffffff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : !entries || entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="pencil.and.list.clipboard" size={48} color="#d1d5db" />
          <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
            {t("journal.noEntries")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8 pt-2"
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() => openEdit(item)}
              onDelete={handleDelete}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white dark:bg-neutral-900"
        >
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
              <Pressable onPress={handleClose}>
                <Text className="text-base text-neutral-500">{t("common.cancel")}</Text>
              </Pressable>
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {isEditing ? t("journal.editEntry") : t("journal.newEntry")}
              </Text>
              <Pressable onPress={handleSave} disabled={!canSave}>
                <Text
                  className={`text-base font-semibold ${
                    canSave
                      ? "text-blue-500"
                      : "text-neutral-300 dark:text-neutral-600"
                  }`}
                >
                  {t("common.save")}
                </Text>
              </Pressable>
            </View>

            <View className="flex-1 px-5 pt-4">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t("journal.titlePlaceholder")}
                placeholderTextColor="#9ca3af"
                className="mb-4 border-b border-neutral-200 pb-3 text-xl font-bold text-neutral-900 dark:border-neutral-700 dark:text-white"
              />
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder={t("journal.contentPlaceholder")}
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                className="flex-1 text-base leading-6 text-neutral-700 dark:text-neutral-300"
                autoFocus={!isEditing}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
