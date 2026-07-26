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
    titleTranslations: { en: "Quiz Champion", fr: "Champion du Quiz" },
    description: "Complete a quiz session",
    descriptionTranslations: { en: "Complete a quiz session", fr: "Terminez une session de quiz" },
    xpReward: 30,
    targetCasual: 1,
    targetSteady: 1,
    targetIntensive: 2,
  },
  {
    challengeType: "review_words" as const,
    title: "Word Reviewer",
    titleTranslations: { en: "Word Reviewer", fr: "Réviseur de Mots" },
    description: "Review words from your word bank",
    descriptionTranslations: { en: "Review words from your word bank", fr: "Révisez les mots de votre banque de mots" },
    xpReward: 20,
    targetCasual: 3,
    targetSteady: 5,
    targetIntensive: 10,
  },
  {
    challengeType: "listen_lesson" as const,
    title: "Active Listener",
    titleTranslations: { en: "Active Listener", fr: "Auditeur Actif" },
    description: "Listen to a lesson",
    descriptionTranslations: { en: "Listen to a lesson", fr: "Écoutez une leçon" },
    xpReward: 25,
    targetCasual: 1,
    targetSteady: 1,
    targetIntensive: 2,
  },
  {
    challengeType: "complete_lesson" as const,
    title: "Lesson Complete",
    titleTranslations: { en: "Lesson Complete", fr: "Leçon Terminée" },
    description: "Mark a lesson as complete",
    descriptionTranslations: { en: "Mark a lesson as complete", fr: "Marquez une leçon comme terminée" },
    xpReward: 35,
    targetCasual: 1,
    targetSteady: 2,
    targetIntensive: 3,
  },
  {
    challengeType: "save_words" as const,
    title: "Word Collector",
    titleTranslations: { en: "Word Collector", fr: "Collectionneur de Mots" },
    description: "Save new words to your word bank",
    descriptionTranslations: { en: "Save new words to your word bank", fr: "Enregistrez de nouveaux mots dans votre banque de mots" },
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
