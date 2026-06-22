import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerModal } from "@/components/language-picker";
import { apiFetch } from "@/lib/api";
import { localize } from "@/lib/localize";
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
  const M = useMuseumTheme();
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: pinned ? M.accentGlow : M.border }}>
      <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: pinned ? M.accent : M.muted }}>
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
  const [showAddProverb, setShowAddProverb] = useState(false);
  const [newProverb, setNewProverb] = useState({ text: "", translation: "", meaning: "", translationFr: "", meaningFr: "", literal: "", context: "" });

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
    dictEntries.filter((e) => e.word.toLowerCase().includes(q) || localize(e.english, "en").toLowerCase().includes(q)),
    [dictEntries, q]
  );
  const filteredProverbs = useMemo(() =>
    proverbsList.filter((p) => p.text.toLowerCase().includes(q) || localize(p.translation, "en").toLowerCase().includes(q)),
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

  const createAndPinPotm = useMutation({
    mutationFn: async () => {
      const created = await authedFetch("/proverbs/admin", {
        method: "POST",
        body: JSON.stringify({
          languageId,
          text: newProverb.text.trim(),
          translation: newProverb.translation.trim(),
          meaning: newProverb.meaning.trim(),
          translationFr: newProverb.translationFr.trim() || undefined,
          meaningFr: newProverb.meaningFr.trim() || undefined,
          literal: newProverb.literal.trim() || undefined,
          context: newProverb.context.trim() || undefined,
        }),
      }) as { id: string };
      await authedFetch("/daily-content/admin/potm", { method: "PUT", body: JSON.stringify({ languageId, proverbId: created.id }) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-potm", languageId] });
      qc.invalidateQueries({ queryKey: ["potm", languageId] });
      qc.invalidateQueries({ queryKey: ["proverbs", languageId] });
      setNewProverb({ text: "", translation: "", meaning: "", translationFr: "", meaningFr: "", literal: "", context: "" });
      setShowAddProverb(false);
      Alert.alert(t("admin.dailyContent.potm.created"));
    },
    onError: () => Alert.alert(t("common.error"), t("admin.dailyContent.errorSet")),
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

  const cardStyle = { backgroundColor: M.card, borderColor: M.border };
  const inputStyle = { backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText };
  const selectedRow = { backgroundColor: M.accentGlow, borderColor: M.accentBorder };
  const plainRow = { backgroundColor: M.card, borderColor: M.border };

  return (
    <>
      <Stack.Screen options={{ title: t("admin.dailyContent.title") }} />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.bg }} edges={["top"]}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-5 pt-5 pb-3">
            <Text className="text-2xl font-bold" style={{ color: M.text }}>{t("admin.dailyContent.title")}</Text>
            <Text className="mt-1 text-sm" style={{ color: M.sub }}>{t("admin.dailyContent.subtitle")}</Text>
          </View>

          {/* Language picker */}
          <View className="px-5 mb-4">
            <Pressable
              onPress={() => setPickerVisible(true)}
              className="flex-row items-center justify-between rounded-2xl border px-4 py-3 active:opacity-70"
              style={cardStyle}
            >
              <Text className="text-sm font-semibold" style={{ color: M.text }}>{langName}</Text>
              <IconSymbol name="chevron.right" size={16} color={M.muted} />
            </Pressable>
          </View>

          {/* Tabs */}
          <View className="flex-row px-5 gap-2 mb-5">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => { setActiveTab(tab.key); setSearch(""); }}
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={{ backgroundColor: active ? M.accent : M.card }}
                >
                  <Text className="text-xs font-bold" style={{ color: active ? M.parchment : M.sub }}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ---- Word of the Day ---- */}
          {activeTab === "wotd" && (
            <View className="px-5">
              {wotdLoading ? (
                <ActivityIndicator className="my-4" color={M.accent} />
              ) : wotdAdmin?.entry ? (
                <View className="rounded-2xl border p-4 mb-5" style={cardStyle}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: M.muted }}>{t("admin.dailyContent.current")}</Text>
                    <Badge pinned={wotdAdmin.isOverride} />
                  </View>
                  <Text className="text-xl font-bold" style={{ color: M.text }}>{wotdAdmin.entry.word}</Text>
                  <Text className="text-sm mt-0.5" style={{ color: M.sub }}>{localize(wotdAdmin.entry.english, "en")}</Text>
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
                      className="mt-3 rounded-xl py-2 items-center active:opacity-70"
                      style={{ backgroundColor: M.errorBg }}
                    >
                      <Text className="text-sm font-semibold" style={{ color: M.error }}>{t("admin.dailyContent.clearOverride")}</Text>
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
                  <Text className="text-sm font-semibold" style={{ color: M.accent }}>{t("admin.dailyContent.wotd.addNewCta")}</Text>
                </Pressable>
              ) : (
                <View className="rounded-2xl border p-4 mb-5" style={cardStyle}>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: M.muted }}>{t("admin.dailyContent.wotd.addNew")}</Text>
                    <Pressable onPress={() => setShowAddWord(false)} className="active:opacity-70">
                      <IconSymbol name="xmark" size={16} color={M.muted} />
                    </Pressable>
                  </View>

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.wotd.fieldWord")}</Text>
                  <TextInput value={newWord.word} onChangeText={(v) => setNewWord((p) => ({ ...p, word: v }))} placeholderTextColor={M.muted} placeholder="e.g. Àkpọ" style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.wotd.fieldEnglish")}</Text>
                  <TextInput value={newWord.english} onChangeText={(v) => setNewWord((p) => ({ ...p, english: v }))} placeholderTextColor={M.muted} placeholder="e.g. World" style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.wotd.fieldCategory")}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                    <View className="flex-row gap-2">
                      {VALID_CATEGORIES.map((cat) => {
                        const active = newWord.category === cat;
                        return (
                          <Pressable
                            key={cat}
                            onPress={() => setNewWord((p) => ({ ...p, category: cat }))}
                            className="rounded-full px-3 py-1.5 active:opacity-70"
                            style={{ backgroundColor: active ? M.accent : M.border }}
                          >
                            <Text className="text-xs font-semibold" style={{ color: active ? M.parchment : M.sub }}>{cat}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.wotd.fieldFrench")}</Text>
                  <TextInput value={newWord.french} onChangeText={(v) => setNewWord((p) => ({ ...p, french: v }))} placeholderTextColor={M.muted} placeholder="e.g. Monde" style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.wotd.fieldPronunciation")}</Text>
                  <TextInput value={newWord.pronunciation} onChangeText={(v) => setNewWord((p) => ({ ...p, pronunciation: v }))} placeholderTextColor={M.muted} placeholder="e.g. ah-KPO" style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.wotd.fieldExample")}</Text>
                  <TextInput value={newWord.example} onChangeText={(v) => setNewWord((p) => ({ ...p, example: v }))} placeholderTextColor={M.muted} multiline numberOfLines={2} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.wotd.fieldExampleTranslation")}</Text>
                  <TextInput value={newWord.exampleTranslation} onChangeText={(v) => setNewWord((p) => ({ ...p, exampleTranslation: v }))} placeholderTextColor={M.muted} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.wotd.fieldExampleTranslationFr")}</Text>
                  <TextInput value={newWord.exampleTranslationFr} onChangeText={(v) => setNewWord((p) => ({ ...p, exampleTranslationFr: v }))} placeholderTextColor={M.muted} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-4" />

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => createAndPinWotd.mutate()}
                      disabled={!newWord.word.trim() || !newWord.english.trim() || createAndPinWotd.isPending}
                      className="flex-1 rounded-xl py-3 items-center active:opacity-70 disabled:opacity-50"
                      style={{ backgroundColor: M.accent }}
                    >
                      <Text className="text-sm font-bold" style={{ color: M.parchment }}>
                        {createAndPinWotd.isPending ? t("admin.dailyContent.wotd.saving") : t("admin.dailyContent.wotd.saveAndPin")}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setShowAddWord(false)} className="rounded-xl border px-4 py-3 items-center active:opacity-70" style={{ borderColor: M.border }}>
                      <Text className="text-sm font-semibold" style={{ color: M.sub }}>{t("admin.dailyContent.wotd.cancel")}</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("admin.dailyContent.wotd.searchPlaceholder")}
                placeholderTextColor={M.muted}
                style={inputStyle}
                className="rounded-2xl border px-4 py-3 text-sm mb-3"
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
                    className="flex-row items-center justify-between rounded-2xl border px-4 py-3 mb-2"
                    style={isSelected ? selectedRow : plainRow}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-semibold" style={{ color: M.text }}>{entry.word}</Text>
                      <Text className="text-xs mt-0.5" style={{ color: M.sub }}>{localize(entry.english, "en")}</Text>
                    </View>
                    {isSelected && <IconSymbol name="checkmark.circle.fill" size={20} color={M.accent} />}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ---- Proverb of the Month ---- */}
          {activeTab === "potm" && (
            <View className="px-5">
              {potmLoading ? (
                <ActivityIndicator className="my-4" color={M.accent} />
              ) : potmAdmin?.proverb ? (
                <View className="rounded-2xl border p-4 mb-5" style={cardStyle}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: M.muted }}>{t("admin.dailyContent.current")}</Text>
                    <Badge pinned={potmAdmin.isOverride} />
                  </View>
                  <Text className="text-base font-bold" style={{ color: M.text }}>{potmAdmin.proverb.text}</Text>
                  <Text className="text-sm mt-1 italic" style={{ color: M.sub }}>{localize(potmAdmin.proverb.translation, "en")}</Text>
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
                      className="mt-3 rounded-xl py-2 items-center active:opacity-70"
                      style={{ backgroundColor: M.errorBg }}
                    >
                      <Text className="text-sm font-semibold" style={{ color: M.error }}>{t("admin.dailyContent.clearOverride")}</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}

              {/* Add new proverb */}
              {!showAddProverb ? (
                <Pressable
                  onPress={() => setShowAddProverb(true)}
                  className="flex-row items-center gap-1.5 mb-4 active:opacity-70"
                >
                  <Text className="text-sm font-semibold" style={{ color: M.accent }}>{t("admin.dailyContent.potm.addNewCta")}</Text>
                </Pressable>
              ) : (
                <View className="rounded-2xl border p-4 mb-5" style={cardStyle}>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: M.muted }}>{t("admin.dailyContent.potm.addNew")}</Text>
                    <Pressable onPress={() => setShowAddProverb(false)} className="active:opacity-70">
                      <IconSymbol name="xmark" size={16} color={M.muted} />
                    </Pressable>
                  </View>

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.potm.fieldText")}</Text>
                  <TextInput value={newProverb.text} onChangeText={(v) => setNewProverb((p) => ({ ...p, text: v }))} placeholderTextColor={M.muted} multiline numberOfLines={2} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.potm.fieldTranslation")}</Text>
                  <TextInput value={newProverb.translation} onChangeText={(v) => setNewProverb((p) => ({ ...p, translation: v }))} placeholderTextColor={M.muted} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.potm.fieldMeaning")}</Text>
                  <TextInput value={newProverb.meaning} onChangeText={(v) => setNewProverb((p) => ({ ...p, meaning: v }))} placeholderTextColor={M.muted} multiline numberOfLines={2} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.potm.fieldTranslationFr")}</Text>
                  <TextInput value={newProverb.translationFr} onChangeText={(v) => setNewProverb((p) => ({ ...p, translationFr: v }))} placeholderTextColor={M.muted} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.potm.fieldMeaningFr")}</Text>
                  <TextInput value={newProverb.meaningFr} onChangeText={(v) => setNewProverb((p) => ({ ...p, meaningFr: v }))} placeholderTextColor={M.muted} multiline numberOfLines={2} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.potm.fieldLiteral")}</Text>
                  <TextInput value={newProverb.literal} onChangeText={(v) => setNewProverb((p) => ({ ...p, literal: v }))} placeholderTextColor={M.muted} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-3" />

                  <Text className="text-xs font-medium mb-1" style={{ color: M.sub }}>{t("admin.dailyContent.potm.fieldContext")}</Text>
                  <TextInput value={newProverb.context} onChangeText={(v) => setNewProverb((p) => ({ ...p, context: v }))} placeholderTextColor={M.muted} multiline numberOfLines={2} style={inputStyle} className="rounded-xl border px-3 py-2.5 text-sm mb-4" />

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => createAndPinPotm.mutate()}
                      disabled={!newProverb.text.trim() || !newProverb.translation.trim() || !newProverb.meaning.trim() || createAndPinPotm.isPending}
                      className="flex-1 rounded-xl py-3 items-center active:opacity-70 disabled:opacity-50"
                      style={{ backgroundColor: M.accent }}
                    >
                      <Text className="text-sm font-bold" style={{ color: M.parchment }}>
                        {createAndPinPotm.isPending ? t("admin.dailyContent.potm.saving") : t("admin.dailyContent.potm.saveAndPin")}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setShowAddProverb(false)} className="rounded-xl border px-4 py-3 items-center active:opacity-70" style={{ borderColor: M.border }}>
                      <Text className="text-sm font-semibold" style={{ color: M.sub }}>{t("admin.dailyContent.potm.cancel")}</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("admin.dailyContent.potm.searchPlaceholder")}
                placeholderTextColor={M.muted}
                style={inputStyle}
                className="rounded-2xl border px-4 py-3 text-sm mb-3"
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
                    className="flex-row items-center justify-between rounded-2xl border px-4 py-3 mb-2"
                    style={isSelected ? selectedRow : plainRow}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-semibold" style={{ color: M.text }}>{proverb.text}</Text>
                      <Text className="text-xs mt-0.5 italic" style={{ color: M.sub }}>{localize(proverb.translation, "en")}</Text>
                    </View>
                    {isSelected && <IconSymbol name="checkmark.circle.fill" size={20} color={M.accent} />}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ---- Song of the Week ---- */}
          {activeTab === "sotw" && (
            <View className="px-5">
              {sotwLoading ? (
                <ActivityIndicator className="my-4" color={M.accent} />
              ) : sotwAdmin?.lesson ? (
                <View className="rounded-2xl border p-4 mb-5" style={cardStyle}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: M.muted }}>{t("admin.dailyContent.current")}</Text>
                    <Badge pinned={sotwAdmin.isOverride} />
                  </View>
                  <Text className="text-base font-bold" style={{ color: M.text }}>{localize(sotwAdmin.lesson.title, "en")}</Text>
                  {sotwAdmin.lesson.artist && (
                    <Text className="text-sm mt-0.5" style={{ color: M.sub }}>{sotwAdmin.lesson.artist}</Text>
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
                      className="mt-3 rounded-xl py-2 items-center active:opacity-70"
                      style={{ backgroundColor: M.errorBg }}
                    >
                      <Text className="text-sm font-semibold" style={{ color: M.error }}>{t("admin.dailyContent.clearOverride")}</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("admin.dailyContent.sotw.searchPlaceholder")}
                placeholderTextColor={M.muted}
                style={inputStyle}
                className="rounded-2xl border px-4 py-3 text-sm mb-3"
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
                    className="flex-row items-center justify-between rounded-2xl border px-4 py-3 mb-2"
                    style={isSelected ? selectedRow : plainRow}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-semibold" style={{ color: M.text }}>{song.title}</Text>
                      {song.artist && (
                        <Text className="text-xs mt-0.5" style={{ color: M.sub }}>{song.artist}</Text>
                      )}
                    </View>
                    {isSelected && <IconSymbol name="checkmark.circle.fill" size={20} color={M.accent} />}
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
