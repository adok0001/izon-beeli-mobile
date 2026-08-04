/**
 * Point Movement 1's ten block-closing game rows at playground mini-games.
 *
 *   npx tsx src/seed/seed-m1-game-keys.ts          # dry run
 *   npx tsx src/seed/seed-m1-game-keys.ts --apply  # write
 *
 * `lessons.game_key` (schema.ts) tells a block's checkpoint gate to run a real
 * playground game instead of its built-in round. The column is new and may not
 * exist in the live DB yet — the apply path creates it first, additively and
 * idempotently, exactly as `drizzle-kit push` would (varchar(32), nullable).
 *
 * Only the four scope-aware, score-recording games are assigned here: quiz,
 * matching-game, word-review, say-it-back. The unscored rest clear a gate on
 * launch, which is a weaker gate than the built-in round — fine when an
 * educator chooses it deliberately in Studio, wrong as a seeded default.
 *
 * word-review is assigned ONLY where the game row carries held-back vocabulary
 * (g06's 41 lines) — scoped to an empty row it has nothing to review and the
 * gate could dead-end. The other three always have dictionary fallback.
 *
 * Assignments follow each block's theme, and no game repeats consecutively:
 * "Say It Again" (the repair-set block) literally gets say-it-back; the
 * opposites block gets pair-matching; the counting block gets the quiz.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);

const ASSIGNMENTS: { id: string; gameKey: string; why: string }[] = [
  { id: "izon-m1-g01", gameKey: "matching-game", why: "The Gate — greeting/reply pairs" },
  { id: "izon-m1-g02", gameKey: "quiz",          why: "Your Name, My Name — who/where questions" },
  { id: "izon-m1-g03", gameKey: "say-it-back",   why: "Say It Again — the repair set, literally" },
  { id: "izon-m1-g04", gameKey: "quiz",          why: "Come and Eat — food quiz (dictionary-backed; the row itself is empty)" },
  { id: "izon-m1-g05", gameKey: "matching-game", why: "The Things of the House — object/name pairs" },
  { id: "izon-m1-g06", gameKey: "word-review",   why: "The Water and the Path — richest held-back vocab (41 lines)" },
  { id: "izon-m1-g07", gameKey: "say-it-back",   why: "The People Here — spoken 'who is that?'" },
  { id: "izon-m1-g08", gameKey: "quiz",          why: "Counting and Trading — numbers drill (27-line vocab)" },
  { id: "izon-m1-g09", gameKey: "matching-game", why: "Tired, Hungry, Glad — opposite pairs" },
  { id: "izon-m1-g10", gameKey: "say-it-back",   why: "Sun and Shadow — weather lines aloud" },
];

// Re-verify rather than trust the plan: only touch rows that are still games.
const rows = (await sql`
  SELECT id, title, type FROM lessons WHERE id = ANY(${ASSIGNMENTS.map((a) => a.id)})
`) as { id: string; title: string; type: string }[];

const byId = new Map(rows.map((r) => [r.id, r]));
const safe = ASSIGNMENTS.filter((a) => byId.get(a.id)?.type === "game");
const skip = ASSIGNMENTS.filter((a) => byId.get(a.id)?.type !== "game");

for (const a of ASSIGNMENTS) {
  const row = byId.get(a.id);
  const mark = row?.type === "game" ? "set " : "SKIP";
  console.log(`  ${mark} ${a.id}  ${a.gameKey.padEnd(14)} ${row ? row.title : "(row missing)"}  — ${a.why}`);
}
if (skip.length) console.log(`\n${skip.length} skipped — missing or no longer type=game.`);
console.log(`\n${safe.length} rows to set.`);

if (APPLY && safe.length > 0) {
  // Additive; matches gameKey: varchar("game_key", { length: 32 }) in schema.ts.
  await sql`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS game_key varchar(32)`;
  for (const a of safe) {
    await sql`UPDATE lessons SET game_key = ${a.gameKey} WHERE id = ${a.id} AND type = 'game'`;
  }
  const after = (await sql`
    SELECT id, game_key FROM lessons WHERE id = ANY(${safe.map((a) => a.id)}) ORDER BY id
  `) as { id: string; game_key: string | null }[];
  const wrong = after.filter((r) => r.game_key !== safe.find((a) => a.id === r.id)?.gameKey);
  console.log(`\napplied — ${after.length} rows read back, ${wrong.length} mismatched (expect 0).`);
} else if (!APPLY) {
  console.log("dry run — re-run with --apply to write.");
}
