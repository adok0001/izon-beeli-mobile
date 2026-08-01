# Evidence Analysis

How to mine attested material for what a ladder needs. Forty lines of real
material beats any amount of typological reasoning — work from what is in front
of you.

## Where the material is

| Source | Path | What it is |
|---|---|---|
| Parsed tutor corpus | `userio-docs/izon_lesson_notes_content.csv` | 1,573 glossed lines, 41 notes, Feb–Jul 2026 — `source_file,date,section,izon,english,notes` |
| Sourced dictionary | `userio-docs/izon_master_dictionary.csv` | ~10,175 rows, each citing the note it came from |
| Owner's running file | `userio-docs/Izon_Lesson Notes Extras` | Newest at top, `MMDD` headers. Overrides a tutor note it contradicts |
| Live tables | `cd server && npm run db:lookup-words -- <lang> <words>` | What already exists |
| Coverage map | `mobile/docs/izon-lesson-notes-coverage.md` | Which sections map to which Movements |

`userio-docs/` is untracked and lives in the main checkout, not in a worktree —
read it at the repo root path.

For a language other than Izon, expect none of this to exist. Check first; a
spec built on nothing is entirely [CONFIRM] and must say so.

---

## Clean the tokens before you conclude anything

These hazards are documented from a real Feb–Jul 2026 run where **103 candidate
"new" words turned out to be 60**. They corrupt evidence analysis the same way
they corrupt an import:

- **Cyrillic homoglyphs.** PDF extraction emits Cyrillic а/к/р/о/м/е inside
  otherwise-Latin words (`акромị`). They never match their Latin twins and
  silently fail `grep` — so a form can look unattested when it is attested, or
  look like a novel variant when it is a scanning artifact. Normalize first.
- **Exercise sections have reversed columns.** `Write these Ịzọn words in
  English`, `Write the numbers 1 to 20 in Ịzọn`, `Write the Ịzọn forms of the
  following` put the *answer* in one column and the *prompt* in the other. This
  is how the English words `hers` and `yours` ended up in the Ịzọn column. Never
  draw a grammatical conclusion from one of these sections.
- **Slash means different things per side.** On the Ịzọn side it is alternative
  forms (`Garii mịẹnẹ/ teminẹ` = two forms); on the English side it is one gloss
  with alternatives (`Tẹmẹ, Image/Spirit` = one).
- **Trailing punctuation and parentheticals.** `beni.` is `beni`; `ede(mefu)` is
  two headwords; `(native oral, mịẹdẹ is written form)` is a register note.
- **`Title/Header` rows and `SIMILAR:`/`DUPLICATE:` notes** are the parser's
  bookkeeping, not content.

---

## 1. Constituent order

Find every sentence with an overt object and note where it sits relative to the
verb. Then check instrumentals, locatives and adverbials **separately** — they
may not pattern with the object.

Verb-final order has downstream consequences the ladder must budget for:
relativization and subordination get much harder for English-speaking learners,
so B1 needs *extra* practice, not the usual amount.

Record whether the order is exceptionless in your sample or merely dominant. In
a corpus dominated by call-and-response drill, a "dominant" order may just be the
drill frame repeating.

## 2. Adpositions

Pre- or post-? One clear example settles it. Postpositions against a
prepositional L1 generate persistent calques — that earns an explicit reviewer
checklist item.

Watch for **suffixed** locatives, which look like morphology rather than
adpositions: in the Izon corpus `Opolo-a` "at Opolo" is [EVIDENCED] as a form
while "*`-a` is a locative suffix*" is [CONFIRM] — and it collides notationally
with the question marker (§5). Say which reading you took and that you are unsure.

## 3. Existentials and negation

Look for an existence verb and its negative counterpart. These are usually
frequent in first-lesson material, morphologically simple, and drillable as a
minimal pair — which makes them an excellent A1 spine.

**If the source already drills them across a noun list, reuse that exact frame
with the story's objects.** That is the cheapest correct A1 text available: the
frame is attested, only the noun changes, and the noun comes from the dictionary
rather than from you.

## 4. TAM markers

Extract by minimal pair — the same verb root with different suffixes or particles
across the material, aligned with the supplied glosses.

Be careful with glosses that conflate categories: an English "will cook" may
correspond to a future particle *plus* an imperfective suffix, not to one marker.
Parenthesized or optional elements in the source are a strong hint that
segmentation is more complex than the gloss suggests.

