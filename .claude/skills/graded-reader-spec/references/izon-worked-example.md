# Graded Reader Spec — Ịzọn (worked example)

> A filled spec, built from the real corpus in `userio-docs/`. It exists to show
> **tagging density and the tone of honest uncertainty** — not to be authoritative.
> Every ruling below is a proposal for the owner, who is a native speaker; their
> revision is the attestation.

**Status:** worked example · **Reviewed by native speaker:** — not yet

---

## 0. Evidence base

| Source | Path | Size |
|---|---|---|
| Parsed tutor corpus | `userio-docs/izon_lesson_notes_content.csv` | 1,573 glossed lines, 41 notes, 11 Feb – 22 Jul 2026 |
| Sourced dictionary | `userio-docs/izon_master_dictionary.csv` | ~10,175 rows, each citing its note |
| Owner's running file | `userio-docs/Izon_Lesson Notes Extras` | dated `MMDD` sections, newest first |

This is an unusually strong evidence base — most of the ladder below is
**[EVIDENCED]** with a quoted form and a date. What is *not* evidenced is my
**segmentation** of those forms: where I write "`-gha` is the negative suffix",
the form `bo-gha` is attested and the morpheme boundary is my reading.

**No target-language prose in this document was written by Claude.** Every Ịzọn
string is quoted from a note. Assembling these into new sentences — even from
attested parts — is generation, and must go through the owner's review gate
before it reaches a learner. Fabricated Ịzọn has reached the seed before
(`ereịn` glossed "sibling", `teki`); the guard is provenance, not plausibility.

---

## 1. Variety and orthography

**Variety: Tarakiri Ịzọn. [EVIDENCED]** — the tutor names it directly, repeatedly:
*"The common coordinating conjunctions in Tarakiri include mọ 'and', anịghakpọ
'or', nda 'but', anịnị 'so' and ma 'while'"* (25-03-2026, §Conjunctions in
Tarakiri). Earlier planning treated the corpus as undifferentiated "Ịzọn"; it is
one variety, and the spec should say so on its face. Cross-variety differences are
**[DECIDE]** — nobody has ruled on whether Kolokuma or Mein forms may appear.

**Script:** Latin with subdot vowels ẹ ị ọ ụ, and sporadic acute/grave accents.

### Inconsistencies found in the source

| Variation | Attested spellings | Proposed ruling | Tag |
|---|---|---|---|
| Polar question marker | `a` (`Teyi ke enị are a?`, 25-02) · `ya` · `yaa` (`A seridẹ yaa?`, 08-06) · `yaaa` (`Endi emi yaaa?`, 24-06) · `aaa` (`Amịnị te otu aaa?`, 25-02) | Standardize to one written form; the extra vowels are length, not spelling | [DECIDE] |
| Existential | `emi` · `emii` (`A emii?`, 03-06) | as above | [DECIDE] |
| Negative existential | `fa` (extras) · `faa` (`Nama faa.`, 24-06) | as above | [DECIDE] |
| Tone density | ~199 of 1,573 lines carry accents | see below | [DECIDE] |
| Name spellings | `Preye` (25-03) vs `Pịrịye` (25-02) — same person | Pick one per character and hold it across all six levels | [DECIDE] |

### Tone policy — this cannot be deferred for Ịzọn

The generic advice is "if tone is unmarked, decide who the learner is". For Ịzọn
that decision is **forced at A1**, because tone is contrastive inside the
possessive paradigm, and the story cannot avoid possession — *her* cloth, *his*
money, *my* rent.

**[EVIDENCED]** (16-02-2026 §Possessives; repeated 23-03-2026 §VI):

| Form | Gloss | Form | Gloss |
|---|---|---|---|
| `ání` | your / her | `ànì` | their |
| `ówó` | our | `òwò` | his |
| `áníyé` | yours / hers | `ànìyè` | theirs |

Tone is the *only* thing distinguishing these pairs in writing. An unmarked A1
text cannot express "his money" vs "their money".

