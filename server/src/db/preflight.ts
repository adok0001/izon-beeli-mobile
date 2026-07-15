/**
 * Referential-integrity preflight.
 *
 * `drizzle-kit push` applies FK constraints with a full validating scan and no
 * transaction. If any orphan row exists, the ADD CONSTRAINT raises 23503, push
 * aborts mid-list, and — because vercel-build runs db:deploy in production —
 * the deploy fails with a cryptic error against a half-constrained database.
 *
 * This runs first and refuses the deploy with a legible message instead.
 *
 *   npx tsx src/db/preflight.ts            # exits 1 if any orphans
 *   npx tsx src/db/preflight.ts --verbose  # also print the offending ids
 *
 * Every FK declared in schema.ts must have a check here. Adding a FK without
 * adding its check means the deploy can still fail the hard way.
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index.js";

interface Check {
  /** Human label, e.g. "story_chapters.lesson_id -> lessons.id" */
  fk: string;
  child: string;
  childKey: string;
  parent: string;
  parentKey: string;
  /**
   * True once schema.ts actually declares this `.references()`. Only enforced
   * checks can fail the build — those are the constraints `drizzle-kit push` is
   * about to apply, so an orphan there means a broken deploy. Checks still
   * pending a batch are reported as warnings: useful to watch, but they must not
   * block an unrelated deploy.
   *
   * Flip to `true` in the SAME commit that adds the `.references()`.
   */
  enforced: boolean;
}

/** Every soft link that is (or is about to become) a foreign key. */
const CHECKS: Check[] = [
  // Batch A — new columns, shipped with their FKs (all-NULL on arrival)
  { enforced: true, fk: "culture_items.season_arc_id", child: "culture_items", childKey: "season_arc_id", parent: "story_arcs", parentKey: "id" },
  { enforced: true, fk: "courses.season_arc_id", child: "courses", childKey: "season_arc_id", parent: "story_arcs", parentKey: "id" },
  { enforced: true, fk: "story_arc_cast.story_arc_id", child: "story_arc_cast", childKey: "story_arc_id", parent: "story_arcs", parentKey: "id" },

  // Batch B — story graph
  { enforced: true, fk: "story_chapters.story_arc_id", child: "story_chapters", childKey: "story_arc_id", parent: "story_arcs", parentKey: "id" },
  { enforced: true, fk: "story_chapters.lesson_id", child: "story_chapters", childKey: "lesson_id", parent: "lessons", parentKey: "id" },
  { enforced: true, fk: "story_arcs.course_id", child: "story_arcs", childKey: "course_id", parent: "courses", parentKey: "id" },
  { enforced: true, fk: "story_arcs.language_id", child: "story_arcs", childKey: "language_id", parent: "languages", parentKey: "id" },

  // Batch C — lesson / culture graph
  { enforced: true, fk: "lessons.course_id", child: "lessons", childKey: "course_id", parent: "courses", parentKey: "id" },
  { enforced: true, fk: "transcript_segments.lesson_id", child: "transcript_segments", childKey: "lesson_id", parent: "lessons", parentKey: "id" },
  { enforced: true, fk: "cultural_key_terms.cultural_content_id", child: "cultural_key_terms", childKey: "cultural_content_id", parent: "cultural_content", parentKey: "id" },
  { enforced: true, fk: "lesson_cultural_content.lesson_id", child: "lesson_cultural_content", childKey: "lesson_id", parent: "lessons", parentKey: "id" },
  { enforced: true, fk: "lesson_cultural_content.cultural_content_id", child: "lesson_cultural_content", childKey: "cultural_content_id", parent: "cultural_content", parentKey: "id" },
  { enforced: true, fk: "cultural_content.language_id", child: "cultural_content", childKey: "language_id", parent: "languages", parentKey: "id" },

  // Batch D — language_id columns
  { enforced: true, fk: "courses.language_id", child: "courses", childKey: "language_id", parent: "languages", parentKey: "id" },
  { enforced: true, fk: "dictionary_entries.language_id", child: "dictionary_entries", childKey: "language_id", parent: "languages", parentKey: "id" },
  { enforced: true, fk: "sentence_templates.language_id", child: "sentence_templates", childKey: "language_id", parent: "languages", parentKey: "id" },
  { enforced: true, fk: "activities.language_id", child: "activities", childKey: "language_id", parent: "languages", parentKey: "id" },
];

/** Postgres 42P01 (undefined_table) / 42703 (undefined_column), through Drizzle's wrapper. */
function isMissingRelation(err: unknown): boolean {
  const cause = (err as { cause?: { code?: string } })?.cause;
  return cause?.code === "42P01" || cause?.code === "42703";
}

async function countOrphans(check: Check, verbose: boolean): Promise<number> {
  const child = sql.identifier(check.child);
  const childKey = sql.identifier(check.childKey);
  const parent = sql.identifier(check.parent);
  const parentKey = sql.identifier(check.parentKey);

  const { rows } = await db.execute<{ id: string; bad_value: string }>(sql`
    SELECT c.id, c.${childKey} AS bad_value
    FROM ${child} c
    LEFT JOIN ${parent} p ON p.${parentKey} = c.${childKey}
    WHERE c.${childKey} IS NOT NULL AND p.${parentKey} IS NULL
    LIMIT 50
  `);

  if (rows.length === 0) return 0;

  const log = check.enforced ? console.error : console.warn;
  const tag = check.enforced ? "FAIL" : "warn";
  const note = check.enforced ? "" : " — not yet enforced; clean before its batch";
  log(
    `  ${tag}  ${check.fk} -> ${check.parent}.${check.parentKey} — ` +
      `${rows.length}${rows.length === 50 ? "+ (capped)" : ""} orphan row(s)${note}`,
  );

  const show = verbose ? rows : rows.slice(0, 5);
  for (const r of show) log(`          ${check.child}.id=${r.id} -> missing "${r.bad_value}"`);
  if (!verbose && rows.length > show.length) {
    log(`          …and ${rows.length - show.length} more (re-run with --verbose)`);
  }

  return rows.length;
}

async function main() {
  const verbose = process.argv.includes("--verbose");
  console.log("Referential-integrity preflight\n");

  let blocking = 0;
  let pending = 0;
  for (const check of CHECKS) {
    try {
      const n = await countOrphans(check, verbose);
      if (check.enforced) blocking += n;
      else pending += n;
    } catch (err) {
      // A table or column that doesn't exist yet is expected while the batches
      // roll out — the check starts applying once its migration lands. Drizzle
      // wraps the driver error, so the useful text is on `cause`, not `message`.
      if (isMissingRelation(err)) {
        console.log(`  skip  ${check.fk} (not in the database yet)`);
        continue;
      }
      throw err;
    }
  }

  if (blocking > 0) {
    console.error(
      `\nORPHAN CHECK FAILED — ${blocking} row(s) violate a foreign key this push will apply.\n` +
        `drizzle-kit push is not transactional: it would abort mid-migration and leave\n` +
        `the database half-constrained.\n\n` +
        `Fix first:  npm run db:cleanup-orphans -- --apply\n`,
    );
    process.exit(1);
  }

  if (pending > 0) {
    console.warn(
      `\n${pending} orphan row(s) on soft links that are NOT yet foreign keys.\n` +
        `Harmless today; they must be cleaned before their batch adds the constraint.\n` +
        `  npm run db:cleanup-orphans           # dry run\n`,
    );
  }

  console.log(pending > 0 ? "\nNo blocking orphans — safe to push." : "\nAll checks clean — safe to push.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Preflight crashed:", err);
  process.exit(1);
});
