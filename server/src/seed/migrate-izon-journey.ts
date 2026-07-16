import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * Crown the Movement journey as the Izon spine (izon-course-plan.md §1–§5).
 *
 * Creates the 10 Movement courses (Unit = Movement), re-parents the legacy
 * topic lessons into them per the population map (§3), threads the Bou Mie
 * episodes in as each Movement's opening anchor, moves Grammar & Structure and
 * Sounds & Script off the numbered path (order 100+), and retires emptied
 * legacy courses via is_active=false — nothing is deleted.
 *
 *   npx tsx src/seed/migrate-izon-journey.ts          # dry run (default) — prints the full plan
 *   npx tsx src/seed/migrate-izon-journey.ts --apply  # write
 *
 * Deliberately NOT done here (manual, in Studio):
 *   - izon-sg (Songs) split: children's counting songs → M4, praise songs → M9.
 *   - izon-ot (Oral Tradition) split: proverbs → M9, creation myths/folktales → M10.
 *   - Scene grouping within Movements — educators assign via the Scene button
 *     on the course's lesson list.
 *   - Movements 3 (Naming) & 5 (Threshold) stay is_active=false until a keeper
 *     authors them. Honest gap > fabricated fill.
 *
 * Standalone seasons are untouched: Bou Mie's story_arcs/story_chapters/cast
 * stay as-is — chapters reference lessons by id, which re-parenting preserves.
 * Idempotent: courses upsert, re-parents converge, re-running is safe.
 */

const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);

// ── The 10 Movements as course rows ──────────────────────────────────────────
const MOVEMENTS = [
  { id: "course-izon-mv-arrival",      order: 1,  level: "beginner",     active: true,  title: "Arrival",          titleFr: "L'Arrivée",           desc: "Welcomed as a guest — greetings, names, hospitality.",                          descFr: "Accueilli en invité — salutations, noms, hospitalité." },
  { id: "course-izon-mv-household",    order: 2,  level: "beginner",     active: true,  title: "The Household",    titleFr: "Le Foyer",            desc: "You settle into the compound — family, home, food, daily rhythm.",              descFr: "Vous vous installez dans la concession — famille, maison, nourriture, rythme quotidien." },
  { id: "course-izon-mv-naming",       order: 3,  level: "beginner",     active: false, title: "The Naming",       titleFr: "La Cérémonie de Nom", desc: "A child is born; you join the naming ceremony. (Awaiting educator authoring.)", descFr: "Un enfant naît ; vous assistez à la cérémonie de nom. (En attente d'un éducateur.)" },
  { id: "course-izon-mv-growing-up",   order: 4,  level: "beginner",     active: true,  title: "Growing Up",       titleFr: "Grandir",             desc: "Childhood around you — the river, the market, first proverbs.",                 descFr: "L'enfance autour de vous — la rivière, le marché, les premiers proverbes." },
  { id: "course-izon-mv-threshold",    order: 5,  level: "intermediate", active: false, title: "The Threshold",    titleFr: "Le Seuil",            desc: "A coming-of-age — initiation, the elder's charge. (Awaiting keeper authoring.)", descFr: "Un rite de passage — initiation, la charge de l'ancien. (En attente d'un gardien.)" },
  { id: "course-izon-mv-working-year", order: 6,  level: "intermediate", active: true,  title: "The Working Year", titleFr: "L'Année de Travail",  desc: "Livelihood across the seasons — fishing, farming, the market.",                 descFr: "Les moyens de subsistance à travers les saisons — pêche, agriculture, marché." },
  { id: "course-izon-mv-union",        order: 7,  level: "intermediate", active: true,  title: "The Union",        titleFr: "L'Union",             desc: "Courtship and marriage — two families join.",                                   descFr: "La cour et le mariage — deux familles s'unissent." },
  { id: "course-izon-mv-assembly",     order: 8,  level: "intermediate", active: true,  title: "The Assembly",     titleFr: "L'Assemblée",         desc: "Community life — festivals, governance, the modern world.",                     descFr: "La vie communautaire — fêtes, gouvernance, le monde moderne." },
  { id: "course-izon-mv-elders-voice", order: 9,  level: "advanced",     active: true,  title: "The Elder's Voice", titleFr: "La Voix de l'Ancien", desc: "You can speak now — oratory, proverbs, praise poetry.",                        descFr: "Vous pouvez parler maintenant — oratoire, proverbes, poésie laudative." },
  { id: "course-izon-mv-keeper",       order: 10, level: "advanced",     active: true,  title: "The Keeper",       titleFr: "Le Gardien",          desc: "You pass it on — ancestry, cosmology, libation, tradition.",                   descFr: "Vous le transmettez — ancestralité, cosmologie, libation, tradition." },
];

