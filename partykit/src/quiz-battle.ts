import type * as Party from "partykit/server";
import { verifyToken } from "@clerk/backend";

interface Player {
  id: string;
  clerkId: string;
  name: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  ready: boolean;
  connected: boolean;
  connectionId: string;
}

interface Question {
  id: string;
  type: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
}

type Phase =
  | "lobby"
  | "countdown"
  | "question"
  | "between_questions"
  | "results";

interface GameState {
  players: Map<string, Player>;
  questions: Question[];
  currentQuestionIndex: number;
  phase: Phase;
  languageId: string;
  sessionId: string;
  questionTimer: ReturnType<typeof setTimeout> | null;
  countdownTimer: ReturnType<typeof setTimeout> | null;
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
  answeredThisRound: Set<string>;
}

// Client → Server messages
type ClientMessage =
  | { type: "ready" }
  | { type: "answer"; questionId: string; selectedAnswer: string }
  | { type: "rematch" };

// Server → Client messages
type ServerMessage =
  | { type: "player_joined"; player: { id: string; name: string } }
  | { type: "player_left"; playerId: string }
  | { type: "waiting_for_ready"; players: { id: string; name: string; ready: boolean }[] }
  | { type: "countdown"; seconds: number }
  | { type: "question"; question: Question; index: number; total: number }
  | { type: "opponent_answered" }
  | {
      type: "answer_result";
      correct: boolean;
      correctAnswer: string;
      myScore: number;
      opponentScore: number;
    }
  | {
      type: "game_over";
      winner: string | null;
      players: { id: string; name: string; score: number; correctAnswers: number; totalAnswers: number }[];
    }
  | { type: "player_disconnected"; playerId: string }
  | { type: "player_reconnected"; playerId: string }
  | { type: "opponent_forfeited"; playerId: string }
  | { type: "error"; message: string }
  | { type: "session_info"; sessionId: string; playerId: string };

export default class QuizBattleRoom implements Party.Server {
  state: GameState;

  constructor(readonly room: Party.Room) {
    this.state = {
      players: new Map(),
      questions: [],
      currentQuestionIndex: 0,
      phase: "lobby",
      languageId: "",
      sessionId: "",
      questionTimer: null,
      countdownTimer: null,
      disconnectTimers: new Map(),
      answeredThisRound: new Set(),
    };
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get("token");
    const name = url.searchParams.get("name") ?? "Player";
    const sessionId = url.searchParams.get("sessionId") ?? "";
    const languageId = url.searchParams.get("languageId") ?? "";
    const playerId = url.searchParams.get("playerId") ?? "";

    if (!token || !playerId) {
      conn.send(JSON.stringify({ type: "error", message: "Missing auth token or player ID" }));
      conn.close();
      return;
    }

    // Verify Clerk JWT
    try {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if (clerkSecretKey) {
        const payload = await verifyToken(token, { secretKey: clerkSecretKey });
        if (!payload.sub) {
          conn.send(JSON.stringify({ type: "error", message: "Invalid token" }));
          conn.close();
          return;
        }
      }
    } catch {
      conn.send(JSON.stringify({ type: "error", message: "Authentication failed" }));
      conn.close();
      return;
    }

    if (this.state.sessionId === "") {
      this.state.sessionId = sessionId;
      this.state.languageId = languageId;
    }

    // Check if this is a reconnection
    const existingPlayer = this.state.players.get(playerId);
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.connectionId = conn.id;
      // Clear disconnect timer
      const timer = this.state.disconnectTimers.get(playerId);
      if (timer) {
        clearTimeout(timer);
        this.state.disconnectTimers.delete(playerId);
      }
      this.broadcast(JSON.stringify({ type: "player_reconnected", playerId }));
      // Send current state to reconnecting player
      this.sendStateToPlayer(conn, playerId);
      return;
    }

    // Don't allow more than 2 players
    if (this.state.players.size >= 2) {
      conn.send(JSON.stringify({ type: "error", message: "Room is full" }));
      conn.close();
      return;
    }

    // Don't allow joining after game started
    if (this.state.phase !== "lobby") {
      conn.send(JSON.stringify({ type: "error", message: "Game already in progress" }));
      conn.close();
      return;
    }

    const player: Player = {
      id: playerId,
      clerkId: "",
      name,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      ready: false,
      connected: true,
      connectionId: conn.id,
    };

    this.state.players.set(playerId, player);

    // Send session info to the joining player
    conn.send(JSON.stringify({ type: "session_info", sessionId: this.state.sessionId, playerId }));

    // Broadcast player joined
    this.broadcast(JSON.stringify({
      type: "player_joined",
      player: { id: playerId, name },
    }));

