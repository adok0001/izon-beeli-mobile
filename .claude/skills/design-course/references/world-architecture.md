# World Architecture

The lattice content sits on: **Movement × Pillar, realized in a Place.**

| Axis | Question it answers | What it gives the learner |
|---|---|---|
| **Movement** | *Where am I in the journey?* (spine, ordered) | narrative pull, a reason to go further |
| **Pillar** | *Which dimension of the worldview?* (thread, cross-cutting) | depth, the 360° picture |
| **Place** | *Where am I standing right now?* (setting, per culture) | immersion, being-there |

> Derived from `../world-blueprint.md`, which is untracked and predates the
> database migration. This file carries only what is still true. Where the two
> disagree, this one is current — see §What changed.

---

## Movements — the Newcomer's journey

The learner arrives a stranger and becomes a keeper of tradition. It is the
**community's** life cycle witnessed and joined, not an avatar's.

### A Movement is a level band wearing a narrative skin

This is the placement rule, and it settles a question the earlier one-line
descriptions left open. A Movement is **not** a subject area. Its order is set by
what the learner can do; the narrative supplies the setting.

**Themes recur across Movements at rising levels — nothing owns a theme.** The
water runs M1 *down to the water* → M6 *setting the net as work* → M9 *the creek
inside a proverb*. The market runs M1 *how much is it* → M4 *arguing the price* →
M8 *the cooperative's pricing dispute*.

Before this was written down, two rules were operating at once and pulling
opposite ways: *a beginner needs it, so put it in M1 whatever the topic* (which
is why M1 legitimately holds fishing, market, family and weather — A1 really is
that large) and *it is about colour, so put it in the colour-ish Movement
whatever the level* (which is why the A1–A2 colour lessons `izon-cl-1/2/3` are
sitting in M8 at B2–C1). The first rule is right. The second is the bug.

**Placing content: level first, setting second.** If a topic feels like it
belongs to a later Movement but the language is A1, it belongs early — write the
A1 version now and the harder version later, in the Movement whose level fits.

| # | Movement | Band | Course id suffix |
|---|---|---|---|
| 1 | **Arrival** | A1 | `-mv-arrival` |
| 2 | **The Household** | A1–A2 | `-mv-household` |
| 3 | **The Village** | A2 | `-mv-village` |
| 4 | **Growing Up** | A2–B1 | `-mv-growing-up` |
| 5 | **The Threshold** | B1 | `-mv-threshold` |
| 6 | **The Working Year** | B1–B2 | `-mv-working-year` |
| 7 | **The Union** | B2 | `-mv-union` |
| 8 | **The Assembly** | B2–C1 | `-mv-assembly` |
| 9 | **The Elder's Voice** | C1 | `-mv-elders-voice` |
| 10 | **The Keeper** | C2 | `-mv-keeper` |

**CEFR is hidden and has no database column.** There is no `cefr` field in
`server/src/db/schema.ts` — the level exists only in design documents like this
one. It never appears in a lesson `title`, `description`, `canDo`, or transcript.
The bands above are ordering information for authors, nothing more.

### What each Movement teaches

Four fields each: what the learner can do at the end, the language that gets
them there, the setting, and what is explicitly out of scope. The last field is
the one that does the work — it is what stops a Movement drifting back into
being a subject.

**M1 Arrival · A1**
- *Can do:* greet and take leave by time of day; give and ask name, origin, and reason for coming; say you don't understand and ask for slower speech; accept food and thank a host; name what is in the compound and say whose it is.
- *Teaches:* greeting paradigm · personal pronouns · `tị`-questions · yes/no and negation · possession · demonstratives · the repair set · 1–20 for recognition.
- *Setting:* the waterside, the compound gate, the first meal.
- *Not here:* past tense, comparison, opinion, reason clauses.

**M2 The Household · A1–A2**
- *Can do:* name family and say how people are related; describe a daily routine; distinguish what you are doing now from what you usually do; give and take simple household instructions; talk about a meal being made.
- *Teaches:* kinship terms and address · habitual vs. continuous aspect · imperatives and polite requests · the `-ama` plural · locatives.
- *Setting:* the compound, the hearth, the sleeping rooms.
- *Not here:* negotiation, extended past narration.

