import { create } from "zustand";
import type { QuizQuestion, MultiplayerPhase } from "@/types";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

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

    set({ connectionStatus: "connecting" });

    const url = new URL(roomUrl);
    url.searchParams.set("token", token);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const ws = new WebSocket(url.toString());

    ws.onopen = () => {
      set({ socket: ws, connectionStatus: "connected" });
    };

    ws.onclose = () => {
      set({ socket: null, connectionStatus: "disconnected" });
    };

    ws.onerror = () => {
      set({ socket: null, connectionStatus: "disconnected" });
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
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ socket: null, connectionStatus: "disconnected" });
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

  reset: () => {
    const { socket } = get();
    if (socket) socket.close();
    set({ ...initialState });
  },
}));

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
    case "player_reconnected":
    case "opponent_forfeited":
    case "partner_forfeited":
      // These could trigger UI indicators
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
