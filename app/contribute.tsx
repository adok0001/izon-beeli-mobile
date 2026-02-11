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
import { useUser } from "@clerk/clerk-expo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useContributionStore } from "@/store/contribution-store";
import { useFeedStore } from "@/store/feed-store";
import { LANGUAGES, formatDuration } from "@/lib/mock-data";
import type { ContributionType } from "@/types";

type Step = "type" | "language" | "record" | "details";

const CONTRIBUTION_TYPES: { type: ContributionType; label: string; icon: string; desc: string }[] = [
  { type: "audio", label: "Audio Recording", icon: "headphones", desc: "Record a phrase, story, or pronunciation guide" },
  { type: "text", label: "Text Content", icon: "pencil.and.list.clipboard", desc: "Write a story, phrase list, or lesson content" },
  { type: "translation", label: "Translation", icon: "book.fill", desc: "Translate existing content into another language" },
];

export default function ContributeScreen() {
  const router = useRouter();
  const {
    isRecording,
    recordingDuration,
    recordingUri,
    startRecording,
    stopRecording,
    discardRecording,
    addContribution,
  } = useContributionStore();
  const { addContribution: addFeedContribution } = useFeedStore();
  const { user } = useUser();

  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<ContributionType | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [textContent, setTextContent] = useState("");

  const handleSubmit = () => {
    if (!selectedType || !selectedLanguage || !title.trim()) return;

    addContribution(
      selectedType,
      selectedLanguage,
      title.trim(),
      description.trim(),
      selectedType === "audio" ? recordingUri ?? undefined : undefined,
      selectedType !== "audio" ? textContent.trim() || undefined : undefined
    );

    const userName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName.charAt(0)}.`
        : user?.firstName ?? "You";

    addFeedContribution(
      title.trim(),
      description.trim(),
      userName,
      selectedType === "audio" ? recordingUri ?? undefined : undefined
    );

    Alert.alert("Submitted!", "Your contribution has been submitted for review.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const canSubmit =
    selectedType &&
    selectedLanguage &&
    title.trim() &&
    (selectedType === "audio" ? !!recordingUri : true);

  return (
    <>
      <Stack.Screen options={{ title: "Contribute", presentation: "modal" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Progress bar */}
          <View className="flex-row px-5 pt-2">
            {(["type", "language", "record", "details"] as Step[]).map((s, i) => (
              <View
                key={s}
                className={`mr-1 h-1 flex-1 rounded-full ${
                  (["type", "language", "record", "details"] as Step[]).indexOf(step) >= i
                    ? "bg-blue-500"
                    : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              />
            ))}
          </View>

          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
            {/* Step 1: Type */}
            {step === "type" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  What would you like to contribute?
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  Choose the type of content you want to share
                </Text>

                {CONTRIBUTION_TYPES.map((ct) => (
                  <Pressable
                    key={ct.type}
                    onPress={() => {
                      setSelectedType(ct.type);
                      setStep("language");
                    }}
                    className={`mb-3 flex-row items-center rounded-xl border-2 p-4 ${
                      selectedType === ct.type
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <IconSymbol name={ct.icon as any} size={24} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                        {ct.label}
                      </Text>
                      <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {ct.desc}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Step 2: Language */}
            {step === "language" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  Select a language
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  Which language is this contribution for?
                </Text>

                {LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang.id}
                    onPress={() => {
                      setSelectedLanguage(lang.id);
                      setStep(selectedType === "audio" ? "record" : "details");
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

            {/* Step 3: Record (audio only) */}
            {step === "record" && selectedType === "audio" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  Record your audio
                </Text>
                <Text className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
                  Tap the microphone to start recording
                </Text>

                <View className="items-center py-8">
                  {/* Timer */}
                  <Text className="mb-6 text-4xl font-light text-neutral-900 dark:text-white">
                    {formatDuration(recordingDuration)}
                  </Text>

                  {/* Record button */}
                  {recordingUri ? (
                    <View className="items-center">
                      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <IconSymbol name="checkmark.circle.fill" size={40} color="#22c55e" />
                      </View>
                      <Text className="mb-6 text-sm text-green-600 dark:text-green-400">
                        Recording saved ({formatDuration(recordingDuration)})
                      </Text>
                      <View className="flex-row gap-4">
                        <Pressable
                          onPress={() => {
                            discardRecording();
                          }}
                          className="rounded-lg bg-neutral-200 px-5 py-2.5 dark:bg-neutral-700"
                        >
                          <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
                            Re-record
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setStep("details")}
                          className="rounded-lg bg-blue-500 px-5 py-2.5"
                        >
                          <Text className="font-semibold text-white">Next</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onPress={isRecording ? stopRecording : startRecording}
                      className={`h-20 w-20 items-center justify-center rounded-full ${
                        isRecording ? "bg-red-500" : "bg-red-100 dark:bg-red-900"
                      }`}
                    >
                      {isRecording ? (
                        <View className="h-8 w-8 rounded-sm bg-white" />
                      ) : (
                        <View className="h-8 w-8 rounded-full bg-red-500" />
                      )}
                    </Pressable>
                  )}

                  {isRecording && (
                    <Text className="mt-4 text-sm text-red-500">
                      Recording... Tap to stop
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Step 4: Details */}
            {step === "details" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  Add details
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  Give your contribution a title and description
                </Text>

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Common Izon greetings"
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />

                <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Description
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe what this contribution contains..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  style={{ minHeight: 80 }}
                />

                {/* Text content field for text/translation types */}
                {selectedType !== "audio" && (
                  <>
                    <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {selectedType === "translation" ? "Translation" : "Content"}
                    </Text>
                    <TextInput
                      value={textContent}
                      onChangeText={setTextContent}
                      placeholder={
                        selectedType === "translation"
                          ? "Enter your translation..."
                          : "Write your content here..."
                      }
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      style={{ minHeight: 140 }}
                    />
                  </>
                )}

                {/* Audio preview */}
                {selectedType === "audio" && recordingUri && (
                  <View className="mb-4 flex-row items-center rounded-xl bg-green-50 p-3 dark:bg-green-950">
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#22c55e" />
                    <Text className="ml-2 text-sm text-green-700 dark:text-green-300">
                      Audio recording attached ({formatDuration(recordingDuration)})
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Bottom actions */}
          <View className="border-t border-neutral-200 px-5 py-4 dark:border-neutral-700">
            <View className="flex-row gap-3">
              {step !== "type" && (
                <Pressable
                  onPress={() => {
                    if (step === "language") setStep("type");
                    else if (step === "record") setStep("language");
                    else if (step === "details")
                      setStep(selectedType === "audio" ? "record" : "language");
                  }}
                  className="flex-1 items-center rounded-xl bg-neutral-100 py-3.5 dark:bg-neutral-800"
                >
                  <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Back
                  </Text>
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
                  <Text className="font-semibold text-white">Submit</Text>
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
