# Izon Flagship Course — Canonical Plan

**Status:** Locked (design) · **Date:** 2026-07-15 · **Scope:** Izon (Ịzọn) flagship — course structure + pedagogy layer.
**Supersedes:** `mobile/scripts/out/izon-lesson-classification.md` (the place-remap proposal — retired, see §1).

---

## 0. Problem

The Izon course was organized by **three competing spines at once** — (A) legacy topic
courses (`izon-fw / cm / ss / nt / ot / cl / sg / el / co`), (B) a proposed House/Community/
Work/Modern-Life *place* remap (unapplied), and (C) the "Bou Mie" podcast season. None won,
so learners couldn't tell drills from story from podcast, and content was filed three ways.
Compounding it: ~30% of audited units are unattested, and the pedagogy engine (which mostly
exists) isn't wired to any spine.

---

## 1. Decision: the Movement journey is the single spine

Adopt the **10-Movement Newcomer's journey** (Arrival → Keeper) as the one organizing
principle. It's what the strongest asset (Bou Mie) already embodies and what the
`design-course` blueprint prescribes. **The place-remap (B) is retired.** Legacy topic
courses (A) are **not deleted** — they become *feeder content* folded into Movements.
CEFR rides **hidden** underneath; it is never a learner-facing organizer.

---

## 2. The final library

| Shelf | Contents |
|---|---|
| **The Journey** (the spine, one path A1→C2) | 10 Movements, numbered as Units 1–10 |
| **Reference tracks** (off the numbered path, always available) | Sounds & Script (`izon-ss`); Grammar & Structure (`izon-cm` grammar + `fw-6/7`, ~18 lessons) |
| **Story & Listening** | Bou Mie — Season 1 (9 episodes); also threaded into Movements as anchors |
| **Discover** (ambient, not graded) | Films: The Creeks, The Empty Net, Woyengi · Podcast: Long Way Home |

**Consolidation:** ~9 tangled topic courses + a rival place-model + an orphan season →
**1 journey (10 Movements) + 2 reference tracks + 1 story season + Discover.** Nothing deleted;
everything re-shelved.

---

## 3. Movement population map

Each Movement = its Bou Mie episode (anchor) + folded topic lessons, grouped by scene.

