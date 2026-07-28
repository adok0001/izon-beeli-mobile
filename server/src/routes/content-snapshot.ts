import { Hono } from "hono";
import { createHash } from "node:crypto";
import {
  selectCultural,
  selectDictionary,
  selectInteractiveStories,
  selectProverbs,
  selectPublishedCourses,
  selectPublishedLessons,
  selectScripts,
  selectSentences,
} from "../lib/content-selectors.js";

export const contentSnapshotRouter = new Hono();

/**
 * GET /api/content/snapshot?lang=<languageId>
 *
 * The offline snapshot the mobile app caches to AsyncStorage. It is built from
 * the shared content selectors (published rows only), so it always mirrors what
 * the live read routes serve. `version` is a content hash — the client re-fetches
 * only when the published content for that language actually changed.
 */
contentSnapshotRouter.get("/snapshot", async (c) => {
  const languageId = c.req.query("lang") ?? c.req.query("languageId");
  if (!languageId || languageId.length > 64) {
    return c.json({ error: "Valid lang query param required" }, 400);
  }

  const [dictionary, sentences, proverbsList, cultural, scriptsBundle, interactiveStoriesList, coursesList, lessonsBundle] =
    await Promise.all([
      selectDictionary(languageId),
      selectSentences(languageId),
      selectProverbs(languageId),
      selectCultural(languageId),
      selectScripts(languageId),
      // Interactive stories are few and keyed by storyId across languages — ship all
      // so the story player resolves any film offline regardless of active language.
      selectInteractiveStories(),
      selectPublishedCourses(languageId),
      selectPublishedLessons(languageId),
    ]);

  const payload = {
    languageId,
    dictionary,
    sentences,
    proverbs: proverbsList,
    cultural,
    scripts: scriptsBundle,
    interactiveStories: interactiveStoriesList,
    courses: coursesList,
    lessons: lessonsBundle,
  };

  const serialized = JSON.stringify(payload);
  const version = createHash("sha1").update(serialized).digest("hex").slice(0, 16);
  const etag = `"${version}"`;

  // The response already told clients to revalidate; until now it gave them
  // nothing to revalidate *with*, so every "has anything changed?" poll paid a
  // full multi-table read, a full serialization, and a full transfer to answer
  // "no" — which is the answer roughly six times in seven.
  c.header("ETag", etag);
  c.header("Cache-Control", "public, max-age=0, must-revalidate");

  if (etagMatches(c.req.header("If-None-Match"), etag)) {
    return c.body(null, 304);
  }

  return c.json({ version, ...payload });
});

/**
 * RFC 9110 If-None-Match: a comma-separated list, `*` matches anything, and a
 * weak validator (`W/"…"`) compares equal to its strong form for this purpose —
 * we only ever emit strong tags, but proxies may weaken them in transit.
 */
function etagMatches(header: string | undefined, etag: string): boolean {
  if (!header) return false;
  const strip = (t: string) => t.trim().replace(/^W\//, "");
  const target = strip(etag);
  return header.split(",").some((t) => {
    const candidate = strip(t);
    return candidate === "*" || candidate === target;
  });
}
