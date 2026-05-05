import { IconSymbol } from "@/components/ui/icon-symbol";
import { ApiError } from "@/lib/api";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  type DictionaryCategory,
} from "@/lib/dictionary";
import { useBounties } from "@/lib/hooks/use-bounties";
import { useSubmitContribution } from "@/lib/hooks/use-contributions";
import { LANGUAGES } from "@/lib/mock-data";
import { useContributionStore } from "@/store/contribution-store";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
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
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ languageId?: string; category?: string }>();
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

  const [step, setStep] = useState<Step>(params.languageId ? "entry" : "type");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(params.languageId ?? null);
  const [langSearch, setLangSearch] = useState("");
  const [word, setWord] = useState("");
  const [english, setEnglish] = useState("");
  const [category, setCategory] = useState<DictionaryCategory | null>(
    params.category ? (params.category as DictionaryCategory) : null
  );
  const [pronunciation, setPronunciation] = useState("");
  const [example, setExample] = useState("");
  const [exampleTranslation, setExampleTranslation] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const isPhrase = word.trim().includes(" ");

  // Bounty matching
  const { data: matchingBounties } = useBounties(
    selectedLanguage ?? undefined,
    category ?? undefined
  );
  const activeBounty = matchingBounties?.[0]; // highest xpReward first

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
    if (!selectedLanguage || !word.trim() || !english.trim() || !category) return;

    submitContribution.mutate(
      {
        type: isPhrase ? "phrase" : "word",
        languageId: selectedLanguage,
        word: word.trim(),
        english: english.trim(),
        category,
        pronunciation: pronunciation.trim() || undefined,
        example: example.trim() || undefined,
        exampleTranslation: exampleTranslation.trim() || undefined,
        audioUri: recordingUri ?? undefined,
        imageUri: imageUri ?? undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(t("contribute.submitted"), t("contribute.submittedWordDesc"), [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (err) => {
          console.error("Contribution submit error:", err);
          if (err instanceof ApiError && err.status === 409) {
            Alert.alert(
              t("contribute.alreadyExists"),
              err.message + "\n\nTry contributing a different word or refine this one."
            );
          } else {
            Alert.alert(t("common.error"), err.message || t("common.tryAgain"));
          }
        },
      }
    );
  };

  const canSubmit =
    selectedLanguage &&
    word.trim() &&
    english.trim() &&
    category &&
    !submitContribution.isPending;

  // Progress bar steps (excluding the type chooser which is a landing)
  const wizardSteps: Step[] = ["language", "entry", "details"];
  const wizardIndex = wizardSteps.indexOf(step);

  return (
    <>
      <Stack.Screen options={{ title: t("contribute.title"), presentation: "modal" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Progress bar — hidden on type chooser */}
          {step !== "type" && (
            <View className="flex-row px-5 pt-2">
              {wizardSteps.map((s, i) => (
                <View
                  key={s}
                  className={`mr-1 h-1 flex-1 rounded-full ${
                    wizardIndex >= i
                      ? "bg-blue-500"
                      : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                />
              ))}
            </View>
          )}

          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
            {/* Type chooser */}
            {step === "type" && (
              <View>
                <Text className="mb-1 text-2xl font-bold text-neutral-900 dark:text-white">
                  {t("contribute.title")}
                </Text>
                <Text className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                  {t("contribute.subtitle")}
                </Text>

                {/* Word / Phrase card */}
                <Pressable
                  onPress={() => setStep("language")}
                  className="mb-3 rounded-2xl bg-blue-50 p-5 active:opacity-80 dark:bg-blue-950"
                >
                  <View className="flex-row items-center">
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                      <IconSymbol name="character.book.closed" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-neutral-900 dark:text-white">
                        {t("contribute.wordOrPhrase")}
                      </Text>
                      <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                        {t("contribute.wordOrPhraseDesc")}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#3b82f6" />
                  </View>
                </Pressable>

                {/* Bulk words card */}
                <Pressable
                  onPress={() => router.push("/contribute-bulk")}
                  className="mb-3 rounded-2xl bg-green-50 p-5 active:opacity-80 dark:bg-green-950"
                >
                  <View className="flex-row items-center">
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-green-500">
                      <IconSymbol name="list.bullet.clipboard" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-neutral-900 dark:text-white">
                        {t("contribute.bulkWords")}
                      </Text>
                      <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                        {t("contribute.bulkWordsDesc")}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#22c55e" />
                  </View>
                </Pressable>

                {/* Lesson card */}
                <Pressable
                  onPress={() => router.push("/contribute-lesson")}
                  className="mb-3 rounded-2xl bg-purple-50 p-5 active:opacity-80 dark:bg-purple-950"
                >
                  <View className="flex-row items-center">
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-purple-500">
                      <IconSymbol name="waveform" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-neutral-900 dark:text-white">
                        {t("contribute.fullLesson")}
                      </Text>
                      <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                        {t("contribute.fullLessonDesc")}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#a855f7" />
                  </View>
                </Pressable>

                {/* Active Bounties card */}
                <Pressable
                  onPress={() => router.push("/bounties")}
                  className="mb-3 rounded-2xl bg-amber-50 p-5 active:opacity-80 dark:bg-amber-950"
                >
                  <View className="flex-row items-center">
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
                      <IconSymbol name="star.fill" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-neutral-900 dark:text-white">
                        {t("contribute.activeBounties")}
                      </Text>
                      <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                        {t("contribute.activeBountiesDesc")}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#f59e0b" />
                  </View>
                </Pressable>
              </View>
            )}

            {/* Step 1: Language */}
            {step === "language" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  {t("contribute.selectLanguage")}
                </Text>
                <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {t("contribute.selectLanguageDesc")}
                </Text>

                {/* Search */}
                <View className="mb-4 flex-row items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 dark:border-neutral-700 dark:bg-neutral-800">
                  <IconSymbol name="magnifyingglass" size={16} color="#9ca3af" />
                  <TextInput
                    value={langSearch}
                    onChangeText={setLangSearch}
                    placeholder={t("contribute.searchLanguage")}
                    placeholderTextColor="#9ca3af"
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    className="ml-2 flex-1 py-3 text-sm text-neutral-900 dark:text-white"
                  />
                  {langSearch.length > 0 && (
                    <Pressable onPress={() => setLangSearch("")} hitSlop={8}>
                      <IconSymbol name="xmark.circle.fill" size={16} color="#9ca3af" />
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
                      className="mt-1 mb-4 flex-row items-center rounded-xl border-2 border-dashed border-violet-300 p-4 active:opacity-70 dark:border-violet-700"
                    >
                      <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
                        <IconSymbol name="plus.circle" size={20} color="#8b5cf6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                          {t("contribute.useCustomLanguage", { name: customName })}
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color="#8b5cf6" />
                    </Pressable>
                  );

                  if (filtered.length === 0) {
                    return (
                      <View>
                        <View className="mb-4 items-center py-6">
                          <IconSymbol name="magnifyingglass" size={32} color="#d1d5db" />
                          <Text className="mt-2 text-sm text-neutral-400 dark:text-neutral-500">
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
                          className={`mb-3 flex-row items-center rounded-xl border-2 p-4 ${
                            selectedLanguage === lang.id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-neutral-200 dark:border-neutral-700"
                          }`}
                        >
                          <View className="flex-1">
                            <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                              {lang.name}
                            </Text>
                            <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                              {lang.nativeName} · {lang.region}
                            </Text>
                          </View>
                          <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                        </Pressable>
                      ))}
                      {customLangButton}
                    </View>
                  );
                })()}
              </View>
            )}

            {/* Step 2: Word/Phrase Entry */}
            {step === "entry" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  {t("contribute.enterWord")}
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  {t("contribute.enterWordDesc")}
                </Text>

                {/* Bounty banner */}
                {activeBounty && (
                  <Pressable
                    onPress={() => router.push("/bounties")}
                    className="mb-4 rounded-xl bg-amber-50 px-4 py-3 active:opacity-80 dark:bg-amber-950"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        {t("contribute.activeBountyBanner", { xp: activeBounty.xpReward })}
                      </Text>
                      <Text className="text-xs text-amber-500 dark:text-amber-400">
                        {activeBounty.currentCount}/{activeBounty.targetCount}
                      </Text>
                    </View>
                    <Text className="mt-0.5 text-sm font-medium text-neutral-700 dark:text-neutral-300" numberOfLines={1}>
                      {activeBounty.title}
                    </Text>
                  </Pressable>
                )}

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t("contribute.wordPhrase")}
                </Text>
                <TextInput
                  value={word}
                  onChangeText={setWord}
                  placeholder="e.g. Baid\u1EB9"
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  autoFocus
                />

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t("dictionaryPage.fieldEnglish")}
                </Text>
                <TextInput
                  value={english}
                  onChangeText={setEnglish}
                  placeholder="e.g. Good morning"
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t("dictionaryPage.fieldCategory")}
                </Text>
                <View className="mb-4 flex-row flex-wrap gap-2">
                  {ALL_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className={`rounded-lg px-3 py-2 ${
                        category === cat
                          ? "bg-blue-500"
                          : "bg-neutral-100 dark:bg-neutral-800"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          category === cat
                            ? "text-white"
                            : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Step 3: Optional Details */}
            {step === "details" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  {t("contribute.additionalDetails")}
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  {t("contribute.additionalDetailsDesc")}
                </Text>

                {/* Summary card */}
                <View className="mb-4 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950">
                  <Text className="text-lg font-bold text-neutral-900 dark:text-white">
                    {word}
                  </Text>
                  <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                    {english}
                  </Text>
                  <Text className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    {category ? CATEGORY_LABELS[category] : ""}
                  </Text>
                </View>

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t("dictionaryPage.fieldPronunciation")}
                </Text>
                <TextInput
                  value={pronunciation}
                  onChangeText={setPronunciation}
                  placeholder="e.g. bah-ee-DEH"
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t("dictionaryPage.fieldExample")}
                </Text>
                <TextInput
                  value={example}
                  onChangeText={setExample}
                  placeholder="An example sentence using this word..."
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t("dictionaryPage.fieldExampleTranslation")}
                </Text>
                <TextInput
                  value={exampleTranslation}
                  onChangeText={setExampleTranslation}
                  placeholder="English translation of the example..."
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />

                {/* Audio recording */}
                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t("contribute.audioPronunciation")}
                </Text>
                <View className="mb-4 items-center rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  {recordingUri ? (
                    <View className="items-center">
                      <Pressable
                        onPress={isPlaying ? stopPlayback : playRecording}
                        className={`h-16 w-16 items-center justify-center rounded-full ${
                          isPlaying ? "bg-blue-500" : "bg-emerald-100 dark:bg-emerald-900"
                        }`}
                      >
                        <IconSymbol
                          name={isPlaying ? "stop.fill" : "play.fill"}
                          size={24}
                          color={isPlaying ? "#fff" : "#10b981"}
                        />
                      </Pressable>
                      <Text className="mt-2 text-sm text-green-600 dark:text-green-400">
                        {t("contribute.recordingSaved")}
                      </Text>
                      <Pressable
                        onPress={() => discardRecording()}
                        className="mt-2 rounded-lg bg-neutral-200 px-4 py-2 dark:bg-neutral-700"
                      >
                        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t("contribute.reRecord")}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={isRecording ? stopRecording : startRecording}
                      className={`h-16 w-16 items-center justify-center rounded-full ${
                        isRecording ? "bg-red-500" : "bg-red-100 dark:bg-red-900"
                      }`}
                    >
                      {isRecording ? (
                        <View className="h-6 w-6 rounded-sm bg-white" />
                      ) : (
                        <IconSymbol name="mic.fill" size={24} color="#ef4444" />
                      )}
                    </Pressable>
                  )}
                  {isRecording && (
                    <Text className="mt-2 text-sm text-red-500">
                      {t("contribute.recordingTapToStop")}
                    </Text>
                  )}
                  {!recordingUri && !isRecording && (
                    <Text className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                      {t("contribute.recordingHint")}
                    </Text>
                  )}
                </View>

              {/* Image */}
              <Text className="mb-1.5 mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t("contribute.imagePicker")}
              </Text>
              {imageUri ? (
                <View className="mb-4 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <Image source={{ uri: imageUri }} className="h-44 w-full" resizeMode="cover" />
                  <Pressable
                    onPress={handlePickImage}
                    className="flex-row items-center justify-center gap-2 py-2.5"
                  >
                    <IconSymbol name="photo" size={15} color="#3b82f6" />
                    <Text className="text-sm font-medium text-blue-500">
                      {t("contribute.changeImage")}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={handlePickImage}
                  className="mb-4 items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-6 dark:border-neutral-600"
                >
                  <IconSymbol name="photo.badge.plus" size={28} color="#9ca3af" />
                  <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                    {t("contribute.imageHint")}
                  </Text>
                </Pressable>
              )}
            </View>
            )}
          </ScrollView>

          {/* Bottom actions */}
          {step !== "type" && (
            <View className="border-t border-neutral-200 px-5 py-4 dark:border-neutral-700">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    if (step === "language") setStep("type");
                    else if (step === "entry") setStep("language");
                    else if (step === "details") setStep("entry");
                  }}
                  className="flex-1 items-center rounded-xl bg-neutral-100 py-3.5 dark:bg-neutral-800"
                >
                  <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {t("common.back")}
                  </Text>
                </Pressable>
                {step === "entry" && (
                  <Pressable
                    onPress={() => {
                      if (word.trim() && english.trim() && category) setStep("details");
                    }}
                    disabled={!word.trim() || !english.trim() || !category}
                    className={`flex-1 items-center rounded-xl py-3.5 ${
                      word.trim() && english.trim() && category
                        ? "bg-blue-500"
                        : "bg-blue-300 dark:bg-blue-800"
                    }`}
                  >
                    <Text className="font-semibold text-white">{t("common.next")}</Text>
                  </Pressable>
                )}
                {step === "details" && (
                  <Pressable
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    className={`flex-1 items-center rounded-xl py-3.5 ${
                      canSubmit ? "bg-blue-500" : "bg-blue-300 dark:bg-blue-800"
                    }`}
                  >
                    <Text className="font-semibold text-white">
                      {submitContribution.isPending ? t("contribute.submitting") : t("common.submit")}
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
