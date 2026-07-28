# Shared sentence corpus + dictionary senses

Decided 2026-07-28. Phases 0–2 built the same day; nothing reads the new rows
yet.

| Phase | | |
|---|---|---|
| 0 | pre-work — parser fixes | **done** |
| 1 | additive schema | **done**, applies on the next `vercel --prod` |
| 2 | backfill script | **done**, `npm run db:migrate-sentence-corpus` — not yet run against production |
| 3 | dual-write, then read cutover | not started |
| 4 | drop deprecated columns | not started — destructive, needs its own authorization |

A dictionary entry today holds every sense of a headword in one 500-character
string and at most one usage example. This splits both out, and puts the example
text in a corpus shared with drills and lesson lines so a sentence is written,
corrected, and **recorded** once.

## Terms

One term, one thing. Earlier drafts used several of these interchangeably.

| Term | Means |
|---|---|
| **Headword** | the word being defined — `bára` |
| **Sense** | one distinct meaning of a headword — "way" |
| **Gloss** | the English text of one sense |
| **Usage example** | a phrase showing the headword in use — `bịsá bàra kị` |
| **Drill** | a generated question |
| **Lesson line** | one line of a lesson's audio transcript |

## Why

Measured against production, 2026-07-28:

| | |
|---|---|
| dictionary entries | 12,299 |
| senses if exploded | 18,405 (1.50 per entry, max 18 on `sụ́ọ¹`) |
| entries with >1 sense | 3,064 (25%) |
| glosses truncated at the 500 cap | 81 — full text dumped into `example` |
| entries with a usage example | 1,489, of which 81 are not examples but that overflow |
| usage examples buried inside gloss text | 1,051 entries, 1,181 senses, up to 6 on one entry |
| entries with example audio | **0** |
| entries with headword audio | 15 |

The gloss column is doing four jobs: sense list, sense notes, usage examples, and
overflow storage. The 500-char cap then truncates the result.

**The migration window is open.** Only 3 entries carry a non-English gloss
translation and none of those is multi-sense. Once educators translate
multi-sense glosses through the translation queue, splitting means aligning sense
boundaries across five locales by hand.

## The decision

Example text lives in a **shared `sentences` table**, not on the dictionary
example. A dictionary example is a pointer.

The consequence, accepted deliberately: editing a shared sentence from the
dictionary screen also changes the lesson and drill that use it. The editor shows
a **"used in N places" badge** on the field before you edit it. Edits do not fork
— forking would quietly decay the corpus back to per-surface copies and lose the
record-once property that motivates this.

## Schema

### `sentences` — the corpus

```ts
export const sentences = pgTable(
  "sentences",
  {
    /** `${languageId}-s-${hash}` — see `sentenceId()`. Re-adding the same text upserts. */
    id: varchar("id", { length: 64 }).primaryKey(),
    languageId: varchar("language_id", { length: 64 })
      .notNull()
      .references(() => languages.id),
    text: text("text").notNull(),
    /** `translation` is the derived en projection of `translations`. */
    translation: text("translation"),
    translations: jsonb("translations").$type<Record<string, string>>(),
    /** Literal gloss for idioms — absorbs `sentence_templates.literalTranslation`. */
    literal: text("literal"),
    /** Romanization, never spoken — absorbs `transcript_segments.roman`. */
    roman: text("roman"),
    audioUrl: text("audio_url"),
    status: contentStatusEnum("status").default("published").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at"),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (t) => [index("sentences_language_idx").on(t.languageId)]
);
```

**Identity.** `sentenceId(languageId, text)` = `` `${languageId}-s-${fnv1a(key)}` ``
where `key` is the text NFC-normalized, whitespace-collapsed, trimmed. Case and
punctuation stay significant — `Bo!` and `Bo?` are different sentences. Same
pattern as `headwordId()` in `server/src/lib/slug.ts`, so adding a sentence that
already exists is an upsert rather than a duplicate, and the duplicate-id guard
in `bulk-import.ts` already covers the import path.

