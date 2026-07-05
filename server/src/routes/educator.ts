/**
 * Educator / Reviewer panel routes
 *
 * All routes require `authMiddleware` + `reviewerMiddleware`.
 * Admins see all languages; reviewers are scoped to their `reviewerLanguages`.
 *
 * This file composes the per-resource routers under ./educator/ — split out
 * because the combined file had grown past 1,700 lines. Each sub-router keeps
 * its handlers verbatim; only the shared helpers moved to ./educator/_shared.ts.
 */
import { Hono } from "hono";
import { AuthEnv, authMiddleware, reviewerMiddleware } from "../middleware/auth.js";
import { educatorMeRouter } from "./educator/me.js";
import { educatorStatsRouter } from "./educator/stats.js";
import { educatorContributionsRouter } from "./educator/contributions.js";
import { educatorDictionaryRouter } from "./educator/dictionary.js";
import { educatorCoursesRouter } from "./educator/courses.js";
import { educatorLessonsRouter } from "./educator/lessons.js";
import { educatorStoryArcsRouter } from "./educator/story-arcs.js";
import { educatorSentencesRouter } from "./educator/sentences.js";
import { educatorScenariosRouter } from "./educator/scenarios.js";
import { educatorContentHealthRouter } from "./educator/content-health.js";

export const educatorRouter = new Hono<AuthEnv>();
educatorRouter.use("*", authMiddleware);
educatorRouter.use("*", reviewerMiddleware);

educatorRouter.route("/", educatorMeRouter);
educatorRouter.route("/", educatorStatsRouter);
educatorRouter.route("/", educatorContributionsRouter);
educatorRouter.route("/", educatorDictionaryRouter);
educatorRouter.route("/", educatorCoursesRouter);
educatorRouter.route("/", educatorLessonsRouter);
educatorRouter.route("/", educatorStoryArcsRouter);
educatorRouter.route("/", educatorSentencesRouter);
educatorRouter.route("/", educatorScenariosRouter);
educatorRouter.route("/", educatorContentHealthRouter);