// ── Explicit lesson re-parenting (population map §3). Bou Mie episode = order 0 anchor. ──
const REPARENT: Record<string, { lessonId: string; order: number }[]> = {
  "course-izon-mv-arrival": [
    { lessonId: "izon-pod-b1", order: 0 },
    { lessonId: "izon-fw-1", order: 1 }, { lessonId: "izon-fw-2", order: 2 }, { lessonId: "izon-fw-3", order: 3 },
    { lessonId: "izon-cm-2", order: 4 }, { lessonId: "izon-cm-3", order: 5 },
  ],
  "course-izon-mv-household": [
    { lessonId: "izon-pod-b2", order: 0 },
    { lessonId: "izon-fw-4", order: 1 }, { lessonId: "izon-fw-5", order: 2 }, { lessonId: "izon-cm-4", order: 3 },
    { lessonId: "izon-cm-6", order: 4 }, { lessonId: "izon-cm-9", order: 5 }, { lessonId: "izon-cm-10", order: 6 },
    { lessonId: "izon-fw-10", order: 7 }, { lessonId: "izon-fw-12", order: 8 }, { lessonId: "izon-cm-5", order: 9 },
    { lessonId: "izon-el-3", order: 10 }, { lessonId: "izon-el-6", order: 11 }, { lessonId: "izon-fw-8", order: 12 },
  ],
  "course-izon-mv-growing-up": [
    { lessonId: "izon-pod-b3", order: 0 },
    { lessonId: "izon-cm-1", order: 1 }, { lessonId: "izon-cm-8", order: 2 }, { lessonId: "izon-fw-9", order: 3 },
  ],
  "course-izon-mv-working-year": [
    { lessonId: "izon-pod-i1", order: 0 },
    { lessonId: "izon-el-5", order: 1 }, { lessonId: "izon-fw-11", order: 2 }, { lessonId: "izon-el-2", order: 3 },
    { lessonId: "izon-el-1", order: 4 }, { lessonId: "izon-el-4", order: 5 },
  ],
  "course-izon-mv-union": [{ lessonId: "izon-pod-i3", order: 0 }],
  "course-izon-mv-assembly": [
    { lessonId: "izon-pod-i2", order: 0 },
    { lessonId: "izon-co-1", order: 50 }, { lessonId: "izon-co-2", order: 51 }, { lessonId: "izon-co-3", order: 52 },
    { lessonId: "izon-co-4", order: 53 }, { lessonId: "izon-co-5", order: 54 },
  ],
  "course-izon-mv-elders-voice": [{ lessonId: "izon-pod-a1", order: 0 }],
  "course-izon-mv-keeper": [{ lessonId: "izon-pod-a2", order: 0 }, { lessonId: "izon-pod-a3", order: 1 }],
  // Grammar reference track absorbs the grammar lessons shelved in First Words.
  "course-izon-cm": [
    { lessonId: "izon-fw-6", order: 200 }, { lessonId: "izon-fw-7", order: 201 },
    { lessonId: "izon-fw-13", order: 202 }, // Who & Whose — possessives
  ],
};

// ── Bou Mie COMPANION lessons (izon-bmc-*) — authored movement-aligned; their
// titles map 1:1 onto Movements. Held ones (bmc-b1/b2 fabricated, a2/a3
// heritage) move too: parking is is_active, not course membership. ──
Object.entries({
  "course-izon-mv-arrival":      [{ lessonId: "izon-bmc-b1", order: 6 }, { lessonId: "izon-bmc-b2", order: 7 }],
  "course-izon-mv-household":    [{ lessonId: "izon-bmc-b3", order: 13 }, { lessonId: "izon-bmc-i3", order: 14 }],
  "course-izon-mv-growing-up":   [{ lessonId: "izon-bmc-b4", order: 30 }],
  "course-izon-mv-working-year": [{ lessonId: "izon-bmc-i1", order: 6 }],
  "course-izon-mv-union":        [{ lessonId: "izon-bmc-i4", order: 1 }],
  "course-izon-mv-assembly":     [{ lessonId: "izon-bmc-i2", order: 55 }],
  "course-izon-mv-elders-voice": [{ lessonId: "izon-bmc-a1", order: 1 }],
  "course-izon-mv-keeper":       [{ lessonId: "izon-bmc-a2", order: 2 }, { lessonId: "izon-bmc-a3", order: 3 }],
}).forEach(([courseId, entries]) => {
  (REPARENT[courseId] ??= []).push(...entries);
});

