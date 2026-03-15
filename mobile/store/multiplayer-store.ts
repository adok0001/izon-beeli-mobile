import { create } from "zustand";
import type { QuizQuestion, MultiplayerPhase } from "@/types";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

interface PlayerInfo {
  id: string;
  name: string;
  ready?: boolean;
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

interface MultiplayerState {
  // Connection
  socket: WebSocket | null;
  connectionStatus: ConnectionStatus;
  sessionId: string;
  sessionType: "quiz_battle" | "paired_lesson" | null;
  inviteCode: string | null;
  players: PlayerInfo[];
  myPlayerId: string;

  // Reconnect params (kept so we can rejoin after a drop)
  _roomUrl: string;
  _token: string;
  _params: Record<string, string>;
  _reconnectAttempts: number;

  // Rematch
  rematchRequested: boolean;
  partnerWantsRematch: boolean;

  // Quiz battle
  currentQuestion: QuizQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  myScore: number;
  opponentScore: number;
  timeRemaining: number;
  opponentAnswered: boolean;
  lastAnswerCorrect: boolean | null;
  lastCorrectAnswer: string | null;

  // Paired lesson
  currentTurn: string;
  currentExercise: QuizQuestion | null;
  exerciseIndex: number;
  totalExercises: number;
  chatMessages: ChatMessage[];

  // Game results
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

  // Actions
  connect: (roomUrl: string, token: string, params: Record<string, string>) => void;
  disconnect: () => void;
  sendReady: () => void;
  sendAnswer: (questionId: string, answer: string) => void;
  sendReaction: (emoji: string) => void;
  sendChat: (text: string) => void;
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
  currentTurn: "",
  currentExercise: null,
  exerciseIndex: 0,
  totalExercises: 0,
  chatMessages: [] as ChatMessage[],
  phase: "lobby" as MultiplayerPhase,
  gameResults: null,
};

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  ...initialState,

  connect: (roomUrl, token, params) => {
    const { socket: existing } = get();
    if (existing) existing.close();

    set({
      connectionStatus: "connecting",
      _roomUrl: roomUrl,
      _token: token,
      _params: params,
      _reconnectAttempts: 0,
    });

    _openSocket(roomUrl, token, params, set, get);
  },

  disconnect: () => {
    _clearReconnectTimer();
    const { socket } = get();
    if (socket) socket.close();
    set({ socket: null, connectionStatus: "disconnected", _reconnectAttempts: 0 });
  },

  sendReady: () => {
    const { socket } = get();
    socket?.send(JSON.stringify({ type: "ready" }));
  },

  sendAnswer: (questionId, answer) => {
    const { socket } = get();
    socket?.send(JSON.stringify({ type: "answer", questionId, selectedAnswer: answer, exerciseId: questionId, answer }));
  },

  sendReaction: (emoji) => {
    const { socket } = get();
    socket?.send(JSON.stringify({ type: "react", emoji }));
  },

  sendChat: (text) => {
    const { socket } = get();
    socket?.send(JSON.stringify({ type: "chat", text }));
  },

  sendRematch: () => {
    const { socket } = get();
    socket?.send(JSON.stringify({ type: "rematch" }));
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
  if (_reconnectTimer) {
    clearTimeout(_reconnectTimer);
    _reconnectTimer = null;
  }
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
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const ws = new WebSocket(url.toString());

  ws.onopen = () => {
    set({ socket: ws, connectionStatus: "connected", _reconnectAttempts: 0 });
  };

  ws.onclose = () => {
    set({ socket: null });
    const { phase, _reconnectAttempts } = get();
    // Don't reconnect if the game has ended or we've tried too many times
    if (phase === "results" || _reconnectAttempts >= 5) {
      set({ connectionStatus: "disconnected" });
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, _reconnectAttempts), 30000);
    set({ connectionStatus: "reconnecting", _reconnectAttempts: _reconnectAttempts + 1 });
    _clearReconnectTimer();
    _reconnectTimer = setTimeout(() => {
      const state = get();
      _openSocket(state._roomUrl, state._token, state._params, set, get);
    }, delay);
  };

