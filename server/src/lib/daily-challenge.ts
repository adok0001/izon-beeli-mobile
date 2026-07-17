import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { dailyChallenges, dailyChallengeTemplates, users } from "../db/schema.js";
import { awardXP, type XPAward } from "./award-xp.js";

type ChallengeType =
  | "complete_quiz"
  | "review_words"
  | "listen_lesson"
  | "complete_lesson"
  | "save_words";

type DailyGoal = "casual" | "steady" | "intensive";

type ChallengeTemplate = typeof dailyChallengeTemplates.$inferSelect;

function targetFor(tpl: ChallengeTemplate, goal: DailyGoal): number {
  if (goal === "casual") return tpl.targetCasual;
  if (goal === "intensive") return tpl.targetIntensive;
  return tpl.targetSteady;
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Pick up to 3 distinct templates for the day, one per slot, from the active pool. */
function pickTemplatesForDay(
  pool: ChallengeTemplate[],
  userId: string,
  date: string,
  seed = 0
): ChallengeTemplate[] {
  if (pool.length === 0) return [];

  const base = hashCode(userId + date + String(seed));
  const picks: ChallengeTemplate[] = [];
  const used = new Set<number>();
  const slotCount = Math.min(3, pool.length);

  for (let slot = 0; slot < slotCount; slot++) {
    let idx = (base + slot * 7) % pool.length;
    let attempts = 0;
    while (used.has(idx) && attempts < pool.length) {
      idx = (idx + 1) % pool.length;
      attempts++;
    }
    used.add(idx);
    picks.push(pool[idx]);
  }

  return picks;
}

export async function getOrCreateTodayChallenges(
  userId: string,
  seed = 0
): Promise<(typeof dailyChallenges.$inferSelect)[]> {
  const today = new Date().toISOString().slice(0, 10);

  const existing = await db
    .select()
    .from(dailyChallenges)
    .where(
      and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today))
    );

  const pool = await db
    .select()
    .from(dailyChallengeTemplates)
    .where(eq(dailyChallengeTemplates.active, true));

  const expectedSlots = Math.min(3, pool.length);
  if (pool.length === 0 || existing.length >= expectedSlots) return existing;

  // Look up goal from user
  const [user] = await db
    .select({ dailyGoal: users.dailyGoal })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const goal = (user?.dailyGoal as DailyGoal | null) ?? "steady";
  const templates = pickTemplatesForDay(pool, userId, today, seed);

  // Determine which slots are missing and insert only those
  const existingSlots = new Set(existing.map((r) => r.slot));
  const toInsert = templates
    .map((tpl, slot) => ({ tpl, slot }))
    .filter(({ slot }) => !existingSlots.has(slot))
    .map(({ tpl, slot }) => ({
      userId,
      date: today,
      slot,
      challengeType: tpl.challengeType,
      title: tpl.title,
      description: tpl.description,
      target: targetFor(tpl, goal),
      xpReward: tpl.xpReward,
    }));

  if (toInsert.length > 0) {
    await db.insert(dailyChallenges).values(toInsert).onConflictDoNothing();
  }

  return db
    .select()
    .from(dailyChallenges)
    .where(
      and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today))
    );
}

export interface ChallengeIncrement {
  /** XP awarded for challenges this call completed. */
  xpAwarded: number;
  /** Level snapshot after the final award — null when nothing completed. */
  award: XPAward | null;
}

export async function incrementDailyChallenge(
  userId: string,
  type: ChallengeType,
  amount = 1
): Promise<ChallengeIncrement> {
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(dailyChallenges)
    .where(
      and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today))
    );

  let xpAwarded = 0;
  let award: XPAward | null = null;

  for (const challenge of rows) {
    if (challenge.completed || challenge.challengeType !== type) continue;

    const newProgress = Math.min(challenge.progress + amount, challenge.target);
    const completed = newProgress >= challenge.target;

    await db
      .update(dailyChallenges)
      .set({
        progress: newProgress,
        completed,
        completedAt: completed ? new Date() : null,
      })
      .where(eq(dailyChallenges.id, challenge.id));

    if (completed) {
      const result = await awardXP(userId, challenge.xpReward, "daily_challenge").catch(() => null);
      if (result) {
        xpAwarded += challenge.xpReward;
        award = result;
      }
    }
  }

  return { xpAwarded, award };
}
