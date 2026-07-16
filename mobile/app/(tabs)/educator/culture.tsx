import { getAccent } from "@/constants/accent-colors";
import { ColorSwatchInput, isHex } from "@/components/educator/color-swatch-input";
import { HeadwordField } from "@/components/educator/headword-field";
import { LocalizedTextInput, serializeLocalizedText, toLocalizedText } from "@/components/ui/localized-text-input";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
import { fonts } from "@/constants/typography";
import type { LocalizedText } from "@/types";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CULTURE_CATEGORY_ICON } from "@/constants/cultural-categories";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { ActiveToggle } from "@/components/studio/active-toggle";
import { friendlyError } from "@/lib/api";
import {
  CulturalItem,
  CulturalKeyTerm,
  useCulturalItems,
  useDeleteCulturalItem,
  useUpsertCulturalItem,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { Stack, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
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
  "governance_values",
  "land_livelihood",
  "kinship",
  "cosmology",
  "oral_tradition",
  "arts_oratory",
  "numbers_trade",
  "geography",
] as const;

type CulturalCategory = (typeof CULTURAL_CATEGORIES)[number];

// ── Form state types ──────────────────────────────────────────────────────────

type HeroBandForm = {
  label: string;
  sublabel: LocalizedText;
  from: string;
  to: string;
  dark: boolean;
};

type CulturalForm = {
  id?: string;
  title: LocalizedText;
  category: CulturalCategory;
  description: LocalizedText;
  keyTerms: CulturalKeyTerm[];
  featured: boolean;
  headwordWord: string;
  headwordGloss: LocalizedText;
  headwordAudioUrl: string;
  applications: LocalizedText[];
  heroBands: HeroBandForm[];
};

const EMPTY_CULTURAL: CulturalForm = {
  title: {},
  category: "festivals",
  description: {},
  keyTerms: [],
  featured: false,
  headwordWord: "",
  headwordGloss: {},
  headwordAudioUrl: "",
  applications: [],
  heroBands: [],
};

/** Coerce a stored LocalizedText | string | null into editable LocalizedText. */
function asLocalized(v: LocalizedText | string | null | undefined): LocalizedText {
  if (v == null) return {};
  if (typeof v === "string") return v.startsWith("{") ? safeParseLocalized(v) : { en: v };
  return v;
}

function safeParseLocalized(s: string): LocalizedText {
  try {
    return JSON.parse(s) as LocalizedText;
  } catch {
    return { en: s };
  }
}

/** Drop empty/whitespace entries; returns undefined when nothing remains. */
function cleanLocalized(v: LocalizedText): LocalizedText | undefined {
  const out: LocalizedText = {};
  for (const [k, val] of Object.entries(v)) {
    if (val && val.trim()) out[k as keyof LocalizedText] = val.trim();
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const inputCls = "rounded-xl border px-3.5 py-2.5 text-sm";

// ── Main component ────────────────────────────────────────────────────────────

export default function EducatorCultureScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user: currentUser, canAccess } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const flatListRef = useRef<FlatList>(null);

  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [culturalForm, setCulturalForm] = useState<CulturalForm>(EMPTY_CULTURAL);
  const [editingCultural, setEditingCultural] = useState(false);
  const [culturalFormOpen, setCulturalFormOpen] = useState(false);
  // Leaving with the editor panel open risks losing an unsaved culture item.
  useUnsavedGuard(culturalFormOpen);

  const allowedLanguages = currentUser?.isAdmin
    ? LANGUAGES.map((l) => l.id)
    : (currentUser?.reviewerLanguages ?? []);

  const activeLanguageId =
    selectedLanguageId ?? allowedLanguages[0] ?? currentUser?.selectedLanguageId ?? "izon";

  const { data: culturalItems = [], isLoading, refetch } = useCulturalItems(activeLanguageId, canAccess);

  const upsertCultural = useUpsertCulturalItem();
  const deleteCultural = useDeleteCulturalItem();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const q = searchQuery.toLowerCase().trim();
  const filteredCultural = q
    ? culturalItems.filter(
        (c) => localize(c.title, "en").toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
      )
    : culturalItems;

  // ── Cultural handlers ─────────────────────────────────────────────────────────

  const resetCultural = () => {
    setCulturalForm(EMPTY_CULTURAL);
    setEditingCultural(false);
    setCulturalFormOpen(false);
  };

  const startEditCultural = (item: CulturalItem) => {
    setCulturalForm({
      id: item.id,
      title: toLocalizedText(item.title, item.titleFr),
      category: (item.category as CulturalCategory) ?? "festivals",
      description: toLocalizedText(item.description, item.descriptionFr),
      keyTerms: item.keyTerms ?? [],
      featured: item.featured ?? false,
      headwordWord: item.headword?.word ?? "",
      headwordGloss: asLocalized(item.headword?.gloss),
      headwordAudioUrl: item.headword?.audioUrl ?? "",
      applications: (item.applications ?? []).map(asLocalized),
      heroBands: (item.heroBands ?? []).map((b) => ({
        label: b.label,
        sublabel: asLocalized(b.sublabel),
        from: b.from,
        to: b.to,
        dark: b.dark ?? false,
      })),
    });
    setEditingCultural(true);
    setCulturalFormOpen(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const submitCultural = () => {
    if (
      !culturalForm.title.en?.trim() ||
      !culturalForm.description.en?.trim()
    ) {
      toastError(t("educator.culture.missingFields"), t("educator.culture.culturalRequired"));
      return;
    }
    const headword = culturalForm.headwordWord.trim()
      ? {
          word: culturalForm.headwordWord.trim(),
          gloss: cleanLocalized(culturalForm.headwordGloss),
          audioUrl: culturalForm.headwordAudioUrl.trim() || undefined,
        }
      : null;
    const applications = culturalForm.applications
      .map(cleanLocalized)
      .filter((a): a is LocalizedText => a !== undefined);
    // A colour band is defined by its colours; the label is optional. Only drop
    // bands with an invalid/empty colour stop (which the reader can't render).
    const heroBands = culturalForm.heroBands
      .filter((b) => isHex(b.from) && isHex(b.to))
      .map((b) => ({
        label: b.label.trim(),
        sublabel: cleanLocalized(b.sublabel),
        from: b.from.trim(),
        to: b.to.trim(),
        dark: b.dark,
      }));

    const titleSer = serializeLocalizedText(culturalForm.title);
    const descriptionSer = serializeLocalizedText(culturalForm.description);
    upsertCultural.mutate(
      {
        id: culturalForm.id,
        languageId: activeLanguageId,
        title: titleSer.primary,
        titleFr: titleSer.fr,
        category: culturalForm.category,
        description: descriptionSer.primary,
        descriptionFr: descriptionSer.fr,
        keyTerms: culturalForm.keyTerms.filter((kt) => kt.word.trim() && kt.english.trim()),
        featured: culturalForm.featured,
        headword,
        // Always send arrays so an educator can clear them on edit.
        applications,
        heroBands,
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
        <Text className="text-2xl" style={{ fontFamily: fonts.heading, color: M.text }}>
          {t("educator.nav.culture")}
        </Text>
        <Text className="mt-1 text-sm" style={{ color: M.sub }}>
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
                className="mr-2 rounded-full px-4 py-2"
                style={{ backgroundColor: active ? M.accent : M.pillBg }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: active ? M.parchment : M.text }}
                >
                  {getLanguageName(langId)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Cultural form ─────────────────────────────────────────────────────── */}
      <View className="mx-5 mt-4 rounded-2xl border p-4" style={{ backgroundColor: M.card, borderColor: M.border }}>
        <Pressable
          onPress={() => setCulturalFormOpen((o) => !o)}
          disabled={editingCultural}
          className="flex-row items-center justify-between"
          style={culturalFormOpen ? { marginBottom: 12 } : undefined}
        >
          <Text className="text-base font-semibold" style={{ color: M.text }}>
            {editingCultural
              ? t("educator.culture.editCultural")
              : t("educator.culture.newCultural")}
          </Text>
          {!editingCultural ? (
            <IconSymbol name={culturalFormOpen ? "chevron.up" : "chevron.down"} size={14} color={M.muted} />
          ) : null}
        </Pressable>
        {culturalFormOpen ? (
        <>
        <LocalizedTextInput
          label={t("educator.culture.titleLabel")}
          value={culturalForm.title}
          onChange={(title) => setCulturalForm((c) => ({ ...c, title }))}
          required
        />

        <Text className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide" style={{ color: M.sub }}>
          {t("educator.culture.categoryLabel")}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CULTURAL_CATEGORIES.map((cat) => {
            const active = culturalForm.category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setCulturalForm((c) => ({ ...c, category: cat }))}
                className="mr-2 rounded-full px-3 py-1.5"
                style={{ backgroundColor: active ? getAccent("purple").solid : M.card }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: active ? "#FFFFFF" : M.sub }}
                >
                  {(t as (k: string) => string)(`educator.culture.categories.${cat}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <LocalizedTextInput
          label={t("educator.culture.descriptionLabel")}
          value={culturalForm.description}
          onChange={(description) => setCulturalForm((c) => ({ ...c, description }))}
          multiline
          required
        />

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: M.sub }}>
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
            <IconSymbol name="plus.circle.fill" size={16} color={getAccent("purple").solid} />
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
              placeholderTextColor={M.muted}
              style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
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
              placeholderTextColor={M.muted}
              style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
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
              <IconSymbol name="xmark.circle.fill" size={18} color={M.error} />
            </Pressable>
          </View>
        ))}

        {/* Featured toggle */}
        <Pressable
          onPress={() => setCulturalForm((c) => ({ ...c, featured: !c.featured }))}
          className="mt-4 flex-row items-center justify-between rounded-xl border p-3"
          style={{ backgroundColor: M.card, borderColor: M.border }}
        >
          <View className="flex-1 pr-3">
            <Text className="text-sm font-semibold" style={{ color: M.text }}>
              {t("educator.culture.featuredLabel")}
            </Text>
            <Text className="mt-0.5 text-xs" style={{ color: M.muted }}>
              {t("educator.culture.featuredHint")}
            </Text>
          </View>
          <View
            className="h-6 w-11 justify-center rounded-full p-0.5"
            style={{ backgroundColor: culturalForm.featured ? getAccent("purple").solid : M.pillBg }}
          >
            <View className={`h-5 w-5 rounded-full bg-white ${culturalForm.featured ? "ml-auto" : ""}`} />
          </View>
        </Pressable>

        {/* Headword + audio */}
        <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide" style={{ color: M.sub }}>
          {t("educator.culture.headwordLabel")}
        </Text>
        <HeadwordField
          languageId={activeLanguageId}
          value={{
            word: culturalForm.headwordWord,
            gloss: culturalForm.headwordGloss,
            audioUrl: culturalForm.headwordAudioUrl,
          }}
          onChange={(patch) =>
            setCulturalForm((c) => ({
              ...c,
              ...(patch.word !== undefined && { headwordWord: patch.word }),
              ...(patch.gloss !== undefined && { headwordGloss: patch.gloss }),
              ...(patch.audioUrl !== undefined && { headwordAudioUrl: patch.audioUrl }),
            }))
          }
          labels={{
            word: t("educator.culture.headwordWord"),
            gloss: t("educator.culture.headwordGloss"),
            audio: t("educator.culture.headwordAudio"),
            pick: t("educator.culture.headwordPick"),
            search: t("educator.culture.headwordSearch"),
            noEntries: t("educator.culture.headwordNoEntries"),
            createHint: t("educator.culture.headwordCreateHint"),
          }}
        />

        {/* Applications */}
        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: M.sub }}>
            {t("educator.culture.applicationsLabel")}
          </Text>
          <Pressable
            onPress={() => setCulturalForm((c) => ({ ...c, applications: [...c.applications, {}] }))}
            className="flex-row items-center gap-1"
          >
            <IconSymbol name="plus.circle.fill" size={16} color={getAccent("purple").solid} />
            <Text className="text-xs font-semibold text-purple-500">{t("educator.culture.addApplication")}</Text>
          </Pressable>
        </View>
        {culturalForm.applications.map((app, i) => (
          <View key={i} className="mt-2 flex-row items-start gap-2">
            <View className="flex-1">
              <LocalizedTextInput
                label={`${t("educator.culture.applicationItem")} ${i + 1}`}
                value={app}
                onChange={(val) =>
                  setCulturalForm((c) => {
                    const applications = [...c.applications];
                    applications[i] = val;
                    return { ...c, applications };
                  })
                }
              />
            </View>
            <Pressable
              onPress={() => setCulturalForm((c) => ({ ...c, applications: c.applications.filter((_, idx) => idx !== i) }))}
              className="w-8 items-center justify-center pt-7"
            >
              <IconSymbol name="xmark.circle.fill" size={18} color={M.error} />
            </Pressable>
          </View>
        ))}

        {/* Colour bands */}
        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: M.sub }}>
            {t("educator.culture.heroBandsLabel")}
          </Text>
          <Pressable
            onPress={() =>
              setCulturalForm((c) => ({
                ...c,
                heroBands: [...c.heroBands, { label: "", sublabel: {}, from: "#C4862A", to: "#0B0D17", dark: true }],
              }))
            }
            className="flex-row items-center gap-1"
          >
            <IconSymbol name="plus.circle.fill" size={16} color={getAccent("purple").solid} />
            <Text className="text-xs font-semibold text-purple-500">{t("educator.culture.addBand")}</Text>
          </Pressable>
        </View>
        {culturalForm.heroBands.map((band, i) => {
          const updateBand = (patch: Partial<HeroBandForm>) =>
            setCulturalForm((c) => {
              const heroBands = [...c.heroBands];
              heroBands[i] = { ...heroBands[i], ...patch };
              return { ...c, heroBands };
            });
          return (
            <View key={i} className="mt-2 rounded-xl border p-3" style={{ backgroundColor: M.card, borderColor: M.border }}>
              <View className="flex-row items-center gap-2">
                <View
                  className="h-8 w-12 rounded-md border"
                  style={{ overflow: "hidden", flexDirection: "row", borderColor: M.border }}
                >
                  <View style={{ flex: 1, backgroundColor: isHex(band.from) ? band.from : "transparent" }} />
                  <View style={{ flex: 1, backgroundColor: isHex(band.to) ? band.to : "transparent" }} />
                </View>
                <TextInput
                  value={band.label}
                  onChangeText={(label) => updateBand({ label })}
                  placeholder={t("educator.culture.bandLabel")}
                  placeholderTextColor={M.muted}
                  style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
                  className={`${inputCls} flex-1`}
                />
                <Pressable
                  onPress={() => setCulturalForm((c) => ({ ...c, heroBands: c.heroBands.filter((_, idx) => idx !== i) }))}
                  className="w-8 items-center justify-center"
                >
                  <IconSymbol name="xmark.circle.fill" size={18} color={M.error} />
                </Pressable>
              </View>
              <View className="mt-3 gap-3">
                <ColorSwatchInput
                  label={t("educator.culture.bandFrom")}
                  value={band.from}
                  onChange={(from) => updateBand({ from })}
                />
                <ColorSwatchInput
                  label={t("educator.culture.bandTo")}
                  value={band.to}
                  onChange={(to) => updateBand({ to })}
                />
              </View>
              <View style={{ marginTop: 8 }}>
                <LocalizedTextInput
                  label={t("educator.culture.bandSublabel")}
                  value={band.sublabel}
                  onChange={(sublabel) => updateBand({ sublabel })}
                />
              </View>
              <Pressable onPress={() => updateBand({ dark: !band.dark })} className="mt-2 flex-row items-center justify-between">
                <Text className="text-xs" style={{ color: M.sub }}>{t("educator.culture.bandDark")}</Text>
                <View
                  className="h-6 w-11 justify-center rounded-full p-0.5"
                  style={{ backgroundColor: band.dark ? getAccent("purple").solid : M.pillBg }}
                >
                  <View className={`h-5 w-5 rounded-full bg-white ${band.dark ? "ml-auto" : ""}`} />
                </View>
              </Pressable>
            </View>
          );
        })}
        {culturalForm.heroBands.some((b) => !(isHex(b.from) && isHex(b.to))) && (
          <View className="mt-2 flex-row items-center gap-1.5">
            <IconSymbol name="exclamationmark.triangle.fill" size={13} color={M.warning} />
            <Text className="flex-1 text-xs" style={{ color: M.warning }}>
              {t("educator.culture.bandIncomplete")}
            </Text>
          </View>
        )}

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
              className="rounded-xl px-4 py-3 active:opacity-80"
              style={{ backgroundColor: M.pillBg }}
            >
              <Text className="font-semibold" style={{ color: M.text }}>
                {t("common.cancel")}
              </Text>
            </Pressable>
          )}
        </View>
        </>
        ) : null}
      </View>

      {/* Search */}
      <View className="mt-5 px-5">
        <View className="flex-row items-center rounded-xl px-3" style={{ backgroundColor: M.pillBg }}>
          <IconSymbol name="magnifyingglass" size={16} color={M.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("educator.culture.searchCultural")}
            placeholderTextColor={M.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ color: M.text }}
            className="ml-2 flex-1 py-2.5 text-sm"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <IconSymbol name="xmark" size={14} color={M.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <View className="mt-4 px-5">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.4px]" style={{ color: M.muted }}>
          {q
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

  const renderItem = ({ item }: { item: CulturalItem }) => (
    <View className="mx-5 rounded-2xl border p-3" style={{ backgroundColor: M.card, borderColor: M.border }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2.5 pr-3">
          <IconSymbol name={CULTURE_CATEGORY_ICON[item.category as CulturalCategory]} size={22} color={M.accent} />
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: M.text }}>
              {localize(item.title, "en")}
            </Text>
            <Text
              className="mt-0.5 text-xs"
              style={{ color: M.muted }}
              numberOfLines={1}
            >
              {localize(item.description, "en")}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <ActiveToggle
            entityType="cultural_content"
            id={item.id}
            isActive={item.isActive ?? true}
            invalidateKeys={[["cultural"]]}
            M={M}
            onToast={{ success: toastSuccess, error: toastError }}
          />
          <Pressable
            onPress={() => startEditCultural(item)}
            className="rounded-full p-2"
            style={{ backgroundColor: M.pillBg }}
          >
            <IconSymbol name="gearshape.fill" size={14} color={M.muted} />
          </Pressable>
          <Pressable
            onPress={() => confirmDeleteCultural(item.id)}
            className="rounded-full p-2"
            style={{ backgroundColor: M.errorBg }}
          >
            <IconSymbol name="xmark.circle.fill" size={14} color={M.error} />
          </Pressable>
        </View>
      </View>
      <View className="mt-2 flex-row items-center gap-2">
        <View className="self-start rounded-full bg-purple-100 px-2 py-0.5 dark:bg-purple-900/40">
          <Text className="text-[10px] font-semibold uppercase text-purple-700 dark:text-purple-400">
            {(t as (k: string) => string)(`educator.culture.categories.${item.category}`)}
          </Text>
        </View>
        {(item.keyTerms ?? []).length > 0 && (
          <Text className="text-xs" style={{ color: M.muted }}>
            {t("educator.culture.keyTermsCount", { count: item.keyTerms!.length })}
          </Text>
        )}
      </View>
    </View>
  );

  // ── Empty state ───────────────────────────────────────────────────────────────

  const listEmpty = (
    <View className="px-5">
      {isLoading ? (
        <Text className="text-sm" style={{ color: M.sub }}>{t("common.loading")}</Text>
      ) : (
        <View className="items-center py-12">
          <IconSymbol name="globe" size={32} color={M.border} />
          <Text className="mt-3 text-center text-sm" style={{ color: M.muted }}>
            {q ? t("educator.culture.noResults") : t("educator.culture.noCultural")}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: t("educator.nav.culture"), headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.bg }} edges={["top"]}>
        <View className="flex-row items-center px-5 pb-1 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12} className="-ml-1 p-1 active:opacity-60">
            <IconSymbol name="chevron.left" size={22} color={M.text} />
          </Pressable>
        </View>
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
          data={filteredCultural}
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
      </SafeAreaView>
    </>
  );
}
