import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { pushTokens, users } from "../db/schema.js";
import { chunk, sendPushBatch, type PushMessage } from "./send-push.js";

const TITLES = {
  wotd: "New Word of the Day",
  potm: "New Proverb of the Month",
  sotw: "New Song of the Week",
} as const;

const TYPES = {
  wotd: "word_of_day",
  potm: "proverb_of_month",
  sotw: "song_of_week",
} as const;

export async function sendDailyContentNotification(
  type: keyof typeof TITLES,
  languageId: string,
  body: string
): Promise<void> {
  const rows = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .innerJoin(users, eq(pushTokens.userId, users.id))
    .where(
      and(
        eq(users.pushWotdEnabled, true),
        eq(users.selectedLanguageId, languageId)
      )
    );

  if (rows.length === 0) return;

  const messages: PushMessage[] = rows.map((row) => ({
    to: row.token,
    title: TITLES[type],
    body,
    data: { type: TYPES[type], languageId },
    sound: "default",
  }));

  for (const batch of chunk(messages, 100)) {
    await sendPushBatch(batch);
  }
}
