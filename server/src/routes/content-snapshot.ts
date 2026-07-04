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

  const version = createHash("sha1").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
  return c.json({ version, ...payload });
});
