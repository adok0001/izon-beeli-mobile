import type * as Party from "partykit/server";

// Room ID format: "matchmaking-{type}-{languageId}"
// One room per (type, languageId) combination.
// Players connect while queued. Server polls DB every 3s for matches.

interface QueuedPlayer {
  playerId: string;
  connectionId: string;
}

export default class MatchmakingRoom implements Party.Server {
  players: Map<string, QueuedPlayer> = new Map();
  pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const playerId = url.searchParams.get("playerId") ?? "";

    if (!playerId) {
      conn.close();
      return;
    }

    this.players.set(playerId, { playerId, connectionId: conn.id });

    // Start polling if not already
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => this.pollForMatches(), 3000);
    }
  }

  onClose(conn: Party.Connection) {
    for (const [playerId, player] of this.players) {
      if (player.connectionId === conn.id) {
        this.players.delete(playerId);
        break;
      }
    }

    if (this.players.size === 0 && this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    // Handle cancel messages
    try {
      const msg = JSON.parse(message);
      if (msg.type === "cancel") {
        for (const [playerId, player] of this.players) {
          if (player.connectionId === sender.id) {
            this.players.delete(playerId);
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private async pollForMatches() {
    if (this.players.size === 0) return;

    try {
      const apiUrl = process.env.API_URL ?? "http://localhost:3000/api";
      const apiKey = process.env.PARTYKIT_API_KEY ?? "";

      for (const [playerId, player] of this.players) {
        const res = await fetch(
          `${apiUrl}/multiplayer/matchmaking/status?playerId=${playerId}`,
          { headers: { "x-api-key": apiKey } }
        );

        if (!res.ok) continue;
        const data = await res.json();

        if (data.matched && data.sessionId) {
          // Notify the matched player
          const conn = this.getConnection(player.connectionId);
          if (conn) {
            conn.send(JSON.stringify({
              type: "matched",
              sessionId: data.sessionId,
              roomId: data.partyRoomId,
            }));
          }
          this.players.delete(playerId);
        }
      }
    } catch {
      // Polling failure — retry next interval
    }
  }

  private getConnection(connectionId: string): Party.Connection | undefined {
    for (const conn of this.room.getConnections()) {
      if (conn.id === connectionId) return conn;
    }
    return undefined;
  }
}