**And this is simultaneously a data-integrity problem.** Verified by running
`server/src/lib/slug.ts` directly — it does NFKD then strips combining marks, so:

| Words | Distinct meanings | Derived id |
|---|---|---|
| `ání` / `ànì` | your·her / their | both `izon-ani` |
| `ówó` / `òwò` | our / his | both `izon-owo` |
| `áníyé` / `ànìyè` | yours·hers / theirs | both `izon-aniye` |
| `torú` / `toru` | native chalk / river | both `izon-toru` |

Six pronouns collapse to three ids. **These cannot all be imported by CSV** — the
importer upserts on id, so a later upload silently overwrites an earlier one, with
no error. They need a seed script with explicit ids. This is the one place where
"the CSV is the deliverable" does not hold.

**Proposal [DECIDE]:** mark tone on the possessive paradigm and on any minimal
pair the story actually uses; leave it unmarked elsewhere, matching the corpus's
own habit. Beeli serves heritage learners (who supply tone) and true beginners
(who invent it and keep it) at once, so this is the owner's call, not mine.

---

## 2. What Ịzọn forces into sentence one

| Feature | Compulsory? | Evidence | Grading strategy | Tag |
|---|---|---|---|---|
| **Verb-final order (SOV)** | Yes | `Ị buru kọn boomịnị?` "Will you bring yams?" — you · yam · take-come (22-07) | Cannot be graded. Budget **extra** B1 practice for subordination | [EVIDENCED] form, [CONFIRM] label |
| **Focus particle `kị`** | In questions and their answers | `Teyi kị emu goo ma?` / `Oloo kị emu goo pamị.` (25-02, §Conversation) | **A1, not C1.** Teach the frame whole; expand which constituent it lands on | [EVIDENCED] |
| **Suffixed definiteness `-mị`** | Frequent from the earliest notes | `Warịmị kiri warị` "It is a bungalow" (11-03); `Bẹlẹmị emi?` "Is the pot there?" (24-06) | Teach explicitly at A1 — English speakers do not expect a suffixed article | [EVIDENCED] form, [CONFIRM] segmentation |
| **Tone in possessives** | Yes — see §1 | 16-02 §Possessives | Two contrasts at A1 (`ání`/`ànì`), the rest at A2 | [EVIDENCED] |
| **Coordination marks every conjunct** | Yes | `Tarị mọ Tọnbara mọ` "Tari and Tonbara" — tutor's own note: *"mọ 'and' usually follows each of the words which are being joined"* (25-03) | A2, but drill it — every list in the story breaks without it | [EVIDENCED], incl. the analysis |

**Not present:** no noun-class concord, no grammatical gender. The Bantu-shaped
template does not port; do not budget A1 space for class agreement.

---

## 3. The ladder

### A1 — Movement 1 (Arrival) · ~120 words

**Spine: the existential minimal pair `emi` / `faa`, drilled across a noun list.**
This is not my design — the 24 June note already does exactly this (§More short
sentences and phrases — III):

```
Nama emi?          Is there meat?
Nama faa.          There is no meat.
Endi emi.          There is fish.
Ịgịna emi.         There is pepper.
Pulou faa.         There is no oil.
Fụụ kpọ faa.       There is also no native salt.
```

Swap the nouns for the story's objects and the A1 text is attested frame +
attested noun, with nothing invented. That is the cheapest correct A1 available.

- **Admits:** existence/negation (`emi`/`faa`); the `Mị te ye?` "What is this?" and
  `Mị tịbọ kị ye?` "Whose is this?" identification frames (01-06, 08-06); the
  focus particle `kị` inside a memorized frame; two possessive contrasts;
  greetings as call-and-response.
- **Excludes:** past marking, subordination, the full possessive paradigm.

### A2 — Movement 2 (The Household) · ~180 words

