import { Hono } from "hono";
import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, pushTokens, dictionaryEntries } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { sendPushBatch, chunk, type PushMessage } from "../lib/send-push.js";

// ---- Shared auth router ----
export const notificationsRouter = new Hono<AuthEnv>();
notificationsRouter.use("*", authMiddleware);

// GET /api/notifications/preferences
notificationsRouter.get("/preferences", async (c) => {
  const userId = c.get("userId");
  const [user] = await db
    .select({
      pushWotdEnabled: users.pushWotdEnabled,
      pushStreakReminderEnabled: users.pushStreakReminderEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return c.json({
    pushWotdEnabled: user?.pushWotdEnabled ?? true,
    pushStreakReminderEnabled: user?.pushStreakReminderEnabled ?? true,
  });
});

// PATCH /api/notifications/preferences
notificationsRouter.patch("/preferences", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    pushWotdEnabled?: boolean;
    pushStreakReminderEnabled?: boolean;
  }>();

  await db
    .update(users)
    .set({
      ...(typeof body.pushWotdEnabled === "boolean"
        ? { pushWotdEnabled: body.pushWotdEnabled }
        : {}),
      ...(typeof body.pushStreakReminderEnabled === "boolean"
        ? { pushStreakReminderEnabled: body.pushStreakReminderEnabled }
        : {}),
    })
    .where(eq(users.id, userId));

  return c.json({ updated: true });
});

// ---- Cron/admin router (protected by CRON_SECRET header) ----
export const notificationsAdminRouter = new Hono();

function cronGuard(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // No secret configured → blocked
  const auth = req.headers.get("x-cron-secret");
  return auth === secret;
}

/**
 * POST /api/notifications/admin/send-wotd
 * Send today's Word of the Day push to all opted-in users with push tokens.
 * Call this from a cron job at your preferred time (e.g. 9:00 AM).
 */
notificationsAdminRouter.post("/send-wotd", async (c) => {
  if (!cronGuard(c.req.raw)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Get all opted-in users who have push tokens + their selected language
  const rows = await db
    .select({
      token: pushTokens.token,
      languageId: users.selectedLanguageId,
    })
    .from(pushTokens)
    .innerJoin(users, eq(pushTokens.userId, users.id))
    .where(eq(users.pushWotdEnabled, true));

  if (rows.length === 0) {
    return c.json({ sent: 0 });
  }

  // Deterministic daily word: days-since-epoch % total entries per language
  const today = Math.floor(Date.now() / 86_400_000);

  // Group tokens by languageId to fetch one word per language
  const langMap = new Map<string, string[]>();
  for (const row of rows) {
    const lang = row.languageId ?? "izon";
    if (!langMap.has(lang)) langMap.set(lang, []);
    langMap.get(lang)!.push(row.token);
  }

  const messages: PushMessage[] = [];

  for (const [languageId, tokens] of langMap) {
    const entries = await db
      .select({ word: dictionaryEntries.word, english: dictionaryEntries.english })
      .from(dictionaryEntries)
      .where(eq(dictionaryEntries.languageId, languageId))
      .orderBy(dictionaryEntries.id);

    if (entries.length === 0) continue;

    const entry = entries[today % entries.length];

    for (const token of tokens) {
      messages.push({
        to: token,
        title: "Word of the Day",
        body: `${entry.word} — ${entry.english}`,
        data: { type: "word_of_day", languageId },
        sound: "default",
      });
    }
  }

  // Send in batches of 100 (Expo limit)
  let sent = 0;
  for (const batch of chunk(messages, 100)) {
    const tickets = await sendPushBatch(batch);
    sent += tickets.filter((t) => t.status === "ok").length;
  }

  return c.json({ sent, total: messages.length });
});

/**
 * POST /api/notifications/admin/send-streak-reminder
 * Send streak reminders to opted-in users who haven't been active today.
 * Call from a cron job in the evening (e.g. 7:00 PM).
 */
notificationsAdminRouter.post("/send-streak-reminder", async (c) => {
  if (!cronGuard(c.req.raw)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  // Users with push tokens, streak reminder enabled, streak > 0, not active today
  const rows = await db
    .select({
      token: pushTokens.token,
      streak: users.streak,
      name: users.name,
    })
    .from(pushTokens)
    .innerJoin(users, eq(pushTokens.userId, users.id))
    .where(
      and(
        eq(users.pushStreakReminderEnabled, true),
        ne(users.streak, 0),
        // lastActiveDate is not today
        sql`${users.lastActiveDate} IS NULL OR ${users.lastActiveDate} != ${todayStr}`
      )
    );

  if (rows.length === 0) return c.json({ sent: 0 });

  const messages: PushMessage[] = rows.map((row) => ({
    to: row.token,
    title: "Keep your streak alive! 🔥",
    body: `You have a ${row.streak}-day streak. Complete a lesson today to keep it going.`,
    data: { type: "streak_reminder" },
    sound: "default",
  }));

  let sent = 0;
  for (const batch of chunk(messages, 100)) {
    const tickets = await sendPushBatch(batch);
    sent += tickets.filter((t) => t.status === "ok").length;
  }

  return c.json({ sent, total: messages.length });
});
