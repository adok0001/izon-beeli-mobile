import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { isGlossOverflow, isLossyGloss, parseSenses, projectSenses } from "../lib/senses.js";
import { normalizeSentence, sentenceId } from "../lib/slug.js";

/**
 * Phase 2 of the shared sentence corpus (docs/sentence-corpus-design.md).
 *
 * Explodes `dictionary_entries.english` into `dictionary_senses` rows, promotes
 * every real usage example and drill sentence into `sentences`, and joins the
 * two through `dictionary_examples`. Phase 1 (the tables themselves) ships with
 * a normal `vercel --prod`; this runs afterwards, by hand.
 *
 *   npx tsx src/seed/migrate-sentence-corpus.ts          # report only
 *   npx tsx src/seed/migrate-sentence-corpus.ts --apply  # write
 *
 * Purely additive — it inserts, and never updates or deletes an existing
 * column. `dictionary_entries.english` is left exactly as it is; nothing reads
 * the new rows until the phase 3 cutover, so a bad run is recoverable by
 * truncating the three new tables.
 *
 * Idempotent. Sentence ids are content hashes, so re-running upserts rather
 * than duplicating; sense and example rows are deleted and rewritten per entry.
 *
 * `transcript_segments` is deliberately NOT backfilled. Lesson lines join the
 * corpus only when someone promotes one on purpose — see the column comment.
 */

const sql = neon(process.env.DATABASE_URL!);

/** Neon's HTTP driver caps a statement; entries are chunked well under it. */
const CHUNK = 200;

type Entry = {
  id: string;
  language_id: string;
  english: string;
  example: string | null;
  example_translation: string | null;
  example_translations: Record<string, string> | null;
  example_audio_url: string | null;
};

type Template = {
  id: string;
  language_id: string;
  sentence: string;
  english_sentence: string;
  literal_translation: string | null;
};

/** A corpus row to be written, keyed by its content hash. */
type Draft = {
  id: string;
  languageId: string;
  text: string;
  translation: string | null;
  translations: Record<string, string> | null;
  literal: string | null;
  audioUrl: string | null;
};

/**
 * Merge a sentence seen more than once. Later sightings only ever *fill* a
 * null — never overwrite text someone already curated, since we cannot tell
 * which of two copies is the corrected one.
 */
function mergeDraft(existing: Draft, next: Draft): Draft {
  return {
    ...existing,
    translation: existing.translation ?? next.translation,
    translations: existing.translations ?? next.translations,
    literal: existing.literal ?? next.literal,
    audioUrl: existing.audioUrl ?? next.audioUrl,
  };
}

function collect(drafts: Map<string, Draft>, draft: Draft): void {
  const seen = drafts.get(draft.id);
  drafts.set(draft.id, seen ? mergeDraft(seen, draft) : draft);
}