// ── Whole-course folds: every lesson of `from` appends to `to` after `startOrder`. ──
const COURSE_FOLDS = [
  { from: "course-izon-nt", to: "course-izon-mv-growing-up", startOrder: 10 }, // Counting & Trade → M4
  { from: "course-izon-cl", to: "course-izon-mv-assembly",   startOrder: 10 }, // Colours (kwa-kwa/pena-pena/dirimo ↔ i2's mother-colours) → M8
];

// ── Reference tracks: off the numbered path via order 100+. ──
const REFERENCE_TRACKS = [
  { id: "course-izon-cm", order: 100, courseType: "grammar",      title: "Izọn Ọkọsụọ — Grammar & Structure", titleFr: "Izọn Ọkọsụọ — Grammaire et Structure" },
  { id: "course-izon-ss", order: 101, courseType: "sound_script", title: null, titleFr: null }, // keeps its own title
];

// Legacy courses expected to end up empty → retired (is_active=false, never deleted).
// course-izon-wk is the never-filled Work course from the RETIRED place-remap plan.
const RETIRE_WHEN_EMPTY = [
  "course-izon-fw", "course-izon-el", "course-izon-co", "course-izon-nt", "course-izon-cl",
  "course-izon-bm-fw", "course-izon-bm-el", "course-izon-bm-ot", "course-izon-wk",
];

// Pending-split courses (manual Studio work) park AFTER the 10 Movements so
// unit numbering stays stable: the path reads M1..M10, then these, then refs.
const PENDING_SPLIT_ORDERS = [
  { id: "course-izon-ot", order: 20 }, // Oral Tradition → split M9/M10
  { id: "course-izon-sg", order: 21 }, // Songs → split M4/M9
];

