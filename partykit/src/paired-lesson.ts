import type * as Party from "partykit/server";
import { verifyToken } from "@clerk/backend";

interface Player {
  id: string;
  name: string;
  connected: boolean;
  connectionId: string;
  ready: boolean;
  correctAnswers: number;
  totalAnswers: number;
}

interface Exercise {
  id: string;
  type: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

type Phase = "lobby" | "playing" | "results";

interface GameState {
  players: Map<string, Player>;
  exercises: Exercise[];
  currentExerciseIndex: number;
  currentTurnPlayerId: string;
  phase: Phase;
  languageId: string;
  lessonId: string;
  sessionId: string;
  chatMessages: ChatMessage[];
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
}

type ClientMessage =
  | { type: "ready" }
  | { type: "answer"; exerciseId: string; answer: string }
  | { type: "react"; emoji: string }
  | { type: "chat"; text: string }
  | { type: "rematch" };

export default class PairedLessonRoom implements Party.Server {
  state: GameState;

  constructor(readonly room: Party.Room) {
    this.state = {
      players: new Map(),
      exercises: [],
      currentExerciseIndex: 0,
      currentTurnPlayerId: "",
      phase: "lobby",
      languageId: "",
      lessonId: "",
      sessionId: "",
      chatMessages: [],
      disconnectTimers: new Map(),
    };
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get("token");
    const name = url.searchParams.get("name") ?? "Player";
    const sessionId = url.searchParams.get("sessionId") ?? "";
    const languageId = url.searchParams.get("languageId") ?? "";
    const lessonId = url.searchParams.get("lessonId") ?? "";
    const playerId = url.searchParams.get("playerId") ?? "";

    if (!token || !playerId) {
      conn.send(JSON.stringify({ type: "error", message: "Missing auth token or player ID" }));
      conn.close();
      return;
    }

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
      this.state.lessonId = lessonId;
    }

    // Reconnection
    const existingPlayer = this.state.players.get(playerId);
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.connectionId = conn.id;
      const timer = this.state.disconnectTimers.get(playerId);
      if (timer) {
        clearTimeout(timer);
        this.state.disconnectTimers.delete(playerId);
      }
      this.broadcast(JSON.stringify({ type: "player_reconnected", playerId }));
      this.sendStateToPlayer(conn, playerId);
      return;
    }

    if (this.state.players.size >= 2) {
      conn.send(JSON.stringify({ type: "error", message: "Room is full" }));
      conn.close();
      return;
    }

    if (this.state.phase !== "lobby") {
      conn.send(JSON.stringify({ type: "error", message: "Lesson already in progress" }));
      conn.close();
      return;
    }

    const player: Player = {
      id: playerId,
      name,
      connected: true,
      connectionId: conn.id,
      ready: false,
      correctAnswers: 0,
      totalAnswers: 0,
    };

    this.state.players.set(playerId, player);

    conn.send(JSON.stringify({ type: "session_info", sessionId: this.state.sessionId, playerId }));

    this.broadcast(JSON.stringify({
      type: "player_joined",
      player: { id: playerId, name },
    }));

