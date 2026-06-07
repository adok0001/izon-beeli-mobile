import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { dailyContentAdminRouter, dailyContentRouter } from "./routes/daily-content.js";
import { billingAdminRouter, billingRouter, billingWebhookRouter } from "./routes/billing.js";
import { bountiesAdminRouter, bountiesRouter } from "./routes/bounties.js";
import { classroomRouter } from "./routes/classroom.js";
import { contributionsPublicRouter, contributionsRouter } from "./routes/contributions.js";
import { contributorsRouter } from "./routes/contributors.js";
import { coursesRouter } from "./routes/courses.js";
import { culturalAdminRouter, culturalRouter } from "./routes/cultural.js";
import { dailyChallengesRouter } from "./routes/daily-challenges.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { dictionaryAdminRouter, dictionaryRouter } from "./routes/dictionary.js";
import { englishWordbankRouter } from "./routes/english-wordbank.js";
import { educatorRouter } from "./routes/educator.js";
import { feedPublicRouter, feedRouter } from "./routes/feed.js";
import { feedbackAdminRouter, feedbackRouter } from "./routes/feedback.js";
import { journalRouter } from "./routes/journal.js";
import { languagesRouter } from "./routes/languages.js";
import { scriptsRouter } from "./routes/scripts.js";
import { lessonContributionsRouter } from "./routes/lesson-contributions.js";
import { lessonsRouter } from "./routes/lessons.js";
import { multiplayerInternalRouter, multiplayerRouter } from "./routes/multiplayer.js";
import { notificationsAdminRouter, notificationsRouter } from "./routes/notifications.js";
import { progressRouter } from "./routes/progress.js";
import { proverbsAdminRouter, proverbsRouter } from "./routes/proverbs.js";
import { pushTokensRouter } from "./routes/push-tokens.js";
import { matchingResultsRouter } from "./routes/matching-results.js";
import { quizResultsRouter } from "./routes/quiz-results.js";
import { wordChallengeRouter, wordChallengeAdminRouter } from "./routes/word-challenge.js";
import { quizRouter } from "./routes/quiz.js";
import { quizAdminRouter } from "./routes/quiz-admin.js";
import { reviewerApplicationsAdminRouter, reviewerApplicationsRouter } from "./routes/reviewer-applications.js";
import { sentencesRouter } from "./routes/sentences.js";
import { storyArcsRouter } from "./routes/story-arcs.js";
import { adminStatsRouter, adminUsersRouter, purgeExpiredDeletedUsers, usersRouter } from "./routes/users.js";
import { isPlusGloballyEnabled } from "./middleware/plus-gate.js";
import { restockPlusFreezes } from "./lib/restock-freezes.js";
import { sendReengagementNotifications } from "./lib/send-reengagement-notifications.js";
import { eq } from "drizzle-orm";
import { appConfig } from "./db/schema.js";
import { db } from "./db/index.js";
import { wordbankRouter } from "./routes/wordbank.js";
import { activitiesRouter, activitiesAdminRouter } from "./routes/activities.js";
import { uploadAdminRouter } from "./routes/upload.js";
import { authMiddleware, adminMiddleware } from "./middleware/auth.js";
import { logger as log } from "./lib/logger.js";

const isDev = process.env.NODE_ENV !== "production";

const app = new Hono().basePath("/api");

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: isDev
      ? "*"
      : (origin) => {
          // Allow mobile clients (no Origin header — Hono passes empty string)
          if (!origin) return origin;
          const allowed = (process.env.ALLOWED_ORIGINS ?? "")
            .split(",")
            .filter(Boolean);
          return allowed.includes(origin) ? origin : "";
        },
    // Keep PUT enabled: educator transcript segment saves use PUT /educator/lessons/:id/segments.
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.onError((err, c) => {
  log.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);
  return c.json(
    { error: "Internal server error", ...(isDev ? { detail: err.message } : {}) },
    500
  );
});

// Stripe webhooks — raw body required, no auth
app.route("/billing", billingWebhookRouter);

