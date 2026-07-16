import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Safely parse a JSON request body. A malformed or empty body throws an
 * HTTPException(400) that the global `app.onError` renders as
 * `{ error: "Invalid request body" }` with status 400 — instead of the raw
 * SyntaxError bubbling up as a 500.
 */
export async function parseJson<T>(c: Context): Promise<T> {
  try {
    return await c.req.json<T>();
  } catch {
    throw new HTTPException(400, { message: "Invalid request body" });
  }
}
