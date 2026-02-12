import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { usersRouter } from "./routes/users.js";
import { progressRouter } from "./routes/progress.js";
import { journalRouter } from "./routes/journal.js";
import { feedRouter } from "./routes/feed.js";
import { contributionsRouter, contributionsPublicRouter } from "./routes/contributions.js";
import { wordbankRouter } from "./routes/wordbank.js";

const isDev = process.env.NODE_ENV !== "production";

const app = new Hono().basePath("/api");

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: isDev
      ? "*"
      : (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
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
app.get("/health", (c) => c.json({ status: "ok" }));

// Authenticated routes
app.route("/users", usersRouter);
app.route("/progress", progressRouter);
app.route("/journal", journalRouter);
app.route("/feed", feedRouter);
app.route("/contributions", contributionsRouter);
app.route("/wordbank", wordbankRouter);

const port = parseInt(process.env.PORT ?? "3000");
serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
  console.log(`Server listening on port ${port}`);
});
