import { Directory, File, Paths } from "expo-file-system";
import type { AudioSource } from "@/types";

const AUDIO_DIR_NAME = "lesson-audio";

function audioDir(): Directory {
  return new Directory(Paths.cache, AUDIO_DIR_NAME);
}

function ensureDir(): Directory {
  const dir = audioDir();
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function extFromUrl(url: string): string {
  return url.split("?")[0].split(".").pop() || "m4a";
}

function cachedFile(lessonId: string, remoteUrl: string): File {
  return new File(audioDir(), `${lessonId}.${extFromUrl(remoteUrl)}`);
}

export function isAudioCached(lessonId: string, remoteUrl: string): boolean {
  try {
    return cachedFile(lessonId, remoteUrl).exists;
  } catch {
    return false;
  }
}

/**
 * Resolves a lesson's audio to a playable source, preferring a cached local
 * file. Downloads on first play; on failure (offline, network error) falls
 * back to the remote URL so the audio store's existing offline error handling
 * still applies.
 */
export async function getCachedAudioSource(
  lessonId: string,
  source: AudioSource | undefined
): Promise<AudioSource | undefined> {
  if (source == null) return undefined;
  if (typeof source === "number") return source; // bundled require() id

  const dest = cachedFile(lessonId, source);
  if (dest.exists) return dest.uri;

  try {
    ensureDir();
    const downloaded = await File.downloadFileAsync(source, dest, { idempotent: true });
    return downloaded.uri;
  } catch {
    return source;
  }
}

export function audioCacheSize(): number {
  try {
    return audioDir().size ?? 0;
  } catch {
    return 0;
  }
}

export function clearAudioCache(): void {
  try {
    const dir = audioDir();
    if (dir.exists) dir.delete();
  } catch {
    // Best effort.
  }
}
