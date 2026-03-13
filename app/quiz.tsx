import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useQuizStore } from "@/store/quiz-store";
import { generateQuiz, generateFocusedQuiz } from "@/lib/quiz-engine";
import { useLanguageStore } from "@/store/language-store";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { getLanguageName } from "@/lib/mock-data";
import {
  playCorrectSound,
  playIncorrectSound,
  playFinishSound,
} from "@/lib/sounds";
import { hapticSuccess, hapticError, hapticHeavy } from "@/lib/haptics";
import { ListeningQuestion } from "@/components/quiz/listening-question";
import { apiFetch } from "@/lib/api";
import { analytics } from "@/lib/analytics";
import type { QuizQuestion } from "@/types";
import { useTranslation } from "react-i18next";

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
      } else {
        playIncorrectSound();
        hapticError();
      }

      if (isLastQuestion) {
        // Play finish sound after a short delay for the last question
        setTimeout(() => {
          playFinishSound();
        }, FEEDBACK_DELAY - 200);
      }

      setTimeout(() => {
        nextQuestion();
      }, FEEDBACK_DELAY);
    },
    [locked, answerQuestion, nextQuestion, isLastQuestion]
  );

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
      </View>
    </View>
  );
}

function ResultsView({ languageId }: { languageId: string }) {
  const { t } = useTranslation();
  const { getResult, reset, questions } = useQuizStore();
  const router = useRouter();
  const { getToken } = useAuth();
  const result = getResult();
  const startTime = useQuizStore((s) => s.startTime);

  useEffect(() => {
    hapticHeavy();
    // Post results to backend (fire-and-forget)
    const post = async () => {
      try {
        const token = await getToken();
        const durationMs = Date.now() - startTime;
        await apiFetch("/quiz-results", {
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
        analytics.quizFinished(languageId, result.accuracy, durationMs);
      } catch {
        // non-blocking — results display even if save fails
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
    // Re-start with same question set but reshuffled
    const reshuffled = [...questions].sort(() => Math.random() - 0.5);
    // Also reshuffle each question's options
    const reshuffledQuestions = reshuffled.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }));
    reset();
    // small delay so reset clears before starting
    setTimeout(() => {
      useQuizStore.getState().startQuiz(reshuffledQuestions);
    }, 0);
  };

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className={`mb-6 h-28 w-28 items-center justify-center rounded-full ${bgScoreColor}`}>
        <Text className={`text-3xl font-bold ${scoreColor}`}>
          {result.correctCount}/{result.totalQuestions}
        </Text>
      </View>

      <Text className={`mb-2 text-4xl font-bold ${scoreColor}`}>
        {result.accuracy}%
      </Text>
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
  }>();
  const { selectedLanguageId } = useLanguageStore();
  const { data: dictionaryEntries = [], isLoading: isDictLoading } = useDictionary(selectedLanguageId);
  const { phase, startQuiz, reset } = useQuizStore();
  const [isEmpty, setIsEmpty] = useState(false);
  const initialized = useRef(false);

  const isFocused = !!params.focusWord && !!params.focusEnglish;
  const languageName = getLanguageName(selectedLanguageId);
  const quizTitle = isFocused
    ? t("quiz.practiceTitle", { word: params.focusWord })
    : t("quiz.quizTitle", { language: languageName });

  // Generate and start quiz once dictionary data has loaded
  useEffect(() => {
    if (initialized.current) return;
    if (isDictLoading) return;
    initialized.current = true;

    const questions = isFocused
      ? generateFocusedQuiz(
          params.focusWord!,
          params.focusEnglish!,
          params.focusAudio || undefined,
          dictionaryEntries
        )
      : generateQuiz(
          {
            languageId: selectedLanguageId,
            courseId: params.courseId,
            category: params.category,
            questionCount: 10,
          },
          dictionaryEntries
        );

    if (questions.length === 0) {
      setIsEmpty(true);
    } else {
      startQuiz(questions);
      analytics.quizStarted(selectedLanguageId, questions.length);
    }
  }, [isDictLoading]);

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
        ) : null}
      </SafeAreaView>
    </>
  );
}