**M3 The Village · A2**
- *Can do:* give and follow directions inside the settlement; introduce one person to another; say what someone does and where they belong; count past twenty; describe a public event you attended.
- *Teaches:* the vigesimal system · compounding and cliticization · conjunctions · titles and address · simple past.
- *Setting:* the paths between compounds, the square, the landing.
- *Not here:* ceremony language, debate, praise register.

**M4 Growing Up · A2–B1**
- *Can do:* buy and sell, ask a price and argue it down; describe animals, colours, and the natural world; recount yesterday; compare two things.
- *Teaches:* money and the akpa system · comparatives and superlatives · adjectives · past narration · ordinals.
- *Setting:* the market, the riverbank, the school path.
- *Not here:* workplace negotiation, ceremonial description.

**M5 The Threshold · B1**
- *Can do:* describe a rite you witnessed and your part in it; express obligation and permission; report what someone told you; describe change in yourself over time.
- *Teaches:* modality · reported speech · aspect across a long narrative · the language of instruction and charge.
- *Setting:* the grove, the elder's compound, the night before.
- *Not here:* invented initiation language. Keeper-gated.

**M6 The Working Year · B1–B2**
- *Can do:* describe a day's work and a full routine; name tools and the stages of an occupation; talk about seasons and the flood cycle; negotiate a work arrangement — share, apprentice, payment; handle an institution.
- *Teaches:* sequencing · purpose and result clauses · quantity and division · conditionals.
- *Setting:* creek, net, farm, motor park, clinic, the year turning.
- *Not here:* first counting, civic argument.

**M7 The Union · B2**
- *Can do:* make and refuse a proposal politely; describe a relationship and its obligations; conduct a formal exchange between two families; state intention and commitment.
- *Teaches:* politeness register and indirectness · future and intention · hypotheticals · the vocabulary of agreement.
- *Setting:* two compounds, the go-between's path.
- *Not here:* sacred formula, oratory.

**M8 The Assembly · B2–C1**
- *Can do:* state and defend an opinion; disagree without giving offence; follow a news report or a public announcement; contribute to a community decision; discuss a contemporary issue.
- *Teaches:* argument connectives · concession · impersonal and passive constructions · abstract nouns · registers of formality.
- *Setting:* the town hall, the festival ground, the radio, the phone.
- *Not here:* A1 vocabulary of any kind.

**M9 The Elder's Voice · C1**
- *Can do:* deploy a proverb at the right moment; tell a story with shape and timing; praise and rebuke in the expected forms; use ideophones expressively.
- *Teaches:* ideophones, reduplication and triplication · proverb structure · rhetorical parallelism · poetic register.
- *Setting:* the gathering, the storytelling night, the naming of a child.
- *Not here:* composed proverbs. Every item attested and attributed.

**M10 The Keeper · C2**
- *Can do:* pour libation in the expected order; recount origin and ancestry; instruct a younger person in the tradition; hold the sacred register appropriately.
- *Teaches:* archaic and ceremonial forms · genealogical vocabulary · address to the unseen.
- *Setting:* the shrine, the ancestral compound, the moment of handing on.
- *Not here:* anything unverified by a religious authority. Gated end to end.

### Known misplacements under this definition

Recorded 2026-08-04 against the live Izon catalogue, not yet acted on:

- **Colours in M8.** `izon-cl-1` The Three Sacred Colours, `izon-cl-2` Colour
  Groupings, `izon-cl-3` Ẹwiri Ịndị sit in The Assembly (B2–C1). Colour words are
  A1–A2 — M1 or M4. The *sacred* colour material may genuinely belong high; the
  plain vocabulary does not.
- **M3 and M5 are empty**, and under a level model that is a hole in the spine
  rather than a staffing gap: a learner steps M2 (A1–A2) → M4 (A2–B1) → M6
  (B1–B2) with A2 and B1 unserved. M3 is the more urgent — the notes corpus
  already maps 298 lines to it (vigesimal counting, word formation, titles).
- **M10 has 4 lessons and 0 live.**

Distribution as of 2026-08-04: M1 66 · M2 15 · M3 0 · M4 13 · M5 0 · M6 7 ·
M7 2 · M8 10 · M9 2 · M10 4. M1 holding 55% is **expected** under this model,
not bloat.

**Movement 3's id was `-mv-naming` until 2026-08-02** — a leftover from when the
Movement was "The Naming". It is `-mv-village` now, matching every other language
scaffolded from `lesson-stubs.ts`. Always resolve ids with `db:list-lessons`
rather than from memory; the suffixes are not all guessable from the titles.