Movement 3 (The Village) is the canonical A2 partner but
`course-izon-mv-naming` is **unstaffed and empty** — A2 material lands entirely
in The Household until an educator is assigned.

- **Admits — past and negation [EVIDENCED]:** `Tamara bo-mị nda Tike bo-gha.`
  "Tamara came but Tike did not come." (25-03). One line gives past `-mị`,
  negative `-gha`, and the connective `nda` "but". *(Segmentation [CONFIRM].)*
- **Connectives, from the tutor's own list (25-03):** `mọ` and · `anịghakpọ` or ·
  `nda` but · `anịnị` so · `ma` while · `nị` as · `donị` because.
- **Serial verbs:** `kọn` take + `bo` come → `kọnbo` bring (11-03 §Verb). Also
  live as a frame: `Ị buru kọn boomịnị?` / `A fụụ kọn boomịnị?` / `O pulou kọn
  boomịnị?` (22-07) — the story's "she picked it up and brought it back" is
  already drilled here.
- **Quantity:** the vigesimal system (`sí oyi kẹnị feni` "twenty and one extra",
  11-02) and money in bags — see §5.

### B1 — Movement 4 (Growing Up) · ~300 words

Movement 5 (The Threshold) is **unstaffed** — awaiting a keeper.

- **Admits:** direct speech (the corpus is full of A/B and Teacher/Students
  exchanges — this is the genre it is strongest in); polar questions with the
  final particle; the expectation-break at the door.
- **Needs extra practice, not the usual amount:** relativization and
  subordination, because of verb-final order. Budget for it explicitly.
- **Weakest evidence in the ladder:** reported speech. I found no clear
  reported-speech construction in the corpus. **[CONFIRM] / gap** — a native
  author must supply it, and the B1 text should not be drafted until they have.

### B2 — Movement 6 (The Working Year) · ~450 words

Debt, rent, and livelihood sit naturally here. **Interior thought and hypothetical
past are [CONFIRM] — not attested.** The corpus is pedagogical dialogue; it
contains almost no introspective narration. This is the level where the master
story stops being cheap to localize.

### C1 — Movement 9 (The Elder's Voice) · ~600 words

Hedging, self-interruption, counterfactual regret. **[CONFIRM] throughout.** The
one genuine asset is `Interjections` (25-03): `abo!`, `apo!`, `hẹ́ẹ́n!`,
`ewouwo!`, `hiin!`, `mị́ oya!`, `mị́ sụọfa!` — the discourse texture C1 needs,
attested, with tone marked in the source.

### C2 — Movement 10 (The Keeper) · ~700 words

Register shift, irony, free indirect discourse. **[CONFIRM] throughout.** In this
culture C2 mastery is proverb, praise, folktale and libation — which the master
story does not exercise at all. **See §4's warning.**

---

## 4. Master story mapping

| Level | Concept | Realizing structure | Tag |
|---|---|---|---|
| A1 | existence / negation | `emi` / `faa` frame | [EVIDENCED] |
| A1 | identification | `Mị te ye?` · `Mị tịbọ kị ye?` | [EVIDENCED] |
| A1 | possession | `ání` / `ànì` / `ówó` / `òwò` | [EVIDENCED] |
| A1 | simple location | `Opolo-a` "at Opolo" (11-03) — suffixed | [EVIDENCED] form, [CONFIRM] as a locative suffix |
| A2 | past + negation | `bo-mị` / `bo-gha` | [EVIDENCED] |
| A2 | sequence / cause | `nda`, `anịnị`, `donị` | [EVIDENCED] |
| A2 | "took it and brought it" | `kọn bo` serial frame | [EVIDENCED] |
| A2 | quantity comparison | vigesimal counting; money in bags | [EVIDENCED] |
| B1 | direct speech | A/B exchange frames | [EVIDENCED] |
| B1 | reported speech | — **no attested construction found** | gap |
| B2 | interior thought | — | [CONFIRM] |
| B2 | hypothetical past | — | [CONFIRM] |
| C1 | hedging, self-correction | interjection set is a start | partial |
| C2 | free indirect discourse | — | [CONFIRM] |