async function main() {
  console.log(APPLY ? "Izon journey migration — APPLYING\n" : "Izon journey migration — DRY RUN (pass --apply to write)\n");

  // Preflight: which mapped lessons actually exist?
  const wanted = [
    ...Object.values(REPARENT).flat().map((r) => r.lessonId),
  ];
  const existing = (await sql`SELECT id, course_id FROM lessons WHERE id = ANY(${wanted})`) as { id: string; course_id: string }[];
  const existingIds = new Set(existing.map((r) => r.id));
  const missing = wanted.filter((id) => !existingIds.has(id));
  console.log(`Mapped lessons found: ${existingIds.size}/${wanted.length}`);
  if (missing.length > 0) {
    console.log(`  MISSING (skipped, journey keeps going): ${missing.join(", ")}`);
  }

  // 1 — Movement courses (upsert; refresh title/desc/level/order, preserve any educator isActive edits on re-run)
  console.log("\n1) Movement courses:");
  for (const m of MOVEMENTS) {
    console.log(`  ${m.id.padEnd(30)} #${String(m.order).padStart(2)} ${m.level.padEnd(12)} ${m.active ? "active" : "INACTIVE (gap)"}  ${m.title}`);
    if (APPLY) {
      await sql`
        INSERT INTO courses (id, language_id, title, title_fr, description, description_fr, level, lessons_count, "order", is_active)
        VALUES (${m.id}, 'izon', ${m.title}, ${m.titleFr}, ${m.desc}, ${m.descFr}, ${m.level}, 0, ${m.order}, ${m.active})
        ON CONFLICT (id) DO UPDATE SET
          title = excluded.title, title_fr = excluded.title_fr,
          description = excluded.description, description_fr = excluded.description_fr,
          level = excluded.level, "order" = excluded."order"
      `;
    }
  }

  // 2 — Explicit re-parents
  console.log("\n2) Lesson re-parents:");
  for (const [courseId, entries] of Object.entries(REPARENT)) {
    for (const { lessonId, order } of entries) {
      if (!existingIds.has(lessonId)) continue;
      const from = existing.find((r) => r.id === lessonId)?.course_id;
      console.log(`  ${lessonId.padEnd(14)} ${String(from).padEnd(22)} -> ${courseId}  order ${order}`);
      if (APPLY) {
        await sql`UPDATE lessons SET course_id = ${courseId}, "order" = ${order} WHERE id = ${lessonId}`;
      }
    }
  }

  // 3 — Whole-course folds (preserve internal order, offset). Lessons already
  // claimed by an explicit re-parent (step 2) are excluded, so the dry-run
  // preview and the applied result agree.
  console.log("\n3) Course folds:");
  const reparented = Object.values(REPARENT).flat().map((r) => r.lessonId);
  for (const fold of COURSE_FOLDS) {
    const rows = (await sql`SELECT id, "order" FROM lessons WHERE course_id = ${fold.from} AND NOT (id = ANY(${reparented})) ORDER BY "order"`) as { id: string; order: number }[];
    console.log(`  ${fold.from} -> ${fold.to}: ${rows.length} lesson(s) at order ${fold.startOrder}+`);
    for (const [i, row] of rows.entries()) {
      console.log(`    ${row.id} -> order ${fold.startOrder + i}`);
      if (APPLY) {
        await sql`UPDATE lessons SET course_id = ${fold.to}, "order" = ${fold.startOrder + i} WHERE id = ${row.id}`;
      }
    }
  }

  // 4 — Reference tracks off the numbered path
  console.log("\n4) Reference tracks (order 100+):");
  for (const ref of REFERENCE_TRACKS) {
    console.log(`  ${ref.id} -> order ${ref.order}, courseType ${ref.courseType}${ref.title ? `, retitled "${ref.title}"` : ""}`);
    if (APPLY) {
      if (ref.title) {
        await sql`UPDATE courses SET "order" = ${ref.order}, course_type = ${ref.courseType}, title = ${ref.title}, title_fr = ${ref.titleFr} WHERE id = ${ref.id}`;
      } else {
        await sql`UPDATE courses SET "order" = ${ref.order}, course_type = ${ref.courseType} WHERE id = ${ref.id}`;
      }
    }
  }

  // 4b — Pending-split courses parked after the Movements
  console.log("\n4b) Pending-split courses (order 20+):");
  for (const p of PENDING_SPLIT_ORDERS) {
    console.log(`  ${p.id} -> order ${p.order}`);
    if (APPLY) await sql`UPDATE courses SET "order" = ${p.order} WHERE id = ${p.id}`;
  }

  // 5 — Retire emptied legacy courses + recompute lessons_count for ALL izon courses
  console.log("\n5) Retire-when-empty + recount:");
  if (APPLY) {
    await sql`
      UPDATE courses SET lessons_count = sub.n
      FROM (SELECT course_id, count(*)::int AS n FROM lessons GROUP BY course_id) sub
      WHERE courses.id = sub.course_id AND courses.language_id = 'izon'
    `;
    await sql`
      UPDATE courses SET lessons_count = 0
      WHERE language_id = 'izon' AND NOT EXISTS (SELECT 1 FROM lessons l WHERE l.course_id = courses.id)
    `;
    const retired = (await sql`
      UPDATE courses SET is_active = false
      WHERE id = ANY(${RETIRE_WHEN_EMPTY})
        AND NOT EXISTS (SELECT 1 FROM lessons l WHERE l.course_id = courses.id)
      RETURNING id
    `) as { id: string }[];
    console.log(`  retired: ${retired.map((r) => r.id).join(", ") || "(none)"}`);
    const notEmpty = (await sql`
      SELECT c.id, count(l.id)::int AS n FROM courses c JOIN lessons l ON l.course_id = c.id
      WHERE c.id = ANY(${RETIRE_WHEN_EMPTY}) GROUP BY c.id
    `) as { id: string; n: number }[];
    for (const r of notEmpty) console.log(`  NOT retired (${r.n} lesson(s) remain — review by hand): ${r.id}`);
  } else {
    console.log(`  would retire any of [${RETIRE_WHEN_EMPTY.join(", ")}] that end up with zero lessons, and recompute lessons_count.`);
  }

  console.log("\nLeft for Studio (manual, by design): izon-sg split (children's -> M4, praise -> M9); izon-ot split (proverbs -> M9, myths -> M10); scene grouping inside each Movement; Movements 3 & 5 authoring.");
  if (!APPLY) console.log("\nNothing written. Re-run with --apply to migrate.");
}

main().catch((err) => {
  console.error("Journey migration failed:", err);
  process.exit(1);
});
