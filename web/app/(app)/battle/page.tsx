"use client";

import { useCreateSession, useJoinMatchmaking, useJoinSession, useRecentSessions } from "@/lib/hooks/use-multiplayer";
import { useLanguageStore } from "@/store/language-store";
import type { GameSession, GameSessionType } from "@/types";
import { useUser } from "@clerk/nextjs";
import { ChevronRight, Clock, Gamepad2, Swords, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// ── Mode card ─────────────────────────────────────────────────────────────────

function ModeCard({
  title,
  subtitle,
  color,
  icon: Icon,
  onQuickPlay,
  onInvite,
  loading,
}: Readonly<{
  title: string;
  subtitle: string;
  color: "blue" | "purple";
  icon: React.ElementType;
  onQuickPlay: () => void;
  onInvite: () => void;
  loading: boolean;
}>) {
  const { t } = useTranslation();

  const bgLight = color === "blue" ? "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40" : "bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40";
  const iconBg = color === "blue" ? "bg-blue-500" : "bg-purple-500";
  const btn = color === "blue" ? "bg-blue-500 hover:bg-blue-600" : "bg-purple-500 hover:bg-purple-600";
  const outline = color === "blue" ? "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30" : "border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30";
  const label = color === "blue" ? "text-blue-700 dark:text-blue-300" : "text-purple-700 dark:text-purple-300";

  return (
    <div className={`rounded-2xl border p-5 ${bgLight}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-neutral-900 dark:text-white">{title}</p>
          <p className={`text-sm ${label}`}>{subtitle}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onQuickPlay}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 ${btn}`}
        >
          {loading ? "…" : t("multiplayer.quickPlay")}
        </button>
        <button
          type="button"
          onClick={onInvite}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors disabled:opacity-60 ${outline}`}
        >
          {t("multiplayer.inviteFriend")}
        </button>
      </div>
    </div>
  );
}

// ── Recent match row ──────────────────────────────────────────────────────────

function RecentMatchRow({ session }: Readonly<{ session: GameSession }>) {
  const { t } = useTranslation();
  const isQuiz = session.type === "quiz_battle";
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isQuiz ? "bg-blue-100 dark:bg-blue-900/40" : "bg-purple-100 dark:bg-purple-900/40"}`}>
        {isQuiz
          ? <Swords className="h-4 w-4 text-blue-500" />
          : <Users className="h-4 w-4 text-purple-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-white">
          {isQuiz ? t("multiplayer.quizBattle") : t("multiplayer.pairedLesson")}
        </p>
        <p className="text-xs text-neutral-400 capitalize">
          {session.status} · {new Date(session.createdAt).toLocaleDateString()}
        </p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${session.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700"}`}>
        {session.status}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BattlePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { selectedLanguageId } = useLanguageStore();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const createSession = useCreateSession();
  const joinSession = useJoinSession();
  const joinMatchmaking = useJoinMatchmaking();
  const { data: recentSessions = [] } = useRecentSessions();

  const goToLobby = (session: GameSession) => {
    const params = new URLSearchParams({
      sessionId: session.id,
      inviteCode: session.inviteCode ?? "",
      type: session.type,
      partyRoomId: session.partyRoomId,
      languageId: session.languageId,
    });
    router.push(`/battle/lobby?${params}`);
  };

  const goToMatchmakingLobby = (type: GameSessionType) => {
    const params = new URLSearchParams({ matchmaking: "true", type, languageId: selectedLanguageId });
    router.push(`/battle/lobby?${params}`);
  };

  const handleInvite = async (type: GameSessionType) => {
    try {
      const session = await createSession.mutateAsync({ type, languageId: selectedLanguageId });
      goToLobby(session);
    } catch {
      toast.error(t("multiplayer.failedCreateSession"));
    }
  };

  const handleQuickPlay = async (type: GameSessionType) => {
    try {
      const result = await joinMatchmaking.mutateAsync({ type, languageId: selectedLanguageId });
      if (result.matched && result.session) {
        goToLobby(result.session);
      } else {
        goToMatchmakingLobby(type);
      }
    } catch {
      toast.error(t("multiplayer.failedJoinMatchmaking"));
    }
  };

  const handleJoinCode = async () => {
    if (joinCode.length < 4) return;
    setJoining(true);
    try {
      const session = await joinSession.mutateAsync(joinCode.toUpperCase());
      goToLobby(session);
    } catch {
      toast.error(t("multiplayer.codeNotFound"));
    } finally {
      setJoining(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Gamepad2 className="mx-auto mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
        <p className="font-semibold text-neutral-700 dark:text-neutral-300">{t("multiplayer.title")}</p>
        <p className="mt-1 text-sm text-neutral-400">{t("multiplayer.quizBattleSubtitle")}</p>
        <Link href="/sign-in" className="mt-4 inline-block px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors">
          Sign in to play
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("multiplayer.title")}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{t("multiplayer.multiplayerSubtitle", { defaultValue: t("multiplayer.quizBattleSubtitle") })}</p>
      </div>

      {/* Game modes */}
      <div className="space-y-3">
        <ModeCard
          title={t("multiplayer.quizBattle")}
          subtitle={t("multiplayer.quizBattleSubtitle")}
          color="blue"
          icon={Swords}
          onQuickPlay={() => handleQuickPlay("quiz_battle")}
          onInvite={() => handleInvite("quiz_battle")}
          loading={joinMatchmaking.isPending && joinMatchmaking.variables?.type === "quiz_battle"}
        />
        <ModeCard
          title={t("multiplayer.pairedLesson")}
          subtitle={t("multiplayer.pairedLessonSubtitle")}
          color="purple"
          icon={Users}
          onQuickPlay={() => handleQuickPlay("paired_lesson")}
          onInvite={() => handleInvite("paired_lesson")}
          loading={joinMatchmaking.isPending && joinMatchmaking.variables?.type === "paired_lesson"}
        />
      </div>

      {/* Join with code */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 p-5">
        <p className="font-semibold text-neutral-900 dark:text-white mb-3">{t("multiplayer.haveInviteCode")}</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder={t("multiplayer.enterCode")}
            maxLength={6}
            className="flex-1 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-center text-lg font-bold tracking-widest text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-blue-400 transition-colors"
          />
          <button
            type="button"
            onClick={handleJoinCode}
            disabled={joinCode.length < 4 || joining}
            className="px-6 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {joining ? "…" : t("multiplayer.join")}
          </button>
        </div>
      </div>

      {/* Recent matches */}
      {recentSessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{t("multiplayer.recentMatches")}</span>
          </div>
          <div className="space-y-2">
            {recentSessions.slice(0, 5).map((s) => (
              <RecentMatchRow key={s.id} session={s} />
            ))}
          </div>
        </div>
      )}

      <Link
        href="/leaderboard"
        className="flex items-center gap-3 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-violet-700 dark:text-violet-400">{t("leaderboard.title")}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-violet-400 shrink-0" />
      </Link>
    </div>
  );
}
