import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { wordBank } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const wordbankRouter = new Hono<AuthEnv>();

wordbankRouter.use("*", authMiddleware);

// GET /api/wordbank - list saved word IDs
wordbankRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const rows = await db
    .select({ dictionaryEntryId: wordBank.dictionaryEntryId })
    .from(wordBank)
    .where(eq(wordBank.userId, userId));

  return c.json(rows.map((r) => r.dictionaryEntryId));
});

// POST /api/wordbank - save a word
wordbankRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ dictionaryEntryId: string }>();

  if (!body.dictionaryEntryId) {
    return c.json({ error: "dictionaryEntryId is required" }, 400);
  }

  // Check if already saved
  const [existing] = await db
    .select()
    .from(wordBank)
    .where(
      and(
        eq(wordBank.userId, userId),
        eq(wordBank.dictionaryEntryId, body.dictionaryEntryId)
      )
    )
    .limit(1);

  if (existing) {
    return c.json({ saved: true, alreadyExists: true });
  }

  await db.insert(wordBank).values({
    userId,
    dictionaryEntryId: body.dictionaryEntryId,
  });

  return c.json({ saved: true }, 201);
});

// DELETE /api/wordbank/:entryId - remove a saved word
wordbankRouter.delete("/:entryId", async (c) => {
  const userId = c.get("userId");
  const entryId = c.req.param("entryId");

  await db
    .delete(wordBank)
    .where(
      and(
        eq(wordBank.userId, userId),
        eq(wordBank.dictionaryEntryId, entryId)
      )
    );

  return c.json({ removed: true });
});
