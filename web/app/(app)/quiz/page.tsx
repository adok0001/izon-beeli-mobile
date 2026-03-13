"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";
import { cn } from "@/lib/utils";
import type { QuizQuestion, QuizResult, AnsweredQuestion } from "@/types";

type Phase = "config" | "playing" | "results";

function QuizConfig({ onStart }: { onStart: (count: number) => void }) {
  const [count, setCount] = useState(10);

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <p className="text-5xl mb-4">🧠</p>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Quiz</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">
        Test your vocabulary knowledge
      </p>

      <div className="mb-6">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
          Number of questions
        </label>
        <div className="flex gap-2 justify-center">
          {[5, 10, 15, 20].map((n) => (
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
      </div>

      <button
        onClick={() => onStart(count)}
        className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
      >
        Start Quiz
      </button>
    </div>
  );
}

function QuizPlay({
  questions,
  onFinish,
}: {
  questions: QuizQuestion[];
  onFinish: (answers: AnsweredQuestion[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);

  const q = questions[index];
  const isCorrect = selected === q.correctAnswer;
  const progress = ((index + 1) / questions.length) * 100;

  const handleSelect = (opt: string) => {
    if (selected) return;
    setSelected(opt);
  };

  const handleNext = () => {
    const updated = [
      ...answers,
      { questionId: q.id, selectedAnswer: selected!, correct: isCorrect },
    ];
    if (index + 1 >= questions.length) {
      onFinish(updated);
    } else {
      setAnswers(updated);
      setSelected(null);
      setIndex(index + 1);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Progress */}
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
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-2">
          {q.type.replace(/-/g, " ")}
        </p>
        <p className="text-xl font-bold text-neutral-900 dark:text-white">{q.prompt}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {q.options.map((opt) => {
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
              className={cn(
                "p-4 rounded-xl border text-sm font-medium text-left transition-colors",
                style
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          {index + 1 >= questions.length ? "See Results" : "Next →"}
        </button>
      )}
    </div>
  );
}

function QuizResults({ result, onRestart }: { result: QuizResult; onRestart: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-12 px-4">
      <p className="text-5xl mb-4">{result.accuracy >= 70 ? "🎉" : "💪"}</p>
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
        {result.accuracy >= 70 ? "Great job!" : "Keep practicing!"}
      </h2>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">
        {result.correctCount}/{result.totalQuestions} correct — {result.accuracy}% accuracy
      </p>

      <div className="flex gap-3 justify-center mb-4">
        <div className="flex-1 bg-green-50 dark:bg-green-950/40 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">{result.correctCount}</p>
          <p className="text-xs text-green-600 mt-0.5">Correct</p>
        </div>
        <div className="flex-1 bg-red-50 dark:bg-red-950/40 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-500">
            {result.totalQuestions - result.correctCount}
          </p>
          <p className="text-xs text-red-500 mt-0.5">Wrong</p>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

export default function QuizPage() {
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();
  const [phase, setPhase] = useState<Phase>("config");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  const fetchQuiz = useMutation({
    mutationFn: async (count: number) => {
      const token = await getToken();
      return apiFetch<QuizQuestion[]>(
        `/quiz/questions?language=${selectedLanguageId}&count=${count}`,
        { token: token ?? undefined }
      );
    },
    onSuccess: (qs) => {
      setQuestions(qs);
      setPhase("playing");
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
    return <QuizConfig onStart={(count) => fetchQuiz.mutate(count)} />;
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
