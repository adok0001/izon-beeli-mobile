import { Hono } from "hono";
import { eq, ne, and, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  gameSessions,
  gameSessionPlayers,
  matchmakingQueue,
  users,
  dictionaryEntries,
} from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { updateStreak } from "../lib/update-streak.js";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correct: string, pool: string[], count: number): string[] {
  return shuffle(pool.filter((s) => s !== correct)).slice(0, count);
}

// Internal API key auth for PartyKit server-to-server calls
function verifyApiKey(c: any): boolean {
  const apiKey = c.req.header("x-api-key");
  const expected = process.env.PARTYKIT_API_KEY;
  return !!expected && apiKey === expected;
}

// --- Public (API-key auth) routes ---
export const multiplayerInternalRouter = new Hono();

// GET /api/multiplayer/quiz-questions — generate quiz questions from dictionary
multiplayerInternalRouter.get("/quiz-questions", async (c) => {
  if (!verifyApiKey(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const languageId = c.req.query("languageId") ?? "";
  const count = parseInt(c.req.query("count") ?? "10", 10);

  if (!languageId) {
    return c.json({ error: "languageId is required" }, 400);
  }

  const entries = await db
    .select()
    .from(dictionaryEntries)
    .where(eq(dictionaryEntries.languageId, languageId));

  if (entries.length < 4) {
    return c.json({ error: "Not enough dictionary entries" }, 400);
  }

  const allWords = entries.map((e) => e.word);
  const allEnglish = entries.map((e) => e.english);
  const shuffled = shuffle(entries);

  const types = ["word-to-english", "english-to-word", "fill-in-the-blank", "listening"];
  const questions = [];

  for (let i = 0; i < shuffled.length && questions.length < count; i++) {
    const entry = shuffled[i];
    const typeIndex = i % types.length;
    const type = types[typeIndex];

    let q = null;
    switch (type) {
      case "word-to-english": {
        const distractors = pickDistractors(entry.english, allEnglish, 3);
        if (distractors.length >= 3) {
          q = {
            id: `q-${Math.random().toString(36).slice(2, 9)}`,
            type,
            prompt: `What does "${entry.word}" mean in English?`,
            correctAnswer: entry.english,
            options: shuffle([entry.english, ...distractors]),
          };
        }
        break;
      }
      case "english-to-word": {
        const distractors = pickDistractors(entry.word, allWords, 3);
        if (distractors.length >= 3) {
          q = {
            id: `q-${Math.random().toString(36).slice(2, 9)}`,
            type,
            prompt: `How do you say "${entry.english}"?`,
            correctAnswer: entry.word,
            options: shuffle([entry.word, ...distractors]),
          };
        }
        break;
      }
      case "fill-in-the-blank": {
        const distractors = pickDistractors(entry.word, allWords, 3);
        if (distractors.length >= 3) {
          q = {
            id: `q-${Math.random().toString(36).slice(2, 9)}`,
            type,
            prompt: `Fill in the blank: ______ means "${entry.english}"`,
            correctAnswer: entry.word,
            options: shuffle([entry.word, ...distractors]),
          };
        }
        break;
      }
      case "listening": {
        const distractors = pickDistractors(entry.english, allEnglish, 3);
        if (distractors.length >= 3) {
          q = {
            id: `q-${Math.random().toString(36).slice(2, 9)}`,
            type: "word-to-english", // fallback to word-to-english for server-generated
            prompt: `What does "${entry.word}" mean in English?`,
            correctAnswer: entry.english,
            options: shuffle([entry.english, ...distractors]),
          };
        }
        break;
      }
    }
    if (q) questions.push(q);
  }

  return c.json(shuffle(questions));
});

// GET /api/multiplayer/matchmaking/status — check if a player has been matched (API key auth)
multiplayerInternalRouter.get("/matchmaking/status", async (c) => {
  if (!verifyApiKey(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const playerId = c.req.query("playerId") ?? "";
  if (!playerId) return c.json({ matched: false });

  const [entry] = await db
    .select()
    .from(matchmakingQueue)
    .where(
      and(
        eq(matchmakingQueue.userId, playerId),
        eq(matchmakingQueue.status, "matched")
      )
    )
    .limit(1);

  if (!entry || !entry.matchedSessionId) {
    return c.json({ matched: false });
  }

  const [session] = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, entry.matchedSessionId))
    .limit(1);

  return c.json({
    matched: true,
    sessionId: session?.id,
    partyRoomId: session?.partyRoomId,
  });
});

// POST /api/multiplayer/sessions/:id/complete — called by PartyKit (API key auth)
multiplayerInternalRouter.post("/sessions/:id/complete", async (c) => {
  if (!verifyApiKey(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");
  const body = await c.req.json<{
    players: { id: string; score: number; correctAnswers: number; totalAnswers: number }[];
    winner: string | null;
  }>();

  // Update session status
  await db
    .update(gameSessions)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(gameSessions.id, sessionId));

  // Update player scores
  for (const p of body.players) {
    await db
      .update(gameSessionPlayers)
      .set({
        score: p.score,
        correctAnswers: p.correctAnswers,
        totalAnswers: p.totalAnswers,
        finishedAt: new Date(),
      })
      .where(
        and(
          eq(gameSessionPlayers.sessionId, sessionId),
          eq(gameSessionPlayers.userId, p.id)
        )
      );

    // Award XP
    const [session] = await db
      .select({ type: gameSessions.type })
      .from(gameSessions)
      .where(eq(gameSessions.id, sessionId))
      .limit(1);

    let xp = 30; // participation
    if (session?.type === "quiz_battle") {
      xp = body.winner === p.id ? 100 : 30;
    } else if (session?.type === "paired_lesson") {
      xp = 75; // cooperative bonus
    }

    await db
      .update(users)
      .set({ points: sql`${users.points} + ${xp}` })
      .where(eq(users.id, p.id));

    updateStreak(p.id).catch(() => {});
  }

  return c.json({ success: true });
});

// --- Authenticated routes ---
export const multiplayerRouter = new Hono<AuthEnv>();

multiplayerRouter.use("*", authMiddleware);

// POST /api/multiplayer/sessions — create a new game session
multiplayerRouter.post("/sessions", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    type: "quiz_battle" | "paired_lesson";
    languageId: string;
    courseId?: string;
    lessonId?: string;
    questionCount?: number;
  }>();

  const inviteCode = generateInviteCode();
  const partyRoomId = `${body.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const [session] = await db
    .insert(gameSessions)
    .values({
      type: body.type,
      status: "waiting",
      inviteCode,
      languageId: body.languageId,
      courseId: body.courseId ?? null,
      lessonId: body.lessonId ?? null,
      partyRoomId,
      createdBy: userId,
      questionCount: body.questionCount ?? 10,
    })
    .returning();

  // Add creator as first player
  await db.insert(gameSessionPlayers).values({
    sessionId: session.id,
    userId,
  });

  return c.json(session, 201);
});

// POST /api/multiplayer/sessions/join — join via invite code
multiplayerRouter.post("/sessions/join", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ inviteCode: string }>();

  const code = body.inviteCode.toUpperCase().trim();

  const [session] = await db
    .select()
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.inviteCode, code),
        eq(gameSessions.status, "waiting")
      )
    )
    .limit(1);

  if (!session) {
    return c.json({ error: "Invalid or expired invite code" }, 404);
  }

  // Check if already joined
  const [existing] = await db
    .select()
    .from(gameSessionPlayers)
    .where(
      and(
        eq(gameSessionPlayers.sessionId, session.id),
        eq(gameSessionPlayers.userId, userId)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(gameSessionPlayers).values({
      sessionId: session.id,
      userId,
    });
  }

  // Mark session as active when second player joins
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameSessionPlayers)
    .where(eq(gameSessionPlayers.sessionId, session.id));

  if ((countResult?.count ?? 0) >= 2) {
    await db
      .update(gameSessions)
      .set({ status: "active", startedAt: new Date() })
      .where(eq(gameSessions.id, session.id));
  }

  return c.json(session);
});

// GET /api/multiplayer/sessions/:id — get session details
multiplayerRouter.get("/sessions/:id", async (c) => {
  const sessionId = c.req.param("id");

  const [session] = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  const players = await db
    .select({
      id: gameSessionPlayers.id,
      userId: gameSessionPlayers.userId,
      score: gameSessionPlayers.score,
      correctAnswers: gameSessionPlayers.correctAnswers,
      totalAnswers: gameSessionPlayers.totalAnswers,
      joinedAt: gameSessionPlayers.joinedAt,
      finishedAt: gameSessionPlayers.finishedAt,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
    })
    .from(gameSessionPlayers)
    .innerJoin(users, eq(gameSessionPlayers.userId, users.id))
    .where(eq(gameSessionPlayers.sessionId, sessionId));

  return c.json({ ...session, players });
});

// GET /api/multiplayer/sessions — list recent sessions for current user
multiplayerRouter.get("/sessions", async (c) => {
  const userId = c.get("userId");

  const playerSessions = await db
    .select({ sessionId: gameSessionPlayers.sessionId })
    .from(gameSessionPlayers)
    .where(eq(gameSessionPlayers.userId, userId));

  if (playerSessions.length === 0) {
    return c.json([]);
  }

  const sessionIds = playerSessions.map((p) => p.sessionId);

  const sessions = await db
    .select()
    .from(gameSessions)
    .where(inArray(gameSessions.id, sessionIds))
    .orderBy(sql`${gameSessions.createdAt} DESC`)
    .limit(20);

  return c.json(sessions);
});

// POST /api/multiplayer/matchmaking/queue — enter matchmaking queue
multiplayerRouter.post("/matchmaking/queue", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    type: "quiz_battle" | "paired_lesson";
    languageId: string;
    courseId?: string;
  }>();

  // Check if there's another queued player for same type + language
  const [match] = await db
    .select()
    .from(matchmakingQueue)
    .where(
      and(
        eq(matchmakingQueue.type, body.type),
        eq(matchmakingQueue.languageId, body.languageId),
        eq(matchmakingQueue.status, "queued"),
        ne(matchmakingQueue.userId, userId)
      )
    )
    .limit(1);

  if (match) {
    // Instant match — create session
    const inviteCode = generateInviteCode();
    const partyRoomId = `${body.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const [session] = await db
      .insert(gameSessions)
      .values({
        type: body.type,
        status: "waiting",
        inviteCode,
        languageId: body.languageId,
        courseId: body.courseId ?? null,
        partyRoomId,
        createdBy: userId,
      })
      .returning();

    // Add both players
    await db.insert(gameSessionPlayers).values([
      { sessionId: session.id, userId },
      { sessionId: session.id, userId: match.userId },
    ]);

    // Update matched player's queue entry
    await db
      .update(matchmakingQueue)
      .set({ status: "matched", matchedSessionId: session.id })
      .where(eq(matchmakingQueue.id, match.id));

    return c.json({
      queued: false,
      matched: true,
      session,
    });
  }

  // No match found — add to queue
  // Remove any existing queue entry for this user first
  await db
    .delete(matchmakingQueue)
    .where(eq(matchmakingQueue.userId, userId));

  await db.insert(matchmakingQueue).values({
    userId,
    type: body.type,
    languageId: body.languageId,
    courseId: body.courseId ?? null,
    status: "queued",
  });

  return c.json({ queued: true, matched: false });
});

// DELETE /api/multiplayer/matchmaking/queue — leave queue
multiplayerRouter.delete("/matchmaking/queue", async (c) => {
  const userId = c.get("userId");

  await db
    .update(matchmakingQueue)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(matchmakingQueue.userId, userId),
        eq(matchmakingQueue.status, "queued")
      )
    );

  return c.json({ success: true });
});

// GET /api/multiplayer/matchmaking/status — check own matchmaking status (authenticated)
multiplayerRouter.get("/matchmaking/status", async (c) => {
  const userId = c.get("userId");

  const [entry] = await db
    .select()
    .from(matchmakingQueue)
    .where(eq(matchmakingQueue.userId, userId))
    .limit(1);

  if (!entry) {
    return c.json({ status: "none" });
  }

  if (entry.status === "matched" && entry.matchedSessionId) {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, entry.matchedSessionId))
      .limit(1);

    return c.json({
      status: "matched",
      session,
    });
  }

  return c.json({ status: entry.status });
});
