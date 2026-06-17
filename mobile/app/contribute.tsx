import { analytics } from "@/lib/analytics";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput } from "@/components/ui/localized-text-input";
import { getAccent } from "@/constants/accent-colors";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { LocalizedText } from "@/types";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { ApiError, friendlyError } from "@/lib/api";
import {
    ALL_CATEGORIES,
    CATEGORY_LABELS,
    type DictionaryCategory,
    type DictionaryEntry,
} from "@/lib/dictionary";
import { useBounties } from "@/lib/hooks/use-bounties";
import {
    useSubmitContribution,
    useSubmitEntryContribution,
} from "@/lib/hooks/use-contributions";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useContributors } from "@/lib/hooks/use-contributors";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES } from "@/lib/mock-data";
import { wordContributionSchema } from "@/lib/validation";
import { useContributionStore } from "@/store/contribution-store";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = "type" | "language" | "entry" | "details";

export default function ContributeScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    languageId?: string;
    category?: string;
    word?: string;
    english?: string;
    pronunciation?: string;
    example?: string;
    exampleTranslation?: string;
  }>();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const {
    isRecording,
    isPlaying,
    recordingUri,
    startRecording,
    stopRecording,
    discardRecording,
    playRecording,
    stopPlayback,
  } = useContributionStore();
  const submitContribution = useSubmitContribution();
  const submitEntryContribution = useSubmitEntryContribution();

  const [step, setStep] = useState<Step>(params.word ? "details" : params.languageId ? "entry" : "type");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(params.languageId ?? null);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);
  const [langSearch, setLangSearch] = useState("");
  const [word, setWord] = useState(params.word ?? "");
  const [english, setEnglish] = useState<LocalizedText>(params.english ? { en: params.english } : {});
  const [category, setCategory] = useState<DictionaryCategory | null>(
    params.category ? (params.category as DictionaryCategory) : null
  );
  const [pronunciation, setPronunciation] = useState(params.pronunciation ?? "");
  const [example, setExample] = useState(params.example ?? "");
  const [exampleTranslation, setExampleTranslation] = useState<LocalizedText>(
    params.exampleTranslation ? { en: params.exampleTranslation } : {}
  );
  const [imageUri, setImageUri] = useState<string | null>(null);

  const isPhrase = word.trim().includes(" ");

  // Dictionary lookup for duplicate detection
  const { data: dictionaryEntries = [] } = useDictionary(selectedLanguage ?? "");
  const wordTrimmed = word.trim();
  const dictMatches =
    wordTrimmed.length >= 2 && !selectedEntry
      ? dictionaryEntries
          .filter((e) =>
            e.word.toLowerCase().startsWith(wordTrimmed.toLowerCase())
          )
          .slice(0, 5)
      : [];

  const handleSelectEntry = (entry: DictionaryEntry) => {
    setSelectedEntry(entry);
    setWord(entry.word);
    setEnglish({});
    setCategory(entry.category);
  };

  const handleClearEntry = () => {
    setSelectedEntry(null);
    setWord("");
    setEnglish({});
    setCategory(null);
  };

  // Bounty matching
  const { data: matchingBounties } = useBounties(
    selectedLanguage ?? undefined,
    category ?? undefined
  );
  const activeBounty = matchingBounties?.[0]; // highest xpReward first

  const { data: contributors = [] } = useContributors();
  const totalContributors = contributors.length;
  const totalApproved = contributors.reduce((sum, c) => sum + c.approvedCount, 0);

  const handlePickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    const onSuccess = () => {
      toastSuccess(t("contribute.submitted"), t("contribute.submittedWordDesc"));
      setTimeout(() => router.back(), 1500);
    };
    const onError = (err: unknown) => {
      console.error("Contribution submit error:", err);
      if (err instanceof ApiError && err.status === 409) {
        toastError(
          t("contribute.alreadyExists"),
          friendlyError(err, "This entry may already exist. Try a different word or refine this one.")
        );
      } else {
        toastError(t("common.error"), friendlyError(err));
      }
    };

    if (selectedEntry) {
      // Update request for an existing dictionary entry
      submitEntryContribution.mutate(
        {
          type: "entry_meaning",
          languageId: selectedLanguage!,
          dictionaryEntryId: selectedEntry.id,
          word: selectedEntry.word,
          english,
          category: selectedEntry.category,
        },
        {
          onSuccess: () => {
            analytics.contributionSubmitted(selectedLanguage!, "entry_meaning");
            onSuccess();
          },
          onError,
        }
      );
      return;
    }

    const validation = wordContributionSchema.safeParse({
      languageId: selectedLanguage ?? "",
      word,
      english,
      category,
      pronunciation: pronunciation || undefined,
      example: example || undefined,
      exampleTranslation: exampleTranslation || undefined,
      audioUri: recordingUri ?? undefined,
      imageUri: imageUri ?? undefined,
    });

    if (!validation.success) {
      const message = validation.error.issues[0]?.message ?? t("common.tryAgain");
      toastError(t("common.error"), message);
      return;
    }

    const data = validation.data;

    const contributionType = isPhrase ? "phrase" : "word";
    submitContribution.mutate(
      {
        type: contributionType,
        languageId: data.languageId,
        word: data.word,
        english: data.english,
        category: data.category,
        pronunciation: data.pronunciation,
        example: data.example,
        exampleTranslation: data.exampleTranslation,
        audioUri: data.audioUri,
        imageUri: data.imageUri,
      },
      {
        onSuccess: () => {
          analytics.contributionSubmitted(data.languageId, contributionType);
          onSuccess();
        },
        onError,
      }
    );
  };

  const hasEnglish = Object.values(english).some((v) => v?.trim());
  const canSubmit =
    selectedLanguage &&
    word.trim() &&
    hasEnglish &&
    category &&
    !submitContribution.isPending &&
    !submitEntryContribution.isPending;

  // Progress bar steps (excluding the type chooser which is a landing)
  const wizardSteps: Step[] = ["language", "entry", "details"];
  const wizardIndex = wizardSteps.indexOf(step);

  return (
    <>
      <Stack.Screen options={{ title: t("contribute.title"), presentation: "modal" }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {step !== "type" && (
            <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingTop: 8 }}>
              {wizardSteps.map((s, i) => (
                <View
                  key={s}
                  style={{ marginRight: 4, height: 4, flex: 1, borderRadius: 999, backgroundColor: wizardIndex >= i ? M.accent : M.border }}
                />
              ))}
            </View>
          )}

          <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
            {step === "type" && (
              <View>
                <Text style={{ marginBottom: 4, fontSize: 24, fontWeight: "900", color: M.text, letterSpacing: -0.5 }}>
                  {t("contribute.title")}
                </Text>
                <Text style={{ marginBottom: 16, fontSize: 13, color: M.sub }}>
                  {t("contribute.subtitle")}
                </Text>

                {totalContributors > 0 && (
                  <View style={{ marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, backgroundColor: M.accentGlow, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: M.accentBorder }}>
                    <IconSymbol name="person.2.fill" size={16} color={M.accent} />
                    <Text style={{ fontSize: 13, color: M.text }}>
                      {t("contribute.socialProof", {
                        contributors: totalContributors,
                        words: totalApproved.toLocaleString(),
                      })}
                    </Text>
                  </View>
                )}

                {([
                  { onPress: () => setStep("language"), bg: M.accentGlow, iconBg: M.accent, icon: "character.book.closed", iconColor: M.ink, title: t("contribute.wordOrPhrase"), desc: t("contribute.wordOrPhraseDesc"), chevronColor: M.accent },
                  { onPress: () => router.push("/contribute-bulk"), bg: M.successBg, iconBg: M.success, icon: "list.bullet.clipboard", iconColor: M.ink, title: t("contribute.bulkWords"), desc: t("contribute.bulkWordsDesc"), chevronColor: M.success },
                  { onPress: () => router.push("/contribute-lesson"), bg: getAccent("purple").bg, iconBg: getAccent("purple").solid, icon: "waveform", iconColor: M.parchment, title: t("contribute.fullLesson"), desc: t("contribute.fullLessonDesc"), chevronColor: getAccent("purple").solid },
                  { onPress: () => router.push("/bounties"), bg: `${M.accent}10`, iconBg: M.accent, icon: "star.fill", iconColor: M.ink, title: t("contribute.activeBounties"), desc: t("contribute.activeBountiesDesc"), chevronColor: M.accent },
                  { onPress: () => router.push("/reviewer-application"), bg: getAccent("indigo").bg, iconBg: getAccent("indigo").solid, icon: "shield.fill", iconColor: M.parchment, title: "Become a Reviewer", desc: "Apply to review contributions and help maintain content quality.", chevronColor: getAccent("indigo").solid },
                ] as const).map((card, i) => (
                  <Pressable
                    key={i}
                    onPress={card.onPress as any}
                    style={{ marginBottom: 12, borderRadius: 16, backgroundColor: card.bg, padding: 20, borderWidth: 1, borderColor: M.border }}
                    className="active:opacity-80"
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ marginRight: 16, height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: card.iconBg }}>
                        <IconSymbol name={card.icon as any} size={24} color={card.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{card.title}</Text>
                        <Text style={{ marginTop: 2, fontSize: 13, color: M.sub }}>{card.desc}</Text>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color={card.chevronColor} />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {step === "language" && (
              <View>
                <Text style={{ marginBottom: 4, fontSize: 20, fontWeight: "700", color: M.text }}>
                  {t("contribute.selectLanguage")}
                </Text>
                <Text style={{ marginBottom: 16, fontSize: 13, color: M.sub }}>
                  {t("contribute.selectLanguageDesc")}
                </Text>

                <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, paddingHorizontal: 12 }}>
                  <IconSymbol name="magnifyingglass" size={16} color={M.muted} />
                  <TextInput
                    value={langSearch}
                    onChangeText={setLangSearch}
                    placeholder={t("contribute.searchLanguage")}
                    placeholderTextColor={M.muted}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    style={{ marginLeft: 8, flex: 1, paddingVertical: 12, fontSize: 14, color: M.text }}
                  />
                  {langSearch.length > 0 && (
                    <Pressable onPress={() => setLangSearch("")} hitSlop={8}>
                      <IconSymbol name="xmark.circle.fill" size={16} color={M.muted} />
                    </Pressable>
                  )}
                </View>

                {(() => {
                  const q = langSearch.toLowerCase();
                  const filtered = LANGUAGES.filter(
                    (lang) =>
                      !q ||
                      lang.name.toLowerCase().includes(q) ||
                      lang.nativeName?.toLowerCase().includes(q) ||
                      lang.region?.toLowerCase().includes(q)
                  );

                  const customName = langSearch.trim();
                  const customLangButton = customName.length > 0 && (
                    <Pressable
                      key="custom"
                      onPress={() => {
                        setSelectedLanguage(customName);
                        setStep("entry");
                      }}
                      style={{ marginTop: 4, marginBottom: 16, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 2, borderStyle: "dashed", borderColor: M.accentBorder, padding: 16 }}
                      className="active:opacity-70"
                    >
                      <View style={{ marginRight: 12, height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: M.accentGlow }}>
                        <IconSymbol name="plus.circle" size={20} color={M.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: M.accent }}>
                          {t("contribute.useCustomLanguage", { name: customName })}
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color={M.accent} />
                    </Pressable>
                  );

                  if (filtered.length === 0) {
                    return (
                      <View>
                        <View style={{ marginBottom: 16, alignItems: "center", paddingVertical: 24 }}>
                          <IconSymbol name="magnifyingglass" size={32} color={M.border} />
                          <Text style={{ marginTop: 8, fontSize: 13, color: M.muted }}>
                            {t("contribute.noLanguageFound")}
                          </Text>
                        </View>
                        {customLangButton}
                      </View>
                    );
                  }

                  return (
                    <View>
                      {filtered.map((lang) => (
                        <Pressable
                          key={lang.id}
                          onPress={() => {
                            setSelectedLanguage(lang.id);
                            setStep("entry");
                          }}
                          style={{ marginBottom: 12, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 2, padding: 16, backgroundColor: selectedLanguage === lang.id ? M.accentGlow : M.card, borderColor: selectedLanguage === lang.id ? M.accent : M.border }}
                          className="active:opacity-70"
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: "600", color: selectedLanguage === lang.id ? M.accent : M.text }}>
                              {lang.name}
                            </Text>
                            <Text style={{ marginTop: 2, fontSize: 13, color: M.sub }}>
                              {lang.nativeName} · {lang.region}
                            </Text>
                          </View>
                          <IconSymbol name="chevron.right" size={16} color={M.muted} />
                        </Pressable>
                      ))}
                      {customLangButton}
                    </View>
                  );
                })()}
              </View>
            )}

            {step === "entry" && (
              <View>
                <Text style={{ marginBottom: 4, fontSize: 20, fontWeight: "700", color: M.text }}>
                  {t("contribute.enterWord")}
                </Text>
                <Text style={{ marginBottom: 20, fontSize: 13, color: M.sub }}>
                  {t("contribute.enterWordDesc")}
                </Text>

                {activeBounty && (
                  <Pressable
                    onPress={() => router.push("/bounties")}
                    style={{ marginBottom: 16, borderRadius: 12, backgroundColor: M.accentGlow, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: M.accentBorder }}
                    className="active:opacity-80"
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: M.accent }}>
                        {t("contribute.activeBountyBanner", { xp: activeBounty.xpReward })}
                      </Text>
                      <Text style={{ fontSize: 11, color: M.accent }}>
                        {activeBounty.currentCount}/{activeBounty.targetCount}
                      </Text>
                    </View>
                    <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "500", color: M.text }} numberOfLines={1}>
                      {activeBounty.title}
                    </Text>
                  </Pressable>
                )}

                {selectedEntry && (
                  <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: M.accentGlow, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: M.accentBorder }}>
                    <IconSymbol name="arrow.up.circle.fill" size={16} color={M.accent} />
                    <Text style={{ marginLeft: 8, flex: 1, fontSize: 13, color: M.text }}>
                      {t("contribute.updateBanner")}
                    </Text>
                    <Pressable onPress={handleClearEntry} hitSlop={8}>
                      <IconSymbol name="xmark.circle.fill" size={18} color={M.muted} />
                    </Pressable>
                  </View>
                )}

                <Text style={{ marginBottom: 6, fontSize: 13, fontWeight: "500", color: M.sub }}>
                  {t("contribute.wordPhrase")}
                </Text>
                <TextInput
                  value={word}
                  onChangeText={(text) => {
                    setWord(text);
                    if (selectedEntry) setSelectedEntry(null);
                  }}
                  placeholder="e.g. Baid\u1EB9"
                  placeholderTextColor={M.muted}
                  editable={!selectedEntry}
                  style={{ borderRadius: dictMatches.length > 0 ? 0 : 12, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 1, borderBottomWidth: dictMatches.length > 0 ? 0 : 1, borderColor: M.border, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: M.text, marginBottom: dictMatches.length > 0 ? 0 : 16, opacity: selectedEntry ? 0.6 : 1 }}
                  autoFocus
                />

                {dictMatches.length > 0 && (
                  <View style={{ marginBottom: 16, borderRadius: 12, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderWidth: 1, borderTopWidth: 0, borderColor: M.border, overflow: "hidden" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: M.bg, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <IconSymbol name="magnifyingglass" size={12} color={M.muted} />
                      <Text style={{ marginLeft: 6, fontSize: 11, fontWeight: "500", color: M.muted }}>
                        {t("contribute.foundInDictionary")}
                      </Text>
                    </View>
                    {dictMatches.map((entry, i) => (
                      <Pressable
                        key={entry.id}
                        onPress={() => handleSelectEntry(entry)}
                        style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i === 0 ? 1 : 0, borderBottomWidth: i < dictMatches.length - 1 ? 1 : 0, borderColor: M.border }}
                        className="active:opacity-70"
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>{entry.word}</Text>
                          <Text style={{ fontSize: 11, color: M.sub }} numberOfLines={1}>{localize(entry.english, "en")}</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontSize: 11, color: M.accent }}>
                          {CATEGORY_LABELS[entry.category]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                <LocalizedTextInput
                  label={selectedEntry ? t("contribute.suggestedMeaning") : t("dictionaryPage.fieldEnglish")}
                  value={english}
                  onChange={setEnglish}
                  required
                />

                <Text style={{ marginBottom: 6, fontSize: 13, fontWeight: "500", color: M.sub }}>
                  {t("dictionaryPage.fieldCategory")}
                </Text>
                <View style={{ marginBottom: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {ALL_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => { if (!selectedEntry) setCategory(cat); }}
                      disabled={!!selectedEntry}
                      accessibilityState={{ disabled: !!selectedEntry }}
                      style={{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: category === cat ? M.accent : M.card, borderWidth: 1, borderColor: category === cat ? M.accent : M.border, opacity: selectedEntry ? 0.6 : 1 }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "500", color: category === cat ? M.ink : M.sub }}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === "details" && (
              <View>
                <Text style={{ marginBottom: 4, fontSize: 20, fontWeight: "700", color: M.text }}>
                  {t("contribute.additionalDetails")}
                </Text>
                <Text style={{ marginBottom: 20, fontSize: 13, color: M.sub }}>
                  {t("contribute.additionalDetailsDesc")}
                </Text>

                <View style={{ marginBottom: 16, borderRadius: 16, backgroundColor: M.accentGlow, padding: 16, borderWidth: 1, borderColor: M.accentBorder, borderLeftWidth: 4, borderLeftColor: M.accent }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: M.text }}>{word}</Text>
                  <Text style={{ marginTop: 2, fontSize: 13, color: M.sub }}>{localize(english, "en")}</Text>
                  <Text style={{ marginTop: 4, fontSize: 11, color: M.accent }}>{category ? CATEGORY_LABELS[category] : ""}</Text>
                </View>

                <View>
                  <Text style={{ marginBottom: 6, fontSize: 13, fontWeight: "500", color: M.sub }}>{t("dictionaryPage.fieldPronunciation")}</Text>
                  <TextInput
                    value={pronunciation}
                    onChangeText={setPronunciation}
                    placeholder="e.g. bah-ee-DEH"
                    placeholderTextColor={M.muted}
                    style={{ marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: M.text }}
                  />
                </View>
                <View>
                  <Text style={{ marginBottom: 6, fontSize: 13, fontWeight: "500", color: M.sub }}>{t("dictionaryPage.fieldExample")}</Text>
                  <TextInput
                    value={example}
                    onChangeText={setExample}
                    placeholder="An example sentence using this word..."
                    placeholderTextColor={M.muted}
                    style={{ marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: M.text }}
                  />
                </View>
                <LocalizedTextInput
                  label={t("dictionaryPage.fieldExampleTranslation")}
                  value={exampleTranslation}
                  onChange={setExampleTranslation}
                />

                <Text style={{ marginBottom: 6, fontSize: 13, fontWeight: "500", color: M.sub }}>
                  {t("contribute.audioPronunciation")}
                </Text>
                <View style={{ marginBottom: 16, alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: M.border, padding: 16, backgroundColor: M.card }}>
                  {recordingUri ? (
                    <View style={{ alignItems: "center" }}>
                      <Pressable
                        onPress={isPlaying ? stopPlayback : playRecording}
                        style={{ height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: isPlaying ? M.accent : getAccent("teal").bg }}
                        className="active:opacity-70"
                      >
                        <IconSymbol
                          name={isPlaying ? "stop.fill" : "play.fill"}
                          size={24}
                          color={isPlaying ? M.ink : getAccent("teal").solid}
                        />
                      </Pressable>
                      <Text style={{ marginTop: 8, fontSize: 13, color: getAccent("teal").solid }}>
                        {t("contribute.recordingSaved")}
                      </Text>
                      <Pressable
                        onPress={() => discardRecording()}
                        style={{ marginTop: 8, borderRadius: 8, backgroundColor: M.border, paddingHorizontal: 16, paddingVertical: 8 }}
                        className="active:opacity-70"
                      >
                        <Text style={{ fontSize: 13, fontWeight: "500", color: M.sub }}>
                          {t("contribute.reRecord")}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={isRecording ? stopRecording : startRecording}
                      style={{ height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: isRecording ? M.error : M.errorBg }}
                      className="active:opacity-70"
                    >
                      {isRecording ? (
                        <View style={{ height: 24, width: 24, borderRadius: 4, backgroundColor: M.parchment }} />
                      ) : (
                        <IconSymbol name="mic.fill" size={24} color={M.error} />
                      )}
                    </Pressable>
                  )}
                  {isRecording && (
                    <Text style={{ marginTop: 8, fontSize: 13, color: M.error }}>
                      {t("contribute.recordingTapToStop")}
                    </Text>
                  )}
                  {!recordingUri && !isRecording && (
                    <Text style={{ marginTop: 8, fontSize: 11, color: M.muted }}>
                      {t("contribute.recordingHint")}
                    </Text>
                  )}
                </View>

                <Text style={{ marginBottom: 6, marginTop: 8, fontSize: 13, fontWeight: "500", color: M.sub }}>
                  {t("contribute.imagePicker")}
                </Text>
                {imageUri ? (
                  <View style={{ marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: M.border, overflow: "hidden" }}>
                    <Image source={{ uri: imageUri }} style={{ height: 176, width: "100%" }} resizeMode="cover" />
                    <Pressable
                      onPress={handlePickImage}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10 }}
                      className="active:opacity-70"
                    >
                      <IconSymbol name="photo" size={15} color={M.accent} />
                      <Text style={{ fontSize: 13, fontWeight: "500", color: M.accent }}>
                        {t("contribute.changeImage")}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={handlePickImage}
                    style={{ marginBottom: 16, alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: M.border, paddingVertical: 24 }}
                    className="active:opacity-70"
                  >
                    <IconSymbol name="photo.badge.plus" size={28} color={M.muted} />
                    <Text style={{ fontSize: 11, color: M.muted }}>
                      {t("contribute.imageHint")}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>

          {step !== "type" && (
            <View style={{ borderTopWidth: 1, borderTopColor: M.border, paddingHorizontal: 20, paddingVertical: 16 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => {
                    if (step === "language") setStep("type");
                    else if (step === "entry") setStep("language");
                    else if (step === "details") setStep("entry");
                  }}
                  style={{ flex: 1, alignItems: "center", borderRadius: 12, backgroundColor: M.card, paddingVertical: 14, borderWidth: 1, borderColor: M.border }}
                  className="active:opacity-70"
                >
                  <Text style={{ fontWeight: "600", color: M.sub }}>
                    {t("common.back")}
                  </Text>
                </Pressable>
                {step === "entry" && (
                  <Pressable
                    onPress={() => {
                      if (selectedEntry) {
                        handleSubmit();
                        return;
                      }
                      const entryCheck = wordContributionSchema.pick({ word: true, english: true, category: true }).safeParse({ word, english, category });
                      if (entryCheck.success) {
                        setStep("details");
                      } else {
                        const message = entryCheck.error.issues[0]?.message ?? t("common.tryAgain");
                        toastError(t("common.error"), message);
                      }
                    }}
                    disabled={!word.trim() || !hasEnglish || !category}
                    style={{ flex: 1, alignItems: "center", borderRadius: 12, paddingVertical: 14, backgroundColor: word.trim() && hasEnglish && category ? M.accent : M.border }}
                    className="active:opacity-80"
                  >
                    <Text style={{ fontWeight: "600", color: word.trim() && hasEnglish && category ? M.ink : M.muted }}>
                      {selectedEntry ? t("contribute.submitUpdate") : t("common.next")}
                    </Text>
                  </Pressable>
                )}
                {step === "details" && (
                  <Pressable
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    style={{ flex: 1, alignItems: "center", borderRadius: 12, paddingVertical: 14, backgroundColor: canSubmit ? M.accent : M.border }}
                    className="active:opacity-80"
                  >
                    <Text style={{ fontWeight: "600", color: canSubmit ? M.ink : M.muted }}>
                      {(submitContribution.isPending || submitEntryContribution.isPending)
                        ? t("contribute.submitting")
                        : selectedEntry
                          ? t("contribute.submitUpdate")
                          : t("common.submit")}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
