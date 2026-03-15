import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiFetch } from "@/lib/api";
import { hapticSuccess } from "@/lib/haptics";
import { ACTIVE_LANGUAGES } from "@/lib/mock-data";
import { playCorrectSound } from "@/lib/sounds";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export const ONBOARDING_KEY = "onboarding-completed-v2";

type DailyGoal = "casual" | "steady" | "intensive";
type Step = "language" | "tryit" | "goal" | "ready";

const ALL_STEPS: Step[] = ["language", "tryit", "goal", "ready"];
const TOTAL_STEPS = ALL_STEPS.length;

const GOAL_OPTIONS: { id: DailyGoal; icon: string }[] = [
  { id: "casual", icon: "leaf.fill" },
  { id: "steady", icon: "flame.fill" },
  { id: "intensive", icon: "bolt.fill" },
];

const GOAL_LABEL_KEYS: Record<DailyGoal, "onboarding.goalCasual" | "onboarding.goalSteady" | "onboarding.goalIntensive"> = {
  casual: "onboarding.goalCasual",
  steady: "onboarding.goalSteady",
  intensive: "onboarding.goalIntensive",
};

const GOAL_DETAIL_KEYS: Record<
  DailyGoal,
  | "onboarding.goalCasualDetail"
  | "onboarding.goalSteadyDetail"
  | "onboarding.goalIntensiveDetail"
> = {
  casual: "onboarding.goalCasualDetail",
  steady: "onboarding.goalSteadyDetail",
  intensive: "onboarding.goalIntensiveDetail",
};

interface DictionaryEntry {
  id: string;
  word: string;
  english: string;
  pronunciation?: string;
  audioUrl?: string;
}

function stepIndex(step: Step): number {
  return ALL_STEPS.indexOf(step);
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { setLanguage } = useLanguageStore();

  const [step, setStep] = useState<Step>("language");
  const [selectedLangId, setSelectedLangId] = useState("izon");
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal>("steady");
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  // Tryit step state
  const [tryItEntry, setTryItEntry] = useState<DictionaryEntry | null>(null);
  const [tryItLoading, setTryItLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const currentIdx = stepIndex(step);

  const goNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < TOTAL_STEPS) {
      setStep(ALL_STEPS[nextIdx]);
    }
  };

  const goBack = () => {
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) {
      setStep(ALL_STEPS[prevIdx]);
    }
  };

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

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top", "bottom"]}>
      {/* Progress bar */}
      <View className="flex-row items-center justify-center gap-1.5 px-6 pt-4">
        {ALL_STEPS.map((_, i) => (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= currentIdx ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          />
        ))}
      </View>

      {/* ── Step: Language selection ── */}
      {step === "language" && (
        <>
          <View className="px-6 pt-8 pb-4">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              {t("onboarding.welcome")}
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
              {t("onboarding.whichLanguage")}
            </Text>
          </View>

          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {ACTIVE_LANGUAGES.map((lang) => {
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
                <Text className="text-base font-bold text-white">{t("onboarding.continue")}</Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {/* ── Step: Try a word ── */}
      {step === "tryit" && (
        <>
          <View className="px-6 pt-8 pb-6">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              {t("onboarding.tryWord")}
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
              {t("onboarding.firstWordIn")}{" "}
              {ACTIVE_LANGUAGES.find((l) => l.id === selectedLangId)?.name ?? t("onboarding.yourLanguage")}.
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
                      {t("onboarding.tapToHear")}
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
                        {t("onboarding.englishTranslation")}
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleReveal}
                      className="rounded-xl bg-neutral-100 px-8 py-3 active:opacity-70 dark:bg-neutral-800"
                    >
                      <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {t("onboarding.revealTranslation")}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              <View className="items-center gap-3">
                <IconSymbol name="book.fill" size={48} color="#d1d5db" />
                <Text className="text-center text-neutral-400 dark:text-neutral-500">
                  {t("onboarding.noWordYet")}
                </Text>
              </View>
            )}
          </View>

          <View className="px-6 pb-6 pt-2 gap-3">
            <Pressable
              onPress={goNext}
              className="items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
            >
              <Text className="text-base font-bold text-white">{t("onboarding.continue")}</Text>
            </Pressable>
            <Pressable
              onPress={goBack}
              className="items-center py-2"
            >
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t("onboarding.back")}</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ── Step: Daily goal ── */}
      {step === "goal" && (
        <>
          <View className="px-6 pt-8 pb-6">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              {t("onboarding.setGoal")}
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
              {t("onboarding.howMuchTime")}
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
                      {t(GOAL_LABEL_KEYS[opt.id])}
                    </Text>
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t(GOAL_DETAIL_KEYS[opt.id])}
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
              onPress={goNext}
              className="items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
            >
              <Text className="text-base font-bold text-white">{t("onboarding.continue")}</Text>
            </Pressable>
            <Pressable
              onPress={goBack}
              className="items-center py-2"
            >
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {t("onboarding.back")}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ── Step: Ready / Celebration ── */}
      {step === "ready" && (
        <>
          <View className="flex-1 items-center justify-center px-6">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <IconSymbol name="checkmark.seal.fill" size={48} color="#22c55e" />
            </View>
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white text-center">
              {t("onboarding.readyTitle")}
            </Text>
            <Text className="mt-3 text-base text-neutral-500 dark:text-neutral-400 text-center leading-6 px-4">
              {t("onboarding.readySubtitle")}
            </Text>
          </View>

          <View className="px-6 pb-6 pt-4 gap-3">
            <Pressable
              onPress={handleFinish}
              disabled={saving}
              className="items-center rounded-2xl bg-green-500 py-4 active:opacity-80"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">
                  {t("onboarding.letsGo")}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={goBack}
              className="items-center py-2"
            >
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {t("onboarding.back")}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
