/**
 * Beeli Film — content schema (authoring superset) + app adapter
 * --------------------------------------------------------------
 * A Beeli "film" is a watch/listen cultural piece surfaced in the Discover feed
 * as a `DiscoverItem` of type "film". Like the podcast layer, films are authored
 * as a RICH superset (speaker-labelled target-language script + romanization +
 * pedagogy + production notes) and DOWN-CONVERTED to the exact app
 * `DiscoverItem` shape via `toFilmDiscoverItem()`.
 *
 * Same two laws as the podcast package:
 *   1. No interface language is spoken on-screen — Izon narration/dialogue only;
 *      English/French live in `title`/`synopsis`/`translation`/`culturalNotes`.
 *   2. Never fabricate the language — attested forms are sourced; recombinations
 *      are verify:true; unattested heritage is a [[bracketed placeholder]], and
 *      any film carrying one stays isActive:false.
 *
 * Reuses `CulturalNote` / `ProductionNotes` from podcast-types.ts and the app's
 * real `DiscoverItem` type so conformance is compiler-checked.
 */

import type { LocalizedText } from "../lessons/types";
import type { DiscoverItem } from "@/types";
import type { CulturalNote, ProductionNotes } from "./podcast-types";

export type FilmKind = "documentary" | "narrative_short" | "heritage";

/** One line/beat of a film's script. Same kind-taxonomy idea as PodcastLine. */
export interface FilmLine {
  seq: number;
  kind: "narration" | "dialogue" | "sfx" | "screen" | "chapter" | "note";
  /** Cast id, a documentary-narrator label, or omitted for cues. */
  speaker?: string;
  /** TARGET-LANGUAGE text (narration/dialogue) or the CUE text (sfx/screen/…). */
  text: string;
  roman?: string;
  translation?: LocalizedText;
  literal?: string;
  source?: string;
  verify?: boolean;
  startTime?: number;
  endTime?: number;
}

export interface FilmItem {
  /** Language-prefixed, unique: e.g. "izon-film-emptynet". */
  id: string;
  /** Optional mini-series grouping id shared across related films. */
  seriesId?: string;
  languageId: string;
  kind: FilmKind;

  /** Interface-language card fields (NOT spoken). */
  title: LocalizedText;
  logline: LocalizedText;
  synopsis: LocalizedText;
  /** Long-form description → DiscoverItem.body. */
  body: LocalizedText;
  /** Watch-notes / credits / glossary → DiscoverItem.showNotes. */
  showNotes: LocalizedText;

  author: string;
  runtimeMinutes: number;
  /** ISO-8601. Passed in by the integrator; not stamped here. */
  publishedAt: string;
  featured?: boolean;

  /**
   * Discover grouping. Films that belong together (or to the podcast season)
   * share a storyId so the app can present them as a mini-series.
   */
  storyId?: string;
  coverEmoji: string;
  coverGradient: [string, string];

  /** Cast ids from the series (../izon/cast.ts). */
  cast: string[];
  /** The full script: narration/dialogue + sfx/screen/chapter/note cues. */
  script: FilmLine[];
  culturalNotes: CulturalNote[];
  production: ProductionNotes;

  /** Audio/video assets (null = not yet produced). */
  audioUrl: string | null;
  videoUrl?: string | null;

  isActive: boolean;
  sources: string[];
}

// ─── Adapter: FilmItem -> app DiscoverItem (type "film") ─────────────────────

function spoken(l: FilmLine): boolean {
  return l.kind === "narration" || l.kind === "dialogue";
}

/** The screen-safe transcript beats (target-language only). */
export function toFilmTranscript(film: FilmItem): {
  startTime: number;
  endTime: number;
  text: string;
  translation?: LocalizedText;
}[] {
  return film.script.filter(spoken).map((l) => ({
    startTime: l.startTime ?? 0,
    endTime: l.endTime ?? 0,
    text: l.text,
    translation: l.translation,
  }));
}

