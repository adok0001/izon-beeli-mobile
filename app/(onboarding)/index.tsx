import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import { Audio } from "expo-av";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LANGUAGES } from "@/lib/mock-data";
import { useLanguageStore } from "@/store/language-store";
import { apiFetch } from "@/lib/api";
import { hapticSuccess } from "@/lib/haptics";
import { playCorrectSound } from "@/lib/sounds";

export const ONBOARDING_KEY = "onboarding-completed-v1";

type DailyGoal = "casual" | "steady" | "intensive";
type Step = "language" | "tryit" | "goal";

const GOAL_OPTIONS: { id: DailyGoal; label: string; detail: string; icon: string }[] = [
  { id: "casual", label: "Casual", detail: "5 min / day", icon: "leaf.fill" },
  { id: "steady", label: "Steady", detail: "10 min / day", icon: "flame.fill" },
  { id: "intensive", label: "Intensive", detail: "20 min / day", icon: "bolt.fill" },
];

interface DictionaryEntry {
  id: string;
  word: string;
  english: string;
  pronunciation?: string;
  audioUrl?: string;
}

function stepIndex(step: Step): number {
  return { language: 0, tryit: 1, goal: 2 }[step];
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { setLanguage } = useLanguageStore();

  const [step, setStep] = useState<Step>("language");
  const [selectedLangId, setSelectedLangId] = useState("izon");
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal>("steady");
  const [saving, setSaving] = useState(false);

  // Tryit step state
  const [tryItEntry, setTryItEntry] = useState<DictionaryEntry | null>(null);
  const [tryItLoading, setTryItLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const handleLanguageContinue = async () => {
    setTryItLoading(true);
    setRevealed(false);
    setTryItEntry(null);
    try {
      const entry = await apiFetch<DictionaryEntry[]>(
        `/dictionary?languageId=${selectedLangId}&limit=1`
      );
      setTryItEntry(entry[0] ?? null);
    } catch {
      setTryItEntry(null);
    } finally {
      setTryItLoading(false);
    }
    // Skip tryit if no entry
    setStep("tryit");
  };

  const handlePlayAudio = async () => {
    if (!tryItEntry?.audioUrl) return;
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: tryItEntry.audioUrl },
          { shouldPlay: true }
        );
        soundRef.current = sound;
      }
    } catch {
      // Ignore audio errors
    }
  };

  const handleReveal = () => {
    setRevealed(true);
    hapticSuccess();
    playCorrectSound().catch(() => {});
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      setLanguage(selectedLangId);
      const token = await getToken();
      if (token) {
        await apiFetch("/users/me", {
          method: "PATCH",
          token,
          body: JSON.stringify({
            selectedLanguageId: selectedLangId,
            dailyGoal: selectedGoal,
          }),
        }).catch(() => {});
      }
      await AsyncStorage.setItem(ONBOARDING_KEY, "1");
      router.replace("/(tabs)/learn");
    } catch {
      await AsyncStorage.setItem(ONBOARDING_KEY, "1");
      router.replace("/(tabs)/learn");
    } finally {
      setSaving(false);
    }
  };

  const currentStepIndex = stepIndex(step);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top", "bottom"]}>
      {/* Progress dots */}
      <View className="flex-row items-center justify-center gap-2 pt-4">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className={`h-2 w-8 rounded-full ${
              i <= currentStepIndex ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          />
        ))}
      </View>

      {step === "language" ? (
        <>
          <View className="px-6 pt-8 pb-4">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              Welcome to{"\n"}Izon Beeli
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
              Which language would you like to learn first?
            </Text>
          </View>

          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {LANGUAGES.map((lang) => {
              const selected = lang.id === selectedLangId;
              return (
                <Pressable
                  key={lang.id}
                  onPress={() => setSelectedLangId(lang.id)}
                  className={`mb-2 flex-row items-center rounded-xl border-2 px-4 py-3.5 active:opacity-70 ${
                    selected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className={`text-base font-semibold ${
                        selected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-neutral-900 dark:text-white"
                      }`}
                    >
                      {lang.name}
                    </Text>
                    <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                      {lang.nativeName} · {lang.region}
                    </Text>
                  </View>
                  {selected && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={22}
                      color="#3b82f6"
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="px-6 pb-6 pt-2">
            <Pressable
              onPress={handleLanguageContinue}
              disabled={tryItLoading}
              className="items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
            >
              {tryItLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">Continue</Text>
              )}
            </Pressable>
          </View>
        </>
      ) : step === "tryit" ? (
        <>
          <View className="px-6 pt-8 pb-6">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              Try a word!
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
              Here&apos;s your first word in{" "}
              {LANGUAGES.find((l) => l.id === selectedLangId)?.name ?? "your language"}.
            </Text>
          </View>

          <View className="flex-1 px-6 items-center justify-center">
            {tryItEntry ? (
              <View className="w-full items-center gap-4">
                <Text className="text-5xl font-bold text-neutral-900 dark:text-white text-center">
                  {tryItEntry.word}
                </Text>
                {tryItEntry.pronunciation && (
                  <Text className="text-lg text-neutral-500 dark:text-neutral-400">
                    /{tryItEntry.pronunciation}/
                  </Text>
                )}

                {tryItEntry.audioUrl && (
                  <Pressable
                    onPress={handlePlayAudio}
                    className="flex-row items-center gap-2 rounded-full bg-blue-100 px-6 py-3 active:opacity-70 dark:bg-blue-900"
                  >
                    <IconSymbol name="speaker.wave.2.fill" size={18} color="#3b82f6" />
                    <Text className="font-semibold text-blue-600 dark:text-blue-400">
                      Tap to hear
                    </Text>
                  </Pressable>
                )}

                <View className="w-full items-center mt-4">
                  {revealed ? (
                    <View className="items-center gap-2">
                      <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {tryItEntry.english}
                      </Text>
                      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                        English translation
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleReveal}
                      className="rounded-xl bg-neutral-100 px-8 py-3 active:opacity-70 dark:bg-neutral-800"
                    >
                      <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
                        Reveal translation
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              <View className="items-center gap-3">
                <IconSymbol name="book.fill" size={48} color="#d1d5db" />
                <Text className="text-center text-neutral-400 dark:text-neutral-500">
                  No word available yet for this language.
                </Text>
              </View>
            )}
          </View>

          <View className="px-6 pb-6 pt-2 gap-3">
            <Pressable
              onPress={() => setStep("goal")}
              className="items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
            >
              <Text className="text-base font-bold text-white">Continue</Text>
            </Pressable>
            <Pressable
              onPress={() => setStep("language")}
              className="items-center py-2"
            >
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">Back</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View className="px-6 pt-8 pb-6">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              Set your daily goal
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
              How much time can you dedicate each day?
            </Text>
          </View>

          <View className="flex-1 px-6 gap-3">
            {GOAL_OPTIONS.map((opt) => {
              const selected = opt.id === selectedGoal;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelectedGoal(opt.id)}
                  className={`flex-row items-center rounded-2xl border-2 px-5 py-5 active:opacity-70 ${
                    selected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                  }`}
                >
                  <View
                    className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${
                      selected ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
                    }`}
                  >
                    <IconSymbol
                      name={opt.icon as any}
                      size={22}
                      color={selected ? "#fff" : "#9ca3af"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${
                        selected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-neutral-900 dark:text-white"
                      }`}
                    >
                      {opt.label}
                    </Text>
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                      {opt.detail}
                    </Text>
                  </View>
                  {selected && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={22}
                      color="#3b82f6"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View className="px-6 pb-6 pt-6 gap-3">
            <Pressable
              onPress={handleFinish}
              disabled={saving}
              className="items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Start Learning
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setStep("tryit")}
              className="items-center py-2"
            >
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                Back
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
