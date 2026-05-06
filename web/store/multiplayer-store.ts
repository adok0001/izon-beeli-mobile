import { create } from "zustand";
import type { QuizQuestion, MultiplayerPhase } from "@/types";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

interface PlayerInfo {
  id: string;
  name: string;
  ready?: boolean;
}

interface MultiplayerState {
  socket: WebSocket | null;
  connectionStatus: ConnectionStatus;
  sessionId: string;
  sessionType: "quiz_battle" | "paired_lesson" | null;
  inviteCode: string | null;
  players: PlayerInfo[];
  myPlayerId: string;

  _roomUrl: string;
  _token: string;
  _params: Record<string, string>;
  _reconnectAttempts: number;

  rematchRequested: boolean;
  partnerWantsRematch: boolean;

  currentQuestion: QuizQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  myScore: number;
  opponentScore: number;
  timeRemaining: number;
  opponentAnswered: boolean;
  lastAnswerCorrect: boolean | null;
  lastCorrectAnswer: string | null;

  phase: MultiplayerPhase;
  gameResults: {
    winner: string | null;
    players: {
      id: string;
      name: string;
      score: number;
      correctAnswers: number;
      totalAnswers: number;
    }[];
  } | null;

  connect: (roomUrl: string, token: string, params: Record<string, string>) => void;
  disconnect: () => void;
  sendReady: () => void;
  sendAnswer: (questionId: string, answer: string) => void;
  sendRematch: () => void;
  reset: () => void;
}

const initialState = {
  socket: null,
  connectionStatus: "disconnected" as ConnectionStatus,
  sessionId: "",
  sessionType: null as "quiz_battle" | "paired_lesson" | null,
  inviteCode: null as string | null,
  players: [] as PlayerInfo[],
  myPlayerId: "",
  _roomUrl: "",
  _token: "",
  _params: {} as Record<string, string>,
  _reconnectAttempts: 0,
  rematchRequested: false,
  partnerWantsRematch: false,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  myScore: 0,
  opponentScore: 0,
  timeRemaining: 15,
  opponentAnswered: false,
  lastAnswerCorrect: null as boolean | null,
  lastCorrectAnswer: null as string | null,
  phase: "lobby" as MultiplayerPhase,
  gameResults: null,
};

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  ...initialState,

  connect: (roomUrl, token, params) => {
    const { socket: existing } = get();
    if (existing) existing.close();
    set({ connectionStatus: "connecting", _roomUrl: roomUrl, _token: token, _params: params, _reconnectAttempts: 0 });
    _openSocket(roomUrl, token, params, set, get);
  },

  disconnect: () => {
    _clearReconnectTimer();
    const { socket } = get();
    if (socket) socket.close();
    set({ socket: null, connectionStatus: "disconnected", _reconnectAttempts: 0 });
  },

  sendReady: () => {
    get().socket?.send(JSON.stringify({ type: "ready" }));
  },

  sendAnswer: (questionId, answer) => {
    get().socket?.send(JSON.stringify({ type: "answer", questionId, selectedAnswer: answer }));
  },

  sendRematch: () => {
    get().socket?.send(JSON.stringify({ type: "rematch" }));
    set({ rematchRequested: true });
  },

  reset: () => {
    _clearReconnectTimer();
    const { socket } = get();
    if (socket) socket.close();
    set({ ...initialState });
  },
}));

let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function _clearReconnectTimer() {
  if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
}

