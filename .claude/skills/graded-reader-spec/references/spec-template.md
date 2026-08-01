# Graded Reader Spec — [LANGUAGE]

> Copy this file to `userio-docs/graded-reader-<lang>-spec.md` and fill it.
> Every claim about the language carries **[EVIDENCED]**, **[CONFIRM]**, or
> **[DECIDE]**. See `../SKILL.md` §Attestation.

**Status:** draft · **Author:** · **Date:** · **Reviewed by (native speaker):** —

---

## 0. Evidence base — read this first

State plainly, before anything else:

- What material this spec was built from, with paths and row counts.
- What proportion of the spec is [EVIDENCED] vs [CONFIRM].
- **If the corpus is thin or absent:** say that the model cannot write reliable
  prose in this language, and that every target-language form below is a
  placeholder awaiting a native author.

| Source | Path | Rows / lines | Notes |
|---|---|---|---|
| | | | |

---

## 1. Variety and orthography

- **Variety / dialect authored in:** [DECIDE]
- **Script and character set:**
- **Orthographic conventions adopted:**

### Inconsistencies found in the source, and the ruling

Every variation found *within* the source material, and what the style sheet says
to do about it. Unruled variations get resolved differently by every team.

| Variation | Attested spellings | Ruling | Tag |
|---|---|---|---|
| | | | |

### Tone policy

- Is tone meaning-bearing? Evidence:
- Density of tone marking in the source:
- **Learner audience** — heritage (supplies tone) or foreign beginner (invents
  and keeps it)? [DECIDE]
- **Ruling:**
- **Id collision check** — words in this spec that `slugify` collapses to the
  same id (tone marks and subdots are stripped). These cannot both go through
  CSV import; they need a seed script with explicit ids.

| Words | Distinct meanings | Derived id |
|---|---|---|
| | | |

---

## 2. What this language forces into sentence one

The compulsory-early features. These cannot be graded by presence — grade them by
**variety**: few contrasts at A1, more later.

| Feature | Compulsory? | Evidence | Grading strategy | Tag |
|---|---|---|---|---|
| | | | | |

**Features the template assumed and this language does not have:**

---

## 3. The ladder

For each level: what is *admitted*, what is *excluded*, and the concrete forms
that realize it. The Movement column is where the material actually ships — see
`../SKILL.md` §"CEFR is hidden".

### A1 — Movement 1 (Arrival)

- **Admits:**
- **Excludes:**
- **Spine structure** (the frame drilled across a noun list):
- **Attested forms:**
- **Word count target:**

### A2 — Movements 2–3 (The Household, The Village)

*(same shape)*

### B1 — Movements 4–5 (Growing Up, The Threshold)

### B2 — Movements 6–7 (The Working Year, The Union)

### C1 — Movements 8–9 (The Assembly, The Elder's Voice)

### C2 — Movement 10 (The Keeper)

**Unstaffed Movements this ladder routes into** — name them; content filed into
an empty course reaches nobody.

---

## 4. Master story mapping

The master's narrative concepts (`../assets/master-story-001-EN.md` §Concept
targets) onto real structures in this language.

| Level | Concept | Realizing structure | Attested? | Tag |
|---|---|---|---|---|
| A1 | present-time narration | | | |
| A1 | existence / possession | | | |
| A1 | simple location | | | |
| A1 | negation | | | |
| A2 | past narration | | | |
| A2 | sequence | | | |
| A2 | causal link | | | |
| A2 | quantity comparison | | | |
| B1 | direct speech | | | |
| B1 | reported speech | | | |
| B1 | expectation vs. outcome | | | |
| B1 | politeness at a stranger's door | | | |
| B2 | interior thought | | | |
| B2 | obligation and debt | | | |
| B2 | hypothetical past | | | |
| B2 | evaluative stance | | | |
| C1 | hedging / self-correction | | | |
| C1 | counterfactual regret | | | |
| C2 | register shift within one text | | | |
| C2 | free indirect discourse | | | |
| C2 | deliberate ambiguity of reference | | | |

**Concepts with no clean realization in this language** — and what replaces them.
An untranslatable concept is a plot problem, not a grammar problem; solve it in
the master, not in the target text.

---

## 5. Cultural localization

| Master element | Localized to | Rationale | Tag |
|---|---|---|---|
| Public vehicle | | | |
| Currency and sum | | | |
| Distance / walk time | | | |
| Door-knocking etiquette (B1) | | | |
| The photograph | | | |
| Newsletter / public retelling (C2) | | | |

### Cast

Names must be **real names in the culture, taken from attested material** — the
corpus, or the owner. Do not invent a name that sounds plausible; a fabricated
name has shipped here before.

| Master placeholder | Localized name | Source | Tag |
|---|---|---|---|
| Mara | | | |
| Tonye | | | |

### Address and titles

How characters address each other, and whether a title carries the role — some
cultures fold role and address into one word, and a literal "the [role]" is wrong.

### Heritage content

Anything sacred, initiatory, or ancestral that the story touches. Per
`design-course`: never fabricated, `isActive: false`, and a `culturalNote` naming
the required source.

---

## 6. Glossary and grammar-note conventions

- **Glossing style** for new forms:
- **Which words get a dictionary entry** vs. glossed inline:
- **Category assignment** — must be in `DICTIONARY_CATEGORIES`
  (`server/src/lib/dictionary-categories.ts`, the one server-side authority;
  mirrored by `DICTIONARY_CATEGORY_VALUES` in `mobile/lib/dictionary.ts`). A
  wrong-but-valid category passes validation and is never flagged again.
- **Grammar notes** — where they live and how long they may be.

---

## 7. Shipping plan

| Level | Movement | Course id | Lesson `style` | Lesson title (the idempotency key) |
|---|---|---|---|---|
| A1 | | | | |
| A2 | | | | |
| B1 | | | | |
| B2 | | | | |
| C1 | | | | |
| C2 | | | | |

Titles are decided **before the first upload** — re-import is idempotent per
(course, title), so changing a title later creates a second lesson instead of
updating the first.

New vocabulary the story needs goes in one unified CSV (language-wide banks, no
course), slugify-checked for id collisions.

---

## 8. Reviewer checklist

Generic items, plus **language-specific ones** — the whole point of a per-language
spec is that the checklist differs.

- [ ] No level label appears in any learner-facing field
- [ ] Every target-language form traces to a note, the owner, or the master
      dictionary — nothing recombined by Claude presented as attested
- [ ] Unverified forms are `[[bracketed]]` so `db:guard-content` holds the lesson
- [ ] Tone marking follows §1's ruling, consistently
- [ ] No two dictionary rows slugify to the same id
- [ ] Categories are in `DICTIONARY_CATEGORIES` and match how neighbours are filed
- [ ] Heritage content is `isActive: false` with a `culturalNote` naming its source
- [ ] *(language-specific)*
- [ ] *(language-specific)*

---

## 9. Open questions for the owner

Numbered, batched, each with the decision it blocks.

| # | Question | Blocks | Tag |
|---|---|---|---|
| 1 | | | [DECIDE] |
