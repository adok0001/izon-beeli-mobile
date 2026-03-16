"use client";

import { ApiError, apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import type { AnsweredQuestion, QuizQuestion, QuizResult } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Brain, Heart, Target, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Phase = "config" | "playing" | "results";
const QUESTION_COUNTS = [5, 10, 15, 20] as const;
const MAX_HEARTS = 5;

function HeartsBar({ hearts }: Readonly<{ hearts: number }>) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1.5" aria-label={t("quiz.hearts")}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <Heart
          key={i}
          className={cn(
            "h-5 w-5 transition-all",
            i < hearts
              ? "fill-red-500 text-red-500"
              : "fill-none text-neutral-300 dark:text-neutral-600"
          )}
        />
      ))}
    </div>
  );
}

function QuizGameOver({ onRestart }: Readonly<{ onRestart: () => void }>) {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
        <Heart className="h-8 w-8 text-red-500 fill-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
        {t("quiz.gameOver")}
      </h2>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">{t("quiz.gameOverDesc")}</p>
      <button
        onClick={onRestart}
        className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
      >
        {t("quiz.tryAgain")}
      </button>
    </div>
  );
}

function getQuestionTypeLabel(t: TFunction, type: QuizQuestion["type"]) {
  switch (type) {
    case "word-to-english":
      return t("quiz.wordToEnglish");
    case "english-to-word":
      return t("quiz.englishToWord");
    case "fill-in-the-blank":
      return t("quiz.fillInBlank");
    case "listening":
      return t("quiz.listening");
    default:
      return type;
  }
}

function QuizConfig({ onStart }: Readonly<{ onStart: (count: number) => void }>) {
  const { t } = useTranslation();
  const [count, setCount] = useState(10);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentIndex = QUESTION_COUNTS.indexOf(count as (typeof QUESTION_COUNTS)[number]);

      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
        setCount(QUESTION_COUNTS[nextIndex]);
      }

      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        const nextIndex = currentIndex >= QUESTION_COUNTS.length - 1 ? currentIndex : currentIndex + 1;
        setCount(QUESTION_COUNTS[nextIndex]);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        onStart(count);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [count, onStart]);

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <Brain className="mx-auto mb-4 h-12 w-12 text-brand-500" />
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{t("quiz.title")}</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">
        {t("quiz.subtitle")}
      </p>

      <div className="mb-6">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
          {t("quiz.numberOfQuestions")}
        </label>
        <div className="flex gap-2 justify-center">
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={cn(
                "w-14 h-14 rounded-xl text-sm font-bold border transition-colors",
                count === n
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300 hover:border-brand-400"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
          {t("quiz.keyboardConfigHint")}
        </p>
      </div>

      <button
        onClick={() => onStart(count)}
        aria-keyshortcuts="Enter"
        className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
      >
        {t("quiz.startQuiz")}
      </button>
    </div>
  );
}

