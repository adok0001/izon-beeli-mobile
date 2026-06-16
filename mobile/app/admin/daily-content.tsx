import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerModal } from "@/components/language-picker";
import { getAccent } from "@/constants/accent-colors";
import { apiFetch } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useProverbs } from "@/lib/hooks/use-proverbs";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useLanguages } from "@/lib/hooks/use-languages";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

const VALID_CATEGORIES = [
  "greetings", "numbers", "family", "pronouns", "time", "verbs", "body",
  "market", "occupations", "nouns", "phrases", "food", "possessives",
  "ordinals", "commands", "animals", "phonetics", "money", "proverbs",
] as const;

type DictCategory = typeof VALID_CATEGORIES[number];
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DictionaryEntry } from "@/lib/dictionary";
import type { Proverb, Lesson } from "@/types";

type Tab = "wotd" | "potm" | "sotw";

interface AdminWotd { overrideId: string | null; entry: DictionaryEntry | null; isOverride: boolean }
interface AdminPotm { overrideId: string | null; proverb: Proverb | null; isOverride: boolean }
interface AdminSotw { overrideId: string | null; lesson: Lesson | null; isOverride: boolean }
interface SongsResponse { id: string; title: string; artist: string | null; genre: string | null }[]

function Badge({ pinned }: { pinned: boolean }) {
  const { t } = useTranslation();
  return (
    <View className={`rounded-full px-2 py-0.5 ${pinned ? "bg-brand-100 dark:bg-brand-900/40" : "bg-neutral-100 dark:bg-neutral-800"}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-wider ${pinned ? "text-brand-600 dark:text-brand-400" : "text-neutral-400"}`}>
        {pinned ? t("admin.dailyContent.pinned") : t("admin.dailyContent.auto")}
      </Text>
    </View>
  );
}