async function run() {
  const apply = process.argv.includes("--apply");

  const entries = (await sql`
    select id, language_id, english, example, example_translation,
           example_translations, example_audio_url
    from dictionary_entries
    order by id
  `) as Entry[];

  const templates = (await sql`
    select id, language_id, sentence, english_sentence, literal_translation
    from sentence_templates
    order by id
  `) as Template[];

  const drafts = new Map<string, Draft>();
  const senseRows: { entryId: string; order: number; gloss: string; note: string | null }[] = [];
  const exampleRows: { entryId: string; sentenceId: string; needsReview: boolean }[] = [];

  const overflow: string[] = [];
  const lossy: { id: string; before: string; after: string }[] = [];
  const overNote: string[] = [];
  let senseCount = 0;
  let normalized = 0;

  for (const e of entries) {
    const senses = parseSenses(e.english);
    if (senses.length === 0) continue;
    senseCount += senses.length;

    senses.forEach((s, i) => {
      // varchar(200); the corpus's longest note is 155, so this should never
      // fire — but a truncated note is a silent content edit, so it is reported.
      if (s.note && s.note.length > 200) overNote.push(e.id);
      senseRows.push({
        entryId: e.id,
        order: i,
        gloss: s.text,
        note: s.note ? s.note.slice(0, 200) : null,
      });
    });

    // The flat column must survive the round trip, or the phase 3 cutover would
    // silently rewrite a gloss.
    const back = projectSenses(senses);
    if (isLossyGloss(e.english)) lossy.push({ id: e.id, before: e.english, after: back });
    else if (back !== e.english) normalized += 1;

    const example = e.example?.trim();
    if (!example) continue;
    if (isGlossOverflow(e.english, example)) {
      overflow.push(e.id);
      continue;
    }

    const id = sentenceId(e.language_id, example);
    collect(drafts, {
      id,
      languageId: e.language_id,
      text: normalizeSentence(example),
      translation: e.example_translation?.trim() || null,
      translations: e.example_translations,
      literal: null,
      audioUrl: e.example_audio_url,
    });
    exampleRows.push({ entryId: e.id, sentenceId: id, needsReview: senses.length > 1 });
  }

  const templateLinks: { id: string; sentenceId: string }[] = [];
  for (const t of templates) {
    const text = t.sentence?.trim();
    if (!text) continue;
    const id = sentenceId(t.language_id, text);
    collect(drafts, {
      id,
      languageId: t.language_id,
      text: normalizeSentence(text),
      translation: t.english_sentence?.trim() || null,
      translations: t.english_sentence?.trim() ? { en: t.english_sentence.trim() } : null,
      literal: t.literal_translation?.trim() || null,
      audioUrl: null,
    });
    templateLinks.push({ id: t.id, sentenceId: id });
  }

  const needingReview = exampleRows.filter((r) => r.needsReview).length;
  console.log("\n── Sentence corpus backfill ─────────────────────────────");
  console.table({
    "dictionary entries": entries.length,
    "→ sense rows": senseCount,
    "usage examples promoted": exampleRows.length,
    "  of those, sense-1 is a guess": needingReview,
    "drill sentences promoted": templates.length,
    "→ distinct corpus sentences": drafts.size,
    "  collapsed by dedupe": exampleRows.length + templateLinks.length - drafts.size,
    "gloss overflow, skipped": overflow.length,
    "glosses whitespace-normalized": normalized,
  });

  if (overflow.length > 0) {
    console.log(
      `\n⚠️  ${overflow.length} entries whose \`example\` is overflowed gloss text, not an` +
        "\n    example. Left in place for an educator to re-split in Studio:",
    );
    console.log("   ", overflow.slice(0, 20).join(", ") + (overflow.length > 20 ? ", …" : ""));
  }

  if (overNote.length > 0) {
    console.log(`\n⚠️  ${overNote.length} notes over varchar(200) would truncate:`, overNote.join(", "));
  }

  if (lossy.length > 0) {
    console.log(`\n❌ ${lossy.length} entries do not survive the sense round trip. Fix before applying:`);
    for (const l of lossy.slice(0, 10)) {
      console.log(`\n   ${l.id}\n   before: ${JSON.stringify(l.before.slice(0, 120))}\n   after:  ${JSON.stringify(l.after.slice(0, 120))}`);
    }
    if (apply) {
      console.log("\nRefusing to apply while the projection is lossy.");
      process.exit(1);
    }
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write.");
    process.exit(0);
  }

  console.log("\nWriting sentences…");
  const all = [...drafts.values()];
  for (let i = 0; i < all.length; i += CHUNK) {
    const chunk = all.slice(i, i + CHUNK);
    await sql`
      insert into sentences (id, language_id, text, translation, translations, literal, audio_url)
      select * from unnest(
        ${chunk.map((d) => d.id)}::varchar[],
        ${chunk.map((d) => d.languageId)}::varchar[],
        ${chunk.map((d) => d.text)}::text[],
        ${chunk.map((d) => d.translation)}::text[],
        ${chunk.map((d) => (d.translations ? JSON.stringify(d.translations) : null))}::jsonb[],
        ${chunk.map((d) => d.literal)}::text[],
        ${chunk.map((d) => d.audioUrl)}::text[]
      )
      on conflict (id) do update set
        translation = coalesce(sentences.translation, excluded.translation),
        translations = coalesce(sentences.translations, excluded.translations),
        literal = coalesce(sentences.literal, excluded.literal),
        audio_url = coalesce(sentences.audio_url, excluded.audio_url)
    `;
  }
  console.log(`  ${all.length} sentences.`);

  // Senses are rewritten per entry, so a re-run converges rather than doubling.
  // `dictionary_examples` cascades off `dictionary_senses`, so it clears with it.
  console.log("Writing senses…");
  const entryIds = [...new Set(senseRows.map((r) => r.entryId))];
  for (let i = 0; i < entryIds.length; i += CHUNK) {
    await sql`delete from dictionary_senses where entry_id = any(${entryIds.slice(i, i + CHUNK)})`;
  }
  for (let i = 0; i < senseRows.length; i += CHUNK) {
    const chunk = senseRows.slice(i, i + CHUNK);
    await sql`
      insert into dictionary_senses (entry_id, "order", gloss, note)
      select * from unnest(
        ${chunk.map((r) => r.entryId)}::varchar[],
        ${chunk.map((r) => r.order)}::int[],
        ${chunk.map((r) => r.gloss)}::text[],
        ${chunk.map((r) => r.note)}::varchar[]
      )
    `;
  }
  console.log(`  ${senseRows.length} senses.`);

  console.log("Writing examples…");
  for (let i = 0; i < exampleRows.length; i += CHUNK) {
    const chunk = exampleRows.slice(i, i + CHUNK);
    await sql`
      insert into dictionary_examples (sense_id, sentence_id, "order", needs_sense_review)
      select s.id, v.sentence_id, 0, v.needs_review
      from unnest(
        ${chunk.map((r) => r.entryId)}::varchar[],
        ${chunk.map((r) => r.sentenceId)}::varchar[],
        ${chunk.map((r) => r.needsReview)}::boolean[]
      ) as v(entry_id, sentence_id, needs_review)
      join dictionary_senses s on s.entry_id = v.entry_id and s."order" = 0
    `;
  }
  console.log(`  ${exampleRows.length} examples.`);

  console.log("Linking drills…");
  for (let i = 0; i < templateLinks.length; i += CHUNK) {
    const chunk = templateLinks.slice(i, i + CHUNK);
    await sql`
      update sentence_templates t set sentence_id = v.sentence_id
      from unnest(
        ${chunk.map((l) => l.id)}::varchar[],
        ${chunk.map((l) => l.sentenceId)}::varchar[]
      ) as v(id, sentence_id)
      where t.id = v.id
    `;
  }
  console.log(`  ${templateLinks.length} drills.`);

  console.log("\n✅ Done. Nothing reads these rows yet — the cutover is phase 3.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Sentence corpus migration failed:", err);
  process.exit(1);
});
