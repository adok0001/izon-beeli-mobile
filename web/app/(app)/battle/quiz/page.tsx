"use client";

import { cn } from "@/lib/utils";
import { useMultiplayerStore } from "@/store/multiplayer-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar() {
  const { t } = useTranslation();
  const { myScore, opponentScore, players, myPlayerId } = useMultiplayerStore();
  const me = players.find((p) => p.id === myPlayerId);
  const opponent = players.find((p) => p.id !== myPlayerId);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
      <div className="text-center">
        <p className="text-xs text-neutral-500">{me?.name ?? t("multiplayer.you")}</p>
        <p className="text-2xl font-bold text-blue-500">{myScore}</p>
      </div>
      <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t("multiplayer.vs")}</span>
      <div className="text-center">
        <p className="text-xs text-neutral-500">{opponent?.name ?? t("multiplayer.opponent")}</p>
        <p className="text-2xl font-bold text-red-500">{opponentScore}</p>
      </div>
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function CountdownView() {
  const { t } = useTranslation();
  const { timeRemaining } = useMultiplayerStore();
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <p className="text-8xl font-bold text-blue-500">{timeRemaining}</p>
      <p className="text-lg text-neutral-500">{t("multiplayer.getReady")}</p>
    </div>
  );
}

// ── Question ──────────────────────────────────────────────────────────────────

function QuestionView() {
  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    timeRemaining,
    opponentAnswered,
    lastAnswerCorrect,
    lastCorrectAnswer,
    phase,
    sendAnswer,
  } = useMultiplayerStore();

  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => { setSelected(null); setLocked(false); }, [questionIndex]);

  const handleSelect = (answer: string) => {
    if (locked || !currentQuestion) return;
    setLocked(true);
    setSelected(answer);
    sendAnswer(currentQuestion.id, answer);
  };

  if (!currentQuestion) return null;

  const showResult = phase === "between_questions" && lastAnswerCorrect !== null;

  return (
    <div className="flex flex-col gap-6 flex-1 px-4 py-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${((questionIndex) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs text-neutral-400 shrink-0">{questionIndex + 1}/{totalQuestions}</span>
        <span className={cn("text-sm font-bold w-6 text-right", timeRemaining <= 5 ? "text-red-500" : "text-neutral-500")}>
          {timeRemaining}
        </span>
      </div>

      {/* Opponent indicator */}
      {opponentAnswered && (
        <p className="text-xs text-center text-amber-500 font-medium">Opponent answered ⚡</p>
      )}

      {/* Prompt */}
      <p className="text-xl font-semibold text-neutral-900 dark:text-white text-center leading-snug">
        {currentQuestion.prompt}
      </p>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {currentQuestion.options.map((option) => {
          let state = "idle";
          if (showResult) {
            if (option === lastCorrectAnswer) state = "correct";
            else if (option === selected) state = "wrong";
          } else if (option === selected) {
            state = "selected";
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={locked}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left font-medium transition-all",
                state === "idle" && "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-300 text-neutral-900 dark:text-white",
                state === "selected" && "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
                state === "correct" && "border-green-400 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300",
                state === "wrong" && "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showResult && lastCorrectAnswer && (
        <div className={cn("rounded-xl p-4 text-sm font-medium text-center", lastAnswerCorrect ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300")}>
          {lastAnswerCorrect ? "Correct! ✓" : `Wrong — the answer was "${lastCorrectAnswer}"`}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function QuizBattlePage() {
  const router = useRouter();
  const { phase, myPlayerId, sessionId } = useMultiplayerStore();

  useEffect(() => {
    if (!myPlayerId && !sessionId) { router.replace("/battle"); return; }
    if (phase === "results") { router.replace("/battle/results"); }
  }, [phase, myPlayerId, sessionId]);

  return (
    <div className="max-w-xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
      <ScoreBar />
      {phase === "countdown" ? <CountdownView /> : <QuestionView />}
    </div>
  );
}
