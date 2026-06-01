
import { ProgressBar } from "@/components/quiz/progress-bar";
import { QuestionTypeLabel } from "@/components/quiz/question-type-label";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiFetch } from "@/lib/api";
import type { DictionaryEntry } from "@/lib/dictionary";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { ACTIVE_LANGUAGES } from "@/lib/mock-data";
import { generateQuiz } from "@/lib/quiz-engine";
import {
    playCorrectSound,
    playFinishSound,
    playIncorrectSound,
} from "@/lib/sounds";
import { useLanguageStore } from "@/store/language-store";
import { useQuizStore } from "@/store/quiz-store";
import { useTourStore } from "@/store/tour-store";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const ONBOARDING_KEY = "onboarding-completed-v2";

type DailyGoal = "casual" | "steady" | "intensive";
type Step = "language" | "tryit" | "goal" | "ready";

const ALL_STEPS: Step[] = ["language", "tryit", "goal", "ready"];
const TOTAL_STEPS = ALL_STEPS.length;
const FEEDBACK_DELAY = 1200;

const GOAL_OPTIONS: { id: DailyGoal; icon: string }[] = [
  { id: "casual", icon: "leaf.fill" },
  { id: "steady", icon: "flame.fill" },
  { id: "intensive", icon: "bolt.fill" },
];

const GOAL_LABEL_KEYS: Record<DailyGoal, string> = {
  casual: "onboarding.goalCasual",
  steady: "onboarding.goalSteady",
  intensive: "onboarding.goalIntensive",
};

const GOAL_DETAIL_KEYS: Record<DailyGoal, string> = {
  casual: "onboarding.goalCasualDetail",
  steady: "onboarding.goalSteadyDetail",
  intensive: "onboarding.goalIntensiveDetail",
};

