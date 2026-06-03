import { useMuseumTheme } from "@/lib/use-museum-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  useCreateJournalEntry,
  useDeleteJournalEntry,
  useJournal,
  useUpdateJournalEntry,
} from "@/lib/hooks/use-journal";
import i18n from "@/lib/i18n";
import { useTourStore } from "@/store/tour-store";
import type { JournalEntry } from "@/types";
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
  return d.toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" });
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function EntryCard({ entry, onPress }: { entry: JournalEntry; onPress: () => void }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const count = wordCount(entry.content);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={entry.title}
      accessibilityHint={t("journal.editEntry")}
      style={{
        marginBottom: 10,
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        borderLeftWidth: 4,
        borderLeftColor: M.accent,
        padding: 16,
      }}
      className="active:opacity-70"
    >
      <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }} numberOfLines={1}>
        {entry.title}
      </Text>
      <Text
        style={{ marginTop: 6, fontSize: 13, lineHeight: 19, color: M.sub }}
        numberOfLines={3}
      >
        {entry.content}
      </Text>
      <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontSize: 10, color: M.muted, letterSpacing: 0.5 }}>
          {formatDate(entry.createdAt)}
        </Text>
        {entry.updatedAt !== entry.createdAt && (
          <Text style={{ fontSize: 10, color: M.muted, marginLeft: 6 }}>
            · {t("journal.edited")}
          </Text>
        )}
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 10, color: M.muted }}>
          {t("journal.words", { count, defaultValue: `${count} words` })}
        </Text>
      </View>
    </Pressable>
  );
}

export default function JournalScreen() {
  const M = useMuseumTheme();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>
          {t("journal.title")}
        </Text>
        <Text style={{ fontSize: 13, color: M.textDim, marginTop: 4 }}>
          {entryCount > 0
            ? t("journal.entryCount", { count: entryCount, defaultValue: `${entryCount} ${entryCount === 1 ? "entry" : "entries"}` })
            : t("journal.subtitle")}
        </Text>
      </View>

      <View style={{ flex: 1, backgroundColor: M.card }}>
        {isLoading ? (
          <LoadingScreen />
        ) : !entries || entries.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View
              style={{
                width: 72, height: 72, borderRadius: 36,
                alignItems: "center", justifyContent: "center",
                backgroundColor: `${M.accent}12`,
                borderWidth: 1, borderColor: `${M.accent}25`,
                marginBottom: 16,
              }}
            >
              <IconSymbol name="pencil.and.list.clipboard" size={30} color={M.accent} />
            </View>
            <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "700", color: M.text }}>
              {t("journal.emptyTitle", { defaultValue: "Nothing written yet" })}
            </Text>
            <Text style={{ marginTop: 6, textAlign: "center", fontSize: 13, color: M.sub, lineHeight: 18 }}>
              {t("journal.emptyBody", { defaultValue: "Capture your thoughts after a lesson. It helps things stick." })}
            </Text>
            <Pressable
              onPress={openNew}
              accessibilityRole="button"
              accessibilityLabel={t("journal.newEntry")}
              style={{
                marginTop: 24,
                flexDirection: "row", alignItems: "center", gap: 8,
                borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12,
                backgroundColor: M.accent,
              }}
              className="active:opacity-80"
            >
              <IconSymbol name="plus" size={16} color={M.ink} />
              <Text style={{ fontWeight: "800", color: M.ink, fontSize: 14 }}>
                {t("journal.writeFirst", { defaultValue: "Write your first entry" })}
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 }}
            renderItem={({ item }) => <EntryCard entry={item} onPress={() => openEdit(item)} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={M.accent}
                colors={[M.accent]}
              />
            }
          />
        )}
      </View>

      {/* FAB */}
      {entries && entries.length > 0 && (
        <Pressable
          onPress={openNew}
          accessibilityRole="button"
          accessibilityLabel={t("journal.newEntry")}
          style={{
            position: "absolute",
            right: 20,
            bottom: bottomInset + 72,
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: M.accent,
            elevation: 6,
            shadowColor: M.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
          className="active:opacity-80"
        >
          <IconSymbol name="plus" size={24} color={M.ink} />
        </Pressable>
      )}

      {/* Editor Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: M.ink }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Modal nav */}
            <View
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                borderBottomWidth: 1, borderBottomColor: M.border,
                paddingHorizontal: 20, paddingVertical: 14,
              }}
            >
              <Pressable onPress={handleClose} hitSlop={8}>
                <Text style={{ fontSize: 14, color: M.textDim }}>{t("common.cancel")}</Text>
              </Pressable>
              <Text style={{ fontSize: 15, fontWeight: "800", color: M.parchment }}>
                {isEditing ? t("journal.editEntry") : t("journal.newEntry")}
              </Text>
              <Pressable onPress={handleSave} disabled={!canSave} hitSlop={8}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: canSave ? M.accent : M.muted }}>
                  {t("common.save")}
                </Text>
              </Pressable>
            </View>

            {/* Editor */}
            <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t("journal.titlePlaceholder")}
                placeholderTextColor={M.muted}
                returnKeyType="next"
                autoFocus
                onSubmitEditing={() => contentInputRef.current?.focus()}
                blurOnSubmit={false}
                style={{
                  marginBottom: 16, paddingBottom: 14,
                  borderBottomWidth: 1, borderBottomColor: M.border,
                  fontSize: 20, fontWeight: "800", color: M.parchment,
                }}
              />
              <TextInput
                ref={contentInputRef}
                value={content}
                onChangeText={setContent}
                placeholder={t("journal.contentPlaceholder")}
                placeholderTextColor={M.textDimDark}
                multiline
                textAlignVertical="top"
                style={{ flex: 1, fontSize: 14, lineHeight: 22, color: M.textDim }}
              />
            </View>

            {/* Footer */}
            <View
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                borderTopWidth: 1, borderTopColor: M.border,
                paddingHorizontal: 20, paddingVertical: 12,
              }}
            >
              <Text style={{ fontSize: 11, color: M.muted }}>
                {t("journal.words", { count: editorWordCount, defaultValue: `${editorWordCount} words` })}
              </Text>
              {isEditing && (
                <Pressable
                  onPress={() => handleDelete(editingId!, title)}
                  hitSlop={16}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.delete")}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  className="active:opacity-70"
                >
                  <IconSymbol name="trash" size={13} color="#f87171" />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#f87171" }}>
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