    this.broadcastLobbyState();
  }

  onClose(conn: Party.Connection) {
    for (const [playerId, player] of this.state.players) {
      if (player.connectionId === conn.id) {
        player.connected = false;

        if (this.state.phase === "lobby") {
          this.state.players.delete(playerId);
          this.broadcast(JSON.stringify({ type: "player_left", playerId }));
          this.broadcastLobbyState();
        } else {
          this.broadcast(JSON.stringify({ type: "player_disconnected", playerId }));
          const timer = setTimeout(() => {
            this.state.players.delete(playerId);
            this.broadcast(JSON.stringify({ type: "partner_forfeited", playerId }));
            this.endLesson();
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
        this.handleAnswer(player, msg.exerciseId, msg.answer);
        break;
      case "react":
        this.broadcast(JSON.stringify({
          type: "reaction",
          playerId: player.id,
          playerName: player.name,
          emoji: msg.emoji,
        }));
        break;
      case "chat":
        this.handleChat(player, msg.text);
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

    const players = Array.from(this.state.players.values());
    if (players.length === 2 && players.every((p) => p.ready)) {
      this.startLesson();
    }
  }

  private async startLesson() {
    // Fetch exercises from API
    try {
      const apiUrl = process.env.API_URL ?? "http://localhost:3000/api";
      const apiKey = process.env.PARTYKIT_API_KEY ?? "";
      const res = await fetch(
        `${apiUrl}/multiplayer/quiz-questions?languageId=${this.state.languageId}&count=10`,
        { headers: { "x-api-key": apiKey } }
      );
      if (!res.ok) throw new Error("Failed to fetch exercises");
      this.state.exercises = await res.json();
    } catch {
      this.broadcast(JSON.stringify({ type: "error", message: "Failed to load exercises." }));
      this.state.phase = "lobby";
      for (const p of this.state.players.values()) p.ready = false;
      this.broadcastLobbyState();
      return;
    }

    this.state.phase = "playing";
    this.state.currentExerciseIndex = 0;

    // First player in the map gets first turn
    const playerIds = Array.from(this.state.players.keys());
    this.state.currentTurnPlayerId = playerIds[0];

    this.broadcast(JSON.stringify({ type: "lesson_started" }));
    this.sendCurrentExercise();
  }

  private sendCurrentExercise() {
    const exercise = this.state.exercises[this.state.currentExerciseIndex];
    if (!exercise) {
      this.endLesson();
      return;
    }

    // Tell each player if it's their turn or their partner's turn
    for (const [playerId, player] of this.state.players) {
      const conn = this.getConnectionForPlayer(player);
      if (!conn) continue;

      const isMyTurn = playerId === this.state.currentTurnPlayerId;
      conn.send(JSON.stringify({
        type: isMyTurn ? "your_turn" : "partner_turn",
        exercise,
        index: this.state.currentExerciseIndex,
        total: this.state.exercises.length,
        currentTurnPlayer: this.state.currentTurnPlayerId,
      }));
    }
  }

  private handleAnswer(player: Player, exerciseId: string, answer: string) {
    if (this.state.phase !== "playing") return;
    if (player.id !== this.state.currentTurnPlayerId) return;

    const exercise = this.state.exercises[this.state.currentExerciseIndex];
    if (!exercise || exercise.id !== exerciseId) return;

    player.totalAnswers++;
    const correct = answer === exercise.correctAnswer;
    if (correct) player.correctAnswers++;

    // Notify both players
    this.broadcast(JSON.stringify({
      type: "partner_answered",
      playerId: player.id,
      playerName: player.name,
      correct,
      correctAnswer: exercise.correctAnswer,
      selectedAnswer: answer,
      exerciseIndex: this.state.currentExerciseIndex,
    }));

    // Advance to next exercise and switch turns
    this.state.currentExerciseIndex++;
    const playerIds = Array.from(this.state.players.keys());
    const currentIdx = playerIds.indexOf(this.state.currentTurnPlayerId);
    this.state.currentTurnPlayerId = playerIds[(currentIdx + 1) % playerIds.length];

    // Small delay before next exercise
    setTimeout(() => {
      this.sendCurrentExercise();
    }, 2000);
  }

  private handleChat(player: Player, text: string) {
    if (text.length > 200) text = text.slice(0, 200);

    const chatMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      playerId: player.id,
      playerName: player.name,
      text,
      timestamp: Date.now(),
    };

    this.state.chatMessages.push(chatMsg);

    this.broadcast(JSON.stringify({
      type: "chat",
      message: chatMsg,
    }));
  }

  private handleRematch(player: Player) {
    if (this.state.phase !== "results") return;

    if (!(this.state as any)._rematchVotes) {
      (this.state as any)._rematchVotes = new Set<string>();
    }
    const votes = (this.state as any)._rematchVotes as Set<string>;
    votes.add(player.id);

    // Notify the partner
    for (const [id, p] of this.state.players) {
      if (id !== player.id) {
        const conn = this.getConnectionForPlayer(p);
        if (conn) {
          conn.send(JSON.stringify({ type: "partner_rematch" }));
        }
      }
    }

    // If both want a rematch, reset and restart
    if (votes.size >= this.state.players.size) {
      votes.clear();
      for (const p of this.state.players.values()) {
        p.correctAnswers = 0;
        p.totalAnswers = 0;
        p.ready = false;
      }
      this.state.currentExerciseIndex = 0;
      this.state.exercises = [];
      this.state.chatMessages = [];
      this.state.phase = "lobby";

      this.broadcast(JSON.stringify({ type: "rematch_starting" }));
      this.broadcastLobbyState();
    }
  }

  private async endLesson() {
    this.state.phase = "results";

    const players = Array.from(this.state.players.values());

    this.broadcast(JSON.stringify({
      type: "lesson_complete",
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        correctAnswers: p.correctAnswers,
        totalAnswers: p.totalAnswers,
      })),
      totalExercises: this.state.exercises.length,
    }));

    // Persist via API
    try {
      const apiUrl = process.env.API_URL ?? "http://localhost:3000/api";
      const apiKey = process.env.PARTYKIT_API_KEY ?? "";
      await fetch(`${apiUrl}/multiplayer/sessions/${this.state.sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({
          players: players.map((p) => ({
            id: p.id,
            score: p.correctAnswers * 10,
            correctAnswers: p.correctAnswers,
            totalAnswers: p.totalAnswers,
          })),
          winner: null, // cooperative mode
        }),
      });
    } catch {
      // Best effort
    }
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
    if (this.state.phase === "playing") {
      const exercise = this.state.exercises[this.state.currentExerciseIndex];
      if (exercise) {
        const isMyTurn = playerId === this.state.currentTurnPlayerId;
        conn.send(JSON.stringify({
          type: isMyTurn ? "your_turn" : "partner_turn",
          exercise,
          index: this.state.currentExerciseIndex,
          total: this.state.exercises.length,
          currentTurnPlayer: this.state.currentTurnPlayerId,
        }));
      }
      // Send chat history
      conn.send(JSON.stringify({
        type: "chat_history",
        messages: this.state.chatMessages,
      }));
    }
  }

  private broadcast(message: string) {
    for (const conn of this.room.getConnections()) {
      conn.send(message);
    }
  }
}
