"use client";

import { useMultiplayerStore } from "@/store/multiplayer-store";
import { Loader2, RotateCcw, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BattleResultsPage() {
  const router = useRouter();
  const { gameResults, myPlayerId, phase, rematchRequested, partnerWantsRematch, sendRematch, reset } = useMultiplayerStore();

  useEffect(() => {
    if (!gameResults && !myPlayerId) { router.replace("/battle"); }
  }, []);

  useEffect(() => {
    if (phase === "lobby" && !gameResults) { router.replace("/battle/quiz"); }
  }, [phase, gameResults]);

  if (!gameResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-neutral-500">No results available</p>
        <button type="button" onClick={() => { reset(); router.push("/battle"); }} className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-semibold">
          Back to Battle
        </button>
      </div>
    );
  }

  const me = gameResults.players.find((p) => p.id === myPlayerId);
  const opponent = gameResults.players.find((p) => p.id !== myPlayerId);
  const iWon = gameResults.winner === myPlayerId;
  const isTie = gameResults.winner === null;

  const myAccuracy = me && me.totalAnswers > 0 ? Math.round((me.correctAnswers / me.totalAnswers) * 100) : 0;
  const opponentAccuracy = opponent && opponent.totalAnswers > 0 ? Math.round((opponent.correctAnswers / opponent.totalAnswers) * 100) : 0;
  const xpEarned = iWon ? 100 : 30;

  const resultConfig = iWon
    ? { label: "You Won!", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", icon: "🏆" }
    : isTie
    ? { label: "It's a Tie!", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", icon: "🤝" }
    : { label: "You Lost", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: "💪" };

  return (
    <div className="max-w-md mx-auto px-4 py-10 flex flex-col items-center gap-8">
      {/* Result */}
      <div className="flex flex-col items-center gap-2">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl ${resultConfig.bg}`}>
          {resultConfig.icon}
        </div>
        <p className={`text-3xl font-bold ${resultConfig.text}`}>{resultConfig.label}</p>
        <p className="text-sm text-neutral-500">+{xpEarned} XP earned</p>
      </div>

      {/* Scores */}
      <div className="w-full rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-5">
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <p className="text-sm text-neutral-500 mb-1">{me?.name ?? "You"}</p>
            <p className="text-3xl font-bold text-blue-500">{me?.score ?? 0}</p>
            <p className="text-xs text-neutral-400 mt-1">{me?.correctAnswers}/{me?.totalAnswers} correct</p>
            <p className="text-xs text-neutral-400">{myAccuracy}% accuracy</p>
          </div>
          <div className="w-px h-16 bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex-1 text-center">
            <p className="text-sm text-neutral-500 mb-1">{opponent?.name ?? "Opponent"}</p>
            <p className="text-3xl font-bold text-red-500">{opponent?.score ?? 0}</p>
            <p className="text-xs text-neutral-400 mt-1">{opponent?.correctAnswers}/{opponent?.totalAnswers} correct</p>
            <p className="text-xs text-neutral-400">{opponentAccuracy}% accuracy</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full space-y-3">
        <button
          type="button"
          onClick={sendRematch}
          disabled={rematchRequested}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors disabled:opacity-60"
        >
          {rematchRequested ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {partnerWantsRematch ? "Starting rematch…" : "Waiting for opponent…"}
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              Rematch{partnerWantsRematch ? " (Opponent ready!)" : ""}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => { reset(); router.push("/battle"); }}
          className="w-full py-3.5 rounded-xl border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
        >
          New Match
        </button>

        <button
          type="button"
          onClick={() => { reset(); router.push("/listen"); }}
          className="w-full py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Back to Practice
        </button>
      </div>
    </div>
  );
}
