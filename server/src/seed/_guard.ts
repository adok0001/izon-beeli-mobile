// Freeze switch for the legacy content importers.
//
// Postgres is now the source of truth for CMS-owned content (Beeli Studio).
// `db:seed` (index.ts) and `db:sync*` (sync-content.ts) rebuild those tables
// from the hand-authored `mobile/lib/data/*` bundle, so running either would
// clobber anything edited through Studio. They are therefore frozen by default.
//
// Deliberate override (throwaway / fresh dev database only):
//   ALLOW_DB_CLOBBER=1 npm run db:seed
//   ALLOW_DB_CLOBBER=1 npm run db:sync
//
// Imported first (after dotenv) by both entrypoints so it also blocks a direct
// `tsx src/seed/sync-content.ts ...` invocation, not just the npm scripts.
if (process.env.ALLOW_DB_CLOBBER !== "1") {
  console.error(
    [
      "",
      "✋ Seed/sync is frozen — Postgres is the source of truth for CMS content.",
      "",
      "   db:seed and db:sync* overwrite CMS-owned tables (dictionary, courses,",
      "   lessons, proverbs, cultural, sentences, stories) from mobile/lib/data/*,",
      "   discarding anything authored through Beeli Studio.",
      "",
      "   To run anyway (throwaway/dev DB only): ALLOW_DB_CLOBBER=1 npm run <script>",
      "",
    ].join("\n")
  );
  process.exit(1);
}
