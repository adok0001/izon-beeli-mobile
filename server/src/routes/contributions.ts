import { put } from "@vercel/blob";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { bounties, contributions, dictionaryEntries, feedItems, users } from "../db/schema.js";
import { awardXP, CONTRIBUTION_BASE_XP } from "../lib/award-xp.js";
import { adminMiddleware, authMiddleware, type AuthEnv } from "../middleware/auth.js";
import { updateStreak } from "../lib/update-streak.js";
import {
  sendEmail,
  contributionStatusEmailHtml,
  contributionStatusEmailText,
} from "../lib/send-email.js";

const VALID_TYPES = ["word", "phrase", "audio", "entry_audio", "entry_meaning", "entry_image"] as const;
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
      imageUrl: contributions.imageUrl,
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
  let imageUrl: string | undefined;
  let dictionaryEntryId: string | undefined;

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
    dictionaryEntryId = (formData.get("dictionaryEntryId") as string) || undefined;

    const audioFile = formData.get("audio") as File | null;
    if (audioFile) {
      try {
        const blob = await put(
          `contributions/${userId}/${Date.now()}-${audioFile.name}`,
          audioFile,
          { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
        );
        audioUrl = blob.url;
      } catch (err: any) {
        console.error("Blob upload error:", err?.message ?? err);
        return c.json({ error: `Failed to upload audio file: ${err?.message ?? "unknown"}` }, 500);
      }
    }

    const imageFile = formData.get("image") as File | null;
    if (imageFile) {
      try {
        const blob = await put(
          `contributions/${userId}/${Date.now()}-${imageFile.name}`,
          imageFile,
          { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
        );
        imageUrl = blob.url;
      } catch (err: any) {
        console.error("Blob upload error:", err?.message ?? err);
        return c.json({ error: `Failed to upload image file: ${err?.message ?? "unknown"}` }, 500);
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
      dictionaryEntryId?: string;
    }>();
    type = body.type ?? "";
    languageId = body.languageId ?? "";
    word = body.word ?? "";
    english = body.english ?? "";
    category = body.category ?? "";
    pronunciation = body.pronunciation;
    example = body.example;
    exampleTranslation = body.exampleTranslation;
    dictionaryEntryId = body.dictionaryEntryId;
  }

  // entry_audio, entry_meaning, entry_image target an existing dictionary entry
  const isEntryContribution = type === "entry_audio" || type === "entry_meaning" || type === "entry_image";

  if (isEntryContribution) {
    if (!dictionaryEntryId || !languageId) {
      return c.json({ error: "dictionaryEntryId and languageId are required for entry contributions" }, 400);
    }
    if (type === "entry_audio" && !audioUrl) {
      return c.json({ error: "Audio file is required for entry_audio contributions" }, 400);
    }
    if (type === "entry_meaning" && !english?.trim()) {
      return c.json({ error: "english (new meaning) is required for entry_meaning contributions" }, 400);
    }
    if (type === "entry_image" && !imageUrl) {
      return c.json({ error: "Image file is required for entry_image contributions" }, 400);
    }

    // Fetch the existing entry to populate word/category
    const [existingEntry] = await db
      .select()
      .from(dictionaryEntries)
      .where(eq(dictionaryEntries.id, dictionaryEntryId))
      .limit(1);

    if (!existingEntry) {
      return c.json({ error: "Dictionary entry not found" }, 404);
    }

    // Use the existing entry's word and category
    word = word.trim() || existingEntry.word;
    category = category || existingEntry.category;
  } else {
    if (!type || !languageId || !word?.trim() || !english?.trim() || !category) {
      return c.json({ error: "type, languageId, word, english, and category are required" }, 400);
    }
  }

  if (!VALID_TYPES.includes(type as any)) {
    return c.json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` }, 400);
  }

  // Duplicate detection — skip for entry contributions (they enhance existing entries)
  if (!isEntryContribution) {
    const wordNorm = word.trim().toLowerCase();
    const [existingDict] = await db
      .select({ id: dictionaryEntries.id, word: dictionaryEntries.word, english: dictionaryEntries.english })
      .from(dictionaryEntries)
      .where(and(eq(dictionaryEntries.languageId, languageId), ilike(dictionaryEntries.word, wordNorm)))
      .limit(1);

    if (existingDict) {
      return c.json(
        { error: "This word already exists in the dictionary", existing: existingDict },
        409
      );
    }

    const [existingContrib] = await db
      .select({ id: contributions.id, word: contributions.word, status: contributions.status })
      .from(contributions)
      .where(
        and(
          eq(contributions.languageId, languageId),
          ilike(contributions.word, wordNorm),
          or(eq(contributions.status, "submitted"), eq(contributions.status, "approved"))
        )
      )
      .limit(1);

    if (existingContrib) {
      return c.json(
        { error: "A contribution for this word already exists", existing: existingContrib },
        409
      );
    }
  }

  try {
    const [contribution] = await db
      .insert(contributions)
      .values({
        userId,
        type: type as (typeof VALID_TYPES)[number],
        languageId,
        word: word.trim(),
        english: english?.trim() || word.trim(),
        category,
        pronunciation: pronunciation?.trim() || null,
        example: example?.trim() || null,
        exampleTranslation: exampleTranslation?.trim() || null,
        audioUrl: audioUrl ?? null,
        imageUrl: imageUrl ?? null,
        dictionaryEntryId: dictionaryEntryId || null,
      })
      .returning();

    // Create a feed item
    const [user] = await db
      .select({ name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const feedTitle = isEntryContribution
      ? type === "entry_audio"
        ? `Audio for: ${word.trim()}`
        : `New meaning for: ${word.trim()}`
      : `${word.trim()} → ${english.trim()}`;

    const feedDesc = isEntryContribution
      ? type === "entry_audio"
        ? `Recorded pronunciation for "${word.trim()}" in ${languageId}`
        : `Suggested a new meaning for "${word.trim()}" in ${languageId}: ${english.trim()}`
      : `Added a new ${type} to the ${languageId} dictionary`;

    const feedTitleFr = isEntryContribution
      ? type === "entry_audio"
        ? `Audio pour : ${word.trim()}`
        : `Nouveau sens pour : ${word.trim()}`
      : `${word.trim()} → ${english.trim()}`;

    const feedDescFr = isEntryContribution
      ? type === "entry_audio"
        ? `A enregistré la prononciation de « ${word.trim()} » en ${languageId}`
        : `A suggéré un nouveau sens pour « ${word.trim()} » en ${languageId} : ${english.trim()}`
      : `A ajouté un nouveau ${type === "word" ? "mot" : type === "phrase" ? "expression" : "fichier audio"} au dictionnaire ${languageId}`;

    await db.insert(feedItems).values({
      userId,
      type: "contribution",
      title: feedTitle,
      titleFr: feedTitleFr,
      description: feedDesc,
      descriptionFr: feedDescFr,
      userName: user?.name ?? "User",
      userAvatarUrl: user?.avatarUrl,
      audioUrl: audioUrl ?? null,
      contributionId: contribution.id,
    });

    updateStreak(userId).catch(() => {});

    return c.json(contribution, 201);
  } catch (err: any) {
    console.error("POST /contributions error:", err);
    return c.json({ error: err.message ?? "Internal server error" }, 500);
  }
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
      submitterName: users.name,
      audioUrl: contributions.audioUrl,
      imageUrl: contributions.imageUrl,
      dictionaryEntryId: contributions.dictionaryEntryId,
      createdAt: contributions.createdAt,
    })
    .from(contributions)
    .leftJoin(users, eq(contributions.userId, users.id))
    .where(eq(contributions.status, "submitted"))
    .orderBy(desc(contributions.createdAt));

  return c.json(result);
});

// POST /api/contributions/bulk - submit multiple word/phrase entries at once (no audio)
contributionsRouter.post("/bulk", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    languageId: string;
    entries: {
      word: string;
      english: string;
      category: string;
      pronunciation?: string;
      example?: string;
      exampleTranslation?: string;
    }[];
  }>();

  const { languageId, entries } = body;

  if (!languageId || languageId.length > 32) {
    return c.json({ error: "Valid languageId is required" }, 400);
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return c.json({ error: "entries array must not be empty" }, 400);
  }

  if (entries.length > 100) {
    return c.json({ error: "Maximum 100 entries per bulk submission" }, 400);
  }

  const invalid = entries.find((e) => !e.word?.trim() || !e.english?.trim() || !e.category);
  if (invalid) {
    return c.json({ error: "Each entry must have word, english, and category" }, 400);
  }

  const rows = entries.map((e) => ({
    userId,
    type: e.word.trim().includes(" ") ? ("phrase" as const) : ("word" as const),
    languageId,
    word: e.word.trim(),
    english: e.english.trim(),
    category: e.category,
    pronunciation: e.pronunciation?.trim() || null,
    example: e.example?.trim() || null,
    exampleTranslation: e.exampleTranslation?.trim() || null,
  }));

  const inserted = await db.insert(contributions).values(rows).returning();

  const [user] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db.insert(feedItems).values({
    userId,
    type: "contribution",
    title: `${inserted.length} new ${languageId} entries`,
    titleFr: `${inserted.length} nouvelles entrées en ${languageId}`,
    description: `Contributed ${inserted.length} words and phrases to the ${languageId} dictionary`,
    descriptionFr: `A contribué ${inserted.length} mots et expressions au dictionnaire ${languageId}`,
    userName: user?.name ?? "User",
    userAvatarUrl: user?.avatarUrl,
    contributionId: null,
  });

  updateStreak(userId).catch(() => {});

  return c.json({ inserted: inserted.length, contributions: inserted }, 201);
});

// PATCH /api/contributions/:id/review - approve or reject a contribution (admin only)
contributionsRouter.patch("/:id/review", adminMiddleware, async (c) => {
  const reviewerId = c.get("userId");
  const { id } = c.req.param();
  const body = await c.req.json<{ action: string; note?: string }>();
  const action = body.action;

  if (!VALID_REVIEW_ACTIONS.includes(action as any)) {
    return c.json({ error: "action must be 'approve' or 'reject'" }, 400);
  }

  // Fetch current contribution to guard against double-approval
  const [existing] = await db
    .select()
    .from(contributions)
    .where(eq(contributions.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Contribution not found" }, 404);
  }

  if (existing.status === "approved") {
    return c.json({ error: "Contribution already approved" }, 409);
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  if (action === "reject") {
    await db.delete(feedItems).where(
      eq(feedItems.contributionId, id)
    );
  }

  let xpAwarded: number | null = null;
  let bountyXpAwarded: number | null = null;
  let matchedBountyId: string | null = null;

  if (action === "approve") {
    // Apply entry contributions to the dictionary entry
    if (existing.dictionaryEntryId) {
      if (existing.type === "entry_audio" && existing.audioUrl) {
        await db
          .update(dictionaryEntries)
          .set({ audioUrl: existing.audioUrl })
          .where(eq(dictionaryEntries.id, existing.dictionaryEntryId));
      } else if (existing.type === "entry_image" && existing.imageUrl) {
        await db
          .update(dictionaryEntries)
          .set({ imageUrl: existing.imageUrl })
          .where(eq(dictionaryEntries.id, existing.dictionaryEntryId));
      } else if (existing.type === "entry_meaning" && existing.english) {
        // Append the new meaning to the existing english field
        const [entry] = await db
          .select({ english: dictionaryEntries.english })
          .from(dictionaryEntries)
          .where(eq(dictionaryEntries.id, existing.dictionaryEntryId))
          .limit(1);
        if (entry) {
          const updatedEnglish = entry.english.includes(existing.english)
            ? entry.english
            : `${entry.english}; ${existing.english}`;
          await db
            .update(dictionaryEntries)
            .set({ english: updatedEnglish })
            .where(eq(dictionaryEntries.id, existing.dictionaryEntryId));
        }
      }
    }

    // Award base XP
    const contribType = existing.type as keyof typeof CONTRIBUTION_BASE_XP;
    const baseXp = CONTRIBUTION_BASE_XP[contribType] ?? 15;
    await awardXP(existing.userId, baseXp, "contribution");
    xpAwarded = baseXp;

    // Find matching active bounty (highest xpReward wins)
    const [matchingBounty] = await db
      .select()
      .from(bounties)
      .where(
        and(
          eq(bounties.status, "active"),
          eq(bounties.languageId, existing.languageId),
          sql`(${bounties.category} IS NULL OR ${bounties.category} = ${existing.category})`,
          sql`(${bounties.contributionType} IS NULL OR ${bounties.contributionType} = ${existing.type})`,
          sql`(${bounties.expiresAt} IS NULL OR ${bounties.expiresAt} > NOW())`,
          sql`${bounties.currentCount} < ${bounties.targetCount}`
        )
      )
      .orderBy(desc(bounties.xpReward))
      .limit(1);

    if (matchingBounty) {
      await awardXP(existing.userId, matchingBounty.xpReward, "contribution");
      bountyXpAwarded = matchingBounty.xpReward;
      matchedBountyId = matchingBounty.id;

      // Atomic increment to prevent race conditions
      await db
        .update(bounties)
        .set({
          currentCount: sql`${bounties.currentCount} + 1`,
          ...(matchingBounty.currentCount + 1 >= matchingBounty.targetCount
            ? { status: "completed" as const }
            : {}),
        })
        .where(eq(bounties.id, matchingBounty.id));
    }
  }

  const [updated] = await db
    .update(contributions)
    .set({
      status: newStatus as "approved" | "rejected",
      reviewNote: body.note?.trim() || null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      xpAwarded,
      bountyId: matchedBountyId,
      bountyXpAwarded,
    })
    .where(eq(contributions.id, id))
    .returning();

  // Email notification to contributor
  const [contributor] = await db
    .select({
      email: users.email,
      name: users.name,
      emailContributionStatusEnabled: users.emailContributionStatusEnabled,
    })
    .from(users)
    .where(eq(users.id, existing.userId))
    .limit(1);

  if (contributor?.emailContributionStatusEnabled) {
    const note = body.note?.trim() || null;
    await sendEmail({
      to: { email: contributor.email, name: contributor.name },
      subject: newStatus === "approved"
        ? `Your contribution was approved: ${existing.word}`
        : `Contribution update: ${existing.word}`,
      htmlContent: contributionStatusEmailHtml(contributor.name, existing.word, newStatus as "approved" | "rejected", note),
      textContent: contributionStatusEmailText(contributor.name, existing.word, newStatus as "approved" | "rejected", note),
    });
  }

  return c.json(updated);
});

// PATCH /api/contributions/:id - edit contribution fields (owner while submitted, or admin)
contributionsRouter.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const [existing] = await db
    .select({ id: contributions.id, userId: contributions.userId, status: contributions.status })
    .from(contributions)
    .where(eq(contributions.id, id))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const [user] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.isAdmin) {
    if (existing.userId !== userId) return c.json({ error: "Forbidden" }, 403);
    if (existing.status !== "submitted") return c.json({ error: "Only pending contributions can be edited" }, 409);
  }

  const contentType = c.req.header("Content-Type") ?? "";
  let word: string | undefined;
  let english: string | undefined;
  let pronunciation: string | null | undefined;
  let example: string | null | undefined;
  let exampleTranslation: string | null | undefined;
  let category: string | undefined;
  let audioUrl: string | undefined;
  let imageUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    word = (formData.get("word") as string) || undefined;
    english = (formData.get("english") as string) || undefined;
    pronunciation = formData.has("pronunciation") ? ((formData.get("pronunciation") as string) || null) : undefined;
    example = formData.has("example") ? ((formData.get("example") as string) || null) : undefined;
    exampleTranslation = formData.has("exampleTranslation") ? ((formData.get("exampleTranslation") as string) || null) : undefined;
    category = (formData.get("category") as string) || undefined;

    const audioFile = formData.get("audio") as File | null;
    if (audioFile) {
      try {
        const blob = await put(
          `contributions/${userId}/${Date.now()}-${audioFile.name}`,
          audioFile,
          { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
        );
        audioUrl = blob.url;
      } catch (err: any) {
        return c.json({ error: `Failed to upload audio: ${err?.message ?? "unknown"}` }, 500);
      }
    }

    const imageFile = formData.get("image") as File | null;
    if (imageFile) {
      try {
        const blob = await put(
          `contributions/${userId}/${Date.now()}-${imageFile.name}`,
          imageFile,
          { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN! }
        );
        imageUrl = blob.url;
      } catch (err: any) {
        return c.json({ error: `Failed to upload image: ${err?.message ?? "unknown"}` }, 500);
      }
    }
  } else {
    const body = await c.req.json<{
      word?: string;
      english?: string;
      pronunciation?: string | null;
      example?: string | null;
      exampleTranslation?: string | null;
      category?: string;
    }>();
    word = body.word;
    english = body.english;
    pronunciation = "pronunciation" in body ? body.pronunciation : undefined;
    example = "example" in body ? body.example : undefined;
    exampleTranslation = "exampleTranslation" in body ? body.exampleTranslation : undefined;
    category = body.category;
  }

  const updates: Record<string, unknown> = {};
  if (word?.trim()) updates.word = word.trim();
  if (english?.trim()) updates.english = english.trim();
  if (pronunciation !== undefined) updates.pronunciation = pronunciation?.trim() || null;
  if (example !== undefined) updates.example = example?.trim() || null;
  if (exampleTranslation !== undefined) updates.exampleTranslation = exampleTranslation?.trim() || null;
  if (category) updates.category = category;
  if (audioUrl) updates.audioUrl = audioUrl;
  if (imageUrl) updates.imageUrl = imageUrl;

  if (Object.keys(updates).length === 0) return c.json({ error: "Nothing to update" }, 400);

  const [updated] = await db.update(contributions).set(updates).where(eq(contributions.id, id)).returning();
  return c.json(updated);
});

// DELETE /api/contributions/:id - delete a contribution (owner while not approved, or admin)
contributionsRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const [existing] = await db
    .select({ userId: contributions.userId, status: contributions.status })
    .from(contributions)
    .where(eq(contributions.id, id))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const [user] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.isAdmin) {
    if (existing.userId !== userId) return c.json({ error: "Forbidden" }, 403);
    if (existing.status === "approved") return c.json({ error: "Approved contributions cannot be deleted" }, 409);
  } else if (existing.status === "approved") {
    return c.json({ error: "Approved contributions cannot be deleted" }, 409);
  }

  await db.delete(feedItems).where(eq(feedItems.contributionId, id));
  await db.delete(contributions).where(eq(contributions.id, id));
  return c.json({ deleted: true });
});
