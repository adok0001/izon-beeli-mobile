import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { friendlyError } from "@/lib/api";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import {
  CulturalItem,
  CulturalKeyTerm,
  Proverb,
  useCulturalItems,
  useDeleteCulturalItem,
  useDeleteProverb,
  useProverbs,
  useUpsertCulturalItem,
  useUpsertProverb,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { Stack } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Constants ─────────────────────────────────────────────────────────────────

const CULTURAL_CATEGORIES = [
  "colors",
  "naming_ceremonies",
  "festivals",
  "creation_myths",
  "music",
  "clothing",
  "cuisine",
  "greetings_etiquette",
] as const;

type CulturalCategory = (typeof CULTURAL_CATEGORIES)[number];

// ── Form state types ──────────────────────────────────────────────────────────

type ProverbForm = {
  id?: string;
  text: string;
  translation: string;
  translationFr: string;
  meaning: string;
  meaningFr: string;
  literal: string;
  context: string;
  tags: string;
};

const EMPTY_PROVERB: ProverbForm = {
  text: "",
  translation: "",
  translationFr: "",
  meaning: "",
  meaningFr: "",
  literal: "",
  context: "",
  tags: "",
};

type CulturalForm = {
  id?: string;
  imageEmoji: string;
  title: string;
  titleFr: string;
  category: CulturalCategory;
  description: string;
  descriptionFr: string;
  keyTerms: CulturalKeyTerm[];
};

const EMPTY_CULTURAL: CulturalForm = {
  imageEmoji: "🌍",
  title: "",
  titleFr: "",
  category: "festivals",
  description: "",
  descriptionFr: "",
  keyTerms: [],
};

type Tab = "proverbs" | "cultural";

const inputCls =
  "rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white";

// ── Main component ────────────────────────────────────────────────────────────

export default function EducatorCultureScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const flatListRef = useRef<FlatList>(null);

  const [tab, setTab] = useState<Tab>("proverbs");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [proverbForm, setProverbForm] = useState<ProverbForm>(EMPTY_PROVERB);
  const [editingProverb, setEditingProverb] = useState(false);
  const [culturalForm, setCulturalForm] = useState<CulturalForm>(EMPTY_CULTURAL);
  const [editingCultural, setEditingCultural] = useState(false);

  const canAccess = currentUser ? canAccessEducatorPanel(currentUser) : false;

  const allowedLanguages = currentUser?.isAdmin
    ? LANGUAGES.map((l) => l.id)
    : (currentUser?.reviewerLanguages ?? []);

  const activeLanguageId =
    selectedLanguageId ?? allowedLanguages[0] ?? currentUser?.selectedLanguageId ?? "izon";

  const { data: proverbs = [], isLoading: proverbsLoading } = useProverbs(
    activeLanguageId,
    canAccess && tab === "proverbs",
  );
  const { data: culturalItems = [], isLoading: culturalLoading } = useCulturalItems(
    activeLanguageId,
    canAccess && tab === "cultural",
  );

  const upsertProverb = useUpsertProverb();
  const deleteProverb = useDeleteProverb();
  const upsertCultural = useUpsertCulturalItem();
  const deleteCultural = useDeleteCulturalItem();

  const q = searchQuery.toLowerCase().trim();
  const filteredProverbs = q
    ? proverbs.filter(
        (p) => p.text.toLowerCase().includes(q) || p.translation.toLowerCase().includes(q),
      )
    : proverbs;
  const filteredCultural = q
    ? culturalItems.filter(
        (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
      )
    : culturalItems;

  const isLoading = tab === "proverbs" ? proverbsLoading : culturalLoading;
  const listData: (Proverb | CulturalItem)[] =
    tab === "proverbs" ? filteredProverbs : filteredCultural;

  // ── Proverb handlers ──────────────────────────────────────────────────────────

  const resetProverb = () => {
    setProverbForm(EMPTY_PROVERB);
    setEditingProverb(false);
  };

  const startEditProverb = (item: Proverb) => {
    setProverbForm({
      id: item.id,
      text: item.text,
      translation: item.translation,
      translationFr: item.translationFr ?? "",
      meaning: item.meaning,
      meaningFr: item.meaningFr ?? "",
      literal: item.literal ?? "",
      context: item.context ?? "",
      tags: (item.tags ?? []).join(", "),
    });
    setEditingProverb(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const submitProverb = () => {
    if (!proverbForm.text.trim() || !proverbForm.translation.trim() || !proverbForm.meaning.trim()) {
      toastError(t("educator.culture.missingFields"), t("educator.culture.proverbRequired"));
      return;
    }
    const tags = proverbForm.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    upsertProverb.mutate(
      {
        id: proverbForm.id,
        languageId: activeLanguageId,
        text: proverbForm.text.trim(),
        translation: proverbForm.translation.trim(),
        translationFr: proverbForm.translationFr.trim() || undefined,
        meaning: proverbForm.meaning.trim(),
        meaningFr: proverbForm.meaningFr.trim() || undefined,
        literal: proverbForm.literal.trim() || undefined,
        context: proverbForm.context.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      },
      {
        onSuccess: () => {
          resetProverb();
          toastSuccess(
            editingProverb ? t("educator.culture.proverbUpdated") : t("educator.culture.proverbCreated"),
          );
        },
        onError: (err) => toastError(t("educator.culture.saveFailed"), friendlyError(err)),
      },
    );
  };

  const confirmDeleteProverb = (id: string) => {
    Alert.alert(
      t("educator.culture.deleteProverbTitle"),
      t("educator.culture.deleteProverbMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () =>
            deleteProverb.mutate(id, {
              onSuccess: () => toastSuccess(t("educator.culture.proverbDeleted")),
              onError: (err) => toastError(t("educator.culture.deleteFailed"), friendlyError(err)),
            }),
        },
      ],
    );
  };

  // ── Cultural handlers ─────────────────────────────────────────────────────────

  const resetCultural = () => {
    setCulturalForm(EMPTY_CULTURAL);
    setEditingCultural(false);
  };

  const startEditCultural = (item: CulturalItem) => {
    setCulturalForm({
      id: item.id,
      imageEmoji: item.imageEmoji,
      title: item.title,
      titleFr: item.titleFr ?? "",
      category: (item.category as CulturalCategory) ?? "festivals",
      description: item.description,
      descriptionFr: item.descriptionFr ?? "",
      keyTerms: item.keyTerms ?? [],
    });
    setEditingCultural(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const submitCultural = () => {
    if (
      !culturalForm.imageEmoji.trim() ||
      !culturalForm.title.trim() ||
      !culturalForm.description.trim()
    ) {
      toastError(t("educator.culture.missingFields"), t("educator.culture.culturalRequired"));
      return;
    }
    upsertCultural.mutate(
      {
        id: culturalForm.id,
        languageId: activeLanguageId,
        imageEmoji: culturalForm.imageEmoji.trim(),
        title: culturalForm.title.trim(),
        titleFr: culturalForm.titleFr.trim() || undefined,
        category: culturalForm.category,
        description: culturalForm.description.trim(),
        descriptionFr: culturalForm.descriptionFr.trim() || undefined,
        keyTerms: culturalForm.keyTerms.filter((kt) => kt.word.trim() && kt.english.trim()),
      },
      {
        onSuccess: () => {
          resetCultural();
          toastSuccess(
            editingCultural
              ? t("educator.culture.culturalUpdated")
              : t("educator.culture.culturalCreated"),
          );
        },
        onError: (err) => toastError(t("educator.culture.saveFailed"), friendlyError(err)),
      },
    );
  };

  const confirmDeleteCultural = (id: string) => {
    Alert.alert(
      t("educator.culture.deleteCulturalTitle"),
      t("educator.culture.deleteCulturalMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () =>
            deleteCultural.mutate(id, {
              onSuccess: () => toastSuccess(t("educator.culture.culturalDeleted")),
              onError: (err) => toastError(t("educator.culture.deleteFailed"), friendlyError(err)),
            }),
        },
      ],
    );
  };

  // ── List header ───────────────────────────────────────────────────────────────

  const listHeader = (
    <View>
      <View className="px-5 pt-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
          {t("educator.nav.culture")}
        </Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t("educator.culture.subtitle")}
        </Text>
      </View>

      {/* Language selector */}
      <View className="mt-4 px-5">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {allowedLanguages.map((langId) => {
            const active = langId === activeLanguageId;
            return (
              <Pressable
                key={langId}
                onPress={() => {
                  setSelectedLanguageId(langId);
                  setSearchQuery("");
                }}
                className={`mr-2 rounded-full px-4 py-2 ${active ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"}`}
              >
                <Text
                  className={`text-sm font-semibold ${active ? "text-white" : "text-neutral-700 dark:text-neutral-300"}`}
                >
                  {getLanguageName(langId)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab switcher */}
      <View className="mt-4 flex-row gap-2 px-5">
        <Pressable
          onPress={() => {
            setTab("proverbs");
            resetProverb();
            setSearchQuery("");
          }}
          className={`flex-1 items-center rounded-xl py-2.5 ${tab === "proverbs" ? "bg-amber-500" : "bg-neutral-100 dark:bg-neutral-800"}`}
        >
          <Text
            className={`text-sm font-semibold ${tab === "proverbs" ? "text-white" : "text-neutral-600 dark:text-neutral-400"}`}
          >
            {t("educator.culture.tabProverbs")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setTab("cultural");
            resetCultural();
            setSearchQuery("");
          }}
          className={`flex-1 items-center rounded-xl py-2.5 ${tab === "cultural" ? "bg-purple-500" : "bg-neutral-100 dark:bg-neutral-800"}`}
        >
          <Text
            className={`text-sm font-semibold ${tab === "cultural" ? "text-white" : "text-neutral-600 dark:text-neutral-400"}`}
          >
            {t("educator.culture.tabCultural")}
          </Text>
        </Pressable>
      </View>

      {/* ── Proverb form ─────────────────────────────────────────────────────── */}
      {tab === "proverbs" && (
        <View className="mx-5 mt-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
          <Text className="mb-3 text-base font-semibold text-neutral-900 dark:text-white">
            {editingProverb ? t("educator.culture.editProverb") : t("educator.culture.newProverb")}
          </Text>
          <TextInput
            value={proverbForm.text}
            onChangeText={(text) => setProverbForm((p) => ({ ...p, text }))}
            placeholder={t("educator.culture.proverbText")}
            placeholderTextColor=M.muted
            multiline
            className={`${inputCls} min-h-[44px]`}
          />
          <TextInput
            value={proverbForm.translation}
            onChangeText={(translation) => setProverbForm((p) => ({ ...p, translation }))}
            placeholder={t("educator.culture.englishTranslation")}
            placeholderTextColor=M.muted
            className={`mt-2 ${inputCls}`}
          />
          <TextInput
            value={proverbForm.translationFr}
            onChangeText={(translationFr) => setProverbForm((p) => ({ ...p, translationFr }))}
            placeholder={t("educator.culture.frenchTranslation")}
            placeholderTextColor=M.muted
            className={`mt-2 ${inputCls}`}
          />
          <TextInput
            value={proverbForm.meaning}
            onChangeText={(meaning) => setProverbForm((p) => ({ ...p, meaning }))}
            placeholder={t("educator.culture.meaningLabel")}
            placeholderTextColor=M.muted
            multiline
            className={`mt-2 ${inputCls} min-h-[44px]`}
          />
          <TextInput
            value={proverbForm.meaningFr}
            onChangeText={(meaningFr) => setProverbForm((p) => ({ ...p, meaningFr }))}
            placeholder={t("educator.culture.meaningFr")}
            placeholderTextColor=M.muted
            multiline
            className={`mt-2 ${inputCls} min-h-[44px]`}
          />
          <TextInput
            value={proverbForm.literal}
            onChangeText={(literal) => setProverbForm((p) => ({ ...p, literal }))}
            placeholder={t("educator.culture.literalLabel")}
            placeholderTextColor=M.muted
            className={`mt-2 ${inputCls}`}
          />
          <TextInput
            value={proverbForm.context}
            onChangeText={(context) => setProverbForm((p) => ({ ...p, context }))}
            placeholder={t("educator.culture.contextLabel")}
            placeholderTextColor=M.muted
            className={`mt-2 ${inputCls}`}
          />
          <TextInput
            value={proverbForm.tags}
            onChangeText={(tags) => setProverbForm((p) => ({ ...p, tags }))}
            placeholder={t("educator.culture.tagsLabel")}
            placeholderTextColor=M.muted
            className={`mt-2 ${inputCls}`}
          />
          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={submitProverb}
              disabled={upsertProverb.isPending}
              className="flex-1 rounded-xl bg-amber-500 py-3 active:opacity-80 disabled:opacity-40"
            >
              <Text className="text-center font-semibold text-white">
                {upsertProverb.isPending
                  ? t("common.loading")
                  : editingProverb
                    ? t("common.save")
                    : t("educator.culture.create")}
              </Text>
            </Pressable>
            {editingProverb && (
              <Pressable
                onPress={resetProverb}
                className="rounded-xl bg-neutral-200 px-4 py-3 active:opacity-80 dark:bg-neutral-700"
              >
                <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {t("common.cancel")}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* ── Cultural form ─────────────────────────────────────────────────────── */}
      {tab === "cultural" && (
        <View className="mx-5 mt-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
          <Text className="mb-3 text-base font-semibold text-neutral-900 dark:text-white">
            {editingCultural
              ? t("educator.culture.editCultural")
              : t("educator.culture.newCultural")}
          </Text>

          <View className="flex-row gap-2">
            <TextInput
              value={culturalForm.imageEmoji}
              onChangeText={(imageEmoji) => setCulturalForm((c) => ({ ...c, imageEmoji }))}
              placeholder="🌍"
              placeholderTextColor=M.muted
              maxLength={8}
              className={`${inputCls} w-16 text-center text-xl`}
            />
            <TextInput
              value={culturalForm.title}
              onChangeText={(title) => setCulturalForm((c) => ({ ...c, title }))}
              placeholder={t("educator.culture.titleLabel")}
              placeholderTextColor=M.muted
              className={`${inputCls} flex-1`}
            />
          </View>
          <TextInput
            value={culturalForm.titleFr}
            onChangeText={(titleFr) => setCulturalForm((c) => ({ ...c, titleFr }))}
            placeholder="Titre en français"
            placeholderTextColor=M.muted
            className={`mt-2 ${inputCls}`}
          />

          <Text className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {t("educator.culture.categoryLabel")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CULTURAL_CATEGORIES.map((cat) => {
              const active = culturalForm.category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCulturalForm((c) => ({ ...c, category: cat }))}
                  className={`mr-2 rounded-full px-3 py-1.5 ${active ? "bg-purple-500" : "bg-white dark:bg-neutral-900"}`}
                >
                  <Text
                    className={`text-xs font-semibold ${active ? "text-white" : "text-neutral-600 dark:text-neutral-400"}`}
                  >
                    {(t as (k: string) => string)(`educator.culture.categories.${cat}`)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            value={culturalForm.description}
            onChangeText={(description) => setCulturalForm((c) => ({ ...c, description }))}
            placeholder={t("educator.culture.descriptionLabel")}
            placeholderTextColor=M.muted
            multiline
            className={`mt-3 ${inputCls} min-h-[60px]`}
          />
          <TextInput
            value={culturalForm.descriptionFr}
            onChangeText={(descriptionFr) => setCulturalForm((c) => ({ ...c, descriptionFr }))}
            placeholder={t("educator.culture.descriptionFrLabel")}
            placeholderTextColor=M.muted
            multiline
            className={`mt-2 ${inputCls} min-h-[60px]`}
          />

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("educator.culture.keyTermsLabel")}
            </Text>
            <Pressable
              onPress={() =>
                setCulturalForm((c) => ({
                  ...c,
                  keyTerms: [...c.keyTerms, { word: "", english: "" }],
                }))
              }
              className="flex-row items-center gap-1"
            >
              <IconSymbol name="plus.circle.fill" size={16} color=getAccent("purple").solid />
              <Text className="text-xs font-semibold text-purple-500">
                {t("educator.culture.addTerm")}
              </Text>
            </Pressable>
          </View>
          {culturalForm.keyTerms.map((kt, i) => (
            <View key={i} className="mt-2 flex-row gap-2">
              <TextInput
                value={kt.word}
                onChangeText={(word) =>
                  setCulturalForm((c) => {
                    const keyTerms = [...c.keyTerms];
                    keyTerms[i] = { ...keyTerms[i], word };
                    return { ...c, keyTerms };
                  })
                }
                placeholder={t("educator.culture.nativeWord")}
                placeholderTextColor=M.muted
                className={`${inputCls} flex-1`}
              />
              <TextInput
                value={kt.english}
                onChangeText={(english) =>
                  setCulturalForm((c) => {
                    const keyTerms = [...c.keyTerms];
                    keyTerms[i] = { ...keyTerms[i], english };
                    return { ...c, keyTerms };
                  })
                }
                placeholder={t("educator.culture.englishWord")}
                placeholderTextColor=M.muted
                className={`${inputCls} flex-1`}
              />
              <Pressable
                onPress={() =>
                  setCulturalForm((c) => ({
                    ...c,
                    keyTerms: c.keyTerms.filter((_, idx) => idx !== i),
                  }))
                }
                className="w-8 items-center justify-center"
              >
                <IconSymbol name="xmark.circle.fill" size={18} color=M.error />
              </Pressable>
            </View>
          ))}

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={submitCultural}
              disabled={upsertCultural.isPending}
              className="flex-1 rounded-xl bg-purple-500 py-3 active:opacity-80 disabled:opacity-40"
            >
              <Text className="text-center font-semibold text-white">
                {upsertCultural.isPending
                  ? t("common.loading")
                  : editingCultural
                    ? t("common.save")
                    : t("educator.culture.create")}
              </Text>
            </Pressable>
            {editingCultural && (
              <Pressable
                onPress={resetCultural}
                className="rounded-xl bg-neutral-200 px-4 py-3 active:opacity-80 dark:bg-neutral-700"
              >
                <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {t("common.cancel")}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Search */}
      <View className="mt-5 px-5">
        <View className="flex-row items-center rounded-xl bg-neutral-100 px-3 dark:bg-neutral-800">
          <IconSymbol name="magnifyingglass" size={16} color=M.muted />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              tab === "proverbs"
                ? t("educator.culture.searchProverbs")
                : t("educator.culture.searchCultural")
            }
            placeholderTextColor=M.muted
            autoCapitalize="none"
            autoCorrect={false}
            className="ml-2 flex-1 py-2.5 text-sm text-neutral-900 dark:text-white"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <IconSymbol name="xmark" size={14} color=M.muted />
            </Pressable>
          )}
        </View>
      </View>

      <View className="mt-4 px-5">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.4px] text-neutral-400 dark:text-neutral-500">
          {tab === "proverbs"
            ? q
              ? t("educator.culture.proverbsCountFiltered", {
                  count: filteredProverbs.length,
                  total: proverbs.length,
                })
              : t("educator.culture.proverbsCount", { count: filteredProverbs.length })
            : q
              ? t("educator.culture.culturalCountFiltered", {
                  count: filteredCultural.length,
                  total: culturalItems.length,
                })
              : t("educator.culture.culturalCount", { count: filteredCultural.length })}
        </Text>
      </View>
    </View>
  );

  // ── renderItem ────────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Proverb | CulturalItem }) => {
    if (tab === "proverbs") {
      const p = item as Proverb;
      return (
        <View className="mx-5 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text
                className="text-base font-semibold italic text-neutral-900 dark:text-white"
                numberOfLines={2}
              >
                &ldquo;{p.text}&rdquo;
              </Text>
              <Text
                className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400"
                numberOfLines={1}
              >
                {p.translation}
              </Text>
              <Text
                className="mt-1 text-xs text-neutral-400 dark:text-neutral-500"
                numberOfLines={2}
              >
                {p.meaning}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => startEditProverb(p)}
                className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-800"
              >
                <IconSymbol name="gearshape.fill" size={14} color={M.muted} />
              </Pressable>
              <Pressable
                onPress={() => confirmDeleteProverb(p.id)}
                className="rounded-full bg-red-100 p-2 dark:bg-red-900/40"
              >
                <IconSymbol name="xmark.circle.fill" size={14} color=M.error />
              </Pressable>
            </View>
          </View>
          {(p.tags ?? []).length > 0 && (
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {p.tags!.map((tag) => (
                <View
                  key={tag}
                  className="rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-900/40"
                >
                  <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }

    const c = item as CulturalItem;
    return (
      <View className="mx-5 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-2.5 pr-3">
            <Text className="text-2xl">{c.imageEmoji}</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {c.title}
              </Text>
              <Text
                className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500"
                numberOfLines={1}
              >
                {c.description}
              </Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => startEditCultural(c)}
              className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-800"
            >
              <IconSymbol name="gearshape.fill" size={14} color={M.muted} />
            </Pressable>
            <Pressable
              onPress={() => confirmDeleteCultural(c.id)}
              className="rounded-full bg-red-100 p-2 dark:bg-red-900/40"
            >
              <IconSymbol name="xmark.circle.fill" size={14} color=M.error />
            </Pressable>
          </View>
        </View>
        <View className="mt-2 flex-row items-center gap-2">
          <View className="self-start rounded-full bg-purple-100 px-2 py-0.5 dark:bg-purple-900/40">
            <Text className="text-[10px] font-semibold uppercase text-purple-700 dark:text-purple-400">
              {(t as (k: string) => string)(`educator.culture.categories.${c.category}`)}
            </Text>
          </View>
          {(c.keyTerms ?? []).length > 0 && (
            <Text className="text-xs text-neutral-400 dark:text-neutral-500">
              {t("educator.culture.keyTermsCount", { count: c.keyTerms!.length })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // ── Empty state ───────────────────────────────────────────────────────────────

  const listEmpty = (
    <View className="px-5">
      {isLoading ? (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t("common.loading")}</Text>
      ) : (
        <View className="items-center py-12">
          <IconSymbol
            name={tab === "proverbs" ? "quote.bubble.fill" : "globe"}
            size={32}
            color=M.border
          />
          <Text className="mt-3 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {q
              ? t("educator.culture.noResults")
              : tab === "proverbs"
                ? t("educator.culture.noProverbs")
                : t("educator.culture.noCultural")}
          </Text>
        </View>
      )}
    </View>
  );

  // ── Access guard ──────────────────────────────────────────────────────────────

  if (!canAccess) {
    return (
      <>
        <Stack.Screen options={{ title: t("educator.nav.culture") }} />
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
      <Stack.Screen options={{ title: t("educator.nav.culture"), headerBackTitle: "Back" }} />
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
          data={listData}
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
      </SafeAreaView>
    </>
  );
}
