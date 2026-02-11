import "dotenv/config";
import { db } from "../db/index.js";
import { users, feedItems, comments } from "../db/schema.js";
import { eq } from "drizzle-orm";

// Seed creates a placeholder user and demo feed data for the community feed.
// All static content (languages, courses, lessons, dictionary) stays local in mock-data.ts.

const PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000";

const SEED_FEED = [
  { type: "lesson_completed" as const, title: "Completed Greetings & Introductions", description: "Finished the first lesson in Izon Basics", userName: "Tamara A.", createdAt: new Date("2025-01-15T10:30:00Z"), likesCount: 5, commentsCount: 2 },
  { type: "contribution" as const, title: "New audio recording", description: "Contributed a pronunciation guide for common Yoruba greetings", userName: "Ebi O.", createdAt: new Date("2025-01-14T16:00:00Z"), likesCount: 12, commentsCount: 4, audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { type: "achievement" as const, title: "7-day streak!", description: "Reached a 7-day learning streak across Izon and Yoruba", userName: "Diepreye K.", createdAt: new Date("2025-01-13T09:00:00Z"), likesCount: 20, commentsCount: 8 },
  { type: "community" as const, title: "Study group forming", description: "Looking for learners to practice conversational Igbo together on weekends", userName: "Seiyefa T.", createdAt: new Date("2025-01-12T12:00:00Z"), likesCount: 15, commentsCount: 11 },
  { type: "lesson_completed" as const, title: "Completed The Tortoise and the River", description: "Loved this traditional Izon folktale! The narrator's voice is captivating.", userName: "Boma D.", createdAt: new Date("2025-01-11T18:00:00Z"), likesCount: 8, commentsCount: 3 },
  { type: "contribution" as const, title: "Hausa translation added", description: "Translated 15 common phrases into Hausa with audio recordings", userName: "Amina B.", createdAt: new Date("2025-01-10T11:00:00Z"), likesCount: 18, commentsCount: 6, audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

const SEED_COMMENTS: { feedIndex: number; userName: string; text: string; createdAt: Date }[] = [
  { feedIndex: 0, userName: "Ebi O.", text: "Great job! Keep it up!", createdAt: new Date("2025-01-15T11:00:00Z") },
  { feedIndex: 0, userName: "Diepreye K.", text: "The greetings lesson is one of my favourites", createdAt: new Date("2025-01-15T12:30:00Z") },
  { feedIndex: 1, userName: "Tamara A.", text: "This is so helpful, thank you!", createdAt: new Date("2025-01-14T17:00:00Z") },
  { feedIndex: 1, userName: "Seiyefa T.", text: "Your pronunciation is really clear", createdAt: new Date("2025-01-14T18:00:00Z") },
  { feedIndex: 1, userName: "Boma D.", text: "Can you do one for Igbo greetings too?", createdAt: new Date("2025-01-14T19:00:00Z") },
  { feedIndex: 1, userName: "Amina B.", text: "Shared this with my study group!", createdAt: new Date("2025-01-14T20:00:00Z") },
  { feedIndex: 2, userName: "Tamara A.", text: "Wow 7 days, amazing consistency!", createdAt: new Date("2025-01-13T10:00:00Z") },
  { feedIndex: 2, userName: "Ebi O.", text: "Inspiring! I'm on day 3 myself", createdAt: new Date("2025-01-13T11:00:00Z") },
  { feedIndex: 3, userName: "Diepreye K.", text: "Count me in! What time on weekends?", createdAt: new Date("2025-01-12T13:00:00Z") },
  { feedIndex: 3, userName: "Boma D.", text: "I'd love to join, I'm learning Igbo basics", createdAt: new Date("2025-01-12T14:00:00Z") },
  { feedIndex: 4, userName: "Seiyefa T.", text: "The narrator is incredible!", createdAt: new Date("2025-01-11T19:00:00Z") },
  { feedIndex: 5, userName: "Diepreye K.", text: "This is a huge contribution, thank you Amina!", createdAt: new Date("2025-01-10T12:00:00Z") },
  { feedIndex: 5, userName: "Tamara A.", text: "The audio quality is perfect", createdAt: new Date("2025-01-10T13:00:00Z") },
];

async function seed() {
  console.log("Seeding database (UGC only)...");

  // 1. Ensure placeholder user exists for seed data
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, PLACEHOLDER_USER_ID))
    .limit(1);

  if (!existing) {
    console.log("  Creating placeholder user...");
    await db.insert(users).values({
      id: PLACEHOLDER_USER_ID,
      clerkId: "seed_placeholder",
      name: "Seed User",
      email: "seed@example.com",
    });
  }

  // 2. Feed items
  console.log("  Inserting feed items...");
  const insertedFeedItems: { id: string }[] = [];
  for (const item of SEED_FEED) {
    const [inserted] = await db
      .insert(feedItems)
      .values({ userId: PLACEHOLDER_USER_ID, ...item })
      .returning({ id: feedItems.id });
    insertedFeedItems.push(inserted);
  }

  // 3. Comments
  console.log("  Inserting comments...");
  for (const comment of SEED_COMMENTS) {
    const feedItem = insertedFeedItems[comment.feedIndex];
    if (feedItem) {
      await db.insert(comments).values({
        userId: PLACEHOLDER_USER_ID,
        feedItemId: feedItem.id,
        userName: comment.userName,
        text: comment.text,
        createdAt: comment.createdAt,
      });
    }
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
