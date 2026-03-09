import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useContributionStore } from "@/store/contribution-store";
import { useSubmitContribution } from "@/lib/hooks/use-contributions";
import { LANGUAGES } from "@/lib/mock-data";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  type DictionaryCategory,
} from "@/lib/dictionary";

type Step = "type" | "language" | "entry" | "details";

export default function ContributeScreen() {
  const router = useRouter();
  const {
    isRecording,
    recordingUri,
    startRecording,
    stopRecording,
    discardRecording,
  } = useContributionStore();
  const submitContribution = useSubmitContribution();

  const [step, setStep] = useState<Step>("type");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [word, setWord] = useState("");
  const [english, setEnglish] = useState("");
  const [category, setCategory] = useState<DictionaryCategory | null>(null);
  const [pronunciation, setPronunciation] = useState("");
  const [example, setExample] = useState("");
  const [exampleTranslation, setExampleTranslation] = useState("");

  const isPhrase = word.trim().includes(" ");

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
      },
      {
        onSuccess: () => {
          Alert.alert("Submitted!", "Your contribution has been submitted for review.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (err) => {
          console.error("Contribution submit error:", err);
          Alert.alert("Error", err.message || "Failed to submit contribution. Please try again.");
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
      <Stack.Screen options={{ title: "Contribute", presentation: "modal" }} />
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
                  Contribute
                </Text>
                <Text className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                  Help preserve and grow language resources
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
                        Word or Phrase
                      </Text>
                      <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                        Add a dictionary entry with translation, pronunciation, and audio
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
                        Bulk Words
                      </Text>
                      <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                        Add many words or phrases at once in a fast table view
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
                        Full Lesson
                      </Text>
                      <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                        Upload lesson audio with a timed transcript for learners
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#a855f7" />
                  </View>
                </Pressable>
              </View>
            )}

            {/* Step 1: Language */}
            {step === "language" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  Select a language
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  Which language are you contributing to?
                </Text>

                {LANGUAGES.map((lang) => (
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
              </View>
            )}

            {/* Step 2: Word/Phrase Entry */}
            {step === "entry" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  Enter the word or phrase
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  Add a word in the selected language with its English translation
                </Text>

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Word / Phrase
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
                  English Translation
                </Text>
                <TextInput
                  value={english}
                  onChangeText={setEnglish}
                  placeholder="e.g. Good morning"
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Category
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
                  Additional details
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  Optional — add pronunciation, examples, or audio
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
                  Pronunciation Guide
                </Text>
                <TextInput
                  value={pronunciation}
                  onChangeText={setPronunciation}
                  placeholder="e.g. bah-ee-DEH"
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Example Sentence
                </Text>
                <TextInput
                  value={example}
                  onChangeText={setExample}
                  placeholder="An example sentence using this word..."
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Example Translation
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
                  Audio Pronunciation
                </Text>
                <View className="mb-4 items-center rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  {recordingUri ? (
                    <View className="items-center">
                      <IconSymbol name="checkmark.circle.fill" size={32} color="#22c55e" />
                      <Text className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Recording saved
                      </Text>
                      <Pressable
                        onPress={() => discardRecording()}
                        className="mt-2 rounded-lg bg-neutral-200 px-4 py-2 dark:bg-neutral-700"
                      >
                        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Re-record
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
                      Recording... Tap to stop
                    </Text>
                  )}
                  {!recordingUri && !isRecording && (
                    <Text className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                      Optional — tap to record pronunciation
                    </Text>
                  )}
                </View>
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
                    Back
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
                    <Text className="font-semibold text-white">Next</Text>
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
                      {submitContribution.isPending ? "Submitting..." : "Submit"}
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
