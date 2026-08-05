import { toCsv } from "./edit-import";
import { parseCsv } from "./unified-import";

/**
 * Lesson bulk-import contract. Web re-exports this module (`@mobile/lib/lesson-import`);
 * there is no second copy to keep in sync.
 *
 * One lesson is a metadata block (key,value rows), a `---` separator, the
 * transcript grid, and an optional second `---` plus a checks grid.
 *
 * A file may hold **several lessons**, separated by a `===` line. That is what
 * makes the round trip work: export a whole Movement, fix it in one spreadsheet,
 * upload that same one file. A file with no `===` parses as exactly one lesson,
 * so every sheet written before this still imports unchanged.
 *
 * The separator also closes a silent failure. Before it existed, a second lesson
 * appended to a file was not an error — `parseLessonFile` treats everything after
 * the second `---` as the checks grid, so the extra lesson's metadata was read as
 * malformed check rows and dropped without a word.
 */

/** Divides one lesson from the next within a single file. */
export const LESSON_SEPARATOR = "===";

/** Lesson metadata fields read from the block above the `---`. */
export const LESSON_META_GUIDE: { key: string; uses: string }[] = [
  { key: "title", uses: "the lesson's title (required)" },
  { key: "description", uses: "a short description of the lesson (required)" },
  { key: "type", uses: "lesson, song, or game (optional, defaults to lesson)" },
  { key: "gameKey", uses: "which playground mini-game a game gate runs, e.g. matching-game (game rows only)" },
  { key: "style", uses: "skit, immersive_story, or host_narrated (optional)" },
  { key: "artist", uses: "performer/host credit (optional)" },
  { key: "genre", uses: "optional" },
  { key: "duration", uses: "length in seconds (optional)" },
  { key: "order", uses: "position within the course (optional)" },
  { key: "canDo", uses: "the real-world skill the learner gains (optional)" },
  { key: "narrativeIntro", uses: "text shown before the lesson starts (optional)" },
  { key: "narrativeOutro", uses: "text shown after it ends (optional)" },
];

/** Metadata keys an export writes, in order. */
export const LESSON_META_COLUMNS = [
  "title", "description", "type", "gameKey", "style", "artist",
  "genre", "duration", "order", "canDo", "narrativeIntro", "narrativeOutro",
] as const;

/** Transcript-grid columns, below the `---`. */
export const LESSON_LINE_GUIDE: { column: string; uses: string }[] = [
  { column: "text", uses: "one transcript line, in the target language (required)" },
  { column: "translation", uses: "its English translation (optional)" },
  { column: "speaker", uses: "who says the line (optional)" },
  { column: "roman", uses: "pronunciation guidance for the learner (optional)" },
];

export const LESSON_LINE_COLUMNS = ["text", "translation", "speaker", "roman"] as const;

/** In-lesson check columns, in an optional third section after a second `---`. */
export const LESSON_CHECK_COLUMNS = [
  "type", "prompt", "answer", "options", "explanation", "afterSegmentIndex",
] as const;

export const LESSON_CHECK_GUIDE: { column: string; uses: string }[] = [
  { column: "type", uses: "predict-next, meaning, who-said, cloze or pick-reply" },
  { column: "prompt", uses: "the question the learner sees" },
  { column: "answer", uses: "the correct answer; must also appear in options when options are given" },
  { column: "options", uses: "choices separated by | (pipe). Leave empty for a tap-to-reveal check" },
  { column: "explanation", uses: "optional note shown after answering" },
  { column: "afterSegmentIndex", uses: "0-based transcript line the check follows. Empty = end of lesson" },
];

/** Starter template — one lesson: metadata block, `---`, then two transcript lines. */
export const LESSON_TEMPLATE_CSV = [
  "title,A Visit to Grandmother's House",
  "description,Greetings and family words through a conversation",
  "style,skit",
  "artist,",
  "genre,",
  "---",
  LESSON_LINE_COLUMNS.join(","),
  "Nene! Baidẹ!,Grandmother! Good morning!,Child,",
  "Tau! Bo dẹkị.,Grandchild! Come in.,Nene,",
  "---",
  LESSON_CHECK_COLUMNS.join(","),
  "meaning,What does Baidẹ mean?,Good morning,Good morning|Good night|Goodbye,,0",
  "",
].join("\n");

export interface ParsedLessonFile {
  meta: Record<string, string>;
  segments: Record<string, string>[];
  /**
   * Absent when the file has no checks section at all — which the server reads
   * as "leave this lesson's existing checks alone". A present-but-empty section
   * means "remove them", so the two cases must stay distinguishable.
   */
  checks?: Record<string, string>[];
}

/**
 * Parse one lesson file into `{ meta, segments, checks? }`. Sections are divided
 * by `---` lines: metadata, then the transcript grid, then an optional checks
 * grid. The metadata block is `key,value` per row — split at the FIRST comma so
 * values may contain commas without quoting. The grids are ordinary CSV. A
 * missing first `---` yields empty segments, which the server flags.
 */
