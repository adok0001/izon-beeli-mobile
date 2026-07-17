import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { dailyChallengeTemplates } from "../db/schema.js";

// The templates that used to live as a hardcoded CHALLENGE_POOL in
// src/lib/daily-challenge.ts, now moved into the DB so admins can edit them.
const TEMPLATES = [
  {
    challengeType: "complete_quiz" as const,
    title: "Quiz Champion",
    titleFr: "Champion du Quiz",
    description: "Complete a quiz session",
    descriptionFr: "Terminez une session de quiz",
    xpReward: 30,
    targetCasual: 1,
    targetSteady: 1,
    targetIntensive: 2,
  },
  {
    challengeType: "review_words" as const,
    title: "Word Reviewer",
    titleFr: "Réviseur de Mots",
    description: "Review words from your word bank",
    descriptionFr: "Révisez les mots de votre banque de mots",
    xpReward: 20,
    targetCasual: 3,
    targetSteady: 5,
    targetIntensive: 10,
  },
  {
    challengeType: "listen_lesson" as const,
    title: "Active Listener",
    titleFr: "Auditeur Actif",
    description: "Listen to a lesson",
    descriptionFr: "Écoutez une leçon",
    xpReward: 25,
    targetCasual: 1,
    targetSteady: 1,
    targetIntensive: 2,
  },
  {
    challengeType: "complete_lesson" as const,
    title: "Lesson Complete",
    titleFr: "Leçon Terminée",
    description: "Mark a lesson as complete",
    descriptionFr: "Marquez une leçon comme terminée",
    xpReward: 35,
    targetCasual: 1,
    targetSteady: 2,
    targetIntensive: 3,
  },
  {
    challengeType: "save_words" as const,
    title: "Word Collector",
    titleFr: "Collectionneur de Mots",
    description: "Save new words to your word bank",
    descriptionFr: "Enregistrez de nouveaux mots dans votre banque de mots",
    xpReward: 15,
    targetCasual: 2,
    targetSteady: 3,
    targetIntensive: 5,
  },
];

async function seed() {
  console.log("Seeding daily challenge templates...");
  let inserted = 0;
  for (const tpl of TEMPLATES) {
    const [existing] = await db
      .select({ id: dailyChallengeTemplates.id })
      .from(dailyChallengeTemplates)
      .where(eq(dailyChallengeTemplates.title, tpl.title))
      .limit(1);
    if (existing) continue;
    await db.insert(dailyChallengeTemplates).values(tpl);
    inserted++;
  }
  console.log(`Seeded ${inserted} of ${TEMPLATES.length} daily challenge templates (rest already present).`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
