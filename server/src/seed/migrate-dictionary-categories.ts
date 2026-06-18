import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * One-off data fix: dictionary_entries created via the old mobile educator panel
 * were saved with singular categories ("noun", "greeting", …) that don't match
 * the canonical plural set used everywhere else (CATEGORY_LABELS, the admin route,
 * and the now-corrected educator route). Those rows mis-render and fail to save.
 *
 * This maps the unambiguous singular values to their canonical plural equivalents.
 * Values with no canonical equivalent (adverb, color, nature, place, other) are
 * left untouched and reported, since the right target is a content decision.
 *
 * Idempotent: re-running is a no-op once categories are already plural.
 *
 *   npx tsx src/seed/migrate-dictionary-categories.ts          # report only
 *   npx tsx src/seed/migrate-dictionary-categories.ts --apply  # perform updates
 */

const sql = neon(process.env.DATABASE_URL!);

// Canonical plural categories — must match VALID_CATEGORIES in the routes and
// DICTIONARY_CATEGORY_VALUES in the mobile app.
const CANONICAL = new Set([
  "greetings", "numbers", "family", "pronouns", "time", "verbs", "body",
  "market", "occupations", "nouns", "phrases", "food", "possessives",
  "ordinals", "commands", "animals", "phonetics", "money", "proverbs",
  "adjectives",
]);

// Unambiguous singular -> plural mappings.
const MAPPING: Record<string, string> = {
  noun: "nouns",
  verb: "verbs",
  adjective: "adjectives",
  pronoun: "pronouns",
  greeting: "greetings",
  phrase: "phrases",
  number: "numbers",
  animal: "animals",
  // Natural phenomena (Rainy Season, Thunder, Lightning) are concrete nouns;
  // there is no weather/nature bucket in the canonical set.
  nature: "nouns",
};

async function run() {
  const apply = process.argv.includes("--apply");

  const counts = (await sql`
    select category, count(*)::int as n
    from dictionary_entries
    group by category
    order by n desc
  `) as { category: string; n: number }[];

  console.log("\nCurrent categories in dictionary_entries:");
  console.table(counts);

  const mappable = counts.filter((c) => c.category in MAPPING);
  const orphans = counts.filter(
    (c) => !CANONICAL.has(c.category) && !(c.category in MAPPING),
  );

  if (orphans.length > 0) {
    console.log(
      "\n⚠️  No canonical equivalent — left unchanged, decide a target manually:",
    );
    console.table(orphans);
  }

  if (mappable.length === 0) {
    console.log("\nNothing to remap. All categories are already canonical.");
    process.exit(0);
  }

  console.log(`\n${apply ? "Applying" : "Would apply"} remaps:`);
  for (const { category, n } of mappable) {
    const target = MAPPING[category];
    console.log(`  ${category} -> ${target} (${n} rows)`);
    if (apply) {
      await sql`update dictionary_entries set category = ${target} where category = ${category}`;
    }
  }

  console.log(
    apply
      ? "\n✅ Done."
      : "\nDry run only. Re-run with --apply to perform the updates.",
  );
  process.exit(0);
}

run().catch((err) => {
  console.error("Category migration failed:", err);
  process.exit(1);
});
