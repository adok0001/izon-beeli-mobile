/**
 * Import the Izon season's bundled metadata into Postgres.
 *
 *   npx tsx scripts/export-izon-bundle.ts > src/seed/izon-bundle.json   # in mobile/
 *   npx tsx src/seed/import-izon.ts                                     # dry run
 *   npx tsx src/seed/import-izon.ts --apply
 *
 * The terminal step of the migration begun in 5b8dcfc: everything here used to
 * live only as TypeScript compiled into the app (`mobile/lib/data/podcasts/` and
 * `lib/data/series/`), so it could not be edited in Studio and it silently
 * disagreed with the database. Once this has run, the app reads all of it from
 * the API and the bundle is deleted.
 *
 * Idempotent — upserts by id, safe to re-run.
 *
 * It deliberately does NOT touch lesson content (title, description, transcript,
 * isActive). Those rows are Studio's now; overwriting them from a stale bundle
 * is exactly the two-sources-of-truth problem this is meant to end.
 */
import "dotenv/config";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  courses,
  cultureItems,
  culturalContent,
  lessonCulturalContent,
  lessons,
  storyArcCast,
  storyArcs,
} from "../db/schema.js";
import bundle from "./izon-bundle.json" with { type: "json" };

const APPLY = process.argv.includes("--apply");
const step = (msg: string) => console.log(`\n${msg}`);
const did = (msg: string) => console.log(`  ${APPLY ? "->" : "would"} ${msg}`);

/**
 * Every id the bundle references must already exist — this import enriches rows,
 * it does not create lessons or courses. A missing id means the bundle and the
 * database have drifted, and writing anyway would create the orphans the new
 * foreign keys exist to prevent.
 */
async function assertTargetsExist() {
  const problems: string[] = [];

  const [arc] = await db.select({ id: storyArcs.id }).from(storyArcs).where(eq(storyArcs.id, bundle.arc.id));
  if (!arc) problems.push(`story_arcs: no row "${bundle.arc.id}"`);

  const lessonIds = [
    ...bundle.lessonStyles.map((l) => l.lessonId),
    ...bundle.culturalNotes.map((n) => n.lessonId),
  ];
  const foundLessons = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(inArray(lessons.id, [...new Set(lessonIds)]));
  const haveLessons = new Set(foundLessons.map((l) => l.id));
  for (const id of new Set(lessonIds)) {
    if (!haveLessons.has(id)) problems.push(`lessons: no row "${id}"`);
  }

  const foundCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(inArray(courses.id, bundle.seasonCourseIds));
  const haveCourses = new Set(foundCourses.map((c) => c.id));
  for (const id of bundle.seasonCourseIds) {
    if (!haveCourses.has(id)) problems.push(`courses: no row "${id}"`);
  }

  const itemIds = bundle.cultureItemLinks.map((l) => l.id);
  const foundItems = await db
    .select({ id: cultureItems.id })
    .from(cultureItems)
    .where(inArray(cultureItems.id, itemIds));
  const haveItems = new Set(foundItems.map((i) => i.id));
  for (const id of itemIds) {
    if (!haveItems.has(id)) problems.push(`culture_items: no row "${id}"`);
  }

  if (problems.length > 0) {
    console.error("\nThe bundle references rows that do not exist:\n");
    for (const p of problems) console.error(`  ${p}`);
    console.error("\nRefusing to import — fix the drift first.\n");
    process.exit(1);
  }
}

async function importSeasonMeta() {
  step(`Season metadata — ${bundle.arc.id}`);
  did(`set native_title="${bundle.arc.nativeTitle}", logline, language_id="${bundle.arc.languageId}"`);
  if (!APPLY) return;
  await db
    .update(storyArcs)
    .set({
      nativeTitle: bundle.arc.nativeTitle,
      logline: bundle.arc.logline,
      languageId: bundle.arc.languageId,
    })
    .where(eq(storyArcs.id, bundle.arc.id));
}

