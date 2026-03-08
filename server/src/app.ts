import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { usersRouter } from "./routes/users.js";
import { progressRouter } from "./routes/progress.js";
import { journalRouter } from "./routes/journal.js";
import { feedRouter } from "./routes/feed.js";
import { contributionsRouter, contributionsPublicRouter } from "./routes/contributions.js";
import { wordbankRouter } from "./routes/wordbank.js";
import { languagesRouter } from "./routes/languages.js";
import { coursesRouter } from "./routes/courses.js";
import { lessonsRouter } from "./routes/lessons.js";
import { dictionaryRouter } from "./routes/dictionary.js";
import { proverbsRouter } from "./routes/proverbs.js";
import { culturalRouter } from "./routes/cultural.js";
import { sentencesRouter } from "./routes/sentences.js";
import { feedbackRouter } from "./routes/feedback.js";
import { lessonContributionsRouter } from "./routes/lesson-contributions.js";
import { multiplayerRouter, multiplayerInternalRouter } from "./routes/multiplayer.js";

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
app.route("/contributions", contributionsPublicRouter);
app.route("/languages", languagesRouter);
app.route("/courses", coursesRouter);
app.route("/lessons", lessonsRouter);
app.route("/dictionary", dictionaryRouter);
app.route("/proverbs", proverbsRouter);
app.route("/cultural", culturalRouter);
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
app.route("/multiplayer", multiplayerRouter);
app.route("/multiplayer", multiplayerInternalRouter);

export default app;
