import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "../db/index.js";
import { contributions, feedItems, users } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

const VALID_TYPES = ["word", "phrase", "audio"] as const;
const VALID_REVIEW_ACTIONS = ["approve", "reject"] as const;

// Public routes (no auth required)
export const contributionsPublicRouter = new Hono();

// GET /api/contributions/approved?languageId=izon - approved entries as dictionary format
contributionsPublicRouter.get("/approved", async (c) => {
  const languageId = c.req.query("languageId");
  if (!languageId || languageId.length > 32) {
    return c.json({ error: "Valid languageId query param required" }, 400);
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
      audioUrl: contributions.audioUrl,
      contributorId: contributions.userId,
      contributorName: users.name,
    })
    .from(contributions)
    .leftJoin(users, eq(contributions.userId, users.id))
    .where(
      and(
        eq(contributions.languageId, languageId),
        eq(contributions.status, "approved")
      )
    )
    .orderBy(contributions.word);

  return c.json(result);
});

// Authenticated routes
export const contributionsRouter = new Hono<AuthEnv>();

contributionsRouter.use("*", authMiddleware);

// POST /api/contributions - submit a structured word/phrase contribution
contributionsRouter.post("/", async (c) => {
  const userId = c.get("userId");
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
    type = (formData.get("type") as string) ?? "";
    languageId = (formData.get("languageId") as string) ?? "";
    word = (formData.get("word") as string) ?? "";
    english = (formData.get("english") as string) ?? "";
    category = (formData.get("category") as string) ?? "";
    pronunciation = (formData.get("pronunciation") as string) || undefined;
    example = (formData.get("example") as string) || undefined;
    exampleTranslation = (formData.get("exampleTranslation") as string) || undefined;

    const audioFile = formData.get("audio") as File | null;
    if (audioFile) {
      try {
        const blob = await put(
          `contributions/${userId}/${Date.now()}-${audioFile.name}`,
          audioFile,
          { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
        );
        audioUrl = blob.url;
      } catch (err) {
        return c.json({ error: "Failed to upload audio file" }, 500);
      }
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
    type = body.type ?? "";
    languageId = body.languageId ?? "";
    word = body.word ?? "";
    english = body.english ?? "";
    category = body.category ?? "";
    pronunciation = body.pronunciation;
    example = body.example;
    exampleTranslation = body.exampleTranslation;
  }

  if (!type || !languageId || !word?.trim() || !english?.trim() || !category) {
    return c.json({ error: "type, languageId, word, english, and category are required" }, 400);
  }

  if (!VALID_TYPES.includes(type as any)) {
    return c.json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` }, 400);
  }

  const [contribution] = await db
    .insert(contributions)
    .values({
      userId,
      type: type as (typeof VALID_TYPES)[number],
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

// GET /api/contributions/pending - list pending contributions for review
contributionsRouter.get("/pending", async (c) => {
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
      type: contributions.type,
      status: contributions.status,
      userId: contributions.userId,
      createdAt: contributions.createdAt,
    })
    .from(contributions)
    .where(eq(contributions.status, "submitted"))
    .orderBy(desc(contributions.createdAt));

  return c.json(result);
});

// PATCH /api/contributions/:id/review - approve or reject a contribution
contributionsRouter.patch("/:id/review", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ action: string }>();
  const action = body.action;

  if (!VALID_REVIEW_ACTIONS.includes(action as any)) {
    return c.json({ error: "action must be 'approve' or 'reject'" }, 400);
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  const [updated] = await db
    .update(contributions)
    .set({ status: newStatus as "approved" | "rejected" })
    .where(eq(contributions.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: "Contribution not found" }, 404);
  }

  return c.json(updated);
});