async function importCast() {
  step(`Cast — ${bundle.cast.length} members`);
  for (const c of bundle.cast) did(`${c.castId} (${c.name} — ${c.role})`);
  if (!APPLY) return;

  for (const c of bundle.cast) {
    await db
      .insert(storyArcCast)
      .values(c)
      .onConflictDoUpdate({
        target: [storyArcCast.storyArcId, storyArcCast.castId],
        set: {
          name: sql`excluded.name`,
          role: sql`excluded.role`,
          avatar: sql`excluded.avatar`,
          hue: sql`excluded.hue`,
          order: sql`excluded."order"`,
        },
      });
  }
}

async function importLessonStyles() {
  step(`Lesson styles — ${bundle.lessonStyles.length} episodes`);
  for (const l of bundle.lessonStyles) did(`${l.lessonId} = ${l.style}`);
  if (!APPLY) return;

  for (const l of bundle.lessonStyles) {
    await db.update(lessons).set({ style: l.style }).where(eq(lessons.id, l.lessonId));
  }
}

/**
 * Culture notes become first-class `cultural_content` rows attached to their
 * lesson with an anchor. Until now they existed only in a bundled map, which is
 * why an educator could never edit them and why Studio's own culture-note
 * feature was write-only.
 */
async function importCulturalNotes() {
  step(`Culture notes — ${bundle.culturalNotes.length} notes`);
  const anchored = bundle.culturalNotes.filter((n) => n.afterSegmentIndex !== null).length;
  console.log(`  (${anchored} anchored inline, ${bundle.culturalNotes.length - anchored} unanchored)`);
  for (const n of bundle.culturalNotes) {
    did(`${n.id} -> ${n.lessonId} @ segment ${n.afterSegmentIndex ?? "end"} [${n.category}]`);
  }
  if (!APPLY) return;

  for (const n of bundle.culturalNotes) {
    await db
      .insert(culturalContent)
      .values({
        id: n.id,
        languageId: n.languageId,
        category: n.category,
        title: n.title.en ?? n.id,
        titleFr: n.title.fr ?? null,
        description: n.body.en ?? "",
        descriptionFr: n.body.fr ?? null,
        imageEmoji: n.imageEmoji,
      })
      .onConflictDoUpdate({
        target: culturalContent.id,
        set: {
          category: sql`excluded.category`,
          title: sql`excluded.title`,
          titleFr: sql`excluded.title_fr`,
          description: sql`excluded.description`,
          descriptionFr: sql`excluded.description_fr`,
          imageEmoji: sql`excluded.image_emoji`,
        },
      });

    await db
      .insert(lessonCulturalContent)
      .values({
        lessonId: n.lessonId,
        culturalContentId: n.id,
        order: n.order,
        afterSegmentIndex: n.afterSegmentIndex,
      })
      .onConflictDoUpdate({
        target: [lessonCulturalContent.lessonId, lessonCulturalContent.culturalContentId],
        set: {
          order: sql`excluded."order"`,
          afterSegmentIndex: sql`excluded.after_segment_index`,
        },
      });
  }
}

async function importLinks() {
  step(`Season links — ${bundle.seasonCourseIds.length} courses, ${bundle.cultureItemLinks.length} media cards`);

  for (const id of bundle.seasonCourseIds) did(`courses.${id}.season_arc_id = ${bundle.arc.id}`);
  for (const l of bundle.cultureItemLinks) {
    did(`culture_items.${l.id} -> season=${l.seasonArcId}`);
  }
  if (!APPLY) return;

  await db
    .update(courses)
    .set({ seasonArcId: bundle.arc.id })
    .where(inArray(courses.id, bundle.seasonCourseIds));

  // A film's scene graph lives on its own row now (folded from interactive
  // stories); links only wire a card to the season it belongs to.
  for (const l of bundle.cultureItemLinks) {
    await db
      .update(cultureItems)
      .set({ seasonArcId: l.seasonArcId })
      .where(eq(cultureItems.id, l.id));
  }
}

async function main() {
  console.log(APPLY ? "Izon bundle import — APPLYING" : "Izon bundle import — DRY RUN (pass --apply to write)");

  await assertTargetsExist();
  await importSeasonMeta();
  await importCast();
  await importLessonStyles();
  await importCulturalNotes();
  await importLinks();

  console.log(
    APPLY
      ? "\nDone. Verify the Series screen and a lesson's culture notes, then delete mobile/lib/data/podcasts + series."
      : "\nNothing written. Re-run with --apply to commit.",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
