import type { AudioSource } from "@/types";

// Re-export the language name lookup from its single source of truth. `LANGUAGES`/
// `ACTIVE_LANGUAGES` moved to `@/store/languages-store`'s `useLanguages()`/
// `useActiveLanguages()` — render code needs them reactively now that they're
// server-backed, not a static bundle.
export { getLanguageName } from "@/store/languages-store";

// Sound effects
export const SFX_CORRECT = require("../public/correct.mp3");
export const SFX_INCORRECT = require("../public/incorrect.mp3");
export const SFX_FINISH = require("../public/finish.wav");

// Bundled audio fallback: all lessons now use audioUrl from CDN; this map is empty.
export const BUNDLED_AUDIO: Record<string, AudioSource> = {};

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
