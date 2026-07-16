/**
 * Take unattested / placeholder lessons off the shelf.
 *
 *   npx tsx src/db/guard-unattested-content.ts                       # dry run (held list + placeholders)
 *   npx tsx src/db/guard-unattested-content.ts --report              # + per-lesson attestation from the review queue
 *   npx tsx src/db/guard-unattested-content.ts --hold-below 0.5     # + hold lessons whose attest rate < 50%
 *   npx tsx src/db/guard-unattested-content.ts ... --apply           # deactivate them
 *
 * Three sources of holds:
 *   1. A transcript line containing a `[[...]]` placeholder is an instruction to
 *      the production team, not language. It must never render to a learner.
 *   2. Lessons on the HELD list are held because an educator review found their
 *      target language FABRICATED. They stay dark until a keeper supplies the
 *      attested form.
 *   3. (opt-in, --hold-below) Lessons whose unit-level attestation rate in
 *      `userio-docs/izon_seed_review_queue.csv` falls below the given floor.
 *      NOT_SOURCED is a spectrum — wrong (Baịyo≠"good evening"), fabricated
 *      (teki, absent from the master dictionary), and plausible-but-unverified
 *      (Tụbara?) — so the threshold is a policy knob the owner sets, never a
 *      default. Verify corrections against izon_master_dictionary.csv.
 *
 * This deactivates (`is_active = false`) rather than deletes: the content stays
 * editable in Studio, it simply stops being served. Re-running is safe.
 *
 * Educators clear a lesson by fixing it in Studio — never by editing this list.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "./index.js";

const APPLY = process.argv.includes("--apply");
const REPORT = process.argv.includes("--report");
const holdBelowIdx = process.argv.indexOf("--hold-below");
const HOLD_BELOW = holdBelowIdx >= 0 ? parseFloat(process.argv[holdBelowIdx + 1] ?? "") : null;
if (holdBelowIdx >= 0 && (HOLD_BELOW == null || isNaN(HOLD_BELOW) || HOLD_BELOW <= 0 || HOLD_BELOW > 1)) {
  console.error("--hold-below expects a rate in (0, 1], e.g. --hold-below 0.5");
  process.exit(1);
}

const QUEUE_PATH = resolve(import.meta.dirname ?? ".", "../../../userio-docs/izon_seed_review_queue.csv");

/**
 * Held back by educator review: the Izon is fabricated. `teki`, `ina ẹrẹ` and
 * `ẹrẹmẹ` are unattested, and `Baịyo` means GOODBYE, not "good evening".
 * Mirrors HELD_PODCAST_IDS / HELD_COURSE_LESSON_IDS in the content bundle.
 * Remove an id here only once a keeper has supplied the attested form.
 */
const HELD_LESSON_IDS = ["izon-pod-b1", "izon-bmc-b1", "izon-bmc-b2"];

/** Minimal CSV row parser that respects double-quoted fields. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Per-lesson attestation from the unit-level review queue.
 * unit_id `izon-fw-1-2` → lesson `izon-fw-1` (strip the trailing unit number).
 */
function lessonAttestationFromQueue(): Map<string, { sourced: number; total: number }> {
  const byLesson = new Map<string, { sourced: number; total: number }>();
  let raw: string;
  try {
    raw = readFileSync(QUEUE_PATH, "utf8");
  } catch {
    console.warn(`(review queue not found at ${QUEUE_PATH} — skipping attestation report)`);
    return byLesson;
  }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const unitIdx = header.indexOf("unit_id");
  const statusIdx = header.indexOf("source_status");
  if (unitIdx < 0 || statusIdx < 0) {
    console.warn("(review queue missing unit_id/source_status columns — skipping)");
    return byLesson;
  }
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const unitId = cols[unitIdx];
    if (!unitId) continue;
    const lessonId = unitId.replace(/-\d+$/, "");
    const entry = byLesson.get(lessonId) ?? { sourced: 0, total: 0 };
    entry.total += 1;
    if (cols[statusIdx]?.trim().toLowerCase() === "sourced") entry.sourced += 1;
    byLesson.set(lessonId, entry);
  }
  return byLesson;
}

async function main() {
  console.log(APPLY ? "Content guard — APPLYING\n" : "Content guard — DRY RUN (pass --apply to write)\n");

  const { rows: placeholders } = await db.execute<{ id: string; n: number }>(sql`
    SELECT l.id, count(ts.id)::int AS n
    FROM lessons l
    JOIN transcript_segments ts ON ts.lesson_id = l.id
    WHERE ts.text LIKE '%[[%'
      AND l.is_active = true
    GROUP BY l.id
    ORDER BY l.id
  `);

  // Threshold holds from the review queue (policy opt-in).
  const attestation = REPORT || HOLD_BELOW != null ? lessonAttestationFromQueue() : new Map<string, { sourced: number; total: number }>();
  const thresholdHeld: string[] = [];
  if (attestation.size > 0) {
    const rows = Array.from(attestation.entries())
      .map(([id, a]) => ({ id, rate: a.total > 0 ? a.sourced / a.total : 0, ...a }))
      .sort((a, b) => a.rate - b.rate);
    if (REPORT) {
      console.log(`Attestation by lesson (review queue, ${attestation.size} lessons):`);
      for (const r of rows) {
        console.log(`  ${r.id.padEnd(16)} ${(r.rate * 100).toFixed(0).padStart(3)}%  (${r.sourced}/${r.total} sourced)`);
      }
      console.log("");
    }
    if (HOLD_BELOW != null) {
      thresholdHeld.push(...rows.filter((r) => r.rate < HOLD_BELOW).map((r) => r.id));
    }
  }

  const holdSet = [...new Set([...HELD_LESSON_IDS, ...thresholdHeld])];
  const { rows: held } = await db.execute<{ id: string }>(sql`
    SELECT id FROM lessons
    WHERE id IN ${holdSet} AND is_active = true
    ORDER BY id
  `);

  if (placeholders.length === 0 && held.length === 0) {
    console.log("Clean — no live lesson carries a placeholder or is on the hold set.");
    process.exit(0);
  }

  if (placeholders.length > 0) {
    console.log(`Live lessons whose transcript still contains a [[placeholder]] (${placeholders.length}):`);
    for (const r of placeholders) console.log(`  ${r.id.padEnd(20)} ${r.n} segment(s)`);
  }

  if (held.length > 0) {
    console.log(`\nLive lessons on the hold set (${held.length})` +
      (thresholdHeld.length > 0 ? ` — includes attest-rate < ${HOLD_BELOW} from the review queue` : " — fabricated target language") + ":");
    for (const r of held) console.log(`  ${r.id}`);
  }

  if (!APPLY) {
    console.log("\nNothing written. Re-run with --apply to deactivate these.");
    process.exit(0);
  }

  await db.execute(sql`
    UPDATE lessons SET is_active = false
    WHERE is_active = true
      AND (
        id IN ${holdSet}
        OR EXISTS (
          SELECT 1 FROM transcript_segments ts
          WHERE ts.lesson_id = lessons.id AND ts.text LIKE '%[[%'
        )
      )
  `);

  const total = new Set([...placeholders.map((r) => r.id), ...held.map((r) => r.id)]).size;
  console.log(`\n-> deactivated ${total} lesson(s). They remain editable in Studio.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Guard failed:", err);
  process.exit(1);
});