/** Human-readable speaker label from a cast id, when no name map is supplied. */
function prettySpeaker(id: string | undefined, names?: Record<string, string>): string {
  if (!id) return "";
  if (names && names[id]) return names[id];
  const tail = id.replace(/^.*cast-/, "");
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

/**
 * Render a film's actual CONTENT — the director's note plus the working
 * script/transcript — as a single readable string for the app's film detail
 * screen (`DiscoverItem.body`). `culture_items` has no structured transcript
 * column, so the readable transcript lives here in `body`. Target-language
 * lines are shown with pronunciation and gloss; heritage placeholders are
 * surfaced honestly rather than as raw brackets.
 *
 * Blocks are separated by blank lines so the screen's paragraph renderer
 * spaces them; each spoken beat keeps its Izon / roman / gloss on their own
 * lines.
 */
export function renderFilmContent(
  film: FilmItem,
  opts: { speakerNames?: Record<string, string>; lang?: "en" | "fr" } = {},
): string {
  const lang = opts.lang ?? "en";
  const intro = film.body[lang] ?? film.body.en ?? "";
  const blocks: string[] = [];

  for (const l of film.script) {
    if (l.kind === "chapter") {
      blocks.push(`— ${l.text.toUpperCase()} —`);
      continue;
    }
    if (!spoken(l)) continue;

    const who = prettySpeaker(l.speaker, opts.speakerNames);
    const prefix = who ? `${who} — ` : "";
    const gloss = l.translation?.[lang] ?? l.translation?.en ?? "";

    if (/\[\[/.test(l.text)) {
      // Heritage / not-yet-attested passage — show the gloss, never the brackets.
      const note = "[Heritage passage — to be recorded with a community keeper]";
      blocks.push(gloss ? `${prefix}${note}\n${gloss}` : `${prefix}${note}`);
      continue;
    }

    const lines = [`${prefix}${l.text}`];
    if (l.roman) lines.push(l.roman);
    if (gloss) lines.push(`“${gloss}”`);
    blocks.push(lines.join("\n"));
  }

  const transcript = blocks.join("\n\n");
  return intro ? `${intro}\n\n———\n\n${transcript}` : transcript;
}

/**
 * Down-convert to the app's `DiscoverItem`. Return type is the real app type,
 * so this fails to compile if the shape ever drifts. `body` carries the full
 * readable content (director's note + working transcript); pass `speakerNames`
 * to render cast ids as display names.
 */
export function toFilmDiscoverItem(
  film: FilmItem,
  publishedAt: string = film.publishedAt,
  speakerNames?: Record<string, string>,
): DiscoverItem {
  return {
    id: film.id,
    type: "film",
    title: film.title.en ?? film.id,
    description: film.synopsis.en ?? "",
    author: film.author,
    publishedAt,
    duration: film.runtimeMinutes * 60,
    coverGradient: film.coverGradient,
    coverEmoji: film.coverEmoji,
    featured: film.featured,
    audioUrl: film.audioUrl ?? undefined,
    videoUrl: film.videoUrl ?? undefined,
    storyId: film.storyId,
    body: renderFilmContent(film, { speakerNames, lang: "en" }),
    showNotes: film.showNotes.en,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface FilmValidationIssue {
  filmId: string;
  severity: "error" | "warn";
  message: string;
}

export function validateFilms(languageId: string, films: FilmItem[]): FilmValidationIssue[] {
  const issues: FilmValidationIssue[] = [];
  const prefix = `${languageId}-`;
  for (const f of films) {
    const add = (severity: "error" | "warn", message: string) =>
      issues.push({ filmId: f.id, severity, message });
    if (!f.id.startsWith(prefix)) add("error", `id must start with "${prefix}"`);
    if (f.languageId !== languageId) add("error", `languageId mismatch`);
    let placeholder = false;
    let unverified = false;
    for (const l of f.script) {
      if (!spoken(l)) continue;
      if (!l.text.trim()) add("error", `beat ${l.seq}: empty spoken text`);
      if (/\[\[.*?\]\]/.test(l.text)) placeholder = true;
      if (l.verify) unverified = true;
      if (!l.translation?.en) add("warn", `beat ${l.seq}: missing en gloss`);
      if (!l.roman && !/\[\[.*?\]\]/.test(l.text)) add("warn", `beat ${l.seq}: missing roman`);
    }
    if ((placeholder || unverified) && f.isActive)
      add("error", `has placeholders/unverified forms but isActive:true — set false until verified`);
  }
  return issues;
}