export function parseLessonFile(text: string): ParsedLessonFile {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const isSep = (l: string) => l.split(",")[0].trim() === "---";
  const sep = lines.findIndex(isSep);
  const second = sep >= 0 ? lines.findIndex((l, i) => i > sep && isSep(l)) : -1;
  const metaLines = sep >= 0 ? lines.slice(0, sep) : lines;
  const gridLines = sep >= 0 ? lines.slice(sep + 1, second >= 0 ? second : undefined) : [];
  const checkLines = second >= 0 ? lines.slice(second + 1) : [];

  const meta: Record<string, string> = {};
  for (const line of metaLines) {
    if (!line.trim()) continue;
    const i = line.indexOf(",");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).replace(/""/g, '"');
    if (key) meta[key] = value;
  }

  const segments = parseCsv(gridLines.join("\n")).filter((r) => (r.text ?? "").trim() !== "");
  if (second < 0) return { meta, segments };
  const checks = parseCsv(checkLines.join("\n")).filter((r) => (r.prompt ?? "").trim() !== "");
  return { meta, segments, checks };
}

/**
 * Parse an uploaded file into every lesson it holds.
 *
 * This is what callers should use: one uploaded file may now carry a whole
 * Movement. Splitting happens *before* `parseLessonFile`, so each chunk sees
 * exactly the single-lesson format it has always parsed — the section logic is
 * untouched. A file with no `===` yields one lesson, identical to before.
 *
 * Blank chunks (a trailing separator, a stray blank line between lessons) are
 * dropped rather than reported: they are formatting, not content. A chunk with
 * real text but no title still comes through, so the server names it in the
 * error list instead of the file disappearing silently.
 */
export function parseLessonFiles(text: string): ParsedLessonFile[] {
  const isSeparator = (line: string) => line.split(",")[0].trim() === LESSON_SEPARATOR;
  const chunks: string[][] = [[]];
  for (const line of text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
    if (isSeparator(line)) chunks.push([]);
    else chunks[chunks.length - 1].push(line);
  }
  return chunks
    .filter((lines) => lines.some((l) => l.trim() !== ""))
    .map((lines) => parseLessonFile(lines.join("\n")));
}

// ─── serialize ────────────────────────────────────────────────────────────────

/**
 * One `key,value` metadata row. `parseLessonFile` splits at the FIRST comma, so
 * a value may hold commas unquoted; it strips a surrounding quote pair, so a
 * value that already starts with one has to be quoted to survive. Newlines are
 * collapsed to spaces because the metadata block is parsed line by line — a
 * value containing one could not be read back at all.
 */
function metaRow(key: string, value: string): string {
  const flat = value.replace(/[\r\n]+/g, " ").trim();
  const needsQuotes = flat.startsWith('"');
  return `${key},${needsQuotes ? `"${flat.replace(/"/g, '""')}"` : flat}`;
}

/** A lesson in the shape `GET /import/lesson-export` returns. */
export interface ExportedLesson {
  id: string;
  meta: Record<string, string>;
  segments: Record<string, string>[];
  checks: Record<string, string>[];
}

/** What `GET /import/lesson-export` hands back — plain cells, serialized client-side. */
export interface LessonExport {
  lessons: ExportedLesson[];
  lessonCount: number;
  totalCount: number;
  /** True when the course held more lessons than the role may upload back. */
  truncated: boolean;
  cap: number;
}

/**
 * Serialize one lesson into the file format.
 *
 * The checks section is omitted when the lesson has none — deliberately. An
 * empty section means "delete this lesson's checks", so writing one would let a
 * stale export wipe checks somebody added in Studio after it was downloaded.
 * Omitting the section means "leave them alone", which is the safe reading of a
 * lesson that had none when it was exported.
 */
export function buildLessonFile(lesson: ExportedLesson): string {
  const lines = LESSON_META_COLUMNS
    .filter((key) => (lesson.meta[key] ?? "").trim() !== "")
    .map((key) => metaRow(key, lesson.meta[key]));

  lines.push("---", toCsv(lesson.segments, LESSON_LINE_COLUMNS).trimEnd());
  if (lesson.checks.length > 0) {
    lines.push("---", toCsv(lesson.checks, LESSON_CHECK_COLUMNS).trimEnd());
  }
  return lines.join("\n");
}

/** Serialize several lessons into one uploadable file, `===` between them. */
export function buildLessonsFile(lessons: readonly ExportedLesson[]): string {
  return `${lessons.map(buildLessonFile).join(`\n${LESSON_SEPARATOR}\n`)}\n`;
}

/** `beeli-mv_arrival-lessons.csv` — the course, so downloads don't collide. */
export function lessonExportFilename(courseId: string): string {
  return `beeli-${courseId}-lessons.csv`;
}
