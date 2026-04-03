import { and, desc, eq, lt, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { comments, feedItems, likes, users } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

const VALID_FEED_TYPES = ["lesson_completed", "achievement", "contribution", "community"] as const;

// Public read-only feed router (no auth required)
export const feedPublicRouter = new Hono();

// GET /api/feed?cursor=&limit=20&type= - paginated feed, isLiked always false for guests
feedPublicRouter.get("/", async (c) => {
  const cursor = c.req.query("cursor");
  const typeFilter = c.req.query("type");
  const rawLimit = parseInt(c.req.query("limit") ?? "20");
  const limit = Math.min(Number.isNaN(rawLimit) ? 20 : rawLimit, 50);

  const conditions = [];
  if (cursor) {
    const cursorDate = new Date(cursor);
    if (Number.isNaN(cursorDate.getTime())) {
      return c.json({ error: "Invalid cursor format" }, 400);
    }
    conditions.push(lt(feedItems.createdAt, cursorDate));
  }
  if (typeFilter && VALID_FEED_TYPES.includes(typeFilter as any)) {
    conditions.push(eq(feedItems.type, typeFilter as (typeof VALID_FEED_TYPES)[number]));
  }

  const items = await db
    .select()
    .from(feedItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(feedItems.createdAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;

  const result = page.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    titleFr: item.titleFr ?? null,
    description: item.description,
    descriptionFr: item.descriptionFr ?? null,
    userName: item.userName,
    userAvatarUrl: item.userAvatarUrl,
    audioUrl: item.audioUrl,
    likes: item.likesCount,
    comments: item.commentsCount,
    isLiked: false,
    createdAt: item.createdAt.toISOString(),
  }));

  return c.json({
    items: result,
    nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
  });
});

// GET /api/feed/:id/comments - public read
feedPublicRouter.get("/:id/comments", async (c) => {
  const feedItemId = c.req.param("id");

  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.feedItemId, feedItemId))
    .orderBy(comments.createdAt);

  return c.json(
    result.map((r) => ({
      id: r.id,
      feedItemId: r.feedItemId,
      userName: r.userName,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

// Authenticated write router
export const feedRouter = new Hono<AuthEnv>();

feedRouter.use("*", authMiddleware);

// POST /api/feed - create community post
feedRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    title: string;
    description: string;
    type?: string;
    audioUrl?: string;
  }>();

  if (!body.title?.trim() || !body.description?.trim()) {
    return c.json({ error: "Title and description required" }, 400);
  }

  const feedType = body.type ?? "community";
  if (!VALID_FEED_TYPES.includes(feedType as any)) {
    return c.json({ error: `Invalid type. Must be one of: ${VALID_FEED_TYPES.join(", ")}` }, 400);
  }

  // Get user name
  const [user] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [item] = await db
    .insert(feedItems)
    .values({
      userId,
      type: feedType as (typeof VALID_FEED_TYPES)[number],
      title: body.title.trim(),
      description: body.description.trim(),
      userName: user?.name ?? "User",
      userAvatarUrl: user?.avatarUrl,
      audioUrl: body.audioUrl,
    })
    .returning();

  return c.json(
    {
      id: item.id,
      type: item.type,
      title: item.title,
      titleFr: item.titleFr ?? null,
      description: item.description,
      descriptionFr: item.descriptionFr ?? null,
      userName: item.userName,
      likes: 0,
      comments: 0,
      isLiked: false,
      createdAt: item.createdAt.toISOString(),
    },
    201
  );
});

// POST /api/feed/:id/like - toggle like
feedRouter.post("/:id/like", async (c) => {
  const userId = c.get("userId");
  const feedItemId = c.req.param("id");

  const [existing] = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.feedItemId, feedItemId)))
    .limit(1);

  if (existing) {
    // Unlike
    await db.delete(likes).where(eq(likes.id, existing.id));
    await db
      .update(feedItems)
      .set({ likesCount: sql`GREATEST(${feedItems.likesCount} - 1, 0)` })
      .where(eq(feedItems.id, feedItemId));
    return c.json({ liked: false });
  } else {
    // Like
    await db.insert(likes).values({ userId, feedItemId });
    await db
      .update(feedItems)
      .set({ likesCount: sql`${feedItems.likesCount} + 1` })
      .where(eq(feedItems.id, feedItemId));
    return c.json({ liked: true });
  }
});

// POST /api/feed/:id/comments - add comment
feedRouter.post("/:id/comments", async (c) => {
  const userId = c.get("userId");
  const feedItemId = c.req.param("id");
  const body = await c.req.json<{ text: string }>();

  if (!body.text?.trim()) {
    return c.json({ error: "Text is required" }, 400);
  }

  // Get user name
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [comment] = await db
    .insert(comments)
    .values({
      userId,
      feedItemId,
      userName: user?.name ?? "User",
      text: body.text.trim(),
    })
    .returning();

  // Increment comment count
  await db
    .update(feedItems)
    .set({ commentsCount: sql`${feedItems.commentsCount} + 1` })
    .where(eq(feedItems.id, feedItemId));

  return c.json(
    {
      id: comment.id,
      feedItemId: comment.feedItemId,
      userName: comment.userName,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    },
    201
  );
});