export default function DailyContentAdminScreen() {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { data: languages = [] } = useLanguages();

  const defaultLang = currentUser?.selectedLanguageId ?? "izon";
  const [languageId, setLanguageId] = useState(defaultLang);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("wotd");
  const [search, setSearch] = useState("");
  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState({ word: "", english: "", french: "", category: "nouns" as DictCategory, pronunciation: "", example: "", exampleTranslation: "", exampleTranslationFr: "" });

  const langName = languages.find((l) => l.id === languageId)?.name ?? languageId;

  // ---- Admin status queries ----
  const { data: wotdAdmin, isLoading: wotdLoading } = useQuery<AdminWotd>({
    queryKey: ["admin-wotd", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/daily-content/admin/wotd?languageId=${encodeURIComponent(languageId)}`, { token: token ?? undefined });
    },
    enabled: !!languageId,
  });

  const { data: potmAdmin, isLoading: potmLoading } = useQuery<AdminPotm>({
    queryKey: ["admin-potm", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/daily-content/admin/potm?languageId=${encodeURIComponent(languageId)}`, { token: token ?? undefined });
    },
    enabled: !!languageId,
  });

  const { data: sotwAdmin, isLoading: sotwLoading } = useQuery<AdminSotw>({
    queryKey: ["admin-sotw", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/daily-content/admin/sotw?languageId=${encodeURIComponent(languageId)}`, { token: token ?? undefined });
    },
    enabled: !!languageId,
  });

  // ---- Content lists ----
  const { data: dictEntries = [] } = useDictionary(languageId);
  const { data: proverbsList = [] } = useProverbs(languageId);
  const { data: songsList = [] } = useQuery<{ id: string; title: string; artist: string | null; genre: string | null }[]>({
    queryKey: ["songs", languageId],
    queryFn: () => apiFetch(`/lessons?languageId=${encodeURIComponent(languageId)}&type=song`),
    enabled: !!languageId,
  });

  // ---- Filtered lists ----
  const q = search.toLowerCase();
  const filteredWords = useMemo(() =>
    dictEntries.filter((e) => e.word.toLowerCase().includes(q) || e.english.toLowerCase().includes(q)),
    [dictEntries, q]
  );
  const filteredProverbs = useMemo(() =>
    proverbsList.filter((p) => p.text.toLowerCase().includes(q) || p.translation.toLowerCase().includes(q)),
    [proverbsList, q]
  );
  const filteredSongs = useMemo(() =>
    songsList.filter((s) => s.title.toLowerCase().includes(q) || (s.artist ?? "").toLowerCase().includes(q)),
    [songsList, q]
  );

  // ---- Mutations ----
  async function authedFetch(path: string, options: RequestInit) {
    const token = await getToken();
    return apiFetch(path, { ...options, token: token ?? undefined });
  }

  const setWotd = useMutation({
    mutationFn: (entryId: string) =>
      authedFetch("/daily-content/admin/wotd", { method: "PUT", body: JSON.stringify({ languageId: languageId, entryId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wotd", languageId] }); qc.invalidateQueries({ queryKey: ["wotd", languageId] }); },
    onError: () => Alert.alert(t("common.error"), t("admin.dailyContent.errorSet")),
  });

  const clearWotd = useMutation({
    mutationFn: () => authedFetch(`/daily-content/admin/wotd?languageId=${encodeURIComponent(languageId)}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wotd", languageId] }); qc.invalidateQueries({ queryKey: ["wotd", languageId] }); },
    onError: () => Alert.alert(t("common.error"), t("admin.dailyContent.errorClear")),
  });

  const createAndPinWotd = useMutation({
    mutationFn: async () => {
      const created = await authedFetch("/dictionary/admin", {
        method: "POST",
        body: JSON.stringify({
          languageId,
          word: newWord.word.trim(),
          english: newWord.english.trim(),
          french: newWord.french.trim() || undefined,
          category: newWord.category,
          pronunciation: newWord.pronunciation.trim() || undefined,
          example: newWord.example.trim() || undefined,
          exampleTranslation: newWord.exampleTranslation.trim() || undefined,
          exampleTranslationFr: newWord.exampleTranslationFr.trim() || undefined,
        }),
      }) as { id: string };
      await authedFetch("/daily-content/admin/wotd", { method: "PUT", body: JSON.stringify({ languageId, entryId: created.id }) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wotd", languageId] });
      qc.invalidateQueries({ queryKey: ["wotd", languageId] });
      qc.invalidateQueries({ queryKey: ["dictionary", languageId] });
      setNewWord({ word: "", english: "", french: "", category: "nouns", pronunciation: "", example: "", exampleTranslation: "", exampleTranslationFr: "" });
      setShowAddWord(false);
      Alert.alert(t("admin.dailyContent.wotd.created"));
    },
    onError: () => Alert.alert(t("common.error"), t("admin.dailyContent.errorSet")),
  });

  const setPotm = useMutation({
    mutationFn: (proverbId: string) =>
      authedFetch("/daily-content/admin/potm", { method: "PUT", body: JSON.stringify({ languageId, proverbId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-potm", languageId] }); qc.invalidateQueries({ queryKey: ["potm", languageId] }); },
    onError: () => Alert.alert(t("common.error"), t("admin.dailyContent.errorSet")),
  });

  const clearPotm = useMutation({
    mutationFn: () => authedFetch(`/daily-content/admin/potm?languageId=${encodeURIComponent(languageId)}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-potm", languageId] }); qc.invalidateQueries({ queryKey: ["potm", languageId] }); },
    onError: () => Alert.alert(t("common.error"), t("admin.dailyContent.errorClear")),
  });

  const setSotw = useMutation({
    mutationFn: (lessonId: string) =>
      authedFetch("/daily-content/admin/sotw", { method: "PUT", body: JSON.stringify({ languageId, lessonId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sotw", languageId] }); qc.invalidateQueries({ queryKey: ["sotw", languageId] }); },
    onError: () => Alert.alert(t("common.error"), t("admin.dailyContent.errorSet")),
  });

  const clearSotw = useMutation({
    mutationFn: () => authedFetch(`/daily-content/admin/sotw?languageId=${encodeURIComponent(languageId)}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sotw", languageId] }); qc.invalidateQueries({ queryKey: ["sotw", languageId] }); },
    onError: () => Alert.alert(t("common.error"), t("admin.dailyContent.errorClear")),
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "wotd", label: t("admin.dailyContent.wotd.tab") },
    { key: "potm", label: t("admin.dailyContent.potm.tab") },
    { key: "sotw", label: t("admin.dailyContent.sotw.tab") },
  ];

  return (
    <>
      <Stack.Screen options={{ title: t("admin.dailyContent.title") }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-5 pt-5 pb-3">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">{t("admin.dailyContent.title")}</Text>
            <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("admin.dailyContent.subtitle")}</Text>
          </View>

          {/* Language picker */}
          <View className="px-5 mb-4">
            <Pressable
              onPress={() => setPickerVisible(true)}
              className="flex-row items-center justify-between rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-neutral-900 dark:text-white">{langName}</Text>
              <IconSymbol name="chevron.right" size={16} color={M.muted} />
            </Pressable>
          </View>

          {/* Tabs */}
          <View className="flex-row px-5 gap-2 mb-5">
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => { setActiveTab(tab.key); setSearch(""); }}
                className={`flex-1 items-center rounded-xl py-2.5 ${activeTab === tab.key ? "bg-brand-600" : "bg-neutral-100 dark:bg-neutral-800"}`}
              >
                <Text className={`text-xs font-bold ${activeTab === tab.key ? "text-white" : "text-neutral-500 dark:text-neutral-400"}`}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ---- Word of the Day ---- */}
          {activeTab === "wotd" && (
            <View className="px-5">
              {wotdLoading ? (
                <ActivityIndicator className="my-4" />
              ) : wotdAdmin?.entry ? (
                <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-4 mb-5">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{t("admin.dailyContent.current")}</Text>
                    <Badge pinned={wotdAdmin.isOverride} />
                  </View>
                  <Text className="text-xl font-bold text-neutral-900 dark:text-white">{wotdAdmin.entry.word}</Text>
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{wotdAdmin.entry.english}</Text>
                  {wotdAdmin.isOverride && (
                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          t("admin.dailyContent.confirmClearTitle"),
                          t("admin.dailyContent.confirmClearMessage"),
                          [
                            { text: t("common.cancel"), style: "cancel" },
                            { text: t("admin.dailyContent.clearOverride"), style: "destructive", onPress: () => clearWotd.mutate() },
                          ]
                        )
                      }
                      disabled={clearWotd.isPending}
                      className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 py-2 items-center active:opacity-70"
                    >
                      <Text className="text-sm font-semibold text-red-600 dark:text-red-400">{t("admin.dailyContent.clearOverride")}</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}

              {/* Add new word */}
              {!showAddWord ? (
                <Pressable
                  onPress={() => setShowAddWord(true)}
                  className="flex-row items-center gap-1.5 mb-4 active:opacity-70"
                >
                  <Text className="text-sm font-semibold text-brand-600 dark:text-brand-400">{t("admin.dailyContent.wotd.addNewCta")}</Text>
                </Pressable>
              ) : (
                <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 mb-5">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{t("admin.dailyContent.wotd.addNew")}</Text>
                    <Pressable onPress={() => setShowAddWord(false)} className="active:opacity-70">
                      <IconSymbol name="xmark" size={16} color={M.muted} />
                    </Pressable>
                  </View>

                  <Text className="text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldWord")}</Text>
                  <TextInput value={newWord.word} onChangeText={(v) => setNewWord((p) => ({ ...p, word: v }))} placeholderTextColor={M.muted} placeholder="e.g. Àkpọ" className="rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 px-3 py-2.5 text-sm text-neutral-900 dark:text-white mb-3" />

                  <Text className="text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldEnglish")}</Text>
                  <TextInput value={newWord.english} onChangeText={(v) => setNewWord((p) => ({ ...p, english: v }))} placeholderTextColor={M.muted} placeholder="e.g. World" className="rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 px-3 py-2.5 text-sm text-neutral-900 dark:text-white mb-3" />

                  <Text className="text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldCategory")}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                    <View className="flex-row gap-2">
                      {VALID_CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat}
                          onPress={() => setNewWord((p) => ({ ...p, category: cat }))}
                          className={`rounded-full px-3 py-1.5 active:opacity-70 ${newWord.category === cat ? "bg-brand-600" : "bg-neutral-200 dark:bg-neutral-600"}`}
                        >
                          <Text className={`text-xs font-semibold ${newWord.category === cat ? "text-white" : "text-neutral-600 dark:text-neutral-300"}`}>{cat}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  <Text className="text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldFrench")}</Text>
                  <TextInput value={newWord.french} onChangeText={(v) => setNewWord((p) => ({ ...p, french: v }))} placeholderTextColor={M.muted} placeholder="e.g. Monde" className="rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 px-3 py-2.5 text-sm text-neutral-900 dark:text-white mb-3" />

                  <Text className="text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldPronunciation")}</Text>
                  <TextInput value={newWord.pronunciation} onChangeText={(v) => setNewWord((p) => ({ ...p, pronunciation: v }))} placeholderTextColor={M.muted} placeholder="e.g. ah-KPO" className="rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 px-3 py-2.5 text-sm text-neutral-900 dark:text-white mb-3" />

                  <Text className="text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldExample")}</Text>
                  <TextInput value={newWord.example} onChangeText={(v) => setNewWord((p) => ({ ...p, example: v }))} placeholderTextColor={M.muted} multiline numberOfLines={2} className="rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 px-3 py-2.5 text-sm text-neutral-900 dark:text-white mb-3" />

                  <Text className="text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldExampleTranslation")}</Text>
                  <TextInput value={newWord.exampleTranslation} onChangeText={(v) => setNewWord((p) => ({ ...p, exampleTranslation: v }))} placeholderTextColor={M.muted} className="rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 px-3 py-2.5 text-sm text-neutral-900 dark:text-white mb-3" />

                  <Text className="text-xs font-medium text-neutral-500 mb-1">{t("admin.dailyContent.wotd.fieldExampleTranslationFr")}</Text>
                  <TextInput value={newWord.exampleTranslationFr} onChangeText={(v) => setNewWord((p) => ({ ...p, exampleTranslationFr: v }))} placeholderTextColor={M.muted} className="rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 px-3 py-2.5 text-sm text-neutral-900 dark:text-white mb-4" />

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => createAndPinWotd.mutate()}
                      disabled={!newWord.word.trim() || !newWord.english.trim() || createAndPinWotd.isPending}
                      className="flex-1 rounded-xl bg-brand-600 py-3 items-center active:opacity-70 disabled:opacity-50"
                    >
                      <Text className="text-sm font-bold text-white">
                        {createAndPinWotd.isPending ? t("admin.dailyContent.wotd.saving") : t("admin.dailyContent.wotd.saveAndPin")}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setShowAddWord(false)} className="rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-3 items-center active:opacity-70">
                      <Text className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{t("admin.dailyContent.wotd.cancel")}</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("admin.dailyContent.wotd.searchPlaceholder")}
                placeholderTextColor={M.muted}
                className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm text-neutral-900 dark:text-white mb-3"
              />

              {filteredWords.slice(0, 50).map((entry) => {
                const isSelected = wotdAdmin?.overrideId === entry.id;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() =>
                      Alert.alert(
                        t("admin.dailyContent.confirmSetTitle"),
                        t("admin.dailyContent.confirmSetMessage"),
                        [
                          { text: t("common.cancel"), style: "cancel" },
                          { text: t("admin.dailyContent.confirmSetButton"), onPress: () => setWotd.mutate(entry.id) },
                        ]
                      )
                    }
                    disabled={setWotd.isPending}
                    className={`flex-row items-center justify-between rounded-2xl px-4 py-3 mb-2 ${isSelected ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" : "bg-neutral-50 dark:bg-neutral-800"}`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-semibold text-neutral-900 dark:text-white">{entry.word}</Text>
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{entry.english}</Text>
                    </View>
                    {isSelected && <IconSymbol name="checkmark.circle.fill" size={20} color={getAccent("blue").solid} />}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ---- Proverb of the Month ---- */}
          {activeTab === "potm" && (
            <View className="px-5">
              {potmLoading ? (
                <ActivityIndicator className="my-4" />
              ) : potmAdmin?.proverb ? (
                <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-4 mb-5">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{t("admin.dailyContent.current")}</Text>
                    <Badge pinned={potmAdmin.isOverride} />
                  </View>
                  <Text className="text-base font-bold text-neutral-900 dark:text-white">{potmAdmin.proverb.text}</Text>
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 italic">{potmAdmin.proverb.translation}</Text>
                  {potmAdmin.isOverride && (
                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          t("admin.dailyContent.confirmClearTitle"),
                          t("admin.dailyContent.confirmClearMessage"),
                          [
                            { text: t("common.cancel"), style: "cancel" },
                            { text: t("admin.dailyContent.clearOverride"), style: "destructive", onPress: () => clearPotm.mutate() },
                          ]
                        )
                      }
                      disabled={clearPotm.isPending}
                      className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 py-2 items-center active:opacity-70"
                    >
                      <Text className="text-sm font-semibold text-red-600 dark:text-red-400">{t("admin.dailyContent.clearOverride")}</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("admin.dailyContent.potm.searchPlaceholder")}
                placeholderTextColor={M.muted}
                className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm text-neutral-900 dark:text-white mb-3"
              />

              {filteredProverbs.slice(0, 50).map((proverb) => {
                const isSelected = potmAdmin?.overrideId === proverb.id;
                return (
                  <Pressable
                    key={proverb.id}
                    onPress={() =>
                      Alert.alert(
                        t("admin.dailyContent.confirmSetTitle"),
                        t("admin.dailyContent.confirmSetMessage"),
                        [
                          { text: t("common.cancel"), style: "cancel" },
                          { text: t("admin.dailyContent.confirmSetButton"), onPress: () => setPotm.mutate(proverb.id) },
                        ]
                      )
                    }
                    disabled={setPotm.isPending}
                    className={`flex-row items-center justify-between rounded-2xl px-4 py-3 mb-2 ${isSelected ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" : "bg-neutral-50 dark:bg-neutral-800"}`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-semibold text-neutral-900 dark:text-white">{proverb.text}</Text>
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 italic">{proverb.translation}</Text>
                    </View>
                    {isSelected && <IconSymbol name="checkmark.circle.fill" size={20} color={getAccent("blue").solid} />}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ---- Song of the Week ---- */}
          {activeTab === "sotw" && (
            <View className="px-5">
              {sotwLoading ? (
                <ActivityIndicator className="my-4" />
              ) : sotwAdmin?.lesson ? (
                <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-4 mb-5">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{t("admin.dailyContent.current")}</Text>
                    <Badge pinned={sotwAdmin.isOverride} />
                  </View>
                  <Text className="text-base font-bold text-neutral-900 dark:text-white">{sotwAdmin.lesson.title}</Text>
                  {sotwAdmin.lesson.artist && (
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{sotwAdmin.lesson.artist}</Text>
                  )}
                  {sotwAdmin.isOverride && (
                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          t("admin.dailyContent.confirmClearTitle"),
                          t("admin.dailyContent.confirmClearMessage"),
                          [
                            { text: t("common.cancel"), style: "cancel" },
                            { text: t("admin.dailyContent.clearOverride"), style: "destructive", onPress: () => clearSotw.mutate() },
                          ]
                        )
                      }
                      disabled={clearSotw.isPending}
                      className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 py-2 items-center active:opacity-70"
                    >
                      <Text className="text-sm font-semibold text-red-600 dark:text-red-400">{t("admin.dailyContent.clearOverride")}</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("admin.dailyContent.sotw.searchPlaceholder")}
                placeholderTextColor={M.muted}
                className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm text-neutral-900 dark:text-white mb-3"
              />

              {filteredSongs.slice(0, 50).map((song) => {
                const isSelected = sotwAdmin?.overrideId === song.id;
                return (
                  <Pressable
                    key={song.id}
                    onPress={() =>
                      Alert.alert(
                        t("admin.dailyContent.confirmSetTitle"),
                        t("admin.dailyContent.confirmSetMessage"),
                        [
                          { text: t("common.cancel"), style: "cancel" },
                          { text: t("admin.dailyContent.confirmSetButton"), onPress: () => setSotw.mutate(song.id) },
                        ]
                      )
                    }
                    disabled={setSotw.isPending}
                    className={`flex-row items-center justify-between rounded-2xl px-4 py-3 mb-2 ${isSelected ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" : "bg-neutral-50 dark:bg-neutral-800"}`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-semibold text-neutral-900 dark:text-white">{song.title}</Text>
                      {song.artist && (
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{song.artist}</Text>
                      )}
                    </View>
                    {isSelected && <IconSymbol name="checkmark.circle.fill" size={20} color={getAccent("blue").solid} />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <LanguagePickerModal
          visible={pickerVisible}
          selectedId={languageId}
          onSelect={(id) => { setLanguageId(id); setPickerVisible(false); setSearch(""); }}
          onClose={() => setPickerVisible(false)}
        />
      </SafeAreaView>
    </>
  );
}