  ws.onerror = () => {
    // onclose will fire after onerror, so reconnect logic lives there
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg, set, get);
    } catch {
      // ignore parse errors
    }
  };

  set({ socket: ws });
}

function handleMessage(
  msg: any,
  set: (state: Partial<MultiplayerState>) => void,
  get: () => MultiplayerState
) {
  switch (msg.type) {
    case "session_info":
      set({ sessionId: msg.sessionId, myPlayerId: msg.playerId });
      break;

    case "player_joined":
      set({
        players: [...get().players.filter((p) => p.id !== msg.player.id), msg.player],
      });
      break;

    case "player_left":
      set({ players: get().players.filter((p) => p.id !== msg.playerId) });
      break;

    case "waiting_for_ready":
      set({ players: msg.players, phase: "lobby" });
      break;

    case "countdown":
      set({ phase: "countdown", timeRemaining: msg.seconds });
      break;

    case "question":
      set({
        phase: "playing",
        currentQuestion: msg.question,
        questionIndex: msg.index,
        totalQuestions: msg.total,
        opponentAnswered: false,
        lastAnswerCorrect: null,
        lastCorrectAnswer: null,
        timeRemaining: 15,
      });
      // Start local countdown
      startQuestionTimer(set, get);
      break;

    case "opponent_answered":
      set({ opponentAnswered: true });
      break;

    case "answer_result":
      set({
        phase: "between_questions",
        lastAnswerCorrect: msg.correct,
        lastCorrectAnswer: msg.correctAnswer,
        myScore: msg.myScore,
        opponentScore: msg.opponentScore,
      });
      break;

    case "game_over":
      set({
        phase: "results",
        gameResults: {
          winner: msg.winner,
          players: msg.players,
        },
      });
      break;

    // Paired lesson messages
    case "lesson_started":
      set({ phase: "playing" });
      break;

    case "your_turn":
    case "partner_turn":
      set({
        phase: "playing",
        currentExercise: msg.exercise,
        exerciseIndex: msg.index,
        totalExercises: msg.total,
        currentTurn: msg.currentTurnPlayer,
        lastAnswerCorrect: null,
        lastCorrectAnswer: null,
      });
      break;

    case "partner_answered":
      set({
        lastAnswerCorrect: msg.correct,
        lastCorrectAnswer: msg.correctAnswer,
      });
      break;

    case "lesson_complete":
      set({
        phase: "results",
        gameResults: {
          winner: null,
          players: msg.players,
        },
      });
      break;

    case "partner_rematch":
      // Partner has clicked rematch
      set({ partnerWantsRematch: true });
      break;

    case "rematch_starting":
      // Both players accepted — reset game state but keep connection
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
        currentExercise: null,
        exerciseIndex: 0,
        totalExercises: 0,
        chatMessages: [],
      });
      break;

    case "reaction":
      // Could trigger a visual reaction animation
      break;

    case "chat":
      set({
        chatMessages: [...get().chatMessages, msg.message],
      });
      break;

    case "chat_history":
      set({ chatMessages: msg.messages });
      break;

    case "player_disconnected":
      set({ connectionStatus: "reconnecting" });
      break;

    case "player_reconnected":
      set({ connectionStatus: "connected" });
      break;

    case "opponent_forfeited":
    case "partner_forfeited":
      // Opponent left — end game with current results
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

let questionTimerInterval: ReturnType<typeof setInterval> | null = null;

function startQuestionTimer(
  set: (state: Partial<MultiplayerState>) => void,
  get: () => MultiplayerState
) {
  if (questionTimerInterval) clearInterval(questionTimerInterval);

  set({ timeRemaining: 15 });
  questionTimerInterval = setInterval(() => {
    const { timeRemaining, phase } = get();
    if (phase !== "playing" || timeRemaining <= 0) {
      if (questionTimerInterval) {
        clearInterval(questionTimerInterval);
        questionTimerInterval = null;
      }
      return;
    }
    set({ timeRemaining: timeRemaining - 1 });
  }, 1000);
}
