import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerModal } from "@/components/language-picker";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { LabeledInput } from "@/components/studio/editor-form";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { StudioSearchInput } from "@/components/studio/studio-search-input";
import { LocalizedTextInput, serializeLocalizedText, toLocalizedText } from "@/components/ui/localized-text-input";
import { getAccent } from "@/constants/accent-colors";
import { friendlyError } from "@/lib/api";
import { localize } from "@/lib/localize";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { ActiveToggle } from "@/components/studio/active-toggle";
import {
  useDeleteEtymology,
  useEtymologyEntries,
  useUpsertEtymology,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
import type { EtymologyEntry, EtymologyNode, LocalizedText } from "@/types";
import { Stack } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EMPTY_NODE: EtymologyNode = { era: "", form: "", language: "", note: {} };

type EtymologyForm = {
  id?: string;
  word: string;
  english: LocalizedText;
  trail: EtymologyNode[];
};

const EMPTY_FORM: EtymologyForm = {
  word: "",
  english: {},
  trail: [{ ...EMPTY_NODE }],
};

// ── Trail node editor ─────────────────────────────────────────────────────────

function TrailEditor({
  trail,
  onChange,
}: {
  trail: EtymologyNode[];
  onChange: (trail: EtymologyNode[]) => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  function update(i: number, field: "era" | "form" | "language", value: string) {
    const next = trail.map((n, idx) => (idx === i ? { ...n, [field]: value } : n));
    onChange(next);
  }

  function updateNote(i: number, value: LocalizedText) {
    const next = trail.map((n, idx) => (idx === i ? { ...n, note: value } : n));
    onChange(next);
  }

  return (
    <View>
      {trail.map((node, i) => (
        <View
          key={i}
          className="mt-3 rounded-2xl p-3"
          style={{ backgroundColor: M.card, borderLeftWidth: 3, borderLeftColor: getAccent("sky").solid }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: M.muted }}>
              {t("educator.etymology.nodeLabel", { number: i + 1 })}
            </Text>
            {trail.length > 1 && (
              <Pressable onPress={() => onChange(trail.filter((_, idx) => idx !== i))} hitSlop={8}>
                <IconSymbol name="xmark.circle.fill" size={16} color={M.error} />
              </Pressable>
            )}
          </View>
          <LabeledInput label={t("educator.etymology.eraPlaceholder")} value={node.era} onChange={(v) => update(i, "era", v)} />
          <View className="mt-2">
            <LabeledInput label={t("educator.etymology.formPlaceholder")} value={node.form} onChange={(v) => update(i, "form", v)} />
          </View>
          <View className="mt-2">
            <LabeledInput label={t("educator.etymology.languagePlaceholder")} value={node.language} onChange={(v) => update(i, "language", v)} />
          </View>
          <View className="mt-2">
            <LocalizedTextInput
              label={t("educator.etymology.notePlaceholder")}
              value={toLocalizedText(node.note)}
              onChange={(v) => updateNote(i, v)}
              multiline
            />
          </View>
        </View>
      ))}
      <Pressable
        onPress={() => onChange([...trail, { ...EMPTY_NODE }])}
        className="mt-3 flex-row items-center gap-1.5 active:opacity-70"
      >
        <IconSymbol name="plus.circle.fill" size={16} color={getAccent("sky").solid} />
        <Text className="text-sm font-semibold" style={{ color: getAccent("sky").solid }}>
          {t("educator.etymology.addNode")}
        </Text>
      </Pressable>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EducatorEtymologyScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { user: currentUser, canAccess } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const flatListRef = useRef<FlatList>(null);

  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<EtymologyForm>(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  // Leaving with the editor panel open risks losing an unsaved entry.
  useUnsavedGuard(formOpen);

  const allowedLanguages = currentUser?.isAdmin
    ? LANGUAGES.map((l) => l.id)
    : (currentUser?.reviewerLanguages ?? []);

  const activeLanguageId =
    selectedLanguageId ?? allowedLanguages[0] ?? currentUser?.selectedLanguageId ?? "izon";

  const { data: entries = [], isLoading, refetch } = useEtymologyEntries(activeLanguageId, canAccess);
  const upsert = useUpsertEtymology();
  const del = useDeleteEtymology();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const q = searchQuery.toLowerCase().trim();
  const filtered = q
    ? entries.filter(
        (e) => e.word.toLowerCase().includes(q) || localize(e.english, "en").toLowerCase().includes(q),
      )
    : entries;

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditing(false);
    setFormOpen(false);
  };

  const startEdit = (entry: EtymologyEntry) => {
    setForm({
      id: entry.id,
      word: entry.word,
      english: toLocalizedText(entry.english),
      trail: entry.trail.map((n) => ({ ...n, note: toLocalizedText(n.note) })),
    });
    setEditing(true);
    setFormOpen(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const submit = () => {
    if (!form.word.trim() || !form.english.en?.trim()) {
      toastError(t("educator.etymology.missingFields"), t("educator.etymology.missingWordEnglish"));
      return;
    }
    if (form.trail.some((n) => !n.era.trim() || !n.form.trim() || !n.language.trim())) {
      toastError(t("educator.etymology.incompleteTrail"), t("educator.etymology.incompleteTrailDetail"));
      return;
    }
    upsert.mutate(
      {
        id: form.id,
        languageId: activeLanguageId,
        word: form.word.trim(),
        english: serializeLocalizedText(form.english).primary,
        trail: form.trail.map((n) => ({ ...n, note: serializeLocalizedText(toLocalizedText(n.note)).primary })),
      },
      {
        onSuccess: () => {
          reset();
          toastSuccess(editing ? t("educator.etymology.updated") : t("educator.etymology.created"));
        },
        onError: (err) => toastError(t("educator.etymology.saveFailed"), friendlyError(err)),
      },
    );
  };

  const confirmDelete = (id: string, word: string) => {
    Alert.alert(t("educator.etymology.deleteTitle"), t("educator.etymology.deleteMessage", { word }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () =>
          del.mutate(id, {
            onSuccess: () => toastSuccess(t("educator.etymology.deleted")),
            onError: (err) => toastError(t("educator.etymology.deleteFailed"), friendlyError(err)),
          }),
      },
    ]);
  };

  const listHeader = (
    <View>
      {/* Language selector */}
      <View className="mt-4 px-5">
        <Pressable
          onPress={() => setLangPickerVisible(true)}
          className="flex-row items-center justify-between rounded-xl border px-3 py-2.5 active:opacity-70"
          style={{ backgroundColor: M.card, borderColor: M.border }}
        >
          <View className="flex-row items-center">
            <IconSymbol name="clock.arrow.circlepath" size={16} color={getAccent("sky").solid} />
            <Text className="ml-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {getLanguageName(activeLanguageId)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs" style={{ color: M.muted }}>
              {entries.length === 1 ? t("educator.etymology.countOne", { count: 1 }) : t("educator.etymology.countMany", { count: entries.length })}
            </Text>
            <IconSymbol name="chevron.right" size={14} color={M.muted} />
          </View>
        </Pressable>
      </View>

      {/* Form */}
      {formOpen && (
        <View className="mx-5 mt-4">
        <StudioCard>
          <Text className="mb-3 text-base font-semibold" style={{ color: M.text }}>
            {editing ? t("educator.etymology.editEntry") : t("educator.etymology.newEntry")}
          </Text>
          <LabeledInput label={t("educator.etymology.wordLabel")} value={form.word} onChange={(word) => setForm((f) => ({ ...f, word }))} />
          <View className="mt-2">
            <LocalizedTextInput
              label={t("educator.etymology.englishLabel")}
              value={form.english}
              onChange={(english) => setForm((f) => ({ ...f, english }))}
              required
            />
          </View>

          <Text className="mt-4 mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: M.sub }}>
            {t("educator.etymology.trailLabel")}
          </Text>
          <TrailEditor trail={form.trail} onChange={(trail) => setForm((f) => ({ ...f, trail }))} />

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={submit}
              disabled={upsert.isPending}
              className="flex-1 rounded-xl py-3 active:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: getAccent("sky").solid }}
            >
              <Text className="text-center font-semibold text-white">
                {upsert.isPending ? t("common.loading") : editing ? t("common.save") : t("educator.culture.create")}
              </Text>
            </Pressable>
            <Pressable
              onPress={reset}
              className="rounded-xl px-4 py-3 active:opacity-80"
              style={{ backgroundColor: M.pillBg }}
            >
              <Text className="font-semibold" style={{ color: M.text }}>
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>
        </StudioCard>
        </View>
      )}

      {/* Search */}
      <View className="mt-5 px-5">
        <StudioSearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder={t("educator.etymology.searchPlaceholder")} />
      </View>

      <View className="mt-4 px-5">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.4px]" style={{ color: M.muted }}>
          {filtered.length !== entries.length
            ? t("educator.etymology.countFiltered", { count: filtered.length, total: entries.length })
            : filtered.length === 1
              ? t("educator.etymology.countOne", { count: 1 })
              : t("educator.etymology.countMany", { count: filtered.length })}
        </Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: EtymologyEntry }) => (
    <StudioCard style={{ marginHorizontal: 20 }}>
      <Text className="text-base font-bold" style={{ color: M.text }}>{item.word}</Text>
      <Text className="text-sm" style={{ color: M.sub }}>{localize(item.english, "en")}</Text>
      <Text className="mt-1 text-xs" style={{ color: M.muted }} numberOfLines={1}>
        {item.trail.map((n) => n.era).join(" → ")}
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-1.5">
        {item.trail.map((n, i) => (
          <View key={i} className="rounded-full bg-sky-100 px-2 py-0.5 dark:bg-sky-900/40">
            <Text className="text-[10px] font-semibold text-sky-700 dark:text-sky-400">
              {n.form}
            </Text>
          </View>
        ))}
      </View>
      <View
        style={{
          flexDirection: "row", alignItems: "center", gap: 8,
          marginTop: 12, paddingTop: 10,
          borderTopWidth: 1, borderTopColor: M.border,
        }}
      >
        <ActiveToggle
          entityType="etymology_entries"
          id={item.id}
          isActive={item.isActive ?? true}
          invalidateKeys={[["etymology"]]}
          M={M}
          onToast={{ success: toastSuccess, error: toastError }}
        />
        <View style={{ flex: 1 }} />
        <ActionPill icon="pencil" label={t("common.edit")} onPress={() => startEdit(item)} />
        <ActionPill icon="trash.fill" label={t("common.delete")} tone="danger" onPress={() => confirmDelete(item.id, item.word)} />
      </View>
    </StudioCard>
  );

  const listEmpty = (
    <View className="px-5">
      {isLoading ? (
        <Text className="text-sm" style={{ color: M.sub }}>{t("common.loading")}</Text>
      ) : (
        <View className="items-center py-12">
          <IconSymbol name="clock.arrow.circlepath" size={32} color={M.border} />
          <Text className="mt-3 text-center text-sm" style={{ color: M.muted }}>
            {q ? t("educator.etymology.noResults") : t("educator.etymology.noEntries")}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: t("admin.nav.etymology"), headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.ink }} edges={["top"]}>
        <StudioScreenHeader
          title={t("admin.nav.etymology")}
          subtitle={t("educator.etymology.subtitle")}
          action={!formOpen ? { label: t("educator.etymology.newEntry"), icon: "plus", onPress: () => setFormOpen(true) } : undefined}
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
            data={filtered}
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
        <LanguagePickerModal
          visible={langPickerVisible}
          selectedId={activeLanguageId}
          allowedIds={allowedLanguages.length > 0 ? allowedLanguages : undefined}
          onSelect={(langId) => {
            setSelectedLanguageId(langId);
            setLangPickerVisible(false);
            setSearchQuery("");
            reset();
          }}
          onClose={() => setLangPickerVisible(false)}
        />
      </SafeAreaView>
    </>
  );
}