**The heritage crown (Movements 9–10).** Mastery in these cultures is the ability
to give a blessing, tell a folktale, deploy a proverb at the right moment, pour
libation. C1/C2 being heritage-intensive is *accurate*, not a workaround for
scarce material — and it is why a European master story tends not to survive
localization above B1.

---

## Pillars — the dimensions of the worldview

Eight universal dimensions, filled distinctly by each culture. A learner on the
main journey meets all eight. Following one pillar vertically is also valid.

| # | Pillar | What it covers |
|---|---|---|
| 1 | **Kinship & Belonging** | Family, roles, forms of address, community ties |
| 2 | **Land & Livelihood** | River/farm/market, work, food production |
| 3 | **Cosmology & Ancestors** | Belief, the sacred, libation, the unseen |
| 4 | **Rites of Passage** | Birth, naming, initiation, marriage, death |
| 5 | **Arts & Oratory** | Song, dance, proverb, storytelling, rhetoric |
| 6 | **Governance & Values** | Elders, justice, communal responsibility, ethics |
| 7 | **Food & Hospitality** | Cooking, sharing, welcoming guests |
| 8 | **Time, Seasons & Festivals** | Calendar, agricultural cycle, celebrations |

Pillars are threads, not silos — a Threshold scene legitimately touches Rites,
Cosmology, Arts and Kinship at once. That density is intentional.

**Pillars cut across Movements; that is the point of having two axes.** Land &
Livelihood appears at M1 as *down to the water*, at M6 as *setting the net for a
living*, and at M9 as *the creek inside a proverb* — one pillar, three levels,
three Movements. So a pillar is never a reason to place content in a particular
Movement. Level decides the Movement; the pillar decides what the scene is
about once it is there.

---

## Places — universal types, named per culture

Eight universal place-types. The Niger Delta creek is not the Sahelian river is
not the highland spring — they all map to `water_land`, but each culture gives
them its own name, ecology, and significance.

| Place | Universal type |
|---|---|
| The Compound / Home | `compound` |
| The Hearth / Kitchen | `hearth_kitchen` |
| The Market | `market` |
| The Water / Land of Livelihood | `water_land` |
| The Sacred Grove / Shrine | `sacred_grove` |
| The Festival Ground / Square | `festival_ground` |
| The Assembly / Court of Elders | `assembly` |
| The Path / Crossroads | `path` |

**The per-culture names are deliberately blank here**, and that is a deliberate
correction. This column once held Izon words; checked against the project's
sourced dictionary, most were wrong — `bou` is *bush*, not creek; `beri` is
*ear*, not path; four of the seven appeared nowhere in 10,175 rows. They read as
authoritative for as long as nobody checked.

**Filling this column is a native-speaker task, in every language.** Producing a
plausible-sounding word for "the market" is exactly the failure this skill
exists to prevent. Leave it blank, generate the review sheet, wait.

The same rule governs the **cast**. Names must be real names in the culture,
taken from attested material or supplied by a speaker. And where a culture folds
role and address into one word, a bare English-style "the [role]" is wrong —
check how the corpus actually addresses people.

**But a name meaning something is not a reason to reject it.** Ịzọn personal
names are routinely also common nouns, and often clipped from a longer form:
**Ere** is a real name — short for *Erepamowei* among others — and `ere` is
*woman* `[nouns, published]`. **Tare** is a name and means *love*; **Ebi** is a
name and means *good*. The dictionary lookup tells you what a word means; it
does not tell you whether people are called that. Only a speaker can say that.

So the check is not "does this word appear in the dictionary as a noun?" — it is
**"do people actually bear this name?"**, and the answer comes from a speaker or
from attested material. Rejecting *Ere* because `ere` means woman is the same
error in the other direction as inventing *Seinye* because it sounded plausible.

**The approved cast pool (owner, 2026-08-04):** Ebi · Ebiere · Tonye · Tare ·
Oge · Ere · Bulouere (m: Bulouwei) · Binarau (m: Binaowei) · Layefa · Timi ·
Funakpo — plus the role-names Yengi (mother), Dau (father), Koko (grandmother),
Amaokowei. Owner-directed renames: Seibi → Tare, Vivian → Oge. English titles
bolted onto names ("Uncle Ere", "Trader Seibi", "Mama Seibi") are the recurring
bug — the name is fine, the English title in front of it is not.

