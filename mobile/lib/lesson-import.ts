import { parseCsv } from "./unified-import";

/**
 * Lesson bulk-import contract — the mobile mirror of `web/lib/lesson-import.ts`.
 * One file is one full lesson: a metadata block (key,value rows), a `---`
 * separator, then the transcript grid. The educator can pick several files; each
 * parses to one `{ meta, segments }` lesson, imported into the picked course.
 * Keep in sync with the web copy.
 */

/** Lesson metadata fields read from the block above the `---`. */
export const LESSON_META_GUIDE: { key: string; uses: string }[] = [
  { key: "title", uses: "the lesson's title (required)" },
  { key: "description", uses: "a short description of the lesson (required)" },
  { key: "style", uses: "skit, immersive_story, or host_narrated (optional)" },
  { key: "artist", uses: "performer/host credit (optional)" },
  { key: "genre", uses: "optional" },
  { key: "duration", uses: "length in seconds (optional)" },
  { key: "canDo", uses: "the real-world skill the learner gains (optional)" },
];

/** Transcript-grid columns, below the `---`. */
export const LESSON_LINE_GUIDE: { column: string; uses: string }[] = [
  { column: "text", uses: "one transcript line, in the target language (required)" },
  { column: "translation", uses: "its English translation (optional)" },
  { column: "speaker", uses: "who says the line (optional)" },
  { column: "roman", uses: "pronunciation guidance for the learner (optional)" },
];

export const LESSON_LINE_COLUMNS = ["text", "translation", "speaker", "roman"] as const;

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
  "",
].join("\n");

export interface ParsedLessonFile {
  meta: Record<string, string>;
  segments: Record<string, string>[];
}

/**
 * Parse one lesson file into `{ meta, segments }`. The metadata block (before the
 * `---` line) is `key,value` per row — split at the FIRST comma so values may
 * contain commas without quoting. The transcript grid (after `---`) is ordinary
 * CSV. A missing `---` yields empty segments, which the server flags.
 */
export function parseLessonFile(text: string): ParsedLessonFile {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const sep = lines.findIndex((l) => l.split(",")[0].trim() === "---");
  const metaLines = sep >= 0 ? lines.slice(0, sep) : lines;
  const gridLines = sep >= 0 ? lines.slice(sep + 1) : [];

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
  return { meta, segments };
}
