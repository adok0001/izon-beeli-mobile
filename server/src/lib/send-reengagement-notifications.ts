import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { pushTokens, users } from "../db/schema.js";
import { getLevelInfo } from "./xp-levels.js";
import { chunk, sendPushBatch, type PushMessage } from "./send-push.js";

const LAPSE_DAYS = [3, 7, 14] as const;

function lapsedDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function buildMessage(
  token: string,
  lapseDays: number,
  levelTitle: string,
  languageId: string | null
): PushMessage {
  const lang = languageId ?? "your language";
  if (lapseDays === 3) {
    return {
      to: token,
      title: `Your ${lang} streak is waiting.`,
      body: "Pick up where you left off.",
      data: { type: "reengagement", lapseDays },
      sound: "default",
    };
  }
  if (lapseDays === 7) {
    return {
      to: token,
      title: `You were a ${levelTitle}.`,
      body: "Don't lose it.",
      data: { type: "reengagement", lapseDays },
      sound: "default",
    };
  }
  return {
    to: token,
    title: `You got to ${levelTitle}.`,
    body: "Here's what your next level unlocks.",
    data: { type: "reengagement", lapseDays },
    sound: "default",
  };
}

export async function sendReengagementNotifications(): Promise<{ sent: number }> {
  const targetDates = LAPSE_DAYS.map(lapsedDateStr);

  // Find users lapsed at exactly 3, 7, or 14 days who have opted into notifications
  const lapsedUsers = await db
    .select({
      id: users.id,
      points: users.points,
      selectedLanguageId: users.selectedLanguageId,
      lastActiveDate: users.lastActiveDate,
    })
    .from(users)
    .where(
      and(
        inArray(sql`${users.lastActiveDate}`, targetDates),
        eq(users.pushStreakReminderEnabled, true),
        isNotNull(users.lastActiveDate)
      )
    );

  if (lapsedUsers.length === 0) return { sent: 0 };

  const userIds = lapsedUsers.map((u) => u.id);
  const tokenRows = await db
    .select({ userId: pushTokens.userId, token: pushTokens.token })
    .from(pushTokens)
    .where(inArray(pushTokens.userId, userIds));

  const tokensByUser = new Map<string, string[]>();
  for (const row of tokenRows) {
    const existing = tokensByUser.get(row.userId) ?? [];
    existing.push(row.token);
    tokensByUser.set(row.userId, existing);
  }

  const messages: PushMessage[] = [];
  for (const user of lapsedUsers) {
    const tokens = tokensByUser.get(user.id);
    if (!tokens || tokens.length === 0) continue;

    const today = new Date().toISOString().slice(0, 10);
    const last = user.lastActiveDate!;
    const lapseDays = Math.round(
      (new Date(today).getTime() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
    );

    const levelTitle = getLevelInfo(user.points ?? 0).title;

    for (const token of tokens) {
      messages.push(buildMessage(token, lapseDays, levelTitle, user.selectedLanguageId));
    }
  }

  if (messages.length === 0) return { sent: 0 };

  await Promise.all(chunk(messages, 100).map((batch) => sendPushBatch(batch)));
  return { sent: messages.length };
}