**The honest finding: this master story is a poor fit above B1.** "The Wallet"
is a European interiority story — its upper levels are built from free indirect
thought and an unreliable first-person monologue. Ịzọn's attested advanced
register is oratory, proverb, and narrated tradition. Localizing C1/C2 faithfully
would produce fluent-sounding invention in exactly the register where a
misjudgement is least detectable.

**Recommendation:** localize A1–B1 from the corpus now; commission C1/C2 as
**original Ịzọn material by a native author**, carrying the plot skeleton but not
the English text's rhetorical strategy. This is a master-story problem, not an
Ịzọn deficiency — and it is the kind of finding that should feed back into the
master before 70 languages inherit it.

---

## 5. Cultural localization

| Master element | Localized to | Rationale | Tag |
|---|---|---|---|
| Bus | **`arụ`** | Glossed in the corpus as *"canoe (or any transport vehicle)"* (11-02) — one attested word covers both the Niger Delta canoe and a bus. Plural `arụama` (23-02) | [EVIDENCED] |
| Currency | Naira, counted in bags | `sịlị akpa` = ₦200 "a bag of money"; `sịlị akpa ekise` = ₦100 "half a bag"; `sịlị ma akpa` = ₦400 (16-02 §Counting Money) | [EVIDENCED] |
| The C2 sum (140,000) | Restate in the bag system | The English figure is meaningless in the attested counting frame; the *point* is that she knows it to the note | [DECIDE] |
| Setting | Yenagoa / Opolo | Attested in the corpus's own house description (11-03 §Owo Warị) | [EVIDENCED] |
| Church newsletter (C2) | [DECIDE] | Needs a locally real venue for a story being retold publicly | [DECIDE] |

### Cast — take names from the corpus, never invent them

The corpus supplies real names in use: **Pịrịye/Preye, Tamara, Vivian, Tike,
Alaere, Tarị, Ebiere, Tọnbara, Erearau, Doris, Pẹrezi.** A fabricated Ịzọn name
has shipped here before and had to be replaced.

| Master placeholder | Proposed | Source |
|---|---|---|
| Mara | `Ebiere` | 25-03 §Conjunctions |
| Tonye | `Tarị` | 25-03 §Conjunctions |

Hold one spelling per character across all six levels (the corpus itself writes
`Preye` and `Pịrịye` for one person).

### Address and titles

`Kịmịowei Adokeme`, `Kịmịowei Pẹrezi` (25-02 §Conversation) — the title is used
**with the name, vocatively**. Do not write "the [role]" as a bare English-style
description; role and address come as one. This matters at the B1 door scene,
which is entirely an address-form problem.

### Heritage content

"The Wallet" touches none. If a localization reaches for libation, Egbesu, or
ancestral material to raise the register at C1–C2, it stops being a localization
and becomes heritage authoring — `isActive: false`, a `culturalNote` naming the
required source, and a keeper's verification (`design-course` §Step 4).

---

## 6. House pedagogical style — and what it means for the master

**Finding [EVIDENCED]: the Ịzọn teaching tradition is call-and-response dialogue
with a structural syllabus.** It is not narrative. Across the corpus:

```
Teacher: A do ee!            Students: Eee! Ị kpọ do ee!        (10-06, 15-06, 17-06)
A. A nụa ee!                 B. Iyaa! Ị kpọ nụa ee!             (03-06, 08-06)
Teacher: Awọụbo kụrọemi?     Students: Kụrọemi yoo!             (10-06)
```

172 lines sit under `More short sentences and phrases`, and the recurring frames
are `Mị te ye?` (What is this?), `Mị tịbọ kị ye?` (Whose is this?), and the
`emi`/`faa` drill — one structure at a time, across a noun list, with the question
form present **from the earliest notes**, not deferred.

"The Wallet" is third-person narration in which nobody speaks until B1.

