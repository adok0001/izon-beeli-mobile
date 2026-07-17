import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { feedItems, pushTokens, users } from "../db/schema.js";
import { getLevelInfo } from "./xp-levels.js";
import { sendPushBatch, chunk } from "./send-push.js";

export const CONTRIBUTION_BASE_XP = { word: 15, phrase: 20, audio: 25 } as const;

export interface XPAward {
  totalPoints: number;
  leveledUp: boolean;
  newLevel: number;
  newTitle: string;
}

export async function awardXP(
  userId: string,
  amount: number,
  _source: "lesson" | "quiz" | "word_review" | "daily_challenge" | "contribution" | "checklist_bonus"
): Promise<XPAward> {
  // Increment in one statement rather than read-modify-write: a single action can
  // award twice (its own XP, plus the daily challenge it completes), and a
  // read-then-write would let the second award clobber the first.
  const [user] = await db
    .update(users)
    .set({ points: sql`${users.points} + ${amount}` })
    .where(eq(users.id, userId))
    .returning({ points: users.points, name: users.name });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const newPoints = user.points;
  const newLevelInfo = getLevelInfo(newPoints);
  const leveledUp = newLevelInfo.level > getLevelInfo(newPoints - amount).level;

  if (leveledUp) {
    // Insert achievement feed item
    await db.insert(feedItems).values({
      userId,
      type: "achievement",
      title: `Reached Level ${newLevelInfo.level}: ${newLevelInfo.title}`,
      titleFr: `Niveau ${newLevelInfo.level} atteint : ${newLevelInfo.titleFr}`,
      description: `${user.name} leveled up to ${newLevelInfo.title}!`,
      descriptionFr: `${user.name} est passé au niveau ${newLevelInfo.titleFr} !`,
      userName: user.name,
    }).catch(() => {});

    // Push notification — fire-and-forget
    db.select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId))
      .then((rows) => {
        const tokens = rows.map((r) => r.token);
        if (tokens.length === 0) return;
        const messages = tokens.map((token) => ({
          to: token,
          title: `You reached ${newLevelInfo.title}!`,
          body: "Keep learning to reach the next level.",
          data: { type: "level_up" },
          sound: "default" as const,
        }));
        return Promise.all(chunk(messages, 100).map((batch) => sendPushBatch(batch)));
      })
      .catch(() => {});
  }

  return {
    totalPoints: newPoints,
    leveledUp,
    newLevel: newLevelInfo.level,
    newTitle: newLevelInfo.title,
  };
}