function stepIndex(step: Step): number {
  return ALL_STEPS.indexOf(step);
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { setLanguage } = useLanguageStore();
  const showTour = useTourStore((s) => s.showTour);
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("language");
  const [selectedLangId, setSelectedLangId] = useState("izon");
  const [langSearch, setLangSearch] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal>("steady");
  const [saving, setSaving] = useState(false);
  const [tryItLoading, setTryItLoading] = useState(false);
  const [noWords, setNoWords] = useState(false);

  // Quiz store — drives the tryit step
  const { phase, questions, currentIndex, lastAnswerCorrect, startQuiz, answerQuestion, nextQuestion, getResult, reset } = useQuizStore();

  // Local per-question answer state (mirrors quiz.tsx ActiveView pattern)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Reset local lock state when question advances
  useEffect(() => {
    setSelectedAnswer(null);
    setLocked(false);
  }, [currentIndex]);

  // Clean up quiz store when leaving the tryit step
  useEffect(() => {
    if (step !== "tryit") reset();
  }, [step]);

  const currentIdx = stepIndex(step);

  const goNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < TOTAL_STEPS) setStep(ALL_STEPS[nextIdx]);
  };

  const goBack = () => {
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(ALL_STEPS[prevIdx]);
  };

  const handleLanguageContinue = async () => {
    setTryItLoading(true);
    setNoWords(false);
    reset();
    try {
      const entries = await apiFetch<DictionaryEntry[]>(
        `/dictionary?languageId=${selectedLangId}&limit=40`
      );
      const languageName =
        ACTIVE_LANGUAGES.find((l) => l.id === selectedLangId)?.name ?? selectedLangId;
      const questions = generateQuiz(
        { languageId: selectedLangId, questionCount: 5 },
        entries,
        [],
        (key, opts) => t(key as any, { language: languageName, ...opts } as any)
      );
      if (questions.length === 0) {
        setNoWords(true);
      } else {
        startQuiz(questions);
      }
    } catch {
      setNoWords(true);
    } finally {
      setTryItLoading(false);
    }
    setStep("tryit");
  };

  const handleSelect = useCallback(
    (answer: string) => {
      if (locked) return;
      setLocked(true);
      setSelectedAnswer(answer);
      const correct = answerQuestion(answer);
      if (correct) {
        playCorrectSound();
        hapticSuccess();
        if (isLastQuestion) setTimeout(() => playFinishSound(), FEEDBACK_DELAY - 200);
        setTimeout(() => nextQuestion(), FEEDBACK_DELAY);
      } else {
        playIncorrectSound();
        hapticError();
      }
    },
    [locked, answerQuestion, nextQuestion, isLastQuestion]
  );

  const handleContinueAfterWrong = useCallback(() => {
    if (isLastQuestion) playFinishSound();
    nextQuestion();
  }, [nextQuestion, isLastQuestion]);

  const getOptionState = (option: string) => {
    if (!locked) return "default" as const;
    if (option === question?.correctAnswer) return "correct" as const;
    if (option === selectedAnswer) return "incorrect" as const;
    return "dimmed" as const;
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
      showTour("welcome");
      router.replace("/(tabs)/learn");
    } catch {
      await AsyncStorage.setItem(ONBOARDING_KEY, "1");
      showTour("welcome");
      router.replace("/(tabs)/learn");
    } finally {
      setSaving(false);
    }
  };

  const result = phase === "results" ? getResult() : null;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top", "bottom"]}>
      {/* Outer progress bar — onboarding steps */}
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
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-3 flex-row items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 dark:border-neutral-700 dark:bg-neutral-800">
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

            {(langSearch.trim()
              ? ACTIVE_LANGUAGES.filter((l) => {
                  const q = langSearch.toLowerCase();
                  return (
                    l.name.toLowerCase().includes(q) ||
                    l.nativeName?.toLowerCase().includes(q) ||
                    l.region?.toLowerCase().includes(q)
                  );
                })
              : ACTIVE_LANGUAGES
            ).map((lang) => {
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
                        selected ? "text-blue-700 dark:text-blue-300" : "text-neutral-900 dark:text-white"
                      }`}
                    >
                      {lang.name}
                    </Text>
                    <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                      {lang.nativeName} · {lang.region}
                    </Text>
                  </View>
                  {selected && (
                    <IconSymbol name="checkmark.circle.fill" size={22} color="#3b82f6" />
                  )}
                </Pressable>
              );
            })}

            {langSearch.trim().length > 0 && (
              <Pressable
                onPress={() => setSelectedLangId(langSearch.trim())}
                className={`mb-2 flex-row items-center rounded-xl border-2 border-dashed px-4 py-3.5 active:opacity-70 ${
                  selectedLangId === langSearch.trim()
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950"
                    : "border-violet-300 dark:border-violet-700"
                }`}
              >
                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      selectedLangId === langSearch.trim()
                        ? "text-violet-700 dark:text-violet-300"
                        : "text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    {t("contribute.useCustomLanguage", { name: langSearch.trim() })}
                  </Text>
                </View>
                {selectedLangId === langSearch.trim() && (
                  <IconSymbol name="checkmark.circle.fill" size={22} color="#8b5cf6" />
                )}
              </Pressable>
            )}
          </ScrollView>

          <View className="px-6 pb-6 pt-2 gap-3">
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
            <Pressable
              onPress={() => router.push("/reviewer-application")}
              className="flex-row items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500 py-4 active:opacity-80"
            >
              <IconSymbol name="person.badge.plus" size={18} color="#10b981" />
              <Text className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {t("onboarding.applyContributor")}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ── Step: Quiz (powered by quiz store + engine) ── */}
      {step === "tryit" && (
        <>
          {/* Quiz inner progress bar */}
          {phase === "active" && (
            <ProgressBar
              current={currentIndex + (locked ? 1 : 0)}
              total={questions.length}
            />
          )}

          {phase === "active" && question ? (
            <View className="flex-1 px-5 pt-6">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t("quiz.questionOf", { current: currentIndex + 1, total: questions.length })}
                </Text>
                {lastAnswerCorrect !== null && locked && (
                  <View
                    className={`rounded-full px-3 py-1 ${
                      lastAnswerCorrect ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        lastAnswerCorrect
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      {lastAnswerCorrect ? t("quiz.correct") : t("quiz.incorrect")}
                    </Text>
                  </View>
                )}
              </View>

              <QuestionTypeLabel type={question.type} />

              <Text className="mb-8 text-xl font-bold text-neutral-900 dark:text-white">
                {question.prompt}
              </Text>

              {question.options.map((option, idx) => {
                const state = getOptionState(option);
                const bgClass = {
                  default: "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
                  correct: "bg-green-50 dark:bg-green-900/40 border-green-500",
                  incorrect: "bg-red-50 dark:bg-red-900/40 border-red-500",
                  dimmed: "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-50",
                }[state];
                const textClass = {
                  default: "text-neutral-900 dark:text-white",
                  correct: "text-green-700 dark:text-green-300",
                  incorrect: "text-red-700 dark:text-red-300",
                  dimmed: "text-neutral-400 dark:text-neutral-500",
                }[state];
                return (
                  <Pressable
                    key={`${question.id}-${idx}`}
                    onPress={() => handleSelect(option)}
                    disabled={state !== "default"}
                    className={`mb-3 rounded-xl border-2 px-5 py-4 ${bgClass}`}
                  >
                    <Text className={`text-base font-medium ${textClass}`}>{option}</Text>
                  </Pressable>
                );
              })}

              {locked && lastAnswerCorrect === false && (
                <View className="mt-3 rounded-2xl bg-red-50 px-4 py-3 dark:bg-red-900/20">
                  <View className="flex-row items-center gap-1.5">
                    <IconSymbol name="lightbulb.fill" size={14} color="#f97316" />
                    <Text className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                      {t("quiz.correctAnswerLabel")}
                    </Text>
                  </View>
                  <Text className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    {question.correctAnswer}
                  </Text>
                  {question.explanation && (
                    <Text className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                      {question.explanation}
                    </Text>
                  )}
                  {question.exampleSentence && (
                    <View className="mt-2 border-t border-red-200 pt-2 dark:border-red-800">
                      <Text className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        {t("wordDetail.example")}
                      </Text>
                      <Text className="mt-0.5 text-xs italic text-neutral-700 dark:text-neutral-300">
                        {question.exampleSentence}
                      </Text>
                      {question.exampleSentenceTranslation && (
                        <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {question.exampleSentenceTranslation}
                        </Text>
                      )}
                    </View>
                  )}
                  <Pressable
                    onPress={handleContinueAfterWrong}
                    className="mt-3 items-center rounded-xl bg-red-500 py-3 active:opacity-70"
                  >
                    <Text className="text-sm font-semibold text-white">{t("common.continue")}</Text>
                  </Pressable>
                </View>
              )}
            </View>

          ) : phase === "results" && result ? (
            /* ── Results summary ── */
            <ScrollView
              className="flex-1 px-6"
              contentContainerStyle={{ paddingTop: 24, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="items-center gap-4 mb-6">
                <View
                  className={`h-28 w-28 items-center justify-center rounded-full ${
                    result.accuracy >= 80
                      ? "bg-green-100 dark:bg-green-900/40"
                      : result.accuracy >= 50
                      ? "bg-amber-100 dark:bg-amber-900/40"
                      : "bg-red-100 dark:bg-red-900/40"
                  }`}
                >
                  <Text
                    className={`text-3xl font-bold ${
                      result.accuracy >= 80
                        ? "text-green-600 dark:text-green-400"
                        : result.accuracy >= 50
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {result.correctCount}/{result.totalQuestions}
                  </Text>
                </View>
                <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {t("onboarding.quizDoneTitle")}
                </Text>
                <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center">
                  {t("onboarding.quizDoneSubtitle", {
                    score: result.correctCount,
                    total: result.totalQuestions,
                  })}
                </Text>
              </View>

              <Pressable
                onPress={goNext}
                className="items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
              >
                <Text className="text-base font-bold text-white">{t("onboarding.continue")}</Text>
              </Pressable>
            </ScrollView>

          ) : (
            /* No words available */
            <View className="flex-1 items-center justify-center px-6 gap-4">
              <IconSymbol name="book.fill" size={48} color="#d1d5db" />
              <Text className="text-center text-neutral-400 dark:text-neutral-500">
                {t("onboarding.noWordYet")}
              </Text>
              <Pressable
                onPress={goNext}
                className="items-center rounded-2xl bg-blue-500 px-8 py-4 active:opacity-80"
              >
                <Text className="text-base font-bold text-white">{t("onboarding.continue")}</Text>
              </Pressable>
            </View>
          )}

          {/* Back link — only show when not mid-question */}
          {(phase === "results" || noWords) && (
            <View className="px-6 pb-6 pt-2">
              <Pressable onPress={goBack} className="items-center py-2">
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t("onboarding.back")}</Text>
              </Pressable>
            </View>
          )}
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
                        selected ? "text-blue-700 dark:text-blue-300" : "text-neutral-900 dark:text-white"
                      }`}
                    >
                      {t(GOAL_LABEL_KEYS[opt.id] as any)}
                    </Text>
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t(GOAL_DETAIL_KEYS[opt.id] as any)}
                    </Text>
                  </View>
                  {selected && (
                    <IconSymbol name="checkmark.circle.fill" size={22} color="#3b82f6" />
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
            <Pressable onPress={goBack} className="items-center py-2">
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t("onboarding.back")}</Text>
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
                <Text className="text-base font-bold text-white">{t("onboarding.letsGo")}</Text>
              )}
            </Pressable>
            <Pressable onPress={goBack} className="items-center py-2">
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t("onboarding.back")}</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
