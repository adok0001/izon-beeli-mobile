
import { analytics } from "@/lib/analytics";
import { ProgressBar } from "@/components/quiz/progress-bar";
import { QuestionTypeLabel } from "@/components/quiz/question-type-label";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePicker } from "@/components/ui/language-picker";
import { getAccent } from "@/constants/accent-colors";
import { apiFetch } from "@/lib/api";
import { ONBOARDING_KEY } from "@/lib/constants";
import type { DictionaryEntry } from "@/lib/dictionary";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { ACTIVE_LANGUAGES } from "@/lib/mock-data";
import { generateQuiz } from "@/lib/quiz-engine";
import {
    playCorrectSound,
    playFinishSound,
    playIncorrectSound,
} from "@/lib/sounds";
import { useMuseumTheme } from "@/lib/use-museum-theme";
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
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


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
  const M = useMuseumTheme();
  const router = useRouter();
  const { getToken } = useAuth();
  const { setLanguage } = useLanguageStore();
  const showTour = useTourStore((s) => s.showTour);
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("language");
  const [selectedLangId, setSelectedLangId] = useState("izon");
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
      analytics.onboardingCompleted(selectedLangId, selectedGoal);
      showTour("welcome");
      router.replace("/(tabs)/learn");
    } catch {
      await AsyncStorage.setItem(ONBOARDING_KEY, "1");
      analytics.onboardingCompleted(selectedLangId, selectedGoal);
      showTour("welcome");
      router.replace("/(tabs)/learn");
    } finally {
      setSaving(false);
    }
  };

  const result = phase === "results" ? getResult() : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      {/* Outer progress bar — onboarding steps */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 24, paddingTop: 16 }}>
        {ALL_STEPS.map((_, i) => (
          <View
            key={i}
            style={{ height: 6, flex: 1, borderRadius: 999, backgroundColor: i <= currentIdx ? M.accent : M.border }}
          />
        ))}
      </View>

      {/* ── Step: Language selection ── */}
      {step === "language" && (
        <>
          <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 }}>
            <Text style={{ fontSize: 30, fontWeight: "900", color: M.text, letterSpacing: -0.5 }}>
              {t("onboarding.welcome")}
            </Text>
            <Text style={{ marginTop: 8, fontSize: 15, color: M.sub }}>
              {t("onboarding.whichLanguage")}
            </Text>
          </View>

          <LanguagePicker
            value={selectedLangId}
            onSelect={setSelectedLangId}
            languages={ACTIVE_LANGUAGES}
          />

          <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8, gap: 12 }}>
            <Pressable
              onPress={handleLanguageContinue}
              disabled={tryItLoading}
              style={{ alignItems: "center", borderRadius: 16, backgroundColor: M.accent, paddingVertical: 16 }}
              className="active:opacity-80"
            >
              {tryItLoading ? (
                <ActivityIndicator color={M.ink} />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>{t("onboarding.continue")}</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.push("/reviewer-application")}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 2, borderColor: getAccent("teal").solid, paddingVertical: 16 }}
              className="active:opacity-80"
            >
              <IconSymbol name="person.badge.plus" size={18} color={getAccent("teal").solid} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: getAccent("teal").solid }}>
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
            <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: M.sub }}>
                  {t("quiz.questionOf", { current: currentIndex + 1, total: questions.length })}
                </Text>
                {lastAnswerCorrect !== null && locked && (
                  <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: lastAnswerCorrect ? M.successBg : M.errorBg }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: lastAnswerCorrect ? M.success : M.error }}>
                      {lastAnswerCorrect ? t("quiz.correct") : t("quiz.incorrect")}
                    </Text>
                  </View>
                )}
              </View>

              <QuestionTypeLabel type={question.type} />

              <Text style={{ marginBottom: 32, fontSize: 20, fontWeight: "700", color: M.text }}>
                {question.prompt}
              </Text>

              {question.options.map((option, idx) => {
                const state = getOptionState(option);
                const bg = { default: M.card, correct: M.successBg, incorrect: M.errorBg, dimmed: M.card }[state];
                const border = { default: M.border, correct: M.success, incorrect: M.error, dimmed: M.border }[state];
                const textColor = { default: M.text, correct: M.success, incorrect: M.error, dimmed: M.muted }[state];
                return (
                  <Pressable
                    key={`${question.id}-${idx}`}
                    onPress={() => handleSelect(option)}
                    disabled={state !== "default"}
                    style={{ marginBottom: 12, borderRadius: 12, borderWidth: 2, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: bg, borderColor: border, opacity: state === "dimmed" ? 0.5 : 1 }}
                    className="active:opacity-70"
                  >
                    <Text style={{ fontSize: 15, fontWeight: "500", color: textColor }}>{option}</Text>
                  </Pressable>
                );
              })}

              {locked && lastAnswerCorrect === false && (
                <View style={{ marginTop: 12, borderRadius: 16, backgroundColor: M.errorBg, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: M.errorBorder }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <IconSymbol name="graduationcap.fill" size={14} color={getAccent("orange").solid} />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: getAccent("orange").solid }}>
                      {t("quiz.correctAnswerLabel")}
                    </Text>
                  </View>
                  <Text style={{ marginTop: 4, fontSize: 13, fontWeight: "700", color: M.text }}>
                    {question.correctAnswer}
                  </Text>
                  {question.explanation && (
                    <Text style={{ marginTop: 4, fontSize: 12, color: M.sub }}>{question.explanation}</Text>
                  )}
                  {question.exampleSentence && (
                    <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: M.errorBorder, paddingTop: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: M.muted }}>
                        {t("wordDetail.example")}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: 12, fontStyle: "italic", color: M.sub }}>
                        {question.exampleSentence}
                      </Text>
                      {question.exampleSentenceTranslation && (
                        <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>
                          {question.exampleSentenceTranslation}
                        </Text>
                      )}
                    </View>
                  )}
                  <Pressable
                    onPress={handleContinueAfterWrong}
                    style={{ marginTop: 12, alignItems: "center", borderRadius: 12, backgroundColor: M.error, paddingVertical: 12 }}
                    className="active:opacity-70"
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: M.parchment }}>{t("common.continue")}</Text>
                  </Pressable>
                </View>
              )}
            </View>

          ) : phase === "results" && result ? (
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 24 }}
              contentContainerStyle={{ paddingTop: 24, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ alignItems: "center", gap: 16, marginBottom: 24 }}>
                <View style={{
                  height: 112, width: 112, alignItems: "center", justifyContent: "center", borderRadius: 56,
                  backgroundColor: result.accuracy >= 80 ? M.successBg : result.accuracy >= 50 ? `${M.accent}20` : M.errorBg,
                }}>
                  <Text style={{ fontSize: 28, fontWeight: "700", color: result.accuracy >= 80 ? M.success : result.accuracy >= 50 ? M.accent : M.error }}>
                    {result.correctCount}/{result.totalQuestions}
                  </Text>
                </View>
                <Text style={{ fontSize: 28, fontWeight: "900", color: M.text, letterSpacing: -0.5 }}>
                  {t("onboarding.quizDoneTitle")}
                </Text>
                <Text style={{ fontSize: 15, color: M.sub, textAlign: "center" }}>
                  {t("onboarding.quizDoneSubtitle", {
                    score: result.correctCount,
                    total: result.totalQuestions,
                  })}
                </Text>
              </View>

              <Pressable
                onPress={goNext}
                style={{ alignItems: "center", borderRadius: 16, backgroundColor: M.accent, paddingVertical: 16 }}
                className="active:opacity-80"
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>{t("onboarding.continue")}</Text>
              </Pressable>
            </ScrollView>

          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 16 }}>
              <IconSymbol name="book.fill" size={48} color={M.border} />
              <Text style={{ textAlign: "center", color: M.muted }}>
                {t("onboarding.noWordYet")}
              </Text>
              <Pressable
                onPress={goNext}
                style={{ alignItems: "center", borderRadius: 16, backgroundColor: M.accent, paddingHorizontal: 32, paddingVertical: 16 }}
                className="active:opacity-80"
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>{t("onboarding.continue")}</Text>
              </Pressable>
            </View>
          )}

          {(phase === "results" || noWords) && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 }}>
              <Pressable onPress={goBack} style={{ alignItems: "center", paddingVertical: 8 }}>
                <Text style={{ fontSize: 13, color: M.muted }}>{t("onboarding.back")}</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* ── Step: Daily goal ── */}
      {step === "goal" && (
        <>
          <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}>
            <Text style={{ fontSize: 30, fontWeight: "900", color: M.text, letterSpacing: -0.5 }}>
              {t("onboarding.setGoal")}
            </Text>
            <Text style={{ marginTop: 8, fontSize: 15, color: M.sub }}>
              {t("onboarding.howMuchTime")}
            </Text>
          </View>

          <View style={{ flex: 1, paddingHorizontal: 24, gap: 12 }}>
            {GOAL_OPTIONS.map((opt) => {
              const selected = opt.id === selectedGoal;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelectedGoal(opt.id)}
                  style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 2, paddingHorizontal: 20, paddingVertical: 20, backgroundColor: selected ? M.accentGlow : M.card, borderColor: selected ? M.accent : M.border }}
                  className="active:opacity-70"
                >
                  <View style={{ marginRight: 16, height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: selected ? M.accent : M.border }}>
                    <IconSymbol
                      name={opt.icon as any}
                      size={22}
                      color={selected ? M.ink : M.sub}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: selected ? M.accent : M.text }}>
                      {t(GOAL_LABEL_KEYS[opt.id] as any)}
                    </Text>
                    <Text style={{ fontSize: 13, color: M.sub }}>
                      {t(GOAL_DETAIL_KEYS[opt.id] as any)}
                    </Text>
                  </View>
                  {selected && (
                    <IconSymbol name="checkmark.circle.fill" size={22} color={M.accent} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 24, gap: 12 }}>
            <Pressable
              onPress={goNext}
              style={{ alignItems: "center", borderRadius: 16, backgroundColor: M.accent, paddingVertical: 16 }}
              className="active:opacity-80"
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>{t("onboarding.continue")}</Text>
            </Pressable>
            <Pressable onPress={goBack} style={{ alignItems: "center", paddingVertical: 8 }}>
              <Text style={{ fontSize: 13, color: M.muted }}>{t("onboarding.back")}</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ── Step: Ready / Celebration ── */}
      {step === "ready" && (
        <>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
            <View style={{ marginBottom: 24, height: 96, width: 96, alignItems: "center", justifyContent: "center", borderRadius: 48, backgroundColor: M.successBg, borderWidth: 1, borderColor: M.successBorder }}>
              <IconSymbol name="checkmark.seal.fill" size={48} color={M.success} />
            </View>
            <Text style={{ fontSize: 30, fontWeight: "900", color: M.text, textAlign: "center", letterSpacing: -0.5 }}>
              {t("onboarding.readyTitle")}
            </Text>
            <Text style={{ marginTop: 12, fontSize: 15, color: M.sub, textAlign: "center", lineHeight: 24, paddingHorizontal: 16 }}>
              {t("onboarding.readySubtitle")}
            </Text>
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16, gap: 12 }}>
            <Pressable
              onPress={handleFinish}
              disabled={saving}
              style={{ alignItems: "center", borderRadius: 16, backgroundColor: M.success, paddingVertical: 16 }}
              className="active:opacity-80"
            >
              {saving ? (
                <ActivityIndicator color={M.ink} />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>{t("onboarding.letsGo")}</Text>
              )}
            </Pressable>
            <Pressable onPress={goBack} style={{ alignItems: "center", paddingVertical: 8 }}>
              <Text style={{ fontSize: 13, color: M.muted }}>{t("onboarding.back")}</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
