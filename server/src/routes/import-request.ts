import type { Context } from "hono";
import { parseJson } from "../lib/http.js";
import type { AuthEnv } from "../middleware/auth.js";

/**
 * The shared front door for every bulk route — import, lessons, and edit.
 *
 * It lives in its own module rather than in `bulk-import.ts` so `bulk-edit.ts`
 * can use it without the two route files importing each other.
 */

export type ImportRequest = {
  languageId: string;
  entries: unknown[];
  dryRun: boolean;
  isAdmin: boolean;
  userId: string;
  /** Only the lessons route uses this — the course the sheet's lessons land in. */
  courseId?: string;
};

/** How many rows one batch may carry — also caps what an export hands back. */
export const roleCap = (isAdmin: boolean): number => (isAdmin ? 5000 : 100);

/**
 * Parse the body and enforce the security-relevant contract (a valid
 * languageId, a non-empty batch, the reviewer's per-language scope, and the
 * role batch cap) in one place so the handlers can't drift. Returns a ready
 * `Response` on rejection.
 */
export async function readImportRequest(c: Context<AuthEnv>): Promise<ImportRequest | Response> {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");
  const userId = c.get("userId");

  const body = await parseJson<{ languageId: string; entries: unknown[]; dryRun?: boolean; courseId?: string }>(c);
  if (!body.languageId || typeof body.languageId !== "string") {
    return c.json({ error: "languageId is required" }, 400);
  }
  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return c.json({ error: "entries must be a non-empty array" }, 400);
  }
  if (!isAdmin && !reviewerLanguages.includes(body.languageId)) {
    return c.json({ error: "Forbidden: not assigned to this language" }, 403);
  }
  const cap = roleCap(isAdmin);
  if (body.entries.length > cap) {
    return c.json({ error: `Maximum ${cap} entries per import batch for your role` }, 400);
  }
  return {
    languageId: body.languageId,
    entries: body.entries,
    dryRun: body.dryRun ?? false,
    isAdmin,
    userId,
    courseId: typeof body.courseId === "string" ? body.courseId : undefined,
  };
}
