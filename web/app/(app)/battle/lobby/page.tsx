"use client";

import { useLeaveMatchmaking, useMatchmakingStatus } from "@/lib/hooks/use-multiplayer";
import { useMultiplayerStore } from "@/store/multiplayer-store";
import { useAuth, useUser } from "@clerk/nextjs";
import { CheckCircle2, Copy, Loader2, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

function LobbyContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const { getToken, userId } = useAuth();
  const params = useSearchParams();

  const sessionId = params.get("sessionId") ?? undefined;
  const inviteCode = params.get("inviteCode") ?? undefined;
  const type = params.get("type") ?? "quiz_battle";
  const partyRoomId = params.get("partyRoomId") ?? undefined;
  const languageId = params.get("languageId") ?? "";
  const isMatchmaking = params.get("matchmaking") === "true";

  const { connectionStatus, players, phase, connect, sendReady, reset } = useMultiplayerStore();
  const leaveMatchmaking = useLeaveMatchmaking();
  const { data: matchStatus } = useMatchmakingStatus(isMatchmaking && !sessionId);

  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const matchHandled = useRef(false);

  useEffect(() => {
    if (!partyRoomId || !sessionId) return;
    const connectToRoom = async () => {
      const token = await getToken();
      if (!token) return;
      const partyName = type === "paired_lesson" ? "paired_lesson" : "main";
      const protocol = PARTYKIT_HOST.includes("localhost") ? "ws" : "wss";
      const roomUrl = `${protocol}://${PARTYKIT_HOST}/parties/${partyName}/${partyRoomId}`;
      connect(roomUrl, token, {
        name: user?.username ?? user?.firstName ?? "Player",
        sessionId,
        languageId,
        playerId: userId ?? sessionId,
      });
    };
    connectToRoom();
  }, [partyRoomId, sessionId]);

  useEffect(() => {
    if (matchHandled.current) return;
    if (matchStatus?.status === "matched" && matchStatus.session) {
      matchHandled.current = true;
      const s = matchStatus.session;
      const p = new URLSearchParams({
        sessionId: s.id,
        inviteCode: s.inviteCode ?? "",
        type: s.type,
        partyRoomId: s.partyRoomId,
        languageId: s.languageId,
      });
      router.replace(`/battle/lobby?${p}`);
    }
  }, [matchStatus]);

  useEffect(() => {
    if (phase === "countdown" || phase === "playing") {
      router.replace("/battle/quiz");
    }
  }, [phase]);

  const handleReady = () => { sendReady(); setReady(true); };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    await navigator.clipboard?.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = () => {
    if (isMatchmaking) leaveMatchmaking.mutate();
    reset();
    router.push("/battle");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center gap-8">
      {/* Invite code */}
      {inviteCode && (
        <button
          type="button"
          onClick={handleCopyCode}
          className="w-full flex flex-col items-center gap-2 p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Invite Code</span>
          <span className="text-4xl font-bold tracking-[0.3em] text-neutral-900 dark:text-white">{inviteCode}</span>
          <span className="flex items-center gap-1.5 text-sm text-blue-500">
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Tap to copy"}
          </span>
        </button>
      )}

      {/* Players */}
      <div className="w-full">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Players</p>
        <div className="flex justify-center gap-8">
          {players.length > 0 ? (
            players.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{p.name}</span>
                {p.ready && <span className="text-xs text-green-500 font-medium">Ready ✓</span>}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <User className="h-7 w-7 text-neutral-400" />
              </div>
              <span className="text-sm text-neutral-500">You</span>
            </div>
          )}
          {players.length < 2 && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
              </div>
              <span className="text-sm text-neutral-400">Waiting...</span>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      {isMatchmaking && !sessionId && (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-sm text-neutral-500">{t("multiplayer.matchmakingError", { defaultValue: "Looking for an opponent…" })}</p>
        </div>
      )}

      {connectionStatus === "connecting" && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting…
        </div>
      )}

      {/* Ready button */}
      {players.length >= 2 && !ready && connectionStatus === "connected" && (
        <button
          type="button"
          onClick={handleReady}
          className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white text-lg font-bold transition-colors"
        >
          Ready!
        </button>
      )}

      {ready && (
        <p className="text-sm text-neutral-500">Waiting for opponent to be ready…</p>
      )}

      <button
        type="button"
        onClick={handleCancel}
        className="text-sm text-red-500 hover:text-red-600 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense>
      <LobbyContent />
    </Suspense>
  );
}
