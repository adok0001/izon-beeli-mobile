import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/dictionary";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useSaveWord, useRemoveWord, useWordBank } from "@/lib/hooks/use-wordbank";

export default function WordDetailScreen() {
  const { id, languageId } = useLocalSearchParams<{
    id: string;
    languageId: string;
  }>();
  const router = useRouter();

  const { data: entries = [], isLoading } = useDictionary(languageId);
  const entry = entries.find((e) => e.id === id);

  const { data: savedIds } = useWordBank();
  const savedSet = new Set(savedIds ?? []);
  const saveWord = useSaveWord();
  const removeWord = useRemoveWord();

  const saved = entry ? savedSet.has(entry.id) : false;

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
            Word not found.
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

            <Text className="mt-3 text-center text-xl text-neutral-600 dark:text-neutral-300">
              {entry.english}
            </Text>

            {/* Audio button — always shown; TTS when no recording */}
            <View className="mt-5 flex-row items-center gap-3">
              <WordAudioButton
                audioSource={entry.audioUrl}
                word={entry.word}
                size={26}
              />
              {!entry.audioUrl && (
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                  Text-to-speech
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
                Example
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
                Contributed by {entry.contributorName}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View className="mx-5 mt-8 gap-3">
            <Pressable
              onPress={handlePractice}
              className="flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 active:opacity-80"
            >
              <IconSymbol name="brain.head.profile" size={18} color="#fff" />
              <Text className="ml-2 text-base font-semibold text-white">
                Practice this word
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
                {saved ? "Saved to Word Bank" : "Save to Word Bank"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