| # | Movement | Level | Anchor + folded lessons | Status |
|---|---|:---:|---|:---:|
| 1 | **Arrival** | A1 | `b1` + fw-1, fw-2, fw-3, cm-2, cm-3 | 🟢 Live |
| 2 | **The Household** | A1–A2 | `b2` + fw-4, fw-5, fw-8, fw-10, fw-12, cm-4, cm-5, cm-6, cm-9, cm-10, el-3, el-6 | 🟢 Live — over-full, rebalance into M4 |
| 3 | **The Naming** | A2 | *(no episode)* + scaffold's 6 naming scenes | 🟡 Authoring gap |
| 4 | **Growing Up** | A2–B1 | `b3` + cm-1, cm-8, fw-9, `nt`, `sg` (children's) | 🟢 Live |
| 5 | **The Threshold** | B1 | *(no episode, no lessons)* + scaffold's 5 initiation scenes | 🔴 **The real hole** |
| 6 | **The Working Year** | B1–B2 | `i1` + el-1, el-2, el-4, el-5, fw-11 | 🟢 Live |
| 7 | **The Union** | B2 | `i3` + negotiation/formal register | 🟠 Heritage-partial (clan-specific terms) |
| 8 | **The Assembly** | B2–C1 | `i2` + `a1` + `cl`, co-1, co-2, co-3/4/5 | 🟢 Live |
| 9 | **The Elder's Voice** | C1 | `a1` + `ot` (proverbs), praise `sg` | 🟡 Depends on `ot` depth |
| 10 | **The Keeper** | C2 | `a2` + `a3` + `ot` creation myths/folktales | 🔒 Heritage-locked (libation/Woyengi) |

**Out of the journey (reference tracks):** Grammar & Structure = `fw-6, fw-7, cm-7, cm-11→24`;
Sounds & Script = `izon-ss`. Both support every Movement; neither is a numbered Unit.

---

## 4. "Units" become Movements

`courseUnitNumber` (`mobile/lib/journey.ts`) numbers a course by its position in the ordered
list — so today **Unit = topic course**. After: **Unit = Movement.** Nine loose tiles become
**ten ordered story chapters**, each opening on its Bou Mie episode and holding its lessons
**grouped by scene**. The two reference tracks come off the numbered path.

---

## 5. Representation — no new tables for v1

Two existing facts make Movement-as-Unit a **data** change, not an engine rebuild:

1. The app already renders courses as numbered Units on a journey map (`journey.ts` +
   `components/learn/journey-map.tsx`).
2. `lessons` already carries `scene` / `sceneTitle` / `sceneOrder` columns (scaffolded, unused).

**Mechanism:** each Movement becomes a course row; the ~44 topic lessons are **re-parented**
into their Movement with scene columns filled; reference courses render off-path.
`courseUnitNumber` then numbers the 10 Movements. The `World`/`Movement`/`Scene` tables from
the blueprint stay a later, optional step.

---

## 6. Pedagogy layer — make the journey actually teach

The engine mostly exists (`wordBank` SM-2 SRS, `quizQuestions` bank, 5 exercise components,
`lessons.canDo`, streaks). The risk is **coverage + wiring**, same disease as the content.

### The five-layer stack (three layers under-built or unbuilt today)

1. **In-lesson checks** — *during* input, formative, low-stakes. Anchored to
   `(lessonId, afterSegmentIndex)`, reusing the **cultural-note placement rail** (the transcript
   already pauses at segment N for notes). Types: `predict-next / meaning / who-register /
   cloze-heard / pick-reply`. Player renders an interactive interstitial (pause → check → reveal
   → resume). Authorable in Studio at segment level. **Unbuilt.**
2. **Post-scene retrieval** — *after*, the testing effect. `quizQuestions` exists but is flat
   per-language with **no lesson/scene link** — must be scene-scoped. **Under-built.**
3. **SRS** — *across* time. **Review unit = the scene phrase/sentence, not the word.** Today
   `wordBank` is keyed to `dictionaryEntryId` (word-level) — this is an architectural change.
   No `word ↔ gloss` flashcards; review whole utterances in context. **Under-built.**
4. **Production** — everywhere, not one exercise type. End-of-scene checkpoint, production mode
   in review, **Journal as scenario-production surface**, feed challenges; ladder
   recognize → cloze → reorder → produce → free; ≥1 production per scene. **Under-built.**
5. **Can-do** — the Movement gate. `canDo` must be **authorable in Studio** and **function**:
   shown at Movement start as the goal, and as an end self-assessment that gates completion.
   **Under-built.**

### Techniques that are already structural (protect these)

- **Interleaving** is *scarce in practice* despite the global wordBank — SM-2 clusters same-age
  items. Must be **manufactured** by a review-session composer with diversity constraints across
  Movements/Pillars/structure/exercise-type.
- **Recycling** — make it a measured obligation: a per-scene **recycle-rate floor** of returning
  items recontextualized along Pillar threads.
- **Dual coding is NOT present** — emoji + a thin `picture-option-grid` don't count. Needs a
  **visual-asset layer** (Place art, object/verb imagery). Lean on audio+text meanwhile.

### Ship gate

A scene does not go live until it runs the full learning loop (input → in-lesson check →
retrieval → production → banked for SRS → feeds a can-do) — **parallel to the attestation gate.**

---

## 7. Integrity gate (attestation)

225 / 752 audited units are `NOT_SOURCED` (izon-sg 100%, izon-cm 109, izon-fw 56, izon-ss 41).
`NOT_SOURCED` is a spectrum: **wrong** (`Baịyo` = "goodbye", mis-taught as "good evening"),
**fabricated** (`teki`, absent from the master dictionary), and **unverified-but-plausible**
(`Tụbara?` — real word, loose gloss). Verify against `userio-docs/izon_master_dictionary.csv`.
The guard (`server/src/db/guard-unattested-content.ts`) currently holds only 3 lessons — far
narrower than the known-unattested set. Corrections route to the educator worksheet → Studio;
never fabricated in files.

**Honest edges (visible, not hidden):** authoring gaps at Movements 3 & 5; heritage locks at
7 & 10. All four are keeper/educator work in Studio, structure-ready, `isActive: false` until
sourced and credited.

---

## 8. Open decisions (not yet made)

- **Integrity policy** — how aggressively "fix it now" pulls unattested content: wrong+fabricated
  only (recommended) vs strict hold-all-225 vs lesson-level attestation threshold.
- **DB access** — whether the guard can be run against live content this session.

---

## 9. Workstream — status (2026-07-16)

All engineering artifacts are BUILT; the DB runs are gated on the owner (dry-run first,
explicit `--apply`, per the destructive-migration convention).

- **Phase 0** ✅ built — `server/src/db/guard-unattested-content.ts` widened: reads
  `userio-docs/izon_seed_review_queue.csv`, reports per-lesson attestation (`--report`),
  optional threshold holds (`--hold-below <rate>`). Real numbers: 46 audited lessons;
  a 0.5 floor holds 15 lessons, 0.25 holds 10; several are 0% attested (fw-2, fw-4,
  fw-5, cm-1, sg-1/2). **Owner picks the floor**; corrections happen in Studio.
- **Phases 1+2** ✅ built — `server/src/seed/migrate-izon-journey.ts`: creates the 10
  Movement courses (M3/M5 inactive gaps), re-parents lessons per §3 with Bou Mie
  episodes as order-0 anchors, folds `nt`→M4 and `cl`→M8, moves Grammar & Structure
  (retitled, +fw-6/fw-7) and Sounds & Script off-path (order 100+, courseType), retires
  emptied legacy courses. Mobile: `journey.ts` now excludes reference courseTypes
  (`grammar`, `sound_script`, `script`) from the map + unit numbering; they remain
  reachable via the Explore All rail; the course header shows "Reference" instead of
  "Unit N". Left for Studio by design: `sg` and `ot` splits, scene grouping, M2↔M4 rebalance.
- **Phase 2.5** ✅ built (2026-07-16) — the learning engine is live end-to-end:
  **sentence-SRS** (`phrase_bank`, snapshot-keyed, SM-2 shared in `lib/sm2.ts`; bookmark
  per transcript line + auto-bank on lesson completion), the **interleaving composer**
  (`GET /phrasebank/session`: per-lesson cap, recall/cloze/reorder rotation, phrase↔word
  interleave), the **phrase-review screen** (playground door, 5 locales), the **can-do
  reflective self-check** (`can_do_checks` + `CanDoCheck` on Movement completion — never
  a gate), and the **recycle-rate report** (`report-recycle-rate.ts`; first run: M2 at
  11% ← below floor, ot 28%; Bou Mie-anchored units 79–88%). Deferred to next cycle:
  the visual dual-coding asset layer (needs an image pipeline), production surfaces in
  Journal/feed, richer cross-Movement composer weighting.
- **Phase 3** ✅ built/existing — journey representation is Phases 1+2; rot cleanup uses
  the pre-existing `cleanup-orphans.ts`; delete `izon-bundle.json` only after confirming
  the import ran (check `story_arc_cast` rows exist for `story-izon-pod-longwayhome`).
- **Phase 4** ✅ encoded — M3 (Naming) & M5 (Threshold) exist as inactive courses whose
  descriptions name the gap; heritage locks (M7 clan terms, M10 libation/Woyengi) remain
  educator/keeper work in Studio, never fabricated.

## 10. Execution runbook (owner-run, in order)

```bash
cd server
# 0 — see the integrity picture, then choose a floor
npx tsx src/db/guard-unattested-content.ts --report
npx tsx src/db/guard-unattested-content.ts --hold-below 0.5           # preview holds
npx tsx src/db/guard-unattested-content.ts --hold-below 0.5 --apply   # write

# 1+2 — crown the journey (idempotent; preview first)
npx tsx src/seed/migrate-izon-journey.ts
npx tsx src/seed/migrate-izon-journey.ts --apply

# fold-in (course-bound chapters → lessons; standalone seasons untouched)
npx tsx src/seed/migrate-fold-course-chapters.ts
npx tsx src/seed/migrate-fold-course-chapters.ts --apply

# 3 — rot cleanup
npx tsx src/db/cleanup-orphans.ts            # (has its own dry-run convention)
npm run db:preflight

# deploy (additive schema lands automatically)
vercel --prod --yes
```

Then in Studio: split `sg`/`ot` into their Movements, group each Movement's lessons into
scenes (Scene button on the course lesson list), rebalance M2→M4, and begin M3/M5 +
heritage authoring with a keeper. Verify on device ("iPhone T"): the learn map shows
Units 1–10, Grammar/Sounds appear only in Explore All, Bou Mie still renders on
`series/[id]` with cast tinting.
