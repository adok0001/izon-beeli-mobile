import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { igboFetch } from "../lib/igbo.js";
import { optionalAuthMiddleware } from "../middleware/auth.js";
import type { AuthEnv } from "../middleware/auth.js";

/**
 * Server-side proxy for igboapi.com.
 *
 * The token used to ship in the mobile bundle via EXPO_PUBLIC_IGBO_API_TOKEN,
 * which inlines it into the app binary at build time. It now lives here as
 * IGBO_API_TOKEN and never leaves the server.
 *
 * Guests are allowed through (the dictionary screen is reachable signed-out),
 * so responses are cached to keep our upstream quota from being drained.
 */
export const igboRouter = new Hono<AuthEnv>();

/** Proxies `path` upstream and writes the result to the response. */
async function send(c: Context<AuthEnv>, path: string) {
  const { status, body } = await igboFetch(path);
  return c.json(body as Record<string, unknown>, status as ContentfulStatusCode);
}

igboRouter.use("*", optionalAuthMiddleware);

igboRouter.get("/words", async (c) => {
  const keyword = c.req.query("keyword")?.trim();
  if (!keyword) return c.json({ error: "keyword is required" }, 400);

  const limit = Math.min(Number(c.req.query("limit")) || 20, 50);
  return send(c, `/words?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
});

igboRouter.get("/words/:id", async (c) => {
  return send(c, `/words/${encodeURIComponent(c.req.param("id"))}`);
});

igboRouter.get("/examples", async (c) => {
  const wordId = c.req.query("associatedWordId")?.trim();
  if (!wordId) return c.json({ error: "associatedWordId is required" }, 400);

  return send(c, `/examples?associatedWordId=${encodeURIComponent(wordId)}`);
});
