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

/**
 * Down-convert to the app's `DiscoverItem`. Return type is the real app type,
 * so this fails to compile if the shape ever drifts.
 */
export function toFilmDiscoverItem(
  film: FilmItem,
  publishedAt: string = film.publishedAt,
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
    body: film.body.en,
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