**Flag the analysis [CONFIRM] even when the forms are [EVIDENCED].** The form is
attested; your segmentation of it is not.

## 5. Focus, topic, question marking

Look for a particle that appears in **both a question and its answer**, attached
to the questioned constituent. That is focus marking — and if it is in
first-lesson material it belongs at A1, not at C1 where a European ladder would
file it. This is the single most common place the ported ladder is wrong.

Also record how polar questions are formed. Final particles, vowel lengthening
and tone changes are all common, and teaching materials write them
inconsistently — count the variants rather than picking one.

## 6. Serial verbs and clause chaining

Two or more verbs in sequence sharing a subject, sometimes with the object
between them. Also check the vocabulary lists: a lexicalized compound like
"take-come" for *bring* is serialization sitting in lesson-one vocabulary.

If it is attested in beginner material it is a beginner feature, regardless of
how advanced it looks to a European-language eye.

## 7. Agreement and compulsory-early features

The organizing question: **what does this language force into sentence one?**

Candidates: noun-class concord, gender, obligatory tone, evidentials, honorifics,
obligatory aspect marking, obligatory definiteness, obligatory focus.

These cannot be graded by presence. Grade by variety — a small number of
contrasts at A1, expanding through A2–B1.

**Absence is a finding too.** Confirming that a language *lacks* the feature the
template was built around means the template does not port — say so loudly, it is
cheaper now than after 70 teams have each worked around it.

## 8. Nominal morphology

Look for the same noun with and without a suffix and check the glosses for "the".
Suffixed definiteness surprises English speakers and needs explicit teaching at
A1. Plural marking, associative and genitive constructions, and modifier order
belong here.

Note any coordination that marks **every** conjunct rather than only the last —
it looks like a small thing and it breaks every A2 list sentence in the story.

## 9. Orthography and internal inconsistency

Read the source for variation *within itself*. Real teaching materials vary in:

- Diacritic or subdot placement, especially on second and later syllables
- Name spellings
- Final vowel length (`emi` / `emii`, `yaa` / `yaaa`)
- Question-marking notation
- Capitalization mid-sentence
- Tone marking density

List every instance. Each unstandardized variation gets resolved differently by
every team that touches it.

**In this repo an orthographic decision is also a data-integrity decision.** The
importer derives `id = <lang>-<slugify(text)>`, and `slugify`
(`server/src/lib/slug.ts`) does NFKD then strips combining marks — so tone marks
and subdots vanish from the id. Two spellings of one word collide on one row and
**overwrite each other silently across uploads**; two genuinely different words
that differ only by tone (`torú` chalk / `toru` river) cannot both be imported by
CSV at all. Before recommending a spelling convention, slugify the candidates and
check the results are unique.

**Tone deserves its own decision.** If the material marks tone sparsely —
Izon's corpus carries accents on ~199 of 1,573 lines, mostly one minimal-pair
lesson — establish who the learner is:

- *Heritage learners* with L1 exposure need literacy, not phonology. Unmarked
  tone is defensible; they supply it.
- *True foreign beginners* will invent a tone pattern and keep it permanently.

Beeli serves both. That is a [DECIDE], and it is invisible until it is expensive.

## 10. House pedagogical style

The most easily missed finding, and often the most consequential. Look at the
*genre* of the existing material:

- Dialogue or narrative?
- Situational syllabus (a scene, with whatever grammar it needs) or grammatical
  syllabus (a structure, with whatever scene fits)?
- Call-and-response drilling? One structure at a time across a noun list?
- Question forms in lesson one, or deferred?

If the master text is a different genre from the teaching tradition, **say so and
recommend adapting the master**. A narrative master handed to a dialogue
tradition produces material that sounds translated and defers the learner's first
question form by several levels.

This maps onto a real field: `lessons.style` is `skit` | `immersive_story` |
`host_narrated`, and the lesson CSV has a `speaker` column. A dialogue tradition
means `skit` with speakers, not narration with none.

## 11. What to do with what you found

Sort into four buckets and report in this order:

1. **Settled** — quote the forms, with the note date and section
2. **Contradicted** — what this overturns in earlier reasoning, including your
   own previous output. Lead with these; they are the most valuable thing you have.
3. **Newly raised** — questions the evidence surfaced that nobody had asked
4. **Still open** — what needs the owner's decision

Then update the ladder. Moving a feature from C1 to A1 because the evidence shows
it in lesson one is exactly the correction this process exists to produce.