---

## Authoring discipline

1. **Target language in `text`; English gloss in `translation`** — never the reverse.
2. **Localized fields use the translations map**, not a fixed language pair:
   a `<field>Translations` jsonb column plus a flat `<field>` holding the English
   projection. Use `LocalizedTextInput` on the client and the helpers in
   `server/src/lib/translations.ts`. The old `<field>Fr` sidecar columns are gone
   — never add one back, and never hardcode an English+French pair of inputs.
3. **`[[bracketed placeholders]]`** mark anything not yet sourced. `db:guard-content`
   takes any lesson containing one off the shelf, so this fails safe.
4. **Heritage content** — sacred phrases, libation formulas, creation accounts,
   proverbs — must be verified by a community or religious authority before it
   goes active.
5. **`culturalNote` is never empty** on heritage or rites-of-passage content.
6. **CEFR is hidden** — it informs curriculum completeness and institutional
   reporting only.

---

## Cultural authenticity standard

The bar for a journey scene is higher than for a thematic vocabulary lesson. A
scene must:

- Reflect the **real** culture — names, places, foods, ceremonies drawn from
  actual community life
- Be **attributed** — traditional songs, proverbs and sacred texts are community
  intellectual property; source and credit always
- Be **asymmetric** — different cultures have different words for what A1 means;
  the grid is shared, the content is not
- Be **honest about uncertainty** — `[[MUST be verified by an Egbesu religious
  authority]]` is a mark of rigour, not weakness
- **Involve community** — the educator from the culture supplies the language;
  this tool drafts structure and English, not heritage phrases

Rushing to active with fabricated heritage content is the worst possible outcome
for the learner and for the community.

---

## What changed from `world-blueprint.md`

Kept here as the record of why this file exists.

| Blueprint said | Status |
|---|---|
| Izon place names (`bou` creek, `beri` path, `ogbo` homestead…) | **wrong** — contradicted by the master dictionary; quarantined |
| Cast: Uncle Ere, Trader Seibi, Ina, "Amaokowei (Chief/Elder)" | **partly wrong, and the original reasoning here was itself wrong** — see below |
| Scenes draw vocabulary from `mobile/lib/data/**` | **dead** — that tree was deleted in `5b8dcfc`; content lives in the database |
| Author a `CulturePack` object; a server endpoint will accept it | **never built** — no `World`/`Movement`/`Scene` tables exist. Lessons ship as CSVs through Studio |
| `buildJourney(pack)` generates the world | **different function** — `mobile/lib/journey.ts` exports `buildJourney(courses, lessons, …)`, a map layout reading the database. Same name, unrelated |
| `en` + `fr` required on every `LocalizedText` | **retired** — replaced by the translations map |
| `assertFullCoverage` validates A1→C2 | scaffold-only; not part of the live path |

### The cast row, corrected (2026-08-04)

This file previously rejected the blueprint cast with: *"`ere` is woman, `ebi` is
good, two are unattested, and the last is a role used as a name."* Three of those
four claims are wrong, and they are wrong in an instructive way — the reasoning
was "this word is a common noun, therefore it is not a name," which is simply not
how Ịzọn names work.

| Blueprint cast | Actual status |
|---|---|
| **Ere** | **A real name** — the owner (native speaker) confirms it, short for *Erepamowei* among other forms. That `ere` is *woman* `[nouns, published]` is irrelevant. What was wrong was "**Uncle** Ere" — an English kin-title bolted on |
| **Ebi** | **A real name**, meaning *good*. Confirmed in the 2026-07-26 owner review. Not a disqualifier either |
| **Amaokowei** | **Correct as used** — role and name together, kept in the 2026-07-26 review. The old claim that it was "a role used as a name" is the error; what is forbidden is the definite article, "*the* Amaokowei" |
| **Ina**, **Seibi** | Genuinely unattested. *Seinye*, from the same batch, was outright fabricated and became *Bulouere* / *Binarau* |

The surviving rule is in *Places* above: check whether **people bear the name**,
not whether the string appears in the dictionary. A dictionary lookup answers a
different question than the one being asked.

`scaffold/` and `node_modules/` in this directory are artifacts of that earlier
pass. They are gitignored and are not inputs to this skill.
