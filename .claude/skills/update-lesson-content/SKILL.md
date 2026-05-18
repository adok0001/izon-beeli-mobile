---
name: update-lesson-content
description: "Add new content from Izon (or other language) lesson note PDFs/DOCXs to the codebase and sync to DB. Use when the user says 'update [language] with lesson notes', 'add lesson notes from [date]', or references a userio-docs file."
---

# Update Lesson Content

Lesson notes arrive as PDFs or DOCX files in `userio-docs/`. This skill defines the complete workflow for extracting content, adding it to the source TypeScript files, and syncing only the affected units to the database — without reseeding.

## Step 1 — Find the lesson note

Look in `userio-docs/` for the file matching the date the user specifies.

Naming pattern: `ỊZỌN LESSON NOTE for [Day] DD-MM-YYYY_[timestamp].pdf`

Read the file with the Read tool. If the user doesn't specify a date, list `userio-docs/` and ask.

## Step 2 — Parse and identify content types

PDFs use numbered sections (I. More Vocabulary, II. Animals, III. Proverbs, etc.). Map each section to a content type:

| Section content | Content type | Target file |
|---|---|---|
| Vocabulary, Animals, Food, Phrases | Dictionary entries | `mobile/lib/data/[lang].ts` |
| Words introduced within a story/lesson | Dictionary entries | `mobile/lib/data/[lang].ts` |
| New lesson or story (with transcript) | Lesson | `mobile/lib/data/lessons/[lang-course].ts` |
| Proverbs | Proverbs | `mobile/lib/data/proverbs/[lang]/` |
| Cultural content | Cultural | `mobile/lib/data/cultural/[lang]/` |
| Sentence drills | Sentences | `mobile/lib/data/sentences/[lang]/` |

Stories are lessons with `type: "story"` — same file structure and sync command.

## Step 3 — Cross-check existing entries (dictionary)

Before adding any word, grep the language file to confirm it isn't already a standalone entry:

```bash
grep -n "\"[word]\"" mobile/lib/data/izon.ts
```

Skip words already present. Report skipped words to the user.

## Step 4 — Find the next dictionary ID

```bash
grep -n "^  e(" mobile/lib/data/izon.ts | tail -1
```

New entries start at `lastId + 1`.

## Step 5 — Assign categories

There is no "adjectives" type. Use:

| Content | Category |
|---|---|
| Action words | `"verbs"` |
| States / qualities (bitter, warm, near, tired) | `"verbs"` (stative) |
| Objects, abstract nouns | `"nouns"` |
| Animals | `"animals"` |
| Food items | `"food"` |
| Greetings / courtesies | `"greetings"` |
| Set phrases | `"phrases"` |
| Body parts | `"body"` |
| Numbers | `"numbers"` |

## Step 6 — Write dictionary entries

Append above the closing `];`, under a dated comment block:

```typescript
  // --- Lesson DD-MM-YYYY: [Section title] ---
  e(691, "word", "english meaning", "category", undefined, "Example sentence", "Translation"),
```

`e()` signature: `(id, word, english, category, pronunciation?, example?, exampleTranslation?)`

- Pass `undefined` for `pronunciation` unless the notes explicitly give it
- Example sentences: short, natural Izon — follow patterns from surrounding entries
- Group entries by section (vocabulary, animals, food, etc.) with their own comment header

## Step 7 — Sync to DB (by content type only)

Run only the sync commands for content types that were actually updated.

```bash
# From the server/ directory:
cd server

# Dictionary vocabulary, animals, food, phrases
npm run db:sync-dict

# Lessons and stories (transcript segments are replaced, audioUrl preserved)
npm run db:sync-lessons

# Proverbs
npm run db:sync-proverbs

# Cultural content
npm run db:sync-cultural

# Sentence drills
npm run db:sync-sentences

# All of the above (when multiple types were updated in one note)
npm run db:sync
```

**What the sync preserves:**
- `dictionary_entries.audioUrl`, `imageUrl`, `contributorName`, `contributorId` — educator-uploaded audio and contributor attribution are never overwritten
- `lessons.audioUrl` — educator-uploaded lesson audio is never overwritten by a source-file placeholder
- All user data (word_bank, user_progress, contributions) is untouched

## Step 8 — Report to user

Summarise:
- N new entries added to [file]
- M entries skipped (already existed): [list]
- Sync command run and output
