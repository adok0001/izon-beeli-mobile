"use client";

import type { SoundboardChannel, PlacementZone, WordToken } from "@/components/learn/mini-apps";

// ── Activity types ────────────────────────────────────────────────────────────

export type ActivityType = "soundboard" | "placement";

export interface SoundboardActivity {
  id: string; type: "soundboard"; languageId: string;
  sentence: string; targetWord: string; targetWordNative: string;
  audioUrl?: string;
  channels: SoundboardChannel[];
}

export interface PlacementActivity {
  id: string; type: "placement"; languageId: string;
  imageUrl: string; imageAlt: string;
  zones: PlacementZone[]; tokens: WordToken[];
}

export type Activity = SoundboardActivity | PlacementActivity;

// ── Draft types ───────────────────────────────────────────────────────────────

export interface ZoneDraft {
  id: string; label: string; labelTranslation: string;
  x: number; y: number; width: number; height: number;
}

export interface TokenDraft { id: string; word: string; translation: string; audioUrl: string; }

export interface ChannelDraft {
  id: string; label: string; targetLevel: number; initialLevel: number; isVoice: boolean;
}

// ── Audio helpers (mirrors educator lesson page) ──────────────────────────────

export const AUDIO_FILE_ACCEPT = "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.webm,.mp4,.mpeg";

export function isAudioFile(file: File): boolean {
  if (file.type.toLowerCase().startsWith("audio/")) return true;
  return /\.(mp3|wav|m4a|aac|ogg|oga|webm|mp4|mpeg)$/i.test(file.name);
}

export function extensionFromMimeType(mimeType: string): string {
  const n = mimeType.toLowerCase();
  if (n.includes("wav")) return "wav";
  if (n.includes("mpeg") || n.includes("mp3")) return "mp3";
  if (n.includes("mp4") || n.includes("m4a")) return "m4a";
  if (n.includes("ogg")) return "ogg";
  return "webm";
}

// ── Shared form helpers ───────────────────────────────────────────────────────

export const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

export const labelCls = "text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}
