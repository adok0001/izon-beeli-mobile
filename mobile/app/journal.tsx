import { useMuseumTheme } from "@/lib/use-museum-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  useCreateJournalEntry,
  useDeleteJournalEntry,
  useJournal,
  useUpdateJournalEntry,
} from "@/lib/hooks/use-journal";
import { useStreakCelebration } from "@/lib/hooks/use-progress";
import { StreakCelebrationModal } from "@/components/streak-celebration-modal";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useVoiceRecording } from "@/lib/hooks/use-voice-recording";
import {
  deleteRecording,
  getRecording,
  migrateRecording,
  setRecording,
} from "@/lib/journal-recordings";
import i18n from "@/lib/i18n";
import { useTourStore } from "@/store/tour-store";
import type { JournalEntry } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TextInput as TextInputType } from "react-native";
import { useTranslation } from "react-i18next";
import { LoadingScreen } from "@/components/loading-screen";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" });
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function readingTime(text: string) {
  return Math.max(1, Math.ceil(wordCount(text) / 200));
}

function groupEntriesBySections(entries: JournalEntry[]): { title: string; data: JournalEntry[] }[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, JournalEntry[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  for (const entry of entries) {
    const dateStr = entry.createdAt.slice(0, 10);
    const entryDate = new Date(entry.createdAt);
    if (dateStr === todayStr) {
      groups.today.push(entry);
    } else if (dateStr === yesterdayStr) {
      groups.yesterday.push(entry);
    } else if (entryDate >= weekAgo) {
      groups.thisWeek.push(entry);
    } else {
      groups.earlier.push(entry);
    }
  }

  const sections: { title: string; data: JournalEntry[] }[] = [];
  if (groups.today.length) sections.push({ title: "Today", data: groups.today });
  if (groups.yesterday.length) sections.push({ title: "Yesterday", data: groups.yesterday });
  if (groups.thisWeek.length) sections.push({ title: "This Week", data: groups.thisWeek });
  if (groups.earlier.length) sections.push({ title: "Earlier", data: groups.earlier });
  return sections;
}

function EntryCard({
  entry,
  hasRecording,
  onPress,
}: {
  entry: JournalEntry;
  hasRecording: boolean;
  onPress: () => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const count = wordCount(entry.content);
  const mins = readingTime(entry.content);

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
        padding: 18,
      }}
      className="active:opacity-70"
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: M.text }} numberOfLines={1}>
          {entry.title}
        </Text>
        {entry.isPublic && (
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 3,
              backgroundColor: `${M.accent}18`,
              borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
            }}
          >
            <IconSymbol name="globe" size={9} color={M.accent} />
            <Text style={{ fontSize: 9, fontWeight: "700", color: M.accent, letterSpacing: 0.5 }}>
              PUBLIC
            </Text>
          </View>
        )}
        {hasRecording && (
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 3,
              backgroundColor: `${M.accent}18`,
              borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
            }}
          >
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: M.accent }} />
            <Text style={{ fontSize: 9, fontWeight: "700", color: M.accent, letterSpacing: 0.5 }}>
              REC
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{ marginTop: 6, fontSize: 13, lineHeight: 20, color: M.sub }}
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
        <Text style={{ fontSize: 10, color: M.muted, marginLeft: 6 }}>
          · ~{mins} min read
        </Text>
      </View>
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, marginBottom: 8, paddingHorizontal: 16 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: M.accent }} />
        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", color: M.muted }}>
          {title}
        </Text>
        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: M.accent }} />
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
    </View>
  );
}

const TEMP_RECORDING_ID = "__new__";

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function WaveformBars({ color, active }: { color: string; active: boolean }) {
  const heights = [6, 10, 14, 10, 6, 12, 8, 14, 10, 6];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2, height: 18 }}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            width: 2,
            height: active ? h : h * 0.5,
            borderRadius: 1,
            backgroundColor: color,
            opacity: active ? 1 : 0.4,
          }}
        />
      ))}
    </View>
  );
}

