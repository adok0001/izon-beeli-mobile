import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { cultureItems, interactiveStories } from "../db/schema.js";

/**
 * One-off backfill for the Film + Interactive Story collapse (Direction B).
 *
 * Folds every `interactive_stories` row into `culture_items` so a film carries
 * its scene graph inline (a film IS its story: its own `id` becomes the story
 * id). Run AFTER the additive columns exist (Phase 1 push) and BEFORE the
 * `interactive_stories` table is dropped (Phase 6). Idempotent — safe to re-run.
 *
 *   npx tsx src/seed/fold-interactive-stories.ts          # dry run (prints plan)
 *   npx tsx src/seed/fold-interactive-stories.ts --apply  # apply to DATABASE_URL
 *
 * For each interactive story S:
 *   - If a film card F points at it (F.interactive_story_id = S.id) → copy the
 *     scene graph (scenes / initial_scene_id / estimated_minutes / language)
 *     onto F. F keeps its own catalog status (it was the live card); we only add
 *     the story payload it was missing.
 *   - Otherwise (a story authored but never linked to a card) → insert a new
 *     film card reusing S.id, so the story stays resolvable by the same id
 *     offline and via the /interactive-stories read shim.
 */

async function run() {
  const apply = process.argv.includes("--apply");
  console.log(`\nFold interactive stories → culture_items — ${apply ? "APPLY" : "DRY RUN"}\n`);

  const stories = await db.select().from(interactiveStories);
  const films = await db
    .select({
      id: cultureItems.id,
      interactiveStoryId: cultureItems.interactiveStoryId,
      storyId: cultureItems.storyId,
    })
    .from(cultureItems)
    .where(eq(cultureItems.type, "film"));

  // Match a story to the film card that opens it. Prefer the typed FK; fall back
  // to the legacy `storyId` string column so un-migrated demo films (which never
  // got an interactiveStoryId) fold onto the existing card instead of spawning a
  // duplicate. The typed FK wins when both are present.
  const filmByStoryId = new Map<string, string>();
  for (const f of films) {
    if (f.storyId && !filmByStoryId.has(f.storyId)) filmByStoryId.set(f.storyId, f.id);
  }
  for (const f of films) {
    if (f.interactiveStoryId) filmByStoryId.set(f.interactiveStoryId, f.id);
  }

  let updated = 0;
  let inserted = 0;

  for (const s of stories) {
    const scenePayload = {
      scenes: s.scenes,
      initialSceneId: s.initialSceneId,
      estimatedMinutes: s.estimatedMinutes,
      language: s.language,
    };

    const filmId = filmByStoryId.get(s.id);
    if (filmId) {
      console.log(`  copy scenes → film ${filmId}  (from story ${s.id})`);
      if (apply) {
        await db.update(cultureItems).set(scenePayload).where(eq(cultureItems.id, filmId));
      }
      updated++;
      continue;
    }

    // Orphan story — no film card references it. Materialise one, reusing S.id.
    console.log(`  insert film card ${s.id}  (orphan story "${s.title}")`);
    if (apply) {
      await db
        .insert(cultureItems)
        .values({
          id: s.id,
          type: "film",
          title: s.title,
          description: s.description,
          author: s.author,
          publishedAt: s.publishedAt ?? new Date(),
          duration: (s.estimatedMinutes ?? 5) * 60,
          coverGradientFrom: s.coverGradientFrom,
          coverGradientTo: s.coverGradientTo,
          coverEmoji: s.coverEmoji,
          featured: false,
          ...scenePayload,
          status: s.status,
          createdBy: s.createdBy,
          updatedBy: s.updatedBy,
          publishedBy: s.publishedBy,
          studioPublishedAt: s.publishedAt,
        })
        .onConflictDoNothing();
    }
    inserted++;
  }

  console.log(
    `\n${apply ? "Applied" : "Would apply"}: ${updated} film card(s) updated, ${inserted} orphan film card(s) inserted, ${stories.length} story(ies) total.`
  );

  if (apply) {
    const withScenes = await db
      .select({ id: cultureItems.id })
      .from(cultureItems)
      .where(eq(cultureItems.type, "film"));
    const sceneCount = withScenes.length;
    console.log(
      `Verify: run \`SELECT count(*) FROM culture_items WHERE type='film' AND scenes IS NOT NULL\` — expect ≥ ${stories.length}. (film rows total: ${sceneCount})\n`
    );
  } else {
    console.log("\nRe-run with --apply to perform the backfill.\n");
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