**Recommendation:** adapt the master for Ịzọn — A1 and A2 as dialogue
(`style: skit`, with `speaker` filled), moving to narration only at B1 where the
door scene naturally provides it. Handing a narrative master to this tradition
would produce stilted material and would defer the learner's first question form
by two levels, when the corpus puts it in lesson one.

---

## 7. Shipping plan

| Level | Movement | Course id | `style` | Status |
|---|---|---|---|---|
| A1 | 1 Arrival | `course-izon-mv-arrival` | `skit` | ready to draft from attested frames |
| A2 | 2 The Household | `course-izon-mv-household` | `skit` | ready |
| B1 | 4 Growing Up | `course-izon-mv-growing-up` | `immersive_story` | blocked on reported speech |
| B2 | 6 The Working Year | `course-izon-mv-working-year` | `immersive_story` | needs a native author |
| C1 | 9 The Elder's Voice | `course-izon-mv-elders-voice` | `host_narrated` | commission original |
| C2 | 10 The Keeper | `course-izon-mv-keeper` | `immersive_story` | commission original |

Resolve every course id with `npm run db:list-lessons -- izon` in the current
session — and never infer a course from a lesson-id prefix; the journey migration
re-parented lessons without renaming them.

Decide the six lesson titles **before the first upload** — re-import is
idempotent per (course, title).

---

## 8. Reviewer checklist — Ịzọn-specific items

- [ ] No level label ("A1", "B2") in any title, description, `canDo`, or transcript
- [ ] Every Ịzọn string traces to a note date + section, the owner, or the master
      dictionary
- [ ] Tone marked on the possessive paradigm per §1; consistent across all six levels
- [ ] **No two dictionary rows slugify to the same id** — run the check; `ání`/`ànì`
      and `ówó`/`òwò` fail it by construction
- [ ] `mọ` follows *every* conjunct in a list, not just the last
- [ ] Object precedes verb throughout — no English-order calques
- [ ] `kị` lands on the focused constituent in question **and** answer
- [ ] One spelling per character name across all six levels
- [ ] Question particle written per §1's ruling, not `a`/`ya`/`yaa`/`yaaa` at random
- [ ] Titles/address forms follow §5 — no bare "the [role]"
- [ ] Nothing recombined by Claude is presented as attested; unverified forms are
      `[[bracketed]]` so `db:guard-content` holds the lesson

---

## 9. Open questions for the owner

| # | Question | Blocks |
|---|---|---|
| 1 | Tone marking: possessive paradigm only, or everywhere? | All six levels |
| 2 | Which written form for the polar question particle? | All six levels |
| 3 | `emi`/`emii`, `fa`/`faa` — which spelling? | A1 |
| 4 | Cast names — are `Ebiere` and `Tarị` right for these two characters? | All six levels |
| 5 | Is there an attested reported-speech construction? | B1 |
| 6 | Commission C1/C2 as original Ịzọn material rather than localization? | C1, C2 |
| 7 | May Kolokuma or Mein forms appear, or is this Tarakiri-only? | All six levels |
| 8 | Restate the C2 sum in the bag system, or use a modern figure? | C2 |

---

## What this evidence overturned

Kept deliberately, as the record of what the process is for:

1. **Focus marking moved from C1 to A1.** A European ladder files focus particles
   late. `kị` appears in a February conversation, in both question and answer. It
   is lesson-one material.
2. **The master story is not localizable above B1.** Discovered from genre, not
   from grammar — and it is a finding about the *master*, not about Ịzọn.
3. **The tone decision is not deferrable.** It looked like a style question until
   the possessive paradigm showed tone carrying person and number at A1.
4. **Tone is an id hazard, not only a phonology one.** Six attested pronouns
   collapse into three importable ids. No amount of careful authoring survives a
   silent upsert overwrite.
5. **The corpus is Tarakiri**, not "Ịzọn" generally — a distinction earlier
   planning did not make.