function _openSocket(
  roomUrl: string,
  token: string,
  params: Record<string, string>,
  set: (state: Partial<MultiplayerState>) => void,
  get: () => MultiplayerState
) {
  const url = new URL(roomUrl);
  url.searchParams.set("token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const ws = new WebSocket(url.toString());

  ws.onopen = () => set({ socket: ws, connectionStatus: "connected", _reconnectAttempts: 0 });

  ws.onclose = () => {
    set({ socket: null });
    const { phase, _reconnectAttempts } = get();
    if (phase === "results" || _reconnectAttempts >= 5) { set({ connectionStatus: "disconnected" }); return; }
    const delay = Math.min(1000 * Math.pow(2, _reconnectAttempts), 30000);
    set({ connectionStatus: "reconnecting", _reconnectAttempts: _reconnectAttempts + 1 });
    _clearReconnectTimer();
    _reconnectTimer = setTimeout(() => {
      const s = get();
      _openSocket(s._roomUrl, s._token, s._params, set, get);
    }, delay);
  };

  ws.onerror = () => {};

  ws.onmessage = (event) => {
    try { handleMessage(JSON.parse(event.data as string), set, get); } catch {}
  };

  set({ socket: ws });
}

let _questionTimer: ReturnType<typeof setInterval> | null = null;

function _startQuestionTimer(set: (state: Partial<MultiplayerState>) => void, get: () => MultiplayerState) {
  if (_questionTimer) clearInterval(_questionTimer);
  set({ timeRemaining: 15 });
  _questionTimer = setInterval(() => {
    const { timeRemaining, phase } = get();
    if (phase !== "playing" || timeRemaining <= 0) { if (_questionTimer) { clearInterval(_questionTimer); _questionTimer = null; } return; }
    set({ timeRemaining: timeRemaining - 1 });
  }, 1000);
}

function handleMessage(
  msg: Record<string, unknown>,
  set: (state: Partial<MultiplayerState>) => void,
  get: () => MultiplayerState
) {
  switch (msg.type) {
    case "session_info":
      set({ sessionId: msg.sessionId as string, myPlayerId: msg.playerId as string });
      break;
    case "player_joined":
      set({ players: [...get().players.filter((p) => p.id !== (msg.player as PlayerInfo).id), msg.player as PlayerInfo] });
      break;
    case "player_left":
      set({ players: get().players.filter((p) => p.id !== msg.playerId) });
      break;
    case "waiting_for_ready":
      set({ players: msg.players as PlayerInfo[], phase: "lobby" });
      break;
    case "countdown":
      set({ phase: "countdown", timeRemaining: msg.seconds as number });
      break;
    case "question":
      set({
        phase: "playing",
        currentQuestion: msg.question as QuizQuestion,
        questionIndex: msg.index as number,
        totalQuestions: msg.total as number,
        opponentAnswered: false,
        lastAnswerCorrect: null,
        lastCorrectAnswer: null,
      });
      _startQuestionTimer(set, get);
      break;
    case "opponent_answered":
      set({ opponentAnswered: true });
      break;
    case "answer_result":
      set({
        phase: "between_questions",
        lastAnswerCorrect: msg.correct as boolean,
        lastCorrectAnswer: msg.correctAnswer as string,
        myScore: msg.myScore as number,
        opponentScore: msg.opponentScore as number,
      });
      break;
    case "game_over":
      set({ phase: "results", gameResults: { winner: msg.winner as string | null, players: msg.players as NonNullable<MultiplayerState["gameResults"]>["players"] } });
      break;
    case "partner_rematch":
      set({ partnerWantsRematch: true });
      break;
    case "rematch_starting":
      set({
        phase: "lobby",
        gameResults: null,
        rematchRequested: false,
        partnerWantsRematch: false,
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        myScore: 0,
        opponentScore: 0,
        lastAnswerCorrect: null,
        lastCorrectAnswer: null,
      });
      break;
    case "opponent_forfeited":
      set({
        phase: "results",
        gameResults: get().gameResults ?? {
          winner: get().myPlayerId,
          players: get().players.map((p) => ({
            id: p.id,
            name: p.name,
            score: p.id === get().myPlayerId ? get().myScore : get().opponentScore,
            correctAnswers: 0,
            totalAnswers: 0,
          })),
        },
      });
      break;
    case "error":
      console.warn("[Multiplayer]", msg.message);
      break;
  }
}
