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
  title_fr?: string;
  description: string;
  description_fr?: string;
  xpReward: number;
  targets: { casual: number; steady: number; intensive: number };
}

const CHALLENGE_POOL: ChallengeTemplate[] = [
  {
    challengeType: "complete_quiz",
    title: "Quiz Champion",
    title_fr: "Champion du Quiz",
    description: "Complete a quiz session",
    description_fr: "Terminez une session de quiz",
    xpReward: 30,
    targets: { casual: 1, steady: 1, intensive: 2 },
  },
  {
    challengeType: "review_words",
    title: "Word Reviewer",
    title_fr: "Réviseur de Mots",
    description: "Review words from your word bank",
    description_fr: "Révisez les mots de votre banque de mots",
    xpReward: 20,
    targets: { casual: 3, steady: 5, intensive: 10 },
  },
  {
    challengeType: "listen_lesson",
    title: "Active Listener",
    title_fr: "Auditeur Actif",
    description: "Listen to a lesson",
    description_fr: "Écoutez une leçon",
    xpReward: 25,
    targets: { casual: 1, steady: 1, intensive: 2 },
  },
  {
    challengeType: "complete_lesson",
    title: "Lesson Complete",
    title_fr: "Leçon Terminée",
    description: "Mark a lesson as complete",
    description_fr: "Marquez une leçon comme terminée",
    xpReward: 35,
    targets: { casual: 1, steady: 2, intensive: 3 },
  },
  {
    challengeType: "save_words",
    title: "Word Collector",
    title_fr: "Collectionneur de Mots",
    description: "Save new words to your word bank",
    description_fr: "Enregistrez de nouveaux mots dans votre banque de mots",
    xpReward: 15,
    targets: { casual: 2, steady: 3, intensive: 5 },
  },
];

const SLOTS = [0, 1, 2] as const;

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Pick 3 distinct templates for the day, one per slot. */
function pickTemplatesForDay(
  userId: string,
  date: string
): [ChallengeTemplate, ChallengeTemplate, ChallengeTemplate] {
  const base = hashCode(userId + date);
  const picks: ChallengeTemplate[] = [];
  const used = new Set<number>();

  for (let slot = 0; slot < 3; slot++) {
    let idx = (base + slot * 7) % CHALLENGE_POOL.length;
    // Ensure no duplicates
    let attempts = 0;
    while (used.has(idx) && attempts < CHALLENGE_POOL.length) {
      idx = (idx + 1) % CHALLENGE_POOL.length;
      attempts++;
    }
    used.add(idx);
    picks.push(CHALLENGE_POOL[idx]);
  }

  return picks as [ChallengeTemplate, ChallengeTemplate, ChallengeTemplate];
}

export async function getOrCreateTodayChallenges(
  userId: string
): Promise<(typeof dailyChallenges.$inferSelect)[]> {
  const today = new Date().toISOString().slice(0, 10);

  const existing = await db
    .select()
    .from(dailyChallenges)
    .where(
      and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today))
    );

  if (existing.length === 3) return existing;

  // Look up goal from user
  const [user] = await db
    .select({ dailyGoal: users.dailyGoal })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const goal = (user?.dailyGoal as DailyGoal | null) ?? "steady";
  const templates = pickTemplatesForDay(userId, today);

  // Determine which slots are missing and insert only those
  const existingSlots = new Set(existing.map((r) => r.slot));
  const toInsert = SLOTS.filter((s) => !existingSlots.has(s)).map((slot) => {
    const tpl = templates[slot];
    return {
      userId,
      date: today,
      slot,
      challengeType: tpl.challengeType,
      title: tpl.title,
      title_fr: tpl.title_fr,
      description: tpl.description,
      description_fr: tpl.description_fr,
      target: tpl.targets[goal],
      xpReward: tpl.xpReward,
    };
  });

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

export async function incrementDailyChallenge(
  userId: string,
  type: ChallengeType,
  amount = 1
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(dailyChallenges)
    .where(
      and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today))
    );

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
      await awardXP(userId, challenge.xpReward, "daily_challenge").catch(() => {});
    }
  }
}
