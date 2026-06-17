import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerModal } from "@/components/language-picker";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { getAccent } from "@/constants/accent-colors";
import { friendlyError } from "@/lib/api";
import { localize } from "@/lib/localize";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import {
  useDeleteEtymology,
  useEtymologyEntries,
  useUpsertEtymology,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { EtymologyEntry, EtymologyNode } from "@/types";
import { Stack } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const inputCls =
  "rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white";

const EMPTY_NODE: EtymologyNode = { era: "", form: "", language: "", note: "" };

type EtymologyForm = {
  id?: string;
  word: string;
  english: string;
  trail: EtymologyNode[];
};

const EMPTY_FORM: EtymologyForm = {
  word: "",
  english: "",
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

  function update(i: number, field: keyof EtymologyNode, value: string) {
    const next = trail.map((n, idx) => (idx === i ? { ...n, [field]: value } : n));
    onChange(next);
  }

  return (
    <View>
      {trail.map((node, i) => (
        <View
          key={i}
          className="mt-3 rounded-2xl bg-white p-3 dark:bg-neutral-900"
          style={{ borderLeftWidth: 3, borderLeftColor: getAccent("sky").solid }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {t("educator.etymology.nodeLabel", { number: i + 1 })}
            </Text>
            {trail.length > 1 && (
              <Pressable onPress={() => onChange(trail.filter((_, idx) => idx !== i))} hitSlop={8}>
                <IconSymbol name="xmark.circle.fill" size={16} color={M.error} />
              </Pressable>
            )}
          </View>
          <TextInput
            value={node.era}
            onChangeText={(v) => update(i, "era", v)}
            placeholder={t("educator.etymology.eraPlaceholder")}
            placeholderTextColor={M.muted}
            className={inputCls}
          />
          <TextInput
            value={node.form}
            onChangeText={(v) => update(i, "form", v)}
            placeholder={t("educator.etymology.formPlaceholder")}
            placeholderTextColor={M.muted}
            className={`mt-2 ${inputCls}`}
          />
          <TextInput
            value={node.language}
            onChangeText={(v) => update(i, "language", v)}
            placeholder={t("educator.etymology.languagePlaceholder")}
            placeholderTextColor={M.muted}
            className={`mt-2 ${inputCls}`}
          />
          <TextInput
            value={node.note}
            onChangeText={(v) => update(i, "note", v)}
            placeholder={t("educator.etymology.notePlaceholder")}
            placeholderTextColor={M.muted}
            multiline
            className={`mt-2 ${inputCls} min-h-[44px]`}
          />
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
  const { data: currentUser } = useCurrentUser();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const flatListRef = useRef<FlatList>(null);

  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<EtymologyForm>(EMPTY_FORM);
  const [editing, setEditing] = useState(false);

  const canAccess = currentUser ? canAccessEducatorPanel(currentUser) : false;

  const allowedLanguages = currentUser?.isAdmin
    ? LANGUAGES.map((l) => l.id)
    : (currentUser?.reviewerLanguages ?? []);

  const activeLanguageId =
    selectedLanguageId ?? allowedLanguages[0] ?? currentUser?.selectedLanguageId ?? "izon";

  const { data: entries = [], isLoading } = useEtymologyEntries(activeLanguageId, canAccess);
  const upsert = useUpsertEtymology();
  const del = useDeleteEtymology();

  const q = searchQuery.toLowerCase().trim();
  const filtered = q
    ? entries.filter(
        (e) => e.word.toLowerCase().includes(q) || localize(e.english, "en").toLowerCase().includes(q),
      )
    : entries;

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditing(false);
  };

  const startEdit = (entry: EtymologyEntry) => {
    setForm({ id: entry.id, word: entry.word, english: localize(entry.english, "en"), trail: entry.trail });
    setEditing(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const submit = () => {
    if (!form.word.trim() || !form.english.trim()) {
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
        english: form.english.trim(),
        trail: form.trail,
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
      <View className="px-5 pt-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
          {t("admin.nav.etymology")}
        </Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t("educator.etymology.subtitle")}
        </Text>
      </View>

      {/* Language selector */}
      <View className="mt-4 px-5">
        <Pressable
          onPress={() => setLangPickerVisible(true)}
          className="flex-row items-center justify-between rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2.5 dark:border-neutral-600 dark:bg-neutral-800 active:opacity-70"
        >
          <View className="flex-row items-center">
            <IconSymbol name="clock.arrow.circlepath" size={16} color={getAccent("sky").solid} />
            <Text className="ml-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {getLanguageName(activeLanguageId)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-neutral-400 dark:text-neutral-500">
              {entries.length === 1 ? t("educator.etymology.countOne", { count: 1 }) : t("educator.etymology.countMany", { count: entries.length })}
            </Text>
            <IconSymbol name="chevron.right" size={14} color={M.muted} />
          </View>
        </Pressable>
      </View>

      {/* Form */}
      <View className="mx-5 mt-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
        <Text className="mb-3 text-base font-semibold text-neutral-900 dark:text-white">
          {editing ? t("educator.etymology.editEntry") : t("educator.etymology.newEntry")}
        </Text>
        <TextInput
          value={form.word}
          onChangeText={(word) => setForm((f) => ({ ...f, word }))}
          placeholder={t("educator.etymology.wordLabel")}
          placeholderTextColor={M.muted}
          className={inputCls}
        />
        <TextInput
          value={form.english}
          onChangeText={(english) => setForm((f) => ({ ...f, english }))}
          placeholder={t("educator.etymology.englishLabel")}
          placeholderTextColor={M.muted}
          className={`mt-2 ${inputCls}`}
        />

        <Text className="mt-4 mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
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
          {editing && (
            <Pressable
              onPress={reset}
              className="rounded-xl bg-neutral-200 px-4 py-3 active:opacity-80 dark:bg-neutral-700"
            >
              <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
                {t("common.cancel")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Search */}
      <View className="mt-5 px-5">
        <View className="flex-row items-center rounded-xl bg-neutral-100 px-3 dark:bg-neutral-800">
          <IconSymbol name="magnifyingglass" size={16} color={M.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("educator.etymology.searchPlaceholder")}
            placeholderTextColor={M.muted}
            autoCapitalize="none"
            autoCorrect={false}
            className="ml-2 flex-1 py-2.5 text-sm text-neutral-900 dark:text-white"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <IconSymbol name="xmark" size={14} color={M.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <View className="mt-4 px-5">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.4px] text-neutral-400 dark:text-neutral-500">
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
    <View className="mx-5 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-neutral-900 dark:text-white">{item.word}</Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">{localize(item.english, "en")}</Text>
          <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500" numberOfLines={1}>
            {item.trail.map((n) => n.era).join(" → ")}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => startEdit(item)}
            className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-800"
          >
            <IconSymbol name="gearshape.fill" size={14} color={M.muted} />
          </Pressable>
          <Pressable
            onPress={() => confirmDelete(item.id, item.word)}
            className="rounded-full bg-red-100 p-2 dark:bg-red-900/40"
          >
            <IconSymbol name="xmark.circle.fill" size={14} color={M.error} />
          </Pressable>
        </View>
      </View>
      <View className="mt-2 flex-row flex-wrap gap-1.5">
        {item.trail.map((n, i) => (
          <View key={i} className="rounded-full bg-sky-100 px-2 py-0.5 dark:bg-sky-900/40">
            <Text className="text-[10px] font-semibold text-sky-700 dark:text-sky-400">
              {n.form}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const listEmpty = (
    <View className="px-5">
      {isLoading ? (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t("common.loading")}</Text>
      ) : (
        <View className="items-center py-12">
          <IconSymbol name="clock.arrow.circlepath" size={32} color={M.border} />
          <Text className="mt-3 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {q ? t("educator.etymology.noResults") : t("educator.etymology.noEntries")}
          </Text>
        </View>
      )}
    </View>
  );

  if (!canAccess) {
    return (
      <>
        <Stack.Screen options={{ title: t("admin.nav.etymology") }} />
        <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("review.adminRequired")}
          </Text>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("admin.nav.etymology"), headerBackTitle: "Back" }} />
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
            data={filtered}
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
