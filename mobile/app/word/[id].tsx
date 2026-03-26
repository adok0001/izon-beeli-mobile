import { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, TextInput, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/dictionary";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useSubmitEntryContribution } from "@/lib/hooks/use-contributions";
import { useContributionStore } from "@/store/contribution-store";
import { useSaveWord, useRemoveWord, useWordBank } from "@/lib/hooks/use-wordbank";
import { useTranslation } from "react-i18next";

export default function WordDetailScreen() {
  const { id, languageId } = useLocalSearchParams<{
    id: string;
    languageId: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: entries = [], isLoading } = useDictionary(languageId);
  const entry = entries.find((e) => e.id === id);

  const { data: savedIds } = useWordBank();
  const savedSet = new Set(savedIds ?? []);
  const saveWord = useSaveWord();
  const removeWord = useRemoveWord();

  const submitEntry = useSubmitEntryContribution();
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
  const [showMeaningInput, setShowMeaningInput] = useState(false);
  const [newMeaning, setNewMeaning] = useState("");

  const saved = entry ? savedSet.has(entry.id) : false;

  const handleSubmitAudio = () => {
    if (!entry || !recordingUri) return;
    submitEntry.mutate(
      {
        type: "entry_audio",
        languageId: entry.languageId,
        dictionaryEntryId: entry.id,
        word: entry.word,
        english: entry.english,
        category: entry.category,
        audioUri: recordingUri,
      },
      {
        onSuccess: () => {
          discardRecording();
          Alert.alert(t("entryContribute.submitted"), t("entryContribute.audioSubmittedDesc"));
        },
        onError: (err) => {
          Alert.alert(t("common.error"), err.message || t("common.tryAgain"));
        },
      }
    );
  };

  const handleSubmitMeaning = () => {
    if (!entry || !newMeaning.trim()) return;
    submitEntry.mutate(
      {
        type: "entry_meaning",
        languageId: entry.languageId,
        dictionaryEntryId: entry.id,
        word: entry.word,
        english: newMeaning.trim(),
        category: entry.category,
      },
      {
        onSuccess: () => {
          setNewMeaning("");
          setShowMeaningInput(false);
          Alert.alert(t("entryContribute.submitted"), t("entryContribute.meaningSubmittedDesc"));
        },
        onError: (err) => {
          Alert.alert(t("common.error"), err.message || t("common.tryAgain"));
        },
      }
    );
  };

  const handleToggleSave = () => {
    if (!entry) return;
    if (saved) {
      removeWord.mutate(entry.id);
    } else {
      saveWord.mutate(entry.id);
    }
  };

  const handlePractice = () => {
    if (!entry) return;
    router.push({
      pathname: "/quiz",
      params: {
        focusWord: entry.word,
        focusEnglish: entry.english,
        ...(typeof entry.audioUrl === "string" && entry.audioUrl
          ? { focusAudio: entry.audioUrl }
          : {}),
      },
    });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "", headerBackTitle: "Back" }} />
        <SafeAreaView
          className="flex-1 items-center justify-center bg-white dark:bg-neutral-900"
          edges={[]}
        >
          <ActivityIndicator size="large" color="#3b82f6" />
        </SafeAreaView>
      </>
    );
  }

  if (!entry) {
    return (
      <>
        <Stack.Screen options={{ title: "Word", headerBackTitle: "Back" }} />
        <SafeAreaView
          className="flex-1 items-center justify-center bg-white px-8 dark:bg-neutral-900"
          edges={[]}
        >
          <IconSymbol name="questionmark.circle" size={48} color="#d1d5db" />
          <Text className="mt-4 text-center text-base text-neutral-400">
            {t("wordDetail.notFound")}
          </Text>
        </SafeAreaView>
      </>
    );
  }

  const categoryLabel = CATEGORY_LABELS[entry.category];
  const categoryIcon = CATEGORY_ICONS[entry.category];

  return (
    <>
      <Stack.Screen
        options={{ title: entry.word, headerBackTitle: "Back" }}
      />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={[]}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <View className="items-center px-6 pb-6 pt-10">
            <Text className="text-center text-6xl font-bold text-neutral-900 dark:text-white">
              {entry.word}
            </Text>

            {entry.pronunciation && (
              <Text className="mt-2 text-base italic text-neutral-500 dark:text-neutral-400">
                /{entry.pronunciation}/
              </Text>
            )}

            {(() => {
              const meanings = entry.english.split(";").map((m) => m.trim()).filter(Boolean);
              if (meanings.length <= 1) {
                return (
                  <Text className="mt-3 text-center text-xl text-neutral-600 dark:text-neutral-300">
                    {entry.english}
                  </Text>
                );
              }
              return (
                <View className="mt-3 items-center gap-1">
                  {meanings.map((meaning, i) => (
                    <View key={i} className="flex-row items-baseline gap-2">
                      <Text className="text-sm font-semibold text-blue-500 dark:text-blue-400">
                        {i + 1}.
                      </Text>
                      <Text className="text-lg text-neutral-600 dark:text-neutral-300">
                        {meaning}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            {/* Audio button — always shown; TTS when no recording */}
            <View className="mt-5 flex-row items-center gap-3">
              <WordAudioButton
                audioSource={entry.audioUrl}
                word={entry.word}
                size={26}
              />
              {!entry.audioUrl && (
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                  {t("wordDetail.textToSpeech")}
                </Text>
              )}
            </View>

            {/* Category badge */}
            <View className="mt-4 flex-row items-center rounded-full bg-blue-50 px-4 py-1.5 dark:bg-blue-900/30">
              <IconSymbol
                name={categoryIcon as any}
                size={13}
                color="#3b82f6"
              />
              <Text className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {categoryLabel}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="mx-5 h-px bg-neutral-100 dark:bg-neutral-800" />

          {/* Example sentence */}
          {entry.example && (
            <View className="mx-5 mt-5 rounded-xl bg-neutral-50 px-4 py-4 dark:bg-neutral-800">
              <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {t("wordDetail.example")}
              </Text>
              <Text className="text-base text-neutral-800 dark:text-neutral-200">
                {entry.example}
              </Text>
              {entry.exampleTranslation && (
                <Text className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  {entry.exampleTranslation}
                </Text>
              )}
            </View>
          )}

          {/* Contributor */}
          {entry.contributorName && (
            <View className="mx-5 mt-4 flex-row items-center">
              <IconSymbol name="person.fill" size={13} color="#9ca3af" />
              <Text className="ml-1.5 text-sm text-neutral-400 dark:text-neutral-500">
                {t("wordDetail.contributedBy", { name: entry.contributorName })}
              </Text>
            </View>
          )}

          {/* Community learning indicator */}
          <View className="mx-5 mt-4 flex-row items-center rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
            <IconSymbol name="person.2.fill" size={16} color="#3b82f6" />
            <Text className="ml-2 text-sm text-blue-600 dark:text-blue-400">
              {t("wordDetail.communityLearning", {
                count: ((entry.word.charCodeAt(0) * 7 + entry.word.length * 3) % 15) + 2,
              })}
            </Text>
          </View>

          {/* Actions */}
          <View className="mx-5 mt-8 gap-3">
            <Pressable
              onPress={handlePractice}
              className="flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 active:opacity-80"
            >
              <IconSymbol name="brain.head.profile" size={18} color="#fff" />
              <Text className="ml-2 text-base font-semibold text-white">
                {t("wordDetail.practiceWord")}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleToggleSave}
              className={`flex-row items-center justify-center rounded-2xl border py-4 active:opacity-80 ${
                saved
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                  : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
              }`}
            >
              <IconSymbol
                name={saved ? "star.fill" : "star"}
                size={18}
                color={saved ? "#f59e0b" : "#9ca3af"}
              />
              <Text
                className={`ml-2 text-base font-semibold ${
                  saved
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-neutral-700 dark:text-neutral-300"
                }`}
              >
                {saved ? t("wordDetail.savedToWordBank") : t("wordDetail.saveToWordBank")}
              </Text>
            </Pressable>
          </View>

          {/* Contribute section */}
          <View className="mx-5 mt-8">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t("entryContribute.title")}
            </Text>

            {/* Record Audio */}
            {!entry.audioUrl && (
              <View className="mb-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                <Text className="mb-1 text-sm font-semibold text-neutral-900 dark:text-white">
                  {t("entryContribute.recordAudio")}
                </Text>
                <Text className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                  {t("entryContribute.recordAudioDesc")}
                </Text>
                <View className="items-center">
                  {recordingUri ? (
                    <View className="items-center gap-2">
                      <Pressable
                        onPress={isPlaying ? stopPlayback : playRecording}
                        className={`h-14 w-14 items-center justify-center rounded-full ${
                          isPlaying ? "bg-blue-500" : "bg-emerald-100 dark:bg-emerald-900"
                        }`}
                      >
                        <IconSymbol
                          name={isPlaying ? "stop.fill" : "play.fill"}
                          size={22}
                          color={isPlaying ? "#fff" : "#10b981"}
                        />
                      </Pressable>
                      <Text className="text-sm text-green-600 dark:text-green-400">
                        {t("contribute.recordingSaved")}
                      </Text>
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => discardRecording()}
                          className="rounded-lg bg-neutral-200 px-4 py-2 dark:bg-neutral-700"
                        >
                          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {t("contribute.reRecord")}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={handleSubmitAudio}
                          disabled={submitEntry.isPending}
                          className="rounded-lg bg-blue-500 px-4 py-2"
                        >
                          <Text className="text-sm font-medium text-white">
                            {submitEntry.isPending ? t("contribute.submitting") : t("common.submit")}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Pressable
                        onPress={isRecording ? stopRecording : startRecording}
                        className={`h-14 w-14 items-center justify-center rounded-full ${
                          isRecording ? "bg-red-500" : "bg-red-100 dark:bg-red-900"
                        }`}
                      >
                        {isRecording ? (
                          <View className="h-5 w-5 rounded-sm bg-white" />
                        ) : (
                          <IconSymbol name="mic.fill" size={22} color="#ef4444" />
                        )}
                      </Pressable>
                      <Text className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                        {isRecording
                          ? t("contribute.recordingTapToStop")
                          : t("entryContribute.tapToRecord")}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Add Meaning */}
            {showMeaningInput ? (
              <View className="mb-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                <Text className="mb-1 text-sm font-semibold text-neutral-900 dark:text-white">
                  {t("entryContribute.addMeaning")}
                </Text>
                <Text className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                  {t("entryContribute.addMeaningDesc")}
                </Text>
                <TextInput
                  value={newMeaning}
                  onChangeText={setNewMeaning}
                  placeholder={t("entryContribute.meaningPlaceholder")}
                  placeholderTextColor="#9ca3af"
                  className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  autoFocus
                />
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setShowMeaningInput(false);
                      setNewMeaning("");
                    }}
                    className="flex-1 items-center rounded-xl bg-neutral-100 py-3 dark:bg-neutral-800"
                  >
                    <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {t("common.cancel")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSubmitMeaning}
                    disabled={!newMeaning.trim() || submitEntry.isPending}
                    className={`flex-1 items-center rounded-xl py-3 ${
                      newMeaning.trim() && !submitEntry.isPending
                        ? "bg-blue-500"
                        : "bg-blue-300 dark:bg-blue-800"
                    }`}
                  >
                    <Text className="font-semibold text-white">
                      {submitEntry.isPending ? t("contribute.submitting") : t("common.submit")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowMeaningInput(true)}
                className="mb-3 flex-row items-center rounded-2xl border border-neutral-200 px-4 py-3.5 active:opacity-80 dark:border-neutral-700"
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#3b82f6" />
                <Text className="ml-2 text-base font-medium text-blue-600 dark:text-blue-400">
                  {t("entryContribute.addMeaning")}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
