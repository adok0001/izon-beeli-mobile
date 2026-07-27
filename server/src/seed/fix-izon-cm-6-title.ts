import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * `izon-cm-6` is mistitled. It carries the title and description of the house
 * lesson ("Owo Warị — Our House") but its transcript is a verb list — arẹ/arị/
 * bo/mu/kọn/kọnbo/baịn/gẹẹ/goo/nemi/afịn/oki — plus example sentences built on
 * them. The real house lesson is `izon-cm-9`, and `izon-cm-10` already runs as
 * "Owo Warị (Part 2)", so the duplicate title made the series read as three
 * parts when it is two.
 *
 *   npx tsx src/seed/fix-izon-cm-6-title.ts          # dry run (default)
 *   npx tsx src/seed/fix-izon-cm-6-title.ts --apply  # write
 *
 * The Ịzọn half of the new title uses three verbs the lesson itself teaches and
 * glosses, joined with `mọ` — the same shape as the existing `izon-fw-12`
 * title "Bo, Mu mọ Kọn Bo". No new vocabulary is invented here; every word is
 * lifted from this lesson's own transcript.
 */
const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);

const ID = "izon-cm-6";

// Both languages move together. The row already carries a French title
// ("Owo Warị — Notre Maison"); merging only `en` would leave French still
// announcing the house lesson — the exact drift that bit the character rename
// earlier, where a one-sided edit left French describing the old content.
const TITLE = { en: "Arẹ, Arị mọ Gẹẹ — Everyday Verbs", fr: "Arẹ, Arị mọ Gẹẹ — Verbes du Quotidien" };
const DESCRIPTION = {
  en: "The core action words of daily life — talk, see, come, go, take, bring, run, write, read, know, sweep, swim — each shown in a short sentence so the verb is learned in use rather than as a bare list.",
  fr: "Les verbes essentiels du quotidien — parler, voir, venir, aller, prendre, apporter, courir, écrire, lire, savoir, balayer, nager — présentés chacun dans une courte phrase, pour que le verbe s'apprenne à l'usage et non comme une simple liste.",
};

const [before] = await sql`select id, title, description, title_translations from lessons where id = ${ID}`;
if (!before) { console.error(`${ID} not found — nothing to do.`); process.exit(1); }

console.log(`── ${ID}`);
console.log(`  title  en  ${before.title}\n         →   ${TITLE.en}`);
console.log(`  title  fr  ${before.title_translations?.fr ?? "—"}\n         →   ${TITLE.fr}`);
console.log(`  desc   en  ${before.description.slice(0, 70)}…\n         →   ${DESCRIPTION.en.slice(0, 70)}…`);

// The translation map is the source of truth for display; the flat column is
// its English projection (see server/src/lib/translations.ts). Both must move
// together or the app serves the stale map and the fix looks un-applied.
if (APPLY) {
  await sql`update lessons
              set title = ${TITLE.en},
                  title_translations = coalesce(title_translations, '{}'::jsonb) || ${JSON.stringify(TITLE)}::jsonb,
                  description = ${DESCRIPTION.en},
                  description_translations = coalesce(description_translations, '{}'::jsonb) || ${JSON.stringify(DESCRIPTION)}::jsonb
            where id = ${ID}`;
  const [after] = await sql`select title, title_translations from lessons where id = ${ID}`;
  console.log(`\napplied — en: ${after.title} · fr: ${after.title_translations?.fr}`);
} else {
  console.log("\ndry run — re-run with --apply to write.");
}
