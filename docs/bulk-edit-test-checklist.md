# Bulk edit mode — test checklist

Manual verification for Studio's dictionary **Edit** mode (`GET /import/export`,
`POST /import/edit`). Work the gates in order. **Gate 2 is a stop-the-line gate**
— if it isn't clean, nothing after it is worth running.

The risk this checklist exists to manage: edit mode is the first Studio path that
**writes over content an educator already published**, and a reviewer's edit
takes a published word out of the app until an admin approves it. A merge bug
here doesn't fail loudly — it silently rewrites glosses.

---

## Already covered by automated tests — don't re-test by hand

`cd server && npm test` · `cd mobile && npm test` · `cd web && npm test`

| Behaviour | Test |
|---|---|
| blank / `--` / `\--` cell decoding | `server/src/lib/__tests__/edit-merge.test.ts` |
| per-locale gloss merge; untouched locale survives | ” |
| `--` rejected on `word` / `english` / `category` | ” |
| flat `english` recomputed from the merged map, never from the cell | ” |
| legacy `translations === null` hydration | ” |
| NFC/NFD equivalence; no-op detection | ” |
| `varchar` length guards | ” |
| duplicate ids → 400 naming every row | `server/src/routes/__tests__/bulk-edit.test.ts` |
| unknown id → error, never an insert | ” |
| dry run touches nothing | ” |
| all-blank row → `unchanged`, no write, no un-publish | ” |
| `unpublished` counted only for reviewer + published + actually-changed | ” |
| one `audit_log` row per changed entry | ” |
| CSV round trip: commas, quotes, newlines, formula leads, literal `--`, BOM | `mobile/lib/__tests__/edit-import.test.ts` |

What is **not** covered automatically, and is therefore what this document is
for: the real SQL, the real spreadsheet, and the two client UIs.

---

## Gate 0 — Environment

- [ ] Neon branch created from prod; local `server/.env` `DATABASE_URL` points at **the branch**
- [ ] Confirmed you are not on prod: `psql $DATABASE_URL -c "select current_database(), inet_server_addr()"`
- [ ] Baseline counts recorded:
      ```sql
      select count(*) from dictionary_entries where language_id = 'izon';
      select status, count(*) from dictionary_entries where language_id = 'izon' group by status;
      ```
- [ ] A test admin account and a test reviewer account scoped to `izon`

> If a branch is genuinely unavailable, note a UTC PITR anchor before the first
> write and do Gate 3 on a throwaway `edu-<uuid>` row only. Do not run Gates 5–7
> against prod.

---

## Gate 1 — The two prerequisite bug fixes

These are independent of edit mode and worth confirming first, because both are
invisible until something conflicts.

**1a. The upsert no longer wipes four columns**

- [ ] Pick a row with data in all four: `select id, synonyms, antonyms, semantic_domain, dialectal_variants from dictionary_entries where language_id='izon' and synonyms is not null limit 5;`
- [ ] Note its `id`, `word`, `english`, `category`
- [ ] Upload a **Content** (unified) CSV containing exactly that row, with an explicit `id` column matching
- [ ] Re-query: all four columns unchanged
- [ ] The columns the sheet *did* carry (`english`, `category`) did change

**1b. BOM**

- [ ] Export a sheet, open it in Excel/Numbers, **Save As → CSV UTF-8** (this writes the BOM), change nothing
- [ ] Upload it back in Edit mode
- [ ] Dry run reports rows, **not** "missing id" on every row

---

## Gate 2 — The no-op round trip · **STOP-THE-LINE**

The single most important check. A round-tripped export is mostly blank cells; if
blanks read as edits, one upload rewrites thousands of fields and un-publishes
the lot.

Pick one small category (~50 rows), e.g. `numbers` or `body`.

