import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { bountiesAdminRouter, bountiesRouter } from "./routes/bounties.js";
import { classroomRouter } from "./routes/classroom.js";
import { contributionsPublicRouter, contributionsRouter } from "./routes/contributions.js";
import { contributorsRouter } from "./routes/contributors.js";
import { coursesRouter } from "./routes/courses.js";
import { culturalAdminRouter, culturalRouter } from "./routes/cultural.js";
import { dailyChallengesRouter } from "./routes/daily-challenges.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { dictionaryAdminRouter, dictionaryRouter } from "./routes/dictionary.js";
import { educatorRouter } from "./routes/educator.js";
import { feedPublicRouter, feedRouter } from "./routes/feed.js";
import { feedbackAdminRouter, feedbackRouter } from "./routes/feedback.js";
import { journalRouter } from "./routes/journal.js";
import { languagesRouter } from "./routes/languages.js";
import { lessonContributionsRouter } from "./routes/lesson-contributions.js";
import { lessonsRouter } from "./routes/lessons.js";
import { multiplayerInternalRouter, multiplayerRouter } from "./routes/multiplayer.js";
import { notificationsAdminRouter, notificationsRouter } from "./routes/notifications.js";
import { progressRouter } from "./routes/progress.js";
import { proverbsAdminRouter, proverbsRouter } from "./routes/proverbs.js";
import { pushTokensRouter } from "./routes/push-tokens.js";
import { quizResultsRouter } from "./routes/quiz-results.js";
import { quizRouter } from "./routes/quiz.js";
import { reviewerApplicationsAdminRouter, reviewerApplicationsRouter } from "./routes/reviewer-applications.js";
import { sentencesRouter } from "./routes/sentences.js";
import { adminStatsRouter, adminUsersRouter, purgeExpiredDeletedUsers, usersRouter } from "./routes/users.js";
import { wordbankRouter } from "./routes/wordbank.js";

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
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);
  return c.json(
    { error: "Internal server error", ...(isDev ? { detail: err.message } : {}) },
    500
  );
});

// Public routes (no auth required)
app.route("/quiz", quizRouter);
app.route("/feed", feedPublicRouter);
app.route("/contributions", contributionsPublicRouter);
app.route("/contributors", contributorsRouter);
app.route("/languages", languagesRouter);
app.route("/courses", coursesRouter);
app.route("/lessons", lessonsRouter);
app.route("/dictionary", dictionaryRouter);
app.route("/dictionary/admin", dictionaryAdminRouter);
app.route("/proverbs", proverbsRouter);
app.route("/proverbs/admin", proverbsAdminRouter);
app.route("/cultural", culturalRouter);
app.route("/cultural/admin", culturalAdminRouter);
app.route("/sentences", sentencesRouter);
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
app.route("/push-tokens", pushTokensRouter);
app.route("/classroom", classroomRouter);
app.route("/daily-challenges", dailyChallengesRouter);
app.route("/dashboard", dashboardRouter);
app.route("/notifications", notificationsRouter);
app.route("/notifications/admin", notificationsAdminRouter);
app.route("/bounties", bountiesRouter);
app.route("/bounties/admin", bountiesAdminRouter);
app.route("/admin/users", adminUsersRouter);
app.route("/admin", adminStatsRouter);
app.route("/educator", educatorRouter);
app.route("/reviewer-applications", reviewerApplicationsRouter);
app.route("/reviewer-applications/admin", reviewerApplicationsAdminRouter);

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

export default app;
