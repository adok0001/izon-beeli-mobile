import type { AudioSource } from "@/types";

// Re-export languages + helper from single source of truth
export { getLanguageName, LANGUAGES, ACTIVE_LANGUAGES } from "@/lib/data/languages";

// Local Izon audio recordings (bundled in app — used as fallback until CDN upload)
const AUDIO_IZON_BAI = require("../public/izon_bai.m4a");
const AUDIO_IZON_BO = require("../public/izon_bo.m4a");
const AUDIO_IZON_DOO = require("../public/izon_doo.m4a");
const AUDIO_IZON_MU = require("../public/izon_mu.m4a");
const AUDIO_IZON_NUA = require("../public/izon_nua.m4a");

// Sound effects
export const SFX_CORRECT = require("../public/correct.mp3");
export const SFX_INCORRECT = require("../public/incorrect.mp3");
export const SFX_FINISH = require("../public/finish.wav");

// Bundled audio fallback: used when lesson.audioUrl is null (not yet on CDN)
// Once Izon audio is uploaded to Vercel Blob, populate audioUrl in DB and this map is no longer used.
export const BUNDLED_AUDIO: Record<string, AudioSource> = {
  "lesson-1": AUDIO_IZON_BAI,
  "lesson-2": AUDIO_IZON_NUA,
  "lesson-3": AUDIO_IZON_DOO,
  "lesson-4": AUDIO_IZON_MU,
  "lesson-5": AUDIO_IZON_BO,
  "lesson-6": AUDIO_IZON_NUA,
  "lesson-7": AUDIO_IZON_DOO,
  "lesson-8": AUDIO_IZON_MU,
};

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