- [ ] Export it (Edit mode → category → Export CSV)
- [ ] Open the file, confirm the header is `id,word,english,english:fr,english:pcm,english:ar,english:pt,category,pronunciation,example,exampleTranslation,exampleTranslation:*,semanticDomain,status`
- [ ] Confirm `status` values are present and look right
- [ ] Re-upload **without editing anything**
- [ ] Dry run reads **`0 to change`, `N unchanged`** where N is the row count
- [ ] No amber un-publish band appears
- [ ] Confirm button is disabled (`Apply 0 words`)

Repeat once **through a spreadsheet** (open, save, close, no edits) — this is what
catches NFC/NFD drift and quoting damage that a straight file round trip won't.

- [ ] Same result: `0 to change`
- [ ] Repeat on a category containing rows with a populated `english:fr` or `english:pcm`
- [ ] Repeat on a legacy row where `translations is null`:
      ```sql
      select id, word, english from dictionary_entries
      where language_id='izon' and translations is null limit 5;
      ```
      → still `0 to change` (hydration must not count as an edit)

**If any row reports as changed here, stop.** The merge or the serializer is
lossy; do not proceed to a write.

---

## Gate 3 — Real edits, as admin

Five rows, one change each, so every field path is exercised once.

| # | Field | Change | Expect |
|---|---|---|---|
| 1 | `english` | reword the gloss | `translations.en` and flat `english` both updated |
| 2 | `english:fr` | add a French gloss to a row that had none | `en` gloss untouched; flat `english` unchanged |
| 3 | `english:pcm` | `--` on a row that has one | that locale gone; others intact |
| 4 | `category` | valid → different valid | category changed |
| 5 | `pronunciation` or `example` | set on a row where it was null | field set |

- [ ] Dry run lists exactly 5 changed rows, each showing `field  before → after`
- [ ] `unchanged` count = (sheet rows − 5)
- [ ] `unpublished` is **0** (admin)
- [ ] Apply
- [ ] Verify in SQL:
      ```sql
      select id, word, english, translations, category, updated_by, status, published_by
      from dictionary_entries where id in (...);
      ```
- [ ] `updated_by` = the admin's user uuid on all five
- [ ] `status` still `published`; `published_by` / `published_at` **unchanged**
- [ ] Row 2: `translations` has both `en` and `fr`; flat `english` is still the English
- [ ] Row 3: the cleared locale key is absent from the jsonb, others present
- [ ] Audit rows written:
      ```sql
      select entity_id, action, actor_id, before->>'english', after->>'english'
      from audit_log where entity_type='dictionary_entries' order by at desc limit 10;
      ```
- [ ] 5 rows, `action = 'edit'`, `before` is the **full** prior row
- [ ] Rows that didn't change have **no** audit row

**Rollback drill** — this is what makes `audit_log.before` real:

- [ ] Restore one row by hand from its `before` payload
- [ ] Re-export that category and confirm the row matches its pre-edit state

---

## Gate 4 — Reviewer un-publish, and getting back

The behaviour the owner accepted: a reviewer's edit takes a published word out of
the app. It must be visible before the fact and reversible after it.

Sign in as the **reviewer**.

- [ ] Export ≤ 100 rows (the reviewer cap); confirm an unfiltered export reports `truncated` and tells you to narrow
- [ ] Edit one **published** row
- [ ] Dry run shows the amber band: *"1 published word disappears from the app"*
- [ ] The confirm button is **not** directly available — a second, explicit tap is required first
- [ ] Cancel, upload a different sheet with an un-publish in it → the second tap is required **again** (acknowledgement must not carry over)
- [ ] Apply
- [ ] `status = 'in_review'`, `published_by is null`, `published_at is null`, `updated_by` = reviewer
- [ ] `audit_log.action = 'edit_unpublish'`
- [ ] The row is **gone from the learner API**: `GET /dictionary?languageId=izon` no longer returns it
- [ ] As admin, republish: `POST /content/dictionary_entries/<id>/publish`
- [ ] The row returns to the learner API with its edit applied

Also confirm the cases that must **not** un-publish:

- [ ] Reviewer edits a row already `draft` or `in_review` → `unpublished: 0`
- [ ] Reviewer uploads an unmodified export of published rows → `unpublished: 0`, nothing written
- [ ] Admin edits a published row → `unpublished: 0`, status preserved

