import { and, count, eq, isNull } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { Hono } from "hono";
import { db } from "../../db/index.js";
import { contributions, dictionaryEntries, lessonContributions } from "../../db/schema.js";
import { AuthEnv } from "../../middleware/auth.js";
import { langFilter } from "./_shared.js";

export const educatorStatsRouter = new Hono<AuthEnv>();

// ─── GET /educator/stats ──────────────────────────────────────────────────────

educatorStatsRouter.get("/stats", async (c) => {
  const isAdmin = c.get("isAdmin");
  const reviewerLanguages = c.get("reviewerLanguages");

  const where = (table: { languageId: PgColumn }) =>
    langFilter(table, isAdmin ? [] : reviewerLanguages);

  const [
    [dictCount],
    [pendingContribCount],
    [approvedContribCount],
    [pendingLessonCount],
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(dictionaryEntries)
      .where(where(dictionaryEntries) ?? isNull(dictionaryEntries.languageId)),
    db
      .select({ value: count() })
      .from(contributions)
      .where(
        and(
          eq(contributions.status, "submitted"),
          where(contributions) ?? undefined,
        )
      ),
    db
      .select({ value: count() })
      .from(contributions)
      .where(
        and(
          eq(contributions.status, "approved"),
          where(contributions) ?? undefined,
        )
      ),
    db
      .select({ value: count() })
      .from(lessonContributions)
      .where(
        and(
          eq(lessonContributions.status, "submitted"),
          where(lessonContributions) ?? undefined,
        )
      ),
  ]);

  return c.json({
    dictionaryEntries: dictCount?.value ?? 0,
    pendingContributions: pendingContribCount?.value ?? 0,
    approvedContributions: approvedContribCount?.value ?? 0,
    pendingLessons: pendingLessonCount?.value ?? 0,
  });
});
