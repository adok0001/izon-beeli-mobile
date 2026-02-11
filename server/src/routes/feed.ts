import { Hono } from "hono";
import { eq, and, desc, lt, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { feedItems, likes, comments, users } from "../db/schema.js";
import { authMiddleware, type AuthEnv } from "../middleware/auth.js";

export const feedRouter = new Hono<AuthEnv>();

feedRouter.use("*", authMiddleware);

// GET /api/feed?cursor=&limit=20 - paginated feed with isLiked
feedRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const cursor = c.req.query("cursor");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 50);

  const conditions = cursor ? [lt(feedItems.createdAt, new Date(cursor))] : [];

  const items = await db
    .select()
    .from(feedItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(feedItems.createdAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;

  // Get user's likes for these items
  const itemIds = page.map((i) => i.id);
  let userLikes: string[] = [];
  if (itemIds.length > 0) {
    const likeRows = await db
      .select({ feedItemId: likes.feedItemId })
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          inArray(likes.feedItemId, itemIds)
        )
      );
    userLikes = likeRows.map((r) => r.feedItemId);
  }

  const result = page.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    userName: item.userName,
    userAvatarUrl: item.userAvatarUrl,
    audioUrl: item.audioUrl,
    likes: item.likesCount,
    comments: item.commentsCount,
    isLiked: userLikes.includes(item.id),
    createdAt: item.createdAt.toISOString(),
  }));

  return c.json({
    items: result,
    nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
  });
});

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
      type: (body.type as any) ?? "community",
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
      description: item.description,
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
      .set({ likesCount: sql`${feedItems.likesCount} - 1` })
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

// GET /api/feed/:id/comments - list comments
feedRouter.get("/:id/comments", async (c) => {
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
