import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerModal } from "@/components/language-picker";
import { LocalizedTextInput, serializeLocalizedText } from "@/components/ui/localized-text-input";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { FormField, FormInput, GhostButton, PrimaryButton } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { StudioSearchInput } from "@/components/studio/studio-search-input";
import { apiFetch } from "@/lib/api";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useProverbs } from "@/lib/hooks/use-proverbs";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useLanguages } from "@/store/languages-store";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DictionaryEntry } from "@/lib/dictionary";
import type { LocalizedText, Proverb, Lesson } from "@/types";

type Tab = "wotd" | "potm" | "sotw";

interface NewWordForm {
  word: string;
  english: LocalizedText;
  category: DictCategory;
  pronunciation: string;
  example: string;
  exampleTranslation: LocalizedText;
}

const EMPTY_WORD: NewWordForm = {
  word: "", english: {}, category: "nouns", pronunciation: "", example: "", exampleTranslation: {},
};

interface NewProverbForm {
  text: string;
  translation: LocalizedText;
  meaning: LocalizedText;
  literal: string;
  context: string;
}

const EMPTY_PROVERB: NewProverbForm = { text: "", translation: {}, meaning: {}, literal: "", context: "" };

interface AdminWotd { overrideId: string | null; entry: DictionaryEntry | null; isOverride: boolean }
interface AdminPotm { overrideId: string | null; proverb: Proverb | null; isOverride: boolean }
interface AdminSotw { overrideId: string | null; lesson: Lesson | null; isOverride: boolean }

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
  const languages = useLanguages();

  const defaultLang = currentUser?.selectedLanguageId ?? "izon";
  const [languageId, setLanguageId] = useState(defaultLang);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("wotd");
  const [search, setSearch] = useState("");
  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState<NewWordForm>(EMPTY_WORD);
  const [showAddProverb, setShowAddProverb] = useState(false);
  const [newProverb, setNewProverb] = useState<NewProverbForm>(EMPTY_PROVERB);

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
  const { data: songsList = [] } = useQuery<{ id: string; title: string | LocalizedText; artist: string | null; genre: string | null }[]>({
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
    songsList.filter((s) => localize(s.title, "en").toLowerCase().includes(q) || (s.artist ?? "").toLowerCase().includes(q)),
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
      // Map the localized glosses back onto the legacy `<field>`/`<field>Fr`
      // column pair — extra languages get JSON-encoded into the primary column.
      const englishSer = serializeLocalizedText(newWord.english);
      const exampleTranslationSer = serializeLocalizedText(newWord.exampleTranslation);
      const created = await authedFetch("/dictionary/admin", {
        method: "POST",
        body: JSON.stringify({
          languageId,
          word: newWord.word.trim(),
          english: englishSer.primary,
          french: englishSer.fr,
          category: newWord.category,
          pronunciation: newWord.pronunciation.trim() || undefined,
          example: newWord.example.trim() || undefined,
          exampleTranslation: exampleTranslationSer.primary || undefined,
          exampleTranslationFr: exampleTranslationSer.fr,
        }),
      }) as { id: string };
      await authedFetch("/daily-content/admin/wotd", { method: "PUT", body: JSON.stringify({ languageId, entryId: created.id }) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wotd", languageId] });
      qc.invalidateQueries({ queryKey: ["wotd", languageId] });
      qc.invalidateQueries({ queryKey: ["dictionary", languageId] });
      setNewWord(EMPTY_WORD);
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
      // Same legacy-pair mapping as the word form: `<field>` + `<field>Fr`.
      const translationSer = serializeLocalizedText(newProverb.translation);
      const meaningSer = serializeLocalizedText(newProverb.meaning);
      const created = await authedFetch("/proverbs/admin", {
        method: "POST",
        body: JSON.stringify({
          languageId,
          text: newProverb.text.trim(),
          translation: translationSer.primary,
          meaning: meaningSer.primary,
          translationFr: translationSer.fr,
          meaningFr: meaningSer.fr,
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
      setNewProverb(EMPTY_PROVERB);
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

  const selectedRow = { backgroundColor: M.accentGlow, borderColor: M.accentBorder };
  const plainRow = { backgroundColor: M.card, borderColor: M.border };

  return (
    <>
      <Stack.Screen options={{ title: t("admin.dailyContent.title") }} />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.ink }} edges={["top"]}>
        <StudioScreenHeader title={t("admin.dailyContent.title")} subtitle={t("admin.dailyContent.subtitle")} />
        <ScrollView
          style={{ flex: 1, backgroundColor: M.bg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        >
          {/* Language picker */}
          <View className="px-5 mb-4">
            <Pressable
              onPress={() => setPickerVisible(true)}
              className="flex-row items-center justify-between rounded-2xl border px-4 py-3 active:opacity-70"
              style={{ backgroundColor: M.card, borderColor: M.border }}
            >
              <Text className="text-sm font-semibold" style={{ color: M.text }}>{langName}</Text>
              <IconSymbol name="chevron.right" size={16} color={M.muted} />
            </Pressable>
          </View>

          {/* Tabs */}
          <View className="px-5 mb-5">
            <StudioFilterPills
              options={tabs.map((tab) => ({ id: tab.key, label: tab.label }))}
              value={activeTab}
              onChange={(key) => { setActiveTab(key); setSearch(""); }}
            />
          </View>

          {/* ---- Word of the Day ---- */}
          {activeTab === "wotd" && (
            <View className="px-5">
              {wotdLoading ? (
                <ActivityIndicator className="my-4" color={M.accent} />
              ) : wotdAdmin?.entry ? (
                <StudioCard style={{ marginBottom: 20 }}>
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
                </StudioCard>
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
                <StudioCard style={{ gap: 10, marginBottom: 20 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: M.muted }}>{t("admin.dailyContent.wotd.addNew")}</Text>
                    <Pressable onPress={() => setShowAddWord(false)} className="active:opacity-70">
                      <IconSymbol name="xmark" size={16} color={M.muted} />
                    </Pressable>
                  </View>

                  <FormField label={t("admin.dailyContent.wotd.fieldWord")} required>
                    <FormInput value={newWord.word} onChangeText={(v) => setNewWord((p) => ({ ...p, word: v }))} placeholder="e.g. Àkpọ" />
                  </FormField>

                  <LocalizedTextInput
                    label={t("admin.dailyContent.wotd.fieldEnglish")}
                    value={newWord.english}
                    onChange={(english) => setNewWord((p) => ({ ...p, english }))}
                    required
                  />

                  <FormField label={t("admin.dailyContent.wotd.fieldCategory")}>
                    <StudioFilterPills
                      options={VALID_CATEGORIES.map((cat) => ({ id: cat, label: cat }))}
                      value={newWord.category}
                      onChange={(cat) => setNewWord((p) => ({ ...p, category: cat }))}
                      scrollable
                    />
                  </FormField>

                  <FormField label={t("admin.dailyContent.wotd.fieldPronunciation")}>
                    <FormInput value={newWord.pronunciation} onChangeText={(v) => setNewWord((p) => ({ ...p, pronunciation: v }))} placeholder="e.g. ah-KPO" />
                  </FormField>

                  <FormField label={t("admin.dailyContent.wotd.fieldExample")}>
                    <FormInput value={newWord.example} onChangeText={(v) => setNewWord((p) => ({ ...p, example: v }))} multiline />
                  </FormField>

                  <LocalizedTextInput
                    label={t("admin.dailyContent.wotd.fieldExampleTranslation")}
                    value={newWord.exampleTranslation}
                    onChange={(exampleTranslation) => setNewWord((p) => ({ ...p, exampleTranslation }))}
                  />

                  <View className="flex-row gap-3">
                    <View style={{ flex: 1 }}>
                      <PrimaryButton
                        label={createAndPinWotd.isPending ? t("admin.dailyContent.wotd.saving") : t("admin.dailyContent.wotd.saveAndPin")}
                        onPress={() => createAndPinWotd.mutate()}
                        disabled={!newWord.word.trim() || !newWord.english.en?.trim() || createAndPinWotd.isPending}
                      />
                    </View>
                    <GhostButton label={t("admin.dailyContent.wotd.cancel")} onPress={() => setShowAddWord(false)} />
                  </View>
                </StudioCard>
              )}

              <View className="mb-3">
                <StudioSearchInput value={search} onChangeText={setSearch} placeholder={t("admin.dailyContent.wotd.searchPlaceholder")} />
              </View>

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
                <StudioCard style={{ marginBottom: 20 }}>
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
                </StudioCard>
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
                <StudioCard style={{ gap: 10, marginBottom: 20 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: M.muted }}>{t("admin.dailyContent.potm.addNew")}</Text>
                    <Pressable onPress={() => setShowAddProverb(false)} className="active:opacity-70">
                      <IconSymbol name="xmark" size={16} color={M.muted} />
                    </Pressable>
                  </View>

                  <FormField label={t("admin.dailyContent.potm.fieldText")} required>
                    <FormInput value={newProverb.text} onChangeText={(v) => setNewProverb((p) => ({ ...p, text: v }))} multiline />
                  </FormField>

                  <LocalizedTextInput
                    label={t("admin.dailyContent.potm.fieldTranslation")}
                    value={newProverb.translation}
                    onChange={(translation) => setNewProverb((p) => ({ ...p, translation }))}
                    required
                  />

                  <LocalizedTextInput
                    label={t("admin.dailyContent.potm.fieldMeaning")}
                    value={newProverb.meaning}
                    onChange={(meaning) => setNewProverb((p) => ({ ...p, meaning }))}
                    multiline
                    required
                  />

                  <FormField label={t("admin.dailyContent.potm.fieldLiteral")}>
                    <FormInput value={newProverb.literal} onChangeText={(v) => setNewProverb((p) => ({ ...p, literal: v }))} />
                  </FormField>

                  <FormField label={t("admin.dailyContent.potm.fieldContext")}>
                    <FormInput value={newProverb.context} onChangeText={(v) => setNewProverb((p) => ({ ...p, context: v }))} multiline />
                  </FormField>

                  <View className="flex-row gap-3">
                    <View style={{ flex: 1 }}>
                      <PrimaryButton
                        label={createAndPinPotm.isPending ? t("admin.dailyContent.potm.saving") : t("admin.dailyContent.potm.saveAndPin")}
                        onPress={() => createAndPinPotm.mutate()}
                        disabled={!newProverb.text.trim() || !newProverb.translation.en?.trim() || !newProverb.meaning.en?.trim() || createAndPinPotm.isPending}
                      />
                    </View>
                    <GhostButton label={t("admin.dailyContent.potm.cancel")} onPress={() => setShowAddProverb(false)} />
                  </View>
                </StudioCard>
              )}

              <View className="mb-3">
                <StudioSearchInput value={search} onChangeText={setSearch} placeholder={t("admin.dailyContent.potm.searchPlaceholder")} />
              </View>

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
                <StudioCard style={{ marginBottom: 20 }}>
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
                </StudioCard>
              ) : null}

              <View className="mb-3">
                <StudioSearchInput value={search} onChangeText={setSearch} placeholder={t("admin.dailyContent.sotw.searchPlaceholder")} />
              </View>

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
                      <Text className="text-sm font-semibold" style={{ color: M.text }}>{localize(song.title, "en")}</Text>
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