function QuizPlay({
  questions,
  onFinish,
}: Readonly<{
  questions: QuizQuestion[];
  onFinish: (answers: AnsweredQuestion[]) => void;
}>) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [lostHeart, setLostHeart] = useState(false);

  const q = questions[index];
  const isCorrect = selected === q.correctAnswer;
  const progress = ((index + 1) / questions.length) * 100;

  const handleSelect = useCallback((opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === q.correctAnswer;
    if (!correct) {
      setHearts((h) => Math.max(0, h - 1));
      setLostHeart(true);
      setTimeout(() => setLostHeart(false), 600);
    }
  }, [selected, q.correctAnswer]);

  const handleNext = useCallback(() => {
    if (!selected) {
      return;
    }

    const updated = [
      ...answers,
      { questionId: q.id, selectedAnswer: selected, correct: isCorrect },
    ];
    if (index + 1 >= questions.length) {
      onFinish(updated);
    } else {
      setAnswers(updated);
      setSelected(null);
      setIndex(index + 1);
    }
  }, [answers, index, isCorrect, onFinish, questions.length, q.id, selected]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selected) {
        const optionIndex = Number.parseInt(event.key, 10) - 1;
        if (optionIndex >= 0 && optionIndex < q.options.length) {
          event.preventDefault();
          handleSelect(q.options[optionIndex]);
        }
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        handleNext();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext, handleSelect, q.options, selected]);

  if (hearts === 0) {
    return <QuizGameOver onRestart={() => onFinish(answers)} />;
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Progress + Hearts */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-neutral-500 dark:text-neutral-400 shrink-0">
          {index + 1}/{questions.length}
        </span>
        <HeartsBar hearts={hearts} />
      </div>

      {/* Feedback toast */}
      {lostHeart && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 text-center animate-pulse">
          {t("quiz.lostHeart")}
        </div>
      )}

      {/* Question */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-2">
          {getQuestionTypeLabel(t, q.type)}
        </p>
        <p className="text-xl font-bold text-neutral-900 dark:text-white">{q.prompt}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {q.options.map((opt, index) => {
          let style = "border-neutral-200 dark:border-neutral-700 hover:border-brand-400";
          if (selected) {
            if (opt === q.correctAnswer) {
              style = "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300";
            } else if (opt === selected && opt !== q.correctAnswer) {
              style = "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400";
            }
          } else if (opt === selected) {
            style = "border-brand-500 bg-brand-50 dark:bg-brand-950/40";
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              aria-keyshortcuts={`${index + 1}`}
              className={cn(
                "p-4 rounded-xl border text-sm font-medium text-left transition-colors",
                style
              )}
            >
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                {index + 1}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
        {t("quiz.keyboardPlayHint")}
      </p>

      {selected && (
        <button
          onClick={handleNext}
          aria-keyshortcuts="Enter"
          className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          {index + 1 >= questions.length ? t("quiz.seeResults") : `${t("common.next")} →`}
        </button>
      )}
    </div>
  );
}

function QuizResults({ result, onRestart }: Readonly<{ result: QuizResult; onRestart: () => void }>) {
  const { t } = useTranslation();
  const ResultIcon = result.accuracy >= 70 ? Trophy : Target;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onRestart();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRestart]);

  return (
    <div className="max-w-md mx-auto text-center py-12 px-4">
      <ResultIcon className="mx-auto mb-4 h-12 w-12 text-brand-500" />
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
        {result.accuracy >= 70 ? t("quiz.greatJob") : t("quiz.keepPracticing")}
      </h2>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">
        {t("quiz.accuracySummary", {
          correct: result.correctCount,
          total: result.totalQuestions,
          accuracy: result.accuracy,
        })}
      </p>

      <div className="flex gap-3 justify-center mb-4">
        <div className="flex-1 bg-green-50 dark:bg-green-950/40 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">{result.correctCount}</p>
          <p className="text-xs text-green-600 mt-0.5">{t("quiz.correctLabel")}</p>
        </div>
        <div className="flex-1 bg-red-50 dark:bg-red-950/40 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-500">
            {result.totalQuestions - result.correctCount}
          </p>
          <p className="text-xs text-red-500 mt-0.5">{t("quiz.wrongLabel")}</p>
        </div>
      </div>

      <button
        onClick={onRestart}
        aria-keyshortcuts="Enter"
        className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
      >
        {t("common.tryAgain")}
      </button>

      <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
        {t("quiz.keyboardResultsHint")}
      </p>
    </div>
  );
}

export default function QuizPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { selectedLanguageId } = useLanguageStore();
  const [phase, setPhase] = useState<Phase>("config");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const fetchQuiz = useMutation({
    mutationFn: async (count: number) => {
      const token = await getToken();
      return apiFetch<QuizQuestion[]>(
        `/quiz/questions?languageId=${selectedLanguageId}&count=${count}`,
        { token: token ?? undefined }
      );
    },
    onSuccess: (qs) => {
      if (qs.length === 0) {
        setStartError(t("quiz.notEnoughVocabDesc"));
        return;
      }

      setStartError(null);
      setQuestions(qs);
      setPhase("playing");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 400) {
        setStartError(t("quiz.notEnoughVocabDesc"));
        return;
      }

      setStartError(error instanceof Error ? error.message : t("common.error"));
    },
  });

  const submitQuiz = useMutation({
    mutationFn: async (answers: AnsweredQuestion[]) => {
      const token = await getToken();
      return apiFetch<QuizResult>("/quiz/submit", {
        method: "POST",
        body: JSON.stringify({ answers, languageId: selectedLanguageId }),
        token: token ?? undefined,
      });
    },
    onSuccess: (r) => {
      setResult(r);
      setPhase("results");
    },
  });

  const handleFinish = (answers: AnsweredQuestion[]) => {
    // Compute result locally if API unavailable
    const correct = answers.filter((a) => a.correct).length;
    setResult({
      totalQuestions: answers.length,
      correctCount: correct,
      accuracy: Math.round((correct / answers.length) * 100),
      timeElapsed: 0,
      answeredQuestions: answers,
    });
    setPhase("results");
    submitQuiz.mutate(answers);
  };

  if (phase === "config") {
    return (
      <>
        <QuizConfig
          onStart={(count) => {
            setStartError(null);
            fetchQuiz.mutate(count);
          }}
        />
        {startError && (
          <div className="mx-auto -mt-6 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {startError}
          </div>
        )}
      </>
    );
  }

  if (phase === "playing" && questions.length > 0) {
    return <QuizPlay questions={questions} onFinish={handleFinish} />;
  }

  if (phase === "results" && result) {
    return (
      <QuizResults
        result={result}
        onRestart={() => {
          setPhase("config");
          setResult(null);
          setQuestions([]);
        }}
      />
    );
  }

  return null;
}
