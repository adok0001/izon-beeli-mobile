import { Hono } from "hono";
import { parseJson } from "../lib/http.js";
import { eq, and, ne, sql, between } from "drizzle-orm";
import { db } from "../db/index.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../middleware/auth.js";
import {
  users,
  pushTokens,
  classroomAssignments,
  classroomMembers,
  lessons,
} from "../db/schema.js";
import { resolveWotd } from "./daily-content.js";
import { sendPushBatch, chunk, type PushMessage } from "../lib/send-push.js";
import {
  sendEmail,
  wordOfDayEmailHtml,
  wordOfDayEmailText,
  streakReminderEmailHtml,
  streakReminderEmailText,
  assignmentDueEmailHtml,
  assignmentDueEmailText,
} from "../lib/send-email.js";

// ---- Shared auth router ----
export const notificationsRouter = new Hono<AuthEnv>();
notificationsRouter.use("*", authMiddleware);

// GET /api/notifications/preferences
notificationsRouter.get("/preferences", async (c) => {
  const userId = c.get("userId");
  const [user] = await db
    .select({
      pushWotdEnabled: users.pushWotdEnabled,
      pushStreakReminderEnabled: users.pushStreakReminderEnabled,
      emailWotdEnabled: users.emailWotdEnabled,
      emailStreakReminderEnabled: users.emailStreakReminderEnabled,
      emailAssignmentDueEnabled: users.emailAssignmentDueEnabled,
      emailContributionStatusEnabled: users.emailContributionStatusEnabled,
      emailReviewerStatusEnabled: users.emailReviewerStatusEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return c.json({
    pushWotdEnabled: user?.pushWotdEnabled ?? true,
    pushStreakReminderEnabled: user?.pushStreakReminderEnabled ?? true,
    emailWotdEnabled: user?.emailWotdEnabled ?? true,
    emailStreakReminderEnabled: user?.emailStreakReminderEnabled ?? true,
    emailAssignmentDueEnabled: user?.emailAssignmentDueEnabled ?? true,
    emailContributionStatusEnabled: user?.emailContributionStatusEnabled ?? true,
    emailReviewerStatusEnabled: user?.emailReviewerStatusEnabled ?? true,
  });
});

// PATCH /api/notifications/preferences
notificationsRouter.patch("/preferences", async (c) => {
  const userId = c.get("userId");
  const body = await parseJson<{
    pushWotdEnabled?: boolean;
    pushStreakReminderEnabled?: boolean;
    emailWotdEnabled?: boolean;
    emailStreakReminderEnabled?: boolean;
    emailAssignmentDueEnabled?: boolean;
    emailContributionStatusEnabled?: boolean;
    emailReviewerStatusEnabled?: boolean;
  }>(c);

  const patch: Record<string, boolean> = {};
  const boolFields = [
    "pushWotdEnabled",
    "pushStreakReminderEnabled",
    "emailWotdEnabled",
    "emailStreakReminderEnabled",
    "emailAssignmentDueEnabled",
    "emailContributionStatusEnabled",
    "emailReviewerStatusEnabled",
  ] as const;

  for (const field of boolFields) {
    if (typeof body[field] === "boolean") patch[field] = body[field]!;
  }

  if (Object.keys(patch).length > 0) {
    await db.update(users).set(patch).where(eq(users.id, userId));
  }

  return c.json({ updated: true });
});

// POST /api/notifications/broadcast — admin-auth-protected broadcast
notificationsRouter.post("/broadcast", adminMiddleware, async (c) => {
  const body = await parseJson<{
    title: string;
    body: string;
    data?: Record<string, string | number | boolean>;
    languageId?: string;
    audience?: "admins" | "educators";
  }>(c);

  if (!body.title || !body.body) {
    return c.json({ error: "title and body are required" }, 400);
  }

  const conditions = [];
  if (body.audience === "admins") conditions.push(eq(users.isAdmin, true));
  else if (body.audience === "educators") conditions.push(eq(users.isReviewer, true));
  if (body.languageId) conditions.push(eq(users.selectedLanguageId, body.languageId));

  const rows = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .innerJoin(users, eq(pushTokens.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined);

  if (rows.length === 0) return c.json({ sent: 0, total: 0 });

  const messages: PushMessage[] = rows.map((row) => ({
    to: row.token,
    title: body.title,
    body: body.body,
    data: { type: "broadcast", ...body.data },
    sound: "default",
  }));

  let sent = 0;
  for (const batch of chunk(messages, 100)) {
    const tickets = await sendPushBatch(batch);
    sent += tickets.filter((t) => t.status === "ok").length;
  }

  return c.json({ sent, total: messages.length });
});

// ---- Cron/admin router (protected by CRON_SECRET header) ----
export const notificationsAdminRouter = new Hono();

function cronGuard(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Support Vercel's Authorization bearer header (used by Vercel Cron)
  const authHeader = req.headers.get("authorization");
  if (authHeader === "Bearer " + secret) return true;
  // Also accept legacy x-cron-secret header
  const cronHeader = req.headers.get("x-cron-secret");
  return cronHeader === secret;
}

/**
 * GET /api/notifications/admin/send-wotd
 * Send today's Word of the Day push + email to all opted-in users.
 * Called by Vercel Cron at the configured schedule (e.g. 9:00 AM).
 */
notificationsAdminRouter.get("/send-wotd", async (c) => {
  if (!cronGuard(c.req.raw)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Users who opted into push WOTD
  const pushRows = await db
    .select({
      token: pushTokens.token,
      languageId: users.selectedLanguageId,
    })
    .from(pushTokens)
    .innerJoin(users, eq(pushTokens.userId, users.id))
    .where(eq(users.pushWotdEnabled, true));

  // Users who opted into email WOTD
  const emailRows = await db
    .select({
      email: users.email,
      name: users.name,
      languageId: users.selectedLanguageId,
    })
    .from(users)
    .where(and(eq(users.emailWotdEnabled, true), sql`${users.deletedAt} IS NULL`));

  // Resolve one word per language (respects manual override)
  const wordByLang = new Map<string, { word: string; english: string }>();

  const allLanguages = new Set([
    ...pushRows.map((r) => r.languageId ?? "izon"),
    ...emailRows.map((r) => r.languageId ?? "izon"),
  ]);

  for (const languageId of allLanguages) {
    const result = await resolveWotd(languageId);
    if (result) wordByLang.set(languageId, { word: result.entry.word, english: result.entry.english });
  }

  // Send push notifications
  const pushLangMap = new Map<string, string[]>();
  for (const row of pushRows) {
    const lang = row.languageId ?? "izon";
    if (!pushLangMap.has(lang)) pushLangMap.set(lang, []);
    pushLangMap.get(lang)!.push(row.token);
  }

  const messages: PushMessage[] = [];
  for (const [languageId, tokens] of pushLangMap) {
    const entry = wordByLang.get(languageId);
    if (!entry) continue;
    for (const token of tokens) {
      messages.push({
        to: token,
        title: "Word of the Day",
        body: `${entry.word} — ${entry.english}`,
        data: { type: "word_of_day", languageId },
        sound: "default",
      });
    }
  }

  let pushSent = 0;
  for (const batch of chunk(messages, 100)) {
    const tickets = await sendPushBatch(batch);
    pushSent += tickets.filter((t) => t.status === "ok").length;
  }

  // Send emails concurrently
  let emailSent = 0;
  await Promise.all(
    emailRows.map(async (row) => {
      const lang = row.languageId ?? "izon";
      const entry = wordByLang.get(lang);
      if (!entry) return;
      const ok = await sendEmail({
        to: { email: row.email, name: row.name },
        subject: `Word of the Day: ${entry.word}`,
        htmlContent: wordOfDayEmailHtml(row.name, entry.word, entry.english, lang),
        textContent: wordOfDayEmailText(row.name, entry.word, entry.english),
      });
      if (ok) emailSent++;
    })
  );

  return c.json({ pushSent, emailSent, total: messages.length + emailRows.length });
});

/**
 * POST /api/notifications/admin/broadcast
 * Send a custom push notification to all users with push tokens.
 * Body: { title: string, body: string, data?: Record<string, string|number|boolean> }
 * Optionally filter by languageId: { languageId?: string }
 */
notificationsAdminRouter.post("/broadcast", async (c) => {
  if (!cronGuard(c.req.raw)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await parseJson<{
    title: string;
    body: string;
    data?: Record<string, string | number | boolean>;
    languageId?: string;
    audience?: "admins" | "educators";
  }>(c);

  if (!body.title || !body.body) {
    return c.json({ error: "title and body are required" }, 400);
  }

  const conditions = [];
  if (body.audience === "admins") conditions.push(eq(users.isAdmin, true));
  else if (body.audience === "educators") conditions.push(eq(users.isReviewer, true));
  if (body.languageId) conditions.push(eq(users.selectedLanguageId, body.languageId));

  const rows = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .innerJoin(users, eq(pushTokens.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined);

  if (rows.length === 0) return c.json({ sent: 0, total: 0 });

  const messages: PushMessage[] = rows.map((row) => ({
    to: row.token,
    title: body.title,
    body: body.body,
    data: { type: "broadcast", ...body.data },
    sound: "default",
  }));

  let sent = 0;
  for (const batch of chunk(messages, 100)) {
    const tickets = await sendPushBatch(batch);
    sent += tickets.filter((t) => t.status === "ok").length;
  }

  return c.json({ sent, total: messages.length });
});

/**
 * POST /api/notifications/admin/send-streak-reminder
 * Send streak reminders to opted-in users who haven't been active today.
 * Called by Vercel Cron in the evening (e.g. 7:00 PM).
 */
notificationsAdminRouter.get("/send-streak-reminder", async (c) => {
  if (!cronGuard(c.req.raw)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const inactiveFilter = and(
    ne(users.streak, 0),
    sql`${users.lastActiveDate} IS NULL OR ${users.lastActiveDate} != ${todayStr}`
  );

  // Push reminders
  const pushRows = await db
    .select({
      token: pushTokens.token,
      streak: users.streak,
      name: users.name,
    })
    .from(pushTokens)
    .innerJoin(users, eq(pushTokens.userId, users.id))
    .where(and(eq(users.pushStreakReminderEnabled, true), inactiveFilter));

  // Email reminders
  const emailRows = await db
    .select({
      email: users.email,
      name: users.name,
      streak: users.streak,
    })
    .from(users)
    .where(
      and(
        eq(users.emailStreakReminderEnabled, true),
        sql`${users.deletedAt} IS NULL`,
        inactiveFilter
      )
    );

  const pushMessages: PushMessage[] = pushRows.map((row) => ({
    to: row.token,
    title: "Keep your streak alive! 🔥",
    body: `You have a ${row.streak}-day streak. Complete a lesson today to keep it going.`,
    data: { type: "streak_reminder" },
    sound: "default",
  }));

  let pushSent = 0;
  for (const batch of chunk(pushMessages, 100)) {
    const tickets = await sendPushBatch(batch);
    pushSent += tickets.filter((t) => t.status === "ok").length;
  }

  let emailSent = 0;
  await Promise.all(
    emailRows.map(async (row) => {
      const ok = await sendEmail({
        to: { email: row.email, name: row.name },
        subject: "Keep your streak alive! 🔥",
        htmlContent: streakReminderEmailHtml(row.name, row.streak),
        textContent: streakReminderEmailText(row.name, row.streak),
      });
      if (ok) emailSent++;
    })
  );

  return c.json({ pushSent, emailSent, total: pushMessages.length + emailRows.length });
});

/**
 * GET /api/notifications/admin/send-assignment-due
 * Email students whose assignments are due within the next 24 hours.
 * Called by Vercel Cron once daily (e.g. 8:00 AM).
 */
notificationsAdminRouter.get("/send-assignment-due", async (c) => {
  if (!cronGuard(c.req.raw)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Assignments due in next 24 hours
  const rows = await db
    .select({
      lessonTitle: lessons.title,
      dueDate: classroomAssignments.dueDate,
      userEmail: users.email,
      userName: users.name,
      emailAssignmentDueEnabled: users.emailAssignmentDueEnabled,
    })
    .from(classroomAssignments)
    .innerJoin(classroomMembers, eq(classroomMembers.groupId, classroomAssignments.groupId))
    .innerJoin(users, eq(users.id, classroomMembers.userId))
    .innerJoin(lessons, eq(lessons.id, classroomAssignments.lessonId))
    .where(
      and(
        between(classroomAssignments.dueDate, now, in24h),
        eq(classroomMembers.role, "student"),
        eq(users.emailAssignmentDueEnabled, true),
        sql`${users.deletedAt} IS NULL`
      )
    );

  const seen = new Set<string>();
  const dedupedRows = rows.filter((row) => {
    const key = `${row.userEmail}-${row.lessonTitle}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let emailSent = 0;
  await Promise.all(
    dedupedRows.map(async (row) => {
      if (!row.dueDate) return;
      const ok = await sendEmail({
        to: { email: row.userEmail, name: row.userName },
        subject: `Assignment due soon: ${row.lessonTitle}`,
        htmlContent: assignmentDueEmailHtml(row.userName, row.lessonTitle, row.dueDate),
        textContent: assignmentDueEmailText(row.userName, row.lessonTitle, row.dueDate),
      });
      if (ok) emailSent++;
    })
  );

  return c.json({ emailSent, total: dedupedRows.length });
});
