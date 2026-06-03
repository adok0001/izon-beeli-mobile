import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);
const FREEZE_GRANT_MILESTONES: Record<number, number> = { 7: 1, 30: 2 };

export function diffDaysFromToday(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(dateStr);
  last.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

export interface StreakResult {
  newStreak: number;
  streakIncremented: boolean;
  streakMilestone: number | null;
  freezeGranted: number | null;
  freezeCount: number;
}

export async function updateStreak(userId: string): Promise<StreakResult> {
  const [user] = await db
    .select({
      streak: users.streak,
      lastActiveDate: users.lastActiveDate,
      streakFreezes: users.streakFreezes,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error(`User not found while updating streak: ${userId}`);
  }

  let newStreak = user.streak ?? 0;
  const lastActive = user.lastActiveDate;
  const diff = diffDaysFromToday(lastActive);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Already active today — streak unchanged, no freeze grants
  if (diff === 0) {
    return {
      newStreak,
      streakIncremented: false,
      streakMilestone: null,
      freezeGranted: null,
      freezeCount: user.streakFreezes ?? 0,
    };
  }

  if (!lastActive) {
    newStreak = 1;
  } else if (diff === 1) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const freezeGrant = FREEZE_GRANT_MILESTONES[newStreak] ?? 0;
  const firstTimerGrant = !lastActive ? 1 : 0;
  const totalFreezeGrant = freezeGrant + firstTimerGrant;

  await db
    .update(users)
    .set({
      streak: newStreak,
      lastActiveDate: todayStr,
      ...(totalFreezeGrant > 0
        ? { streakFreezes: (user.streakFreezes ?? 0) + totalFreezeGrant }
        : {}),
    })
    .where(eq(users.id, userId));

  return {
    newStreak,
    streakIncremented: true,
    streakMilestone: STREAK_MILESTONES.has(newStreak) ? newStreak : null,
    freezeGranted: totalFreezeGrant > 0 ? totalFreezeGrant : null,
    freezeCount: (user.streakFreezes ?? 0) + totalFreezeGrant,
  };
}
