import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "../db/index.js";
import { contributions, feedItems, users } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const contributionsRouter = new Hono<AuthEnv>();

contributionsRouter.use("*", authMiddleware);

// POST /api/contributions - submit a structured word/phrase contribution
contributionsRouter.post("/", async (c) => {
  const userId = c.get("userId");
  console.log("[contributions] POST from user:", userId);
  const contentType = c.req.header("Content-Type") ?? "";

  let type: string;
  let languageId: string;
  let word: string;
  let english: string;
  let category: string;
  let pronunciation: string | undefined;
  let example: string | undefined;
  let exampleTranslation: string | undefined;
  let audioUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    type = formData.get("type") as string;
    languageId = formData.get("languageId") as string;
    word = formData.get("word") as string;
    english = formData.get("english") as string;
    category = formData.get("category") as string;
    pronunciation = (formData.get("pronunciation") as string) || undefined;
    example = (formData.get("example") as string) || undefined;
    exampleTranslation = (formData.get("exampleTranslation") as string) || undefined;

    const audioFile = formData.get("audio") as File | null;
    if (audioFile) {
      const blob = await put(
        `contributions/${userId}/${Date.now()}-${audioFile.name}`,
        audioFile,
        { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
      );
      audioUrl = blob.url;
    }
  } else {
    const body = await c.req.json<{
      type: string;
      languageId: string;
      word: string;
      english: string;
      category: string;
      pronunciation?: string;
      example?: string;
      exampleTranslation?: string;
    }>();
    type = body.type;
    languageId = body.languageId;
    word = body.word;
    english = body.english;
    category = body.category;
    pronunciation = body.pronunciation;
    example = body.example;
    exampleTranslation = body.exampleTranslation;
  }

  console.log("[contributions] Parsed:", { type, languageId, word, english, category });

  if (!type || !languageId || !word?.trim() || !english?.trim() || !category) {
    return c.json({ error: "type, languageId, word, english, and category are required" }, 400);
  }

  const [contribution] = await db
    .insert(contributions)
    .values({
      userId,
      type: type as any,
      languageId,
      word: word.trim(),
      english: english.trim(),
      category,
      pronunciation: pronunciation?.trim() || null,
      example: example?.trim() || null,
      exampleTranslation: exampleTranslation?.trim() || null,
      audioUrl,
    })
    .returning();

  // Create a feed item
  const [user] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db.insert(feedItems).values({
    userId,
    type: "contribution",
    title: `${word.trim()} → ${english.trim()}`,
    description: `Added a new ${type} to the ${languageId} dictionary`,
    userName: user?.name ?? "User",
    userAvatarUrl: user?.avatarUrl,
    audioUrl,
  });

  return c.json(contribution, 201);
});

// GET /api/contributions - list user's contributions
contributionsRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const result = await db
    .select()
    .from(contributions)
    .where(eq(contributions.userId, userId))
    .orderBy(desc(contributions.createdAt));

  return c.json(result);
});

// GET /api/contributions/approved?languageId=izon - approved entries as dictionary format
contributionsRouter.get("/approved", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId) {
    return c.json({ error: "languageId query param required" }, 400);
  }

  const result = await db
    .select({
      id: contributions.id,
      word: contributions.word,
      english: contributions.english,
      category: contributions.category,
      languageId: contributions.languageId,
      pronunciation: contributions.pronunciation,
      example: contributions.example,
      exampleTranslation: contributions.exampleTranslation,
    })
    .from(contributions)
    .where(
      and(
        eq(contributions.languageId, languageId),
        eq(contributions.status, "approved")
      )
    )
    .orderBy(contributions.word);

  return c.json(result);
});