// Public config
app.get("/config/public", async (c) => {
  const plusEnabled = await isPlusGloballyEnabled();
  return c.json({ plusEnabled });
});

// Public routes (no auth required)
app.route("/quiz/admin", quizAdminRouter); // more specific path must precede /quiz
app.route("/quiz", quizRouter);
app.route("/feed", feedPublicRouter);
app.route("/contributions", contributionsPublicRouter);
app.route("/contributors", contributorsRouter);
app.route("/languages", languagesRouter);
app.route("/scripts", scriptsRouter);
app.route("/courses", coursesRouter);
app.route("/lessons", lessonsRouter);
app.route("/dictionary", dictionaryRouter);
app.route("/english-wordbank", englishWordbankRouter);
app.route("/dictionary/admin", dictionaryAdminRouter);
app.route("/proverbs", proverbsRouter);
app.route("/proverbs/admin", proverbsAdminRouter);
app.route("/cultural", culturalRouter);
app.route("/cultural/admin", culturalAdminRouter);
app.route("/sentences", sentencesRouter);
app.route("/story-arcs", storyArcsRouter);
app.route("/daily-content", dailyContentRouter);
app.route("/activities", activitiesRouter);
app.get("/health", (c) => c.json({ status: "ok" }));

// Authenticated routes
app.route("/users", usersRouter);
app.route("/progress", progressRouter);
app.route("/journal", journalRouter);
app.route("/feed", feedRouter);
app.route("/contributions", contributionsRouter);
app.route("/lesson-contributions", lessonContributionsRouter);
app.route("/wordbank", wordbankRouter);
app.route("/feedback", feedbackRouter);
app.route("/feedback/admin", feedbackAdminRouter);
app.route("/multiplayer", multiplayerRouter);
app.route("/multiplayer", multiplayerInternalRouter);
app.route("/quiz-results", quizResultsRouter);
app.route("/word-challenge", wordChallengeRouter);
app.route("/word-challenge/admin", wordChallengeAdminRouter);
app.route("/matching-results", matchingResultsRouter);
app.route("/push-tokens", pushTokensRouter);
app.route("/classroom", classroomRouter);
app.route("/daily-challenges", dailyChallengesRouter);
app.route("/dashboard", dashboardRouter);
app.route("/notifications", notificationsRouter);
app.route("/notifications/admin", notificationsAdminRouter);
app.route("/bounties", bountiesRouter);
app.route("/bounties/admin", bountiesAdminRouter);
app.route("/billing", billingRouter);
app.route("/admin/billing", billingAdminRouter);
app.route("/admin/users", adminUsersRouter);
app.route("/daily-content/admin", dailyContentAdminRouter);
app.route("/activities/admin", activitiesAdminRouter);
app.route("/upload", uploadAdminRouter);
app.route("/admin", adminStatsRouter);
app.route("/educator", educatorRouter);
app.route("/reviewer-applications", reviewerApplicationsRouter);
app.route("/reviewer-applications/admin", reviewerApplicationsAdminRouter);

// POST /api/internal/restock-plus-freezes
// Called monthly by Vercel cron. Protected by CRON_SECRET header.
app.post("/internal/restock-plus-freezes", async (c) => {
  const secret = c.req.header("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const restocked = await restockPlusFreezes();
  return c.json({ restocked });
});

// PATCH /api/admin/config — toggle app config values (admin only)
app.patch("/admin/config", authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json<{ key: string; value: string }>();
  await db
    .insert(appConfig)
    .values({ key: body.key, value: body.value })
    .onConflictDoUpdate({ target: appConfig.key, set: { value: body.value } });
  return c.json({ ok: true });
});

// POST /api/internal/purge-deleted-users
// Called daily by Vercel cron (see vercel.json). Protected by CRON_SECRET header.
app.post("/internal/purge-deleted-users", async (c) => {
  const secret = c.req.header("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const purged = await purgeExpiredDeletedUsers();
  return c.json({ purged });
});

app.post("/internal/send-reengagement", async (c) => {
  const secret = c.req.header("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const result = await sendReengagementNotifications();
  return c.json(result);
});

export default app;
