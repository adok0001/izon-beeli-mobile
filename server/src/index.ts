import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { usersRouter } from "./routes/users.js";
import { progressRouter } from "./routes/progress.js";
import { journalRouter } from "./routes/journal.js";
import { feedRouter } from "./routes/feed.js";
import { contributionsRouter } from "./routes/contributions.js";
import { wordbankRouter } from "./routes/wordbank.js";

const app = new Hono().basePath("/api");

app.use("*", logger());
app.use("*", cors());

app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);
  return c.json({ error: "Internal server error", detail: err.message }, 500);
});

// All routes are authenticated (UGC only)
app.route("/users", usersRouter);
app.route("/progress", progressRouter);
app.route("/journal", journalRouter);
app.route("/feed", feedRouter);
app.route("/contributions", contributionsRouter);
app.route("/wordbank", wordbankRouter);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

const port = 3000;
console.log(`Server starting on http://localhost:${port}/api`);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