---

## Gate 5 — Errors and edge cases

Each of these should fail **cleanly at the dry run**, with a message an educator
can act on, and write nothing.

| Case | Expected |
|---|---|
| Same `id` twice in one sheet | 400 for the whole sheet, listing the id and both row numbers |
| `id` not in the table | Row error: "no izon entry with id …", never an insert |
| `id` belonging to **another language** | Same error (not a cross-language edit) |
| `id` of an approved **contribution** (not a dictionary row) | Same error — contributions aren't editable here |
| Blank `id` cell | Row skipped with "missing id" |
| `--` in `word` | Rejected: required, cannot be cleared |
| `--` in `english` (bare column) | Rejected |
| `--` in `category` | Rejected |
| `--` in `english:fr` | **Allowed** — clears just that locale |
| `\--` in a gloss | Stored as the literal `--` |
| Invalid `category` (typo) | Row error naming the category |
| `word` > 500 chars | Rejected at dry run, not by Postgres mid-batch |
| `semanticDomain` > 200 chars | Same |
| `status` column edited to `published` | **Ignored** — status unchanged (must not route around four-eyes) |
| `id` column edited | Treated as a different id → unknown-id error; the original row untouched |
| Sheet with only a header | "No rows found — every row needs its `id` column" |
| 101 rows as reviewer / 5001 as admin | 400 on the batch cap |
| A row whose gloss legitimately starts with `=`, `+`, `-`, `@` | Round-trips intact, no `'` left in the stored value |

- [ ] After running all of Gate 5, row count and per-status counts match the Gate 0 baseline plus only the Gate 3/4 changes

---

## Gate 6 — Both client surfaces

Run the happy path on **each**, since the panels are separate implementations.

**Mobile** (`Educator → Bulk Import → Edit`)

- [ ] Three pills: Content · Lessons · Edit
- [ ] Card 1 (export) shows only in Edit mode; category dropdown lists every valid category **including `ideophones` and `adverbs`**
- [ ] Export button shows "Preparing…" while fetching, then opens the OS share sheet
- [ ] A truncated export raises a toast naming the total and the cap
- [ ] No "Download sample / Show template" buttons in Edit mode
- [ ] Diff list renders `field  before → after`, and rows that un-publish are tagged
- [ ] Footer note matches the role (admin: corrections stay live; reviewer: goes back for review)
- [ ] Success toast reports `Updated N words` plus the un-publish count when non-zero
- [ ] Dark mode: amber band and diff text are legible

**Web** (`/educator/import`)

- [ ] Third pill present; blurb changes with it
- [ ] Export downloads a file with the right name (`beeli-izon-<category>.csv`)
- [ ] Same diff rendering, amber band, and two-step confirm
- [ ] Empty-filter export reports "nothing to export" rather than a blank file

**Both**

- [ ] Switching modes clears any pending result
- [ ] A file picked and then replaced doesn't leave the previous dry run on screen
- [ ] Editing then navigating away and back doesn't re-apply anything

---

## Gate 7 — Scale up

Only after Gates 2–6 are clean.

- [ ] One category at real size (a few hundred rows) as admin — no-op round trip first, then a handful of real edits
- [ ] Timing is acceptable at that size (batches fan out concurrently; watch for gateway timeouts)
- [ ] Spot-check 10 random rows against their `audit_log.before`
- [ ] Then a second category, and so on

**Before prod:** re-run Gate 2 against the prod dictionary as a **dry run only**.
A dry run is read-only by construction — the write function sits below the
`if (req.dryRun) return` — so this is safe and is the cheapest possible proof
that prod data round-trips cleanly.

---

## Sign-off

- [ ] Gate 2 clean on ≥ 3 categories, including one with non-English glosses and one with legacy null `translations`
- [ ] Un-publish demonstrated **and** reversed end to end
- [ ] Rollback from `audit_log.before` demonstrated
- [ ] Neon test branch deleted