    // Send lobby state
    this.broadcastLobbyState();
  }

  onClose(conn: Party.Connection) {
    // Find player by connection ID
    for (const [playerId, player] of this.state.players) {
      if (player.connectionId === conn.id) {
        player.connected = false;

        if (this.state.phase === "lobby") {
          // In lobby, just remove the player
          this.state.players.delete(playerId);
          this.broadcast(JSON.stringify({ type: "player_left", playerId }));
          this.broadcastLobbyState();
        } else {
          // In game, start 15s grace period
          this.broadcast(JSON.stringify({ type: "player_disconnected", playerId }));
          const timer = setTimeout(() => {
            // Auto-forfeit
            this.state.players.delete(playerId);
            this.broadcast(JSON.stringify({ type: "opponent_forfeited", playerId }));
            this.endGame();
          }, 15_000);
          this.state.disconnectTimers.set(playerId, timer);
        }
        break;
      }
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    const player = this.findPlayerByConnection(sender.id);
    if (!player) return;

    switch (msg.type) {
      case "ready":
        this.handleReady(player);
        break;
      case "answer":
        this.handleAnswer(player, msg.questionId, msg.selectedAnswer);
        break;
      case "rematch":
        this.handleRematch(player);
        break;
    }
  }

  private findPlayerByConnection(connectionId: string): Player | undefined {
    for (const player of this.state.players.values()) {
      if (player.connectionId === connectionId) return player;
    }
    return undefined;
  }

  private handleReady(player: Player) {
    if (this.state.phase !== "lobby") return;
    player.ready = true;
    this.broadcastLobbyState();

    // Check if all players are ready (need exactly 2)
    const players = Array.from(this.state.players.values());
    if (players.length === 2 && players.every((p) => p.ready)) {
      this.startCountdown();
    }
  }

  private async startCountdown() {
    this.state.phase = "countdown";

    // Fetch questions from API
    try {
      const apiUrl = process.env.API_URL ?? "http://localhost:3000/api";
      const apiKey = process.env.PARTYKIT_API_KEY ?? "";
      const res = await fetch(
        `${apiUrl}/multiplayer/quiz-questions?languageId=${this.state.languageId}&count=10`,
        { headers: { "x-api-key": apiKey } }
      );
      if (!res.ok) throw new Error("Failed to fetch questions");
      this.state.questions = await res.json();
    } catch {
      // Fallback: generate simple questions
      this.broadcast(JSON.stringify({ type: "error", message: "Failed to load questions. Please try again." }));
      this.state.phase = "lobby";
      for (const p of this.state.players.values()) {
        p.ready = false;
      }
      this.broadcastLobbyState();
      return;
    }

    // 3-2-1 countdown
    for (let i = 3; i >= 1; i--) {
      this.broadcast(JSON.stringify({ type: "countdown", seconds: i }));
      await this.sleep(1000);
    }

    this.sendNextQuestion();
  }

  private sendNextQuestion() {
    const { questions, currentQuestionIndex } = this.state;
    if (currentQuestionIndex >= questions.length) {
      this.endGame();
      return;
    }

    this.state.phase = "question";
    this.state.answeredThisRound = new Set();
    const question = questions[currentQuestionIndex];

    this.broadcast(JSON.stringify({
      type: "question",
      question,
      index: currentQuestionIndex,
      total: questions.length,
    }));

    // 15s timer per question
    this.state.questionTimer = setTimeout(() => {
      this.timeUp();
    }, 15_000);
  }

  private handleAnswer(player: Player, questionId: string, selectedAnswer: string) {
    if (this.state.phase !== "question") return;
    if (this.state.answeredThisRound.has(player.id)) return;

    const question = this.state.questions[this.state.currentQuestionIndex];
    if (!question || question.id !== questionId) return;

    this.state.answeredThisRound.add(player.id);
    player.totalAnswers++;

    const correct = selectedAnswer === question.correctAnswer;
    if (correct) {
      player.correctAnswers++;
      player.score += 10;
    }

    // Notify the answering player
    const opponent = this.getOpponent(player.id);
    const conn = this.getConnectionForPlayer(player);
    if (conn) {
      conn.send(JSON.stringify({
        type: "answer_result",
        correct,
        correctAnswer: question.correctAnswer,
        myScore: player.score,
        opponentScore: opponent?.score ?? 0,
      }));
    }

    // Notify opponent that this player answered
    if (opponent) {
      const oppConn = this.getConnectionForPlayer(opponent);
      if (oppConn) {
        oppConn.send(JSON.stringify({ type: "opponent_answered" }));
      }
    }

    // Check if both players answered
    if (this.state.answeredThisRound.size >= this.state.players.size) {
      this.advanceQuestion();
    }
  }

  private handleRematch(player: Player) {
    if (this.state.phase !== "results") return;

    // Track rematch requests per player
    if (!(this.state as any)._rematchVotes) {
      (this.state as any)._rematchVotes = new Set<string>();
    }
    const votes = (this.state as any)._rematchVotes as Set<string>;
    votes.add(player.id);

    // Notify the other player
    const opponent = this.getOpponent(player.id);
    if (opponent) {
      const oppConn = this.getConnectionForPlayer(opponent);
      if (oppConn) {
        oppConn.send(JSON.stringify({ type: "partner_rematch" }));
      }
    }

    // If both players want a rematch, reset and restart
    if (votes.size >= this.state.players.size) {
      votes.clear();
      // Reset player state
      for (const p of this.state.players.values()) {
        p.score = 0;
        p.correctAnswers = 0;
        p.totalAnswers = 0;
        p.ready = false;
      }
      this.state.currentQuestionIndex = 0;
      this.state.questions = [];
      this.state.answeredThisRound = new Set();
      this.state.phase = "lobby";

      this.broadcast(JSON.stringify({ type: "rematch_starting" }));
      this.broadcastLobbyState();
    }
  }

  private timeUp() {
    // Players who didn't answer get 0 points
    for (const player of this.state.players.values()) {
      if (!this.state.answeredThisRound.has(player.id)) {
        player.totalAnswers++;
        const question = this.state.questions[this.state.currentQuestionIndex];
        const conn = this.getConnectionForPlayer(player);
        if (conn && question) {
          conn.send(JSON.stringify({
            type: "answer_result",
            correct: false,
            correctAnswer: question.correctAnswer,
            myScore: player.score,
            opponentScore: this.getOpponent(player.id)?.score ?? 0,
          }));
        }
      }
    }
    this.advanceQuestion();
  }

  private async advanceQuestion() {
    if (this.state.questionTimer) {
      clearTimeout(this.state.questionTimer);
      this.state.questionTimer = null;
    }

    this.state.phase = "between_questions";
    await this.sleep(2000);

    this.state.currentQuestionIndex++;
    this.sendNextQuestion();
  }

  private async endGame() {
    this.state.phase = "results";
    if (this.state.questionTimer) {
      clearTimeout(this.state.questionTimer);
    }

    const players = Array.from(this.state.players.values());
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const winner =
      sorted.length >= 2 && sorted[0].score > sorted[1].score
        ? sorted[0].id
        : null; // null = tie

    this.broadcast(JSON.stringify({
      type: "game_over",
      winner,
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        correctAnswers: p.correctAnswers,
        totalAnswers: p.totalAnswers,
      })),
    }));

    // Persist scores via API
    try {
      const apiUrl = process.env.API_URL ?? "http://localhost:3000/api";
      const apiKey = process.env.PARTYKIT_API_KEY ?? "";
      await fetch(`${apiUrl}/multiplayer/sessions/${this.state.sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({
          players: players.map((p) => ({
            id: p.id,
            score: p.score,
            correctAnswers: p.correctAnswers,
            totalAnswers: p.totalAnswers,
          })),
          winner,
        }),
      });
    } catch {
      // Best effort — scores are already shown to players
    }
  }

  private getOpponent(playerId: string): Player | undefined {
    for (const [id, player] of this.state.players) {
      if (id !== playerId) return player;
    }
    return undefined;
  }

  private getConnectionForPlayer(player: Player): Party.Connection | undefined {
    for (const conn of this.room.getConnections()) {
      if (conn.id === player.connectionId) return conn;
    }
    return undefined;
  }

  private broadcastLobbyState() {
    const players = Array.from(this.state.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
    }));
    this.broadcast(JSON.stringify({ type: "waiting_for_ready", players }));
  }

  private sendStateToPlayer(conn: Party.Connection, playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;

    if (this.state.phase === "question") {
      const question = this.state.questions[this.state.currentQuestionIndex];
      if (question) {
        conn.send(JSON.stringify({
          type: "question",
          question,
          index: this.state.currentQuestionIndex,
          total: this.state.questions.length,
        }));
      }
    } else if (this.state.phase === "results") {
      const players = Array.from(this.state.players.values());
      const sorted = [...players].sort((a, b) => b.score - a.score);
      const winner =
        sorted.length >= 2 && sorted[0].score > sorted[1].score
          ? sorted[0].id
          : null;
      conn.send(JSON.stringify({
        type: "game_over",
        winner,
        players: players.map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          correctAnswers: p.correctAnswers,
          totalAnswers: p.totalAnswers,
        })),
      }));
    }
  }

  private broadcast(message: string) {
    for (const conn of this.room.getConnections()) {
      conn.send(message);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
