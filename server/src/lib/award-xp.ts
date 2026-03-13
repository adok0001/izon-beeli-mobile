import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, feedItems } from "../db/schema.js";
import { getLevelInfo } from "./xp-levels.js";

export const CONTRIBUTION_BASE_XP = { word: 15, phrase: 20, audio: 25 } as const;

export async function awardXP(
  userId: string,
  amount: number,
  _source: "lesson" | "quiz" | "word_review" | "daily_challenge" | "contribution"
): Promise<{ totalPoints: number; leveledUp: boolean; newLevel: number; newTitle: string }> {
  const [user] = await db
    .select({ points: users.points, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const oldLevel = getLevelInfo(user.points).level;
  const newPoints = user.points + amount;
  const newLevelInfo = getLevelInfo(newPoints);
  const leveledUp = newLevelInfo.level > oldLevel;

  await db
    .update(users)
    .set({ points: newPoints })
    .where(eq(users.id, userId));

  if (leveledUp) {
    // Insert achievement feed item
    await db.insert(feedItems).values({
      userId,
      type: "achievement",
      title: `Reached Level ${newLevelInfo.level}: ${newLevelInfo.title}`,
      description: `${user.name} leveled up to ${newLevelInfo.title}!`,
      userName: user.name,
    }).catch(() => {}); // fire-and-forget, don't fail if feed insert errors
  }

  return {
    totalPoints: newPoints,
    leveledUp,
    newLevel: newLevelInfo.level,
    newTitle: newLevelInfo.title,
  };
}
