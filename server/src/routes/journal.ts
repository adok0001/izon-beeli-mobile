import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { journalEntries } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const journalRouter = new Hono<AuthEnv>();

journalRouter.use("*", authMiddleware);

// GET /api/journal - list user's journal entries
journalRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const entries = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt));

  return c.json(entries);
});

// POST /api/journal - create entry
journalRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    title: string;
    content: string;
    lessonId?: string;
  }>();

  if (!body.title?.trim() || !body.content?.trim()) {
    return c.json({ error: "Title and content are required" }, 400);
  }

  const [entry] = await db
    .insert(journalEntries)
    .values({
      userId,
      title: body.title.trim(),
      content: body.content.trim(),
      lessonId: body.lessonId || null,
    })
    .returning();

  return c.json(entry, 201);
});

// PATCH /api/journal/:id - update entry
journalRouter.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json<{ title?: string; content?: string }>();

  const [existing] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
    .limit(1);

  if (!existing) return c.json({ error: "Entry not found" }, 404);

  const [updated] = await db
    .update(journalEntries)
    .set({
      ...(body.title ? { title: body.title.trim() } : {}),
      ...(body.content ? { content: body.content.trim() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(journalEntries.id, id))
    .returning();

  return c.json(updated);
});

// DELETE /api/journal/:id - delete entry
journalRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const [existing] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
    .limit(1);

  if (!existing) return c.json({ error: "Entry not found" }, 404);

  await db.delete(journalEntries).where(eq(journalEntries.id, id));
  return c.json({ deleted: true });
});
