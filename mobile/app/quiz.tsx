import { ListeningQuestion } from "@/components/quiz/listening-question";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { analytics } from "@/lib/analytics";
import { apiFetch } from "@/lib/api";
import { hapticError, hapticHeavy, hapticSuccess } from "@/lib/haptics";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useLesson } from "@/lib/hooks/use-courses";
import { getLanguageName } from "@/lib/mock-data";
import { generateFocusedQuiz, generateQuiz } from "@/lib/quiz-engine";
import {
    playCorrectSound,
    playFinishSound,
    playIncorrectSound,
} from "@/lib/sounds";
import { useLanguageStore } from "@/store/language-store";
import { useQuizStore } from "@/store/quiz-store";
import type { QuizQuestion } from "@/types";
import { useInvalidateDailyChallenges } from "@/lib/hooks/use-daily-challenge";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QUESTION_COUNTS = [5, 10, 15, 20] as const;
const TIME_ESTIMATE_MINUTES: Record<number, number> = { 5: 3, 10: 6, 15: 9, 20: 12 };

const FEEDBACK_DELAY = 1200;

function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = total > 0 ? ((current) / total) * 100 : 0;
  return (
    <View className="mx-5 mt-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
      <View
        className="h-2 rounded-full bg-blue-500"
        style={{ width: `${pct}%` }}
      />
    </View>
  );
}

function QuestionTypeLabel({ type }: { type: QuizQuestion["type"] }) {
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    "word-to-english": t("quiz.wordToEnglish"),
    "english-to-word": t("quiz.englishToWord"),
    "fill-in-the-blank": t("quiz.fillInBlank"),
    listening: t("quiz.listening"),
  };
  return (
    <View className="mb-2 self-start rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900">
      <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
        {labels[type] ?? type}
      </Text>
    </View>
  );
}

function OptionCard({
  label,
  state,
  onPress,
}: {
  label: string;
  state: "default" | "correct" | "incorrect" | "dimmed";
  onPress: () => void;
}) {
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
      onPress={onPress}
      disabled={state !== "default"}
      className={`mb-3 rounded-xl border-2 px-5 py-4 ${bgClass}`}
    >
      <Text className={`text-base font-medium ${textClass}`}>{label}</Text>
    </Pressable>
  );
}

