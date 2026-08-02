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

| # | Movement | What happens | Hidden CEFR | Course id suffix |
|---|---|---|---|---|
| 1 | **Arrival** | Welcomed as a guest — greetings, names, hospitality | A1 | `-mv-arrival` |
| 2 | **The Household** | Settling into the compound — family, home, food | A1–A2 | `-mv-household` |
| 3 | **The Village** | Beyond the compound — the community, and the naming that gathers it | A2 | `-mv-naming` |
| 4 | **Growing Up** | Childhood around you — the river, the market, first proverbs | A2–B1 | `-mv-growing-up` |
| 5 | **The Threshold** | A coming-of-age — initiation, the elder's charge | B1 | `-mv-threshold` |
| 6 | **The Working Year** | Livelihood across the seasons — fishing, farming, market | B1–B2 | `-mv-working-year` |
| 7 | **The Union** | Courtship and marriage — two families join | B2 | `-mv-union` |
| 8 | **The Assembly** | Community life — festivals, governance, the modern world | B2–C1 | `-mv-assembly` |
| 9 | **The Elder's Voice** | You can speak now — oratory, proverbs, praise poetry | C1 | `-mv-elders-voice` |
| 10 | **The Keeper** | You pass it on — ancestry, cosmology, libation, tradition | C2 | `-mv-keeper` |

**CEFR is hidden and has no database column.** There is no `cefr` field in
`server/src/db/schema.ts` — the level exists only in design documents like this
one. It never appears in a lesson `title`, `description`, `canDo`, or transcript.

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
| Cast: Uncle Ere, Trader Seibi, Ina, "Amaokowei (Chief/Elder)" | **wrong** — `ere` is *woman*, `ebi` is *good*, two are unattested, and the last is a role used as a name |
| Scenes draw vocabulary from `mobile/lib/data/**` | **dead** — that tree was deleted in `5b8dcfc`; content lives in the database |
| Author a `CulturePack` object; a server endpoint will accept it | **never built** — no `World`/`Movement`/`Scene` tables exist. Lessons ship as CSVs through Studio |
| `buildJourney(pack)` generates the world | **different function** — `mobile/lib/journey.ts` exports `buildJourney(courses, lessons, …)`, a map layout reading the database. Same name, unrelated |
| `en` + `fr` required on every `LocalizedText` | **retired** — replaced by the translations map |
| `assertFullCoverage` validates A1→C2 | scaffold-only; not part of the live path |

`scaffold/` and `node_modules/` in this directory are artifacts of that earlier
pass. They are gitignored and are not inputs to this skill.
