import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { dailyChallenges, users } from "../db/schema.js";
import { awardXP } from "./award-xp.js";

type ChallengeType =
  | "complete_quiz"
  | "review_words"
  | "listen_lesson"
  | "complete_lesson"
  | "save_words";

type DailyGoal = "casual" | "steady" | "intensive";

interface ChallengeTemplate {
  challengeType: ChallengeType;
  title: string;
  description: string;
  xpReward: number;
  targets: { casual: number; steady: number; intensive: number };
}

const CHALLENGE_POOL: ChallengeTemplate[] = [
  {
    challengeType: "complete_quiz",
    title: "Quiz Champion",
    description: "Complete a quiz session",
    xpReward: 30,
    targets: { casual: 1, steady: 1, intensive: 2 },
  },
  {
    challengeType: "review_words",
    title: "Word Reviewer",
    description: "Review words from your word bank",
    xpReward: 20,
    targets: { casual: 3, steady: 5, intensive: 10 },
  },
  {
    challengeType: "listen_lesson",
    title: "Active Listener",
    description: "Listen to a lesson",
    xpReward: 25,
    targets: { casual: 1, steady: 1, intensive: 2 },
  },
  {
    challengeType: "complete_lesson",
    title: "Lesson Complete",
    description: "Mark a lesson as complete",
    xpReward: 35,
    targets: { casual: 1, steady: 2, intensive: 3 },
  },
  {
    challengeType: "save_words",
    title: "Word Collector",
    description: "Save new words to your word bank",
    xpReward: 15,
    targets: { casual: 2, steady: 3, intensive: 5 },
  },
];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function generateDailyChallenge(
  userId: string,
  date: string,
  goal: DailyGoal = "steady"
): Promise<typeof dailyChallenges.$inferSelect> {
  // Pick deterministically using hash of userId + date
  const idx = hashCode(userId + date) % CHALLENGE_POOL.length;
  const template = CHALLENGE_POOL[idx];
  const target = template.targets[goal];

  const [row] = await db
    .insert(dailyChallenges)
    .values({
      userId,
      date,
      challengeType: template.challengeType,
      title: template.title,
      description: template.description,
      target,
      xpReward: template.xpReward,
    })
    .onConflictDoNothing()
    .returning();

  if (!row) {
    // Already exists — fetch it
    const [existing] = await db
      .select()
      .from(dailyChallenges)
      .where(
        and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, date))
      )
      .limit(1);
    return existing;
  }

  return row;
}

export async function incrementDailyChallenge(
  userId: string,
  type: ChallengeType,
  amount = 1
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const [challenge] = await db
    .select()
    .from(dailyChallenges)
    .where(
      and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today))
    )
    .limit(1);

  if (!challenge || challenge.completed || challenge.challengeType !== type) {
    return;
  }

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
    await awardXP(userId, challenge.xpReward, "daily_challenge").catch(() => {});
  }
}

export async function getOrCreateTodayChallenge(
  userId: string
): Promise<typeof dailyChallenges.$inferSelect> {
  const today = new Date().toISOString().slice(0, 10);

  const [existing] = await db
    .select()
    .from(dailyChallenges)
    .where(
      and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today))
    )
    .limit(1);

  if (existing) return existing;

  // Look up goal from user
  const [user] = await db
    .select({ dailyGoal: users.dailyGoal })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const goal = (user?.dailyGoal as DailyGoal | null) ?? "steady";
  return generateDailyChallenge(userId, today, goal);
}