function ConfigView({ onStart }: { onStart: (count: number) => void }) {
  const { t } = useTranslation();
  const [count, setCount] = useState(10);

  return (
    <View className="flex-1 items-center justify-center px-8">
      <IconSymbol name="trophy.fill" size={56} color="#3b82f6" />
      <Text className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">
        {t("quiz.title")}
      </Text>
      <Text className="mt-2 mb-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {t("quiz.subtitle")}
      </Text>

      <Text className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {t("quiz.numberOfQuestions")}
      </Text>
      <View className="mb-8 flex-row gap-3">
        {QUESTION_COUNTS.map((n) => (
          <Pressable
            key={n}
            onPress={() => setCount(n)}
            className={`h-16 w-16 items-center justify-center rounded-xl border-2 ${
              count === n
                ? "border-blue-500 bg-blue-500"
                : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
            }`}
          >
            <Text
              className={`text-base font-bold ${
                count === n ? "text-white" : "text-neutral-700 dark:text-neutral-300"
              }`}
            >
              {n}
            </Text>
            <Text className={`text-[10px] ${count === n ? "text-blue-100" : "text-neutral-400 dark:text-neutral-500"}`}>
              {t("quiz.minutesEstimate", { minutes: TIME_ESTIMATE_MINUTES[n] })}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => onStart(count)}
        className="w-full items-center rounded-xl bg-blue-500 py-4 active:opacity-80"
      >
        <Text className="text-base font-semibold text-white">{t("quiz.startQuiz")}</Text>
      </Pressable>
    </View>
  );
}

function ActiveView() {
  const { t } = useTranslation();
  const {
    questions,
    currentIndex,
    lastAnswerCorrect,
    answerQuestion,
    nextQuestion,
  } = useQuizStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Reset local state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setLocked(false);
  }, [currentIndex]);

  const handleSelect = useCallback(
    async (answer: string) => {
      if (locked) return;
      setLocked(true);
      setSelectedAnswer(answer);

      const correct = answerQuestion(answer);
      if (correct) {
        playCorrectSound();
        hapticSuccess();
        if (isLastQuestion) {
          setTimeout(() => { playFinishSound(); }, FEEDBACK_DELAY - 200);
        }
        setTimeout(() => { nextQuestion(); }, FEEDBACK_DELAY);
      } else {
        playIncorrectSound();
        hapticError();
      }
    },
    [locked, answerQuestion, nextQuestion, isLastQuestion]
  );

  const handleContinue = useCallback(() => {
    if (isLastQuestion) playFinishSound();
    nextQuestion();
  }, [nextQuestion, isLastQuestion]);

  if (!question) return null;

  const getOptionState = (option: string) => {
    if (!locked) return "default" as const;
    if (option === question.correctAnswer) return "correct" as const;
    if (option === selectedAnswer && option !== question.correctAnswer)
      return "incorrect" as const;
    return "dimmed" as const;
  };

  return (
    <View className="flex-1">
      <ProgressBar current={currentIndex + (locked ? 1 : 0)} total={questions.length} />

      <View className="flex-1 px-5 pt-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("quiz.questionOf", { current: currentIndex + 1, total: questions.length })}
          </Text>
          {lastAnswerCorrect !== null && locked && (
            <View
              className={`rounded-full px-3 py-1 ${
                lastAnswerCorrect
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-red-100 dark:bg-red-900"
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

        {question.type === "listening" && question.audioSource ? (
          <ListeningQuestion audioSource={question.audioSource} />
        ) : (
          <Text className="mb-8 text-xl font-bold text-neutral-900 dark:text-white">
            {question.prompt}
          </Text>
        )}

        {question.options.map((option, idx) => (
          <OptionCard
            key={`${question.id}-${idx}`}
            label={option}
            state={getOptionState(option)}
            onPress={() => handleSelect(option)}
          />
        ))}

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
              onPress={handleContinue}
              className="mt-3 items-center rounded-xl bg-red-500 py-3 active:opacity-70 dark:bg-red-500"
            >
              <Text className="text-sm font-semibold text-white">
                {t("common.continue")}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function ResultsView({ languageId }: { languageId: string }) {
  const { t } = useTranslation();
  const { getResult, reset, startQuiz, questions, answeredQuestions } = useQuizStore();
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const invalidateDailyChallenges = useInvalidateDailyChallenges();
  const result = getResult();
  const startTime = useQuizStore((s) => s.startTime);
  const [xpResult, setXpResult] = useState<{ xpEarned: number; leveledUp: boolean } | null>(null);

  useEffect(() => {
    hapticHeavy();
    const post = async () => {
      try {
        const token = await getToken();
        const durationMs = Date.now() - startTime;
        const res = await apiFetch<{ xpEarned: number; leveledUp: boolean; newLevel?: number }>("/quiz-results", {
          method: "POST",
          token: token ?? undefined,
          body: JSON.stringify({
            languageId,
            score: result.correctCount,
            accuracy: result.accuracy,
            durationMs,
            questionCount: result.totalQuestions,
          }),
        });
        setXpResult({ xpEarned: res.xpEarned, leveledUp: res.leveledUp });
        queryClient.invalidateQueries({ queryKey: ["progress"] });
        invalidateDailyChallenges();
        analytics.quizFinished(languageId, result.accuracy, durationMs);
      } catch {
        // non-blocking — results display even if save fails
        analytics.quizFinished(languageId, result.accuracy, 0);
      }
    };
    post();
  }, []);

  const scoreColor =
    result.accuracy >= 80
      ? "text-green-600 dark:text-green-400"
      : result.accuracy >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const bgScoreColor =
    result.accuracy >= 80
      ? "bg-green-100 dark:bg-green-900/40"
      : result.accuracy >= 50
        ? "bg-amber-100 dark:bg-amber-900/40"
        : "bg-red-100 dark:bg-red-900/40";

  const mins = Math.floor(result.timeElapsed / 60);
  const secs = result.timeElapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const handleTryAgain = () => {
    const reshuffled = [...questions].sort(() => Math.random() - 0.5);
    const reshuffledQuestions = reshuffled.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }));
    // Call startQuiz directly — transitions from "results" → "active" without
    // passing through "idle" (which would briefly flash the config screen).
    startQuiz(reshuffledQuestions);
  };

  const missedItems = answeredQuestions
    .filter((a) => !a.correct)
    .map((a) => ({ ...a, question: questions.find((q) => q.id === a.questionId) }))
    .filter((a) => a.question != null);

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-8 pb-8 pt-6" showsVerticalScrollIndicator={false}>
      <View className="items-center">
        <View className={`mb-6 h-28 w-28 items-center justify-center rounded-full ${bgScoreColor}`}>
          <Text className={`text-3xl font-bold ${scoreColor}`}>
            {result.correctCount}/{result.totalQuestions}
          </Text>
        </View>

        <Text className={`mb-2 text-4xl font-bold ${scoreColor}`}>
          {result.accuracy}%
        </Text>
        {xpResult && (
          <View className="mb-3 flex-row items-center gap-2">
            <View className="rounded-full bg-amber-100 px-4 py-1.5 dark:bg-amber-900/40">
              <Text className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {t("quiz.xpEarned", { xp: xpResult.xpEarned })}
              </Text>
            </View>
            {xpResult.leveledUp && (
              <View className="rounded-full bg-purple-100 px-4 py-1.5 dark:bg-purple-900/40">
                <Text className="text-sm font-bold text-purple-700 dark:text-purple-300">
                  {t("quiz.leveledUp")}
                </Text>
              </View>
            )}
          </View>
        )}
        <Text className="mb-6 text-base text-neutral-500 dark:text-neutral-400">
          {t("quiz.completedIn", { time: timeStr })}
        </Text>

        <View className="w-full gap-3">
          <Pressable
            onPress={handleTryAgain}
            className="items-center rounded-xl bg-blue-500 py-4 active:opacity-80"
          >
            <Text className="text-base font-semibold text-white">{t("quiz.tryAgain")}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              reset();
              router.back();
            }}
            className="items-center rounded-xl border-2 border-neutral-200 py-4 active:opacity-80 dark:border-neutral-700"
          >
            <Text className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
              {t("quiz.backToLearn")}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Missed questions review */}
      {missedItems.length > 0 && (
        <View className="mt-8">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t(missedItems.length === 1 ? "quiz.missedCount_one" : "quiz.missedCount_other", { count: missedItems.length })}
          </Text>
          {missedItems.map(({ question, selectedAnswer }) => (
            <View
              key={question!.id}
              className="mb-3 rounded-2xl bg-red-50 p-4 dark:bg-red-900/10"
            >
              <Text className="mb-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {question!.prompt}
              </Text>
              <View className="flex-row items-center gap-2">
                <IconSymbol name="xmark.circle.fill" size={14} color="#ef4444" />
                <Text className="text-xs text-neutral-500 dark:text-neutral-400 line-through">
                  {selectedAnswer}
                </Text>
              </View>
              <View className="mt-1 flex-row items-center gap-2">
                <IconSymbol name="checkmark.circle.fill" size={14} color="#22c55e" />
                <Text className="text-xs font-semibold text-green-700 dark:text-green-400">
                  {question!.correctAnswer}
                </Text>
              </View>
              {question!.exampleSentence && (
                <View className="mt-2 border-t border-red-200 pt-2 dark:border-red-800">
                  <Text className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {t("wordDetail.example")}
                  </Text>
                  <Text className="mt-0.5 text-xs italic text-neutral-600 dark:text-neutral-400">
                    {question!.exampleSentence}
                  </Text>
                  {question!.exampleSentenceTranslation && (
                    <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">
                      {question!.exampleSentenceTranslation}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function EmptyView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reset } = useQuizStore();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <IconSymbol name="character.book.closed" size={56} color="#d1d5db" />
      <Text className="mt-4 text-center text-lg font-semibold text-neutral-700 dark:text-neutral-300">
        {t("quiz.notEnoughVocab")}
      </Text>
      <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {t("quiz.notEnoughVocabDesc")}
      </Text>
      <Pressable
        onPress={() => {
          reset();
          router.back();
        }}
        className="mt-6 rounded-xl bg-blue-500 px-8 py-3 active:opacity-80"
      >
        <Text className="font-semibold text-white">{t("common.goBack")}</Text>
      </Pressable>
    </View>
  );
}

export default function QuizScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    courseId?: string;
    category?: string;
    focusWord?: string;
    focusEnglish?: string;
    focusAudio?: string;
    lessonId?: string;
  }>();
  const { selectedLanguageId } = useLanguageStore();
  const { data: dictionaryEntries = [], isLoading: isDictLoading } = useDictionary(selectedLanguageId);
  const { data: lessonData, isLoading: isLessonLoading } = useLesson(params.lessonId ?? "");

  // When lessonId is provided, filter dictionary to words that appear in the lesson transcript.
  // Falls back to full dictionary if fewer than 4 matches (not enough for distractors).
  const activeEntries = useMemo(() => {
    if (!params.lessonId || !lessonData?.transcript?.length) return dictionaryEntries;
    const transcriptWords = new Set(
      lessonData.transcript.flatMap((seg) =>
        seg.text.split(/\s+/).map((w) => w.toLowerCase().replace(/[.,!?;:'"()\[\]]/g, "").trim())
      ).filter(Boolean)
    );
    const matches = dictionaryEntries.filter((e) =>
      transcriptWords.has(e.word.toLowerCase().trim())
    );
    return matches.length >= 4 ? matches : dictionaryEntries;
  }, [params.lessonId, lessonData, dictionaryEntries]);
  const { phase, startQuiz, reset } = useQuizStore();
  const [isEmpty, setIsEmpty] = useState(false);
  const [configReady, setConfigReady] = useState(false);
  const initialized = useRef(false);

  // Reset quiz state on unmount so a dismissed mid-quiz doesn't persist into the next visit
  useEffect(() => {
    return () => { reset(); };
  }, [reset]);

  const isFocused = !!params.focusWord && !!params.focusEnglish;
  const languageName = getLanguageName(selectedLanguageId);
  const quizTitle = isFocused
    ? t("quiz.practiceTitle", { word: params.focusWord })
    : t("quiz.quizTitle", { language: languageName });

  const makeTq = useCallback(
    () => (key: string, opts?: Record<string, unknown>) =>
      t(key as any, { language: languageName, ...opts } as any),
    [t, languageName]
  );

  // Once dictionary (and lesson, if applicable) data loads: auto-start focused quizzes, show config for regular quizzes
  useEffect(() => {
    if (initialized.current) return;
    if (isDictLoading) return;
    if (params.lessonId && isLessonLoading) return;
    initialized.current = true;

    const tq = makeTq();

    if (isFocused) {
      const questions = generateFocusedQuiz(
        params.focusWord!,
        params.focusEnglish!,
        params.focusAudio || undefined,
        dictionaryEntries,
        tq
      );
      if (questions.length === 0) {
        setIsEmpty(true);
      } else {
        startQuiz(questions);
        analytics.quizStarted(selectedLanguageId, questions.length);
      }
    } else {
      // Check there's enough vocabulary before showing the config screen
      const test = generateQuiz(
        { languageId: selectedLanguageId, courseId: params.courseId, category: params.category, questionCount: 5 },
        activeEntries,
        undefined,
        tq
      );
      if (test.length === 0) {
        setIsEmpty(true);
      } else {
        setConfigReady(true);
      }
    }
  }, [isDictLoading, isLessonLoading]);

  const handleStart = useCallback(
    (count: number) => {
      const tq = makeTq();
      const questions = generateQuiz(
        {
          languageId: selectedLanguageId,
          courseId: params.courseId,
          category: params.category,
          questionCount: count,
        },
        activeEntries,
        undefined,
        tq
      );
      if (questions.length === 0) {
        setIsEmpty(true);
      } else {
        startQuiz(questions);
        analytics.quizStarted(selectedLanguageId, questions.length);
      }
    },
    [selectedLanguageId, params.courseId, params.category, activeEntries, makeTq, startQuiz]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: quizTitle,
          headerShown: true,
          presentation: "modal",
          headerLeft: () => (
            <Pressable
              onPress={() => {
                reset();
                router.back();
              }}
              hitSlop={8}
            >
              <IconSymbol name="xmark" size={22} color="#9ca3af" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={[]}
      >
        {isEmpty ? (
          <EmptyView />
        ) : phase === "results" ? (
          <ResultsView languageId={selectedLanguageId} />
        ) : phase === "active" ? (
          <ActiveView />
        ) : configReady ? (
          <ConfigView onStart={handleStart} />
        ) : null}
      </SafeAreaView>
    </>
  );
}