Deliberately exact, not fuzzy. Near-match suggestion ("did you mean this existing
sentence?") belongs in the editor UI, not in the key.

### `dictionary_senses`

```ts
export const dictionarySenses = pgTable(
  "dictionary_senses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entryId: varchar("entry_id", { length: 64 })
      .notNull()
      .references(() => dictionaryEntries.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    /** `text`, not varchar — escaping the 500-char cap is half the point. */
    gloss: text("gloss").notNull(),
    glossTranslations: jsonb("gloss_translations").$type<Record<string, string>>(),
    /** Parenthetical disambiguation: "of humans", "consonant phoneme m". */
    note: varchar("note", { length: 200 }), // longest in corpus: 155
  },
  (t) => [index("dictionary_senses_entry_idx").on(t.entryId, t.order)]
);
```

`dictionary_entries.english` stays, permanently, as the flat projection of the
sense list — exactly as it is already the projection of `translations`. It is the
search field, the quiz answer, the push-notification body and the SEO HTML.
Roughly 120 read sites keep working untouched. This is what makes the change
affordable.

Projection is the inverse of the existing parser:
`senses.map(s => s.note ? `${s.gloss} (${s.note})` : s.gloss).join("; ")`.
Verified over all 12,299 rows: 98.98% byte-identical, remainder whitespace
normalization (see Pre-work).

### `dictionary_examples` — a pointer, not a copy

```ts
export const dictionaryExamples = pgTable(
  "dictionary_examples",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    senseId: uuid("sense_id")
      .notNull()
      .references(() => dictionarySenses.id, { onDelete: "cascade" }),
    /** No cascade: deleting a sentence still used elsewhere must fail loudly. */
    sentenceId: varchar("sentence_id", { length: 64 })
      .notNull()
      .references(() => sentences.id),
    order: integer("order").notNull(),
  },
  (t) => [
    index("dictionary_examples_sense_idx").on(t.senseId, t.order),
    index("dictionary_examples_sentence_idx").on(t.sentenceId), // usage badge
  ]
);
```

### Existing tables

`sentence_templates` (252 rows) becomes a **drill over** a sentence rather than
the owner of one: keep `id`, `languageId`, `answer`, `kind` and the workflow
columns, add `sentenceId`. `sentence`, `englishSentence` and `literalTranslation`
move into `sentences`.

`transcript_segments` (25,376 rows) gets a **nullable** `sentenceId`. Lesson lines
are promoted into the corpus only when someone deliberately reuses one — never in
bulk. Segments are replaced wholesale on lesson save, so a promoted sentence must
outlive its segment; the FK points segment → sentence and deleting segments never
touches `sentences`. This is the failure `phrase_bank` already guards against by
snapshotting text instead of referencing it.

## The usage badge

```
GET /sentences/:id/usage
→ { dictionaryExamples: 2, drills: 1, lessonLines: 0, total: 3 }
```

Three index scans on the `sentenceId` indexes. No denormalized counter — it would
drift, and this is not on a hot path.

The editor shows "Used in 3 places" beside the field and names them on tap. Below
2 it renders nothing, so the common case stays quiet.

## Migration

### Phase 0 — pre-work, before any backfill — done

A backfill freezes the current parser's behaviour into rows, so its bugs got
fixed first (`parseSenses` in `mobile/lib/dictionary.ts` and `server/src/lib/senses.ts`):

- `"corrugated iron sheet(s)"` parsed to gloss `"corrugated iron sheet"` + note
  `"s"` — the trailing-parenthesis regex couldn't tell a disambiguation from
  inflectional morphology. **Fixed** by requiring whitespace before the `(`.
  Costs ~20 senses whose note now stays inline (lossless), saves 15 from being
  mangled.
- 15 entries (not ~6) have a combining dot-below typed *after* its `;`.
  **Fixed** by pulling any combining mark following a top-level `;` back onto
  the sense it belongs to, before the split.
- 72 entries have a `;` inside parentheses. The depth-aware parser already
  handled these; the migration uses it rather than `split(";")`.

The projection now round-trips byte-identically on 99.34% of the corpus (was
98.98%). The remaining 81 differ only by whitespace the split has to normalize,
and the migration's guard is fixed-point stability (`isLossyGloss`), not string
equality — comparing raw strings would have blocked the backfill on all 81.

Decide separately what happens to the **1,051 entries with usage examples buried
in gloss text**. There is no delimiter between the Izon and its English
(`Wárị òsoba a kọ́rịmị Staying indoors for a long time…`), and both are Latin
script. This is an editorial queue in Studio — proposed split, educator confirms —
not an automated parse.

### Phase 1 — additive — done

All three new tables plus the two nullable `sentenceId` columns, in
`server/src/db/schema.ts`. Nothing reads them. `drizzle-kit push` applies it on a
normal `vercel --prod`.

One addition to the schema above: `dictionary_examples.needs_sense_review`.
Without a column, the "attached to sense 1, verify it" queue could only be
recomputed by re-running the migration.

### Phase 2 — backfill — done, not yet run

`server/src/seed/migrate-sentence-corpus.ts`, dry-run / `--apply` per the
`migrate-*.ts` pattern. Dry run against production, 2026-07-28:

| | |
|---|---|
| dictionary entries | 12,299 |
| → sense rows | 18,405 |
| usage examples promoted | 1,407 |
| of those, sense 1 is a guess | 138 |
| drill sentences promoted | 252 |
| → distinct corpus sentences | 1,604 |
| collapsed by dedupe | 55 |
| gloss overflow, skipped | 82 |
| glosses whitespace-normalized | 81 |
| entries failing the round trip | **0** |

Purely additive — it only inserts, and leaves `dictionary_entries.english`
untouched. Idempotent: sentence ids are content hashes so re-adding upserts, and
sense rows are deleted and rewritten per entry. A bad run is recoverable by
truncating the three new tables.

`transcript_segments` is deliberately not backfilled. Lesson lines join the
corpus only when someone promotes one on purpose.

**Known imprecision:** an existing example was authored against the whole entry,
not a sense. The backfill attaches it to sense 1 and sets `needs_sense_review`.
Right for the single-sense entries; a guess for 138 of them.

### Phase 3 — dual-write, then read cutover

Writes populate senses/examples and re-derive `english`. Then `entry-detail`
reads real rows instead of parsing, and the content snapshot carries them.

The snapshot hashes its whole payload into `version`
(`server/src/routes/content-snapshot.ts`), so this invalidates every client's
offline cache at once. Budget ~15–20% payload growth over the current
6.94 MB / 1.23 MB gzipped, and bump the mobile cache version in step.

Open question, pedagogy not schema: quiz distractors compare whole gloss strings
for uniqueness (`mobile/lib/quiz-engine.ts`, `server/src/routes/quiz.ts`). With
senses, "what does *sụ́ọ* mean?" needs an answer — sense 1, any sense, or all.

### Phase 4 — drop deprecated columns

`sentence_templates.sentence`, `.english_sentence`, `.literal_translation`.

**Destructive.** Not part of a deploy. Code ships first so nothing reads them,
then an explicit non-interactive SQL script, then `npm run db:preflight`. Needs
its own authorization.

## Fixed along the way

Both contribution-approval routes hand-rolled the sense merge as
`` english.includes(x) ? english : `${english}; ${x}` `` —
`server/src/routes/contributions.ts` and `server/src/routes/educator/contributions.ts`.
That got two things wrong: `includes` is a substring test, so approving "way"
against a gloss already containing "always" was silently discarded; and neither
checked the 500-char cap, so a merge onto a long gloss threw a Postgres 22001 and
the approval failed outright. **Both now call `mergeSense`**, which compares
whole senses case-insensitively and refuses rather than overflows. It becomes an
insert at phase 3.

Still open:

- `server/src/lib/igbo.ts:155` joins `definitions[]` with `"; "` by hand.
- `server/src/routes/admin-import.ts:105` upserts `english` without ever touching
  `translations`. Tolerable today; under senses it silently desyncs. Fix before
  the phase 2 run.

## Routes

`GET /api/sentence-corpus/:id/usage` → `{ dictionaryExamples, drills, lessonLines, total }`.

Mounted at `/sentence-corpus`, not `/sentences` — that path already serves
`sentence_templates`, which are drills *over* sentences. Two entities under one
noun is the ambiguity this document exists to remove.

## Not decided

- Which sense a quiz answers on (phase 3).
- Whether proverbs cited inside gloss text (`osi-ịkpáị̀`, "Saying: …") belong in
  `proverbs` rather than `sentences`.
- Whether a sense needs its own part of speech, or whether a headword spanning
  two parts of speech is always two entries.
