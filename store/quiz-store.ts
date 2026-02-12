import { create } from "zustand";
import type { AnsweredQuestion, QuizQuestion, QuizResult } from "@/types";

type QuizPhase = "idle" | "active" | "results";

interface QuizState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answeredQuestions: AnsweredQuestion[];
  startTime: number;
  lastAnswerCorrect: boolean | null;

  startQuiz: (questions: QuizQuestion[]) => void;
  answerQuestion: (selectedAnswer: string) => boolean;
  nextQuestion: () => void;
  getResult: () => QuizResult;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  phase: "idle",
  questions: [],
  currentIndex: 0,
  answeredQuestions: [],
  startTime: 0,
  lastAnswerCorrect: null,

  startQuiz: (questions) => {
    set({
      phase: "active",
      questions,
      currentIndex: 0,
      answeredQuestions: [],
      startTime: Date.now(),
      lastAnswerCorrect: null,
    });
  },

  answerQuestion: (selectedAnswer) => {
    const { questions, currentIndex, answeredQuestions } = get();
    const question = questions[currentIndex];
    if (!question) return false;

    const correct = selectedAnswer === question.correctAnswer;

    set({
      answeredQuestions: [
        ...answeredQuestions,
        {
          questionId: question.id,
          selectedAnswer,
          correct,
        },
      ],
      lastAnswerCorrect: correct,
    });

    return correct;
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    const nextIdx = currentIndex + 1;

    if (nextIdx >= questions.length) {
      set({ phase: "results", lastAnswerCorrect: null });
    } else {
      set({ currentIndex: nextIdx, lastAnswerCorrect: null });
    }
  },

  getResult: () => {
    const { questions, answeredQuestions, startTime } = get();
    const correctCount = answeredQuestions.filter((a) => a.correct).length;
    const totalQuestions = questions.length;

    return {
      totalQuestions,
      correctCount,
      accuracy:
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0,
      timeElapsed: Math.round((Date.now() - startTime) / 1000),
      answeredQuestions,
    };
  },

  reset: () => {
    set({
      phase: "idle",
      questions: [],
      currentIndex: 0,
      answeredQuestions: [],
      startTime: 0,
      lastAnswerCorrect: null,
    });
  },
}));