export default function JournalScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { data: entries, isLoading, refetch } = useJournal();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const { onStreakUpdate, celebration, clearCelebration, toast: streakToast, dismissToast } = useStreakCelebration();
  const createEntry = useCreateJournalEntry({ onStreakUpdate });
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const originalTitle = useRef("");
  const originalContent = useRef("");
  const originalIsPublic = useRef(false);
  const contentInputRef = useRef<TextInputType>(null);
  const { bottom: bottomInset } = useSafeAreaInsets();

  // Recording state keyed by entry id → hasRecording flag for list rendering
  const [recordingMap, setRecordingMap] = useState<Record<string, boolean>>({});

  const voice = useVoiceRecording();
  // Pulse animation for the recording indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (voice.state === "recording") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.6, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [voice.state, pulseAnim]);

  // Load recording map from storage when entries arrive
  useEffect(() => {
    if (!entries) return;
    Promise.all(entries.map((e) => getRecording(e.id).then((uri) => ({ id: e.id, has: !!uri })))).then(
      (results) => {
        const map: Record<string, boolean> = {};
        for (const r of results) map[r.id] = r.has;
        setRecordingMap(map);
      }
    );
  }, [entries]);

  const isEditing = editingId !== null;
  const canSave = title.trim().length > 0 && content.trim().length > 0;
  const isDirty =
    title.trim() !== originalTitle.current ||
    content.trim() !== originalContent.current ||
    isPublic !== originalIsPublic.current;
  const { t } = useTranslation();
  const showTour = useTourStore((s) => s.showTour);
  const hasSeen = useTourStore((s) => s.hasSeen);

  const openNew = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setIsPublic(false);
    originalTitle.current = "";
    originalContent.current = "";
    originalIsPublic.current = false;
    voice.discardRecording();
    setShowModal(true);
  };

  const openEdit = useCallback(async (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setIsPublic(entry.isPublic);
    originalTitle.current = entry.title.trim();
    originalContent.current = entry.content.trim();
    originalIsPublic.current = entry.isPublic;
    voice.discardRecording();
    const uri = await getRecording(entry.id);
    if (uri) voice.loadUri(uri);
    setShowModal(true);
  }, [voice]);

  const resetModal = () => {
    setTitle("");
    setContent("");
    setIsPublic(false);
    setEditingId(null);
    voice.discardRecording();
  };

  const handleSave = async () => {
    if (!canSave) return;

    if (voice.state === "recording") {
      await voice.stopRecording();
    }

    if (isEditing) {
      updateEntry.mutate({ id: editingId, title: title.trim(), content: content.trim(), isPublic });
      if (voice.uri) {
        await setRecording(editingId, voice.uri);
        setRecordingMap((m) => ({ ...m, [editingId]: true }));
      }
    } else {
      // For new entries, persist recording under temp key then migrate after server returns id
      if (voice.uri) {
        await setRecording(TEMP_RECORDING_ID, voice.uri);
      }
      createEntry.mutate(
        { title: title.trim(), content: content.trim(), isPublic },
        {
          onSuccess: async ({ entry }) => {
            if (voice.uri) {
              await migrateRecording(TEMP_RECORDING_ID, entry.id);
              setRecordingMap((m) => ({ ...m, [entry.id]: true }));
            }
          },
        }
      );
      if (!hasSeen("feed")) {
        setTimeout(() => showTour("feed"), 1000);
      }
    }

    resetModal();
    setShowModal(false);
  };

  const handleClose = () => {
    const dirty = isDirty && (title.trim() || content.trim());
    const hasUnsavedRecording = voice.state !== "idle" && !isEditing;

    if (dirty || hasUnsavedRecording) {
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
              resetModal();
            },
          },
        ]
      );
    } else {
      setShowModal(false);
      resetModal();
    }
  };

  const handleDelete = (id: string, entryTitle: string) => {
    Alert.alert(t("journal.deleteTitle"), t("journal.deleteConfirm", { title: entryTitle }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          deleteEntry.mutate(id);
          await deleteRecording(id);
          setRecordingMap((m) => { const n = { ...m }; delete n[id]; return n; });
          setShowModal(false);
          resetModal();
        },
      },
    ]);
  };

  const handleDiscardRecording = async () => {
    if (isEditing && editingId) {
      await deleteRecording(editingId);
      setRecordingMap((m) => ({ ...m, [editingId]: false }));
    }
    voice.discardRecording();
  };

  const entryCount = entries?.length ?? 0;
  const editorWordCount = wordCount(content);
  const editorReadingMins = readingTime(content);
  const sections = entries && entries.length > 0 ? groupEntriesBySections(entries) : [];

  return (
    <>
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10, alignSelf: "flex-start" }}
          className="active:opacity-60"
          accessibilityRole="button"
        >
          <IconSymbol name="chevron.left" size={14} color={M.parchment} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: M.parchment }}>{t("common.back")}</Text>
        </Pressable>
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
            <Text style={{ marginTop: 10, fontSize: 11, color: M.muted }}>
              Your entries are private.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EntryCard
                entry={item}
                hasRecording={!!recordingMap[item.id]}
                onPress={() => openEdit(item)}
              />
            )}
            renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
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
            {/* Nav bar — all controls live here, keyboard-safe */}
            <View
              style={{
                flexDirection: "row", alignItems: "center",
                borderBottomWidth: 1, borderBottomColor: M.border,
                paddingHorizontal: 16, paddingVertical: 12,
                gap: 8,
              }}
            >
              {/* Left: Cancel + Delete (when editing) */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, minWidth: 72 }}>
                <Pressable onPress={handleClose} hitSlop={10} accessibilityRole="button">
                  <Text style={{ fontSize: 14, color: M.textDim }}>{t("common.cancel")}</Text>
                </Pressable>
                {isEditing && (
                  <Pressable
                    onPress={() => handleDelete(editingId!, title)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={t("common.delete")}
                    className="active:opacity-60"
                  >
                    <IconSymbol name="trash" size={15} color="#f87171" />
                  </Pressable>
                )}
              </View>

              {/* Centre: title label or live recording indicator */}
              <View style={{ flex: 1, alignItems: "center" }}>
                {voice.state === "recording" ? (
                  <Pressable
                    onPress={voice.stopRecording}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Stop recording"
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                    className="active:opacity-70"
                  >
                    <Animated.View
                      style={{
                        width: 7, height: 7, borderRadius: 4,
                        backgroundColor: "#f87171",
                        transform: [{ scale: pulseAnim }],
                      }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#f87171" }}>
                      {formatSeconds(voice.elapsed)}
                    </Text>
                    <View
                      style={{
                        width: 18, height: 18, borderRadius: 4,
                        backgroundColor: "#f87171",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <View style={{ width: 7, height: 7, borderRadius: 1, backgroundColor: M.ink }} />
                    </View>
                  </Pressable>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "800", color: M.parchment }}>
                    {isEditing ? t("journal.editEntry") : t("journal.newEntry")}
                  </Text>
                )}
              </View>

              {/* Right: visibility · mic · save */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, minWidth: 72, justifyContent: "flex-end" }}>
                <Pressable
                  onPress={() => setIsPublic((v) => !v)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={isPublic ? "Make private" : "Make public"}
                  className="active:opacity-60"
                >
                  <IconSymbol
                    name={isPublic ? "globe" : "lock"}
                    size={15}
                    color={isPublic ? M.accent : M.muted}
                  />
                </Pressable>

                {voice.state === "idle" && (
                  <Pressable
                    onPress={voice.startRecording}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Record voice note"
                    className="active:opacity-60"
                  >
                    <IconSymbol name="mic.fill" size={15} color={M.muted} />
                  </Pressable>
                )}

                <Pressable onPress={handleSave} disabled={!canSave} hitSlop={10} accessibilityRole="button">
                  <Text style={{ fontSize: 14, fontWeight: "800", color: canSave ? M.accent : M.muted }}>
                    {t("common.save")}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Editor */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
                  paddingBottom: 12,
                  borderBottomWidth: 2,
                  borderBottomColor: title.length > 0 ? M.accent : M.border,
                  fontSize: 24, fontWeight: "800", color: M.parchment,
                }}
              />
              {/* Word count — quiet inline annotation */}
              <Text style={{ fontSize: 10, color: editorWordCount > 150 ? M.accent : M.muted, marginTop: 6, marginBottom: 14, letterSpacing: 0.4 }}>
                {editorWordCount > 0
                  ? `${editorWordCount} ${editorWordCount === 1 ? "word" : "words"} · ~${editorReadingMins} min`
                  : t("journal.words", { count: 0, defaultValue: "0 words" })}
              </Text>
              <TextInput
                ref={contentInputRef}
                value={content}
                onChangeText={setContent}
                placeholder={t("journal.contentPlaceholder", { defaultValue: "What are you thinking about…" })}
                placeholderTextColor={M.textDimDark}
                multiline
                textAlignVertical="top"
                style={{ minHeight: 200, fontSize: 15, lineHeight: 24, color: M.textDim }}
              />
            </ScrollView>

            {/* Voice note player — inline strip above safe area */}
            {voice.state === "stopped" && voice.uri && (
              <View
                style={{
                  marginHorizontal: 20, marginBottom: 12,
                  borderRadius: 12,
                  backgroundColor: `${M.accent}10`,
                  borderWidth: 1, borderColor: `${M.accent}30`,
                  paddingHorizontal: 14, paddingVertical: 10,
                  flexDirection: "row", alignItems: "center", gap: 10,
                }}
              >
                <Pressable
                  onPress={voice.togglePlayback}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={voice.isPlaying ? "Pause" : "Play recording"}
                  style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: M.accent,
                    alignItems: "center", justifyContent: "center",
                  }}
                  className="active:opacity-70"
                >
                  <IconSymbol
                    name={voice.isPlaying ? "pause.fill" : "play.fill"}
                    size={14}
                    color={M.ink}
                  />
                </Pressable>
                <WaveformBars color={M.accent} active={voice.isPlaying} />
                <Text style={{ fontSize: 11, color: M.accent, fontWeight: "700", minWidth: 36 }}>
                  {formatSeconds(
                    voice.isPlaying
                      ? voice.playbackDuration - voice.playbackPosition
                      : voice.playbackDuration
                  )}
                </Text>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={handleDiscardRecording}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Discard recording"
                  className="active:opacity-70"
                >
                  <IconSymbol name="xmark" size={12} color={M.muted} />
                </Pressable>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
    <NotificationBanner visible={streakToast.visible} title={streakToast.title} body={streakToast.body} type={streakToast.type} onDismiss={dismissToast} />
    <StreakCelebrationModal visible={!!celebration} streak={celebration?.streak ?? 0} isMilestone={celebration?.isMilestone} onDismiss={clearCelebration} />
    </>
  );
}
