import AsyncStorage from "@/lib/storage";
import { Directory, File, Paths } from "expo-file-system";
import type { AudioSource, LocalizedText } from "@/types";

// Durable, user-controlled lesson-audio downloads. Replaces the old
// lib/audio-cache.ts, which silently cached audio on first play into the
// OS-purgeable Paths.cache dir with no manifest and no per-item delete.
// This module stores files under Paths.document (survives OS cache
// eviction) and keeps an AsyncStorage manifest so a downloads screen can
// list/delete individual items and show total storage used.
//
// Deviates from lib/journal-recordings.ts (the template this is modeled on)
// by using the @/lib/storage safe wrapper instead of the raw AsyncStorage
// package, for the extra Expo-Go/web/Jest in-memory fallback.

const DOWNLOADS_DIR_NAME = "lesson-downloads";
const MANIFEST_KEY = "@beeli/lesson-downloads";
const LEGACY_CACHE_DIR_NAME = "lesson-audio";

export interface DownloadRecord {
  lessonId: string;
  courseId: string;
  title: string | LocalizedText;
  courseTitle?: string | LocalizedText;
  filename: string;
  sizeBytes: number;
  downloadedAt: string;
}

function downloadsDir(): Directory {
  return new Directory(Paths.document, DOWNLOADS_DIR_NAME);
}

function ensureDir(): Directory {
  const dir = downloadsDir();
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function extFromUrl(url: string): string {
  return url.split("?")[0].split(".").pop() || "m4a";
}

function fileForRecord(record: DownloadRecord): File {
  return new File(downloadsDir(), record.filename);
}

async function loadManifestRaw(): Promise<Record<string, DownloadRecord>> {
  try {
    const raw = await AsyncStorage.getItem(MANIFEST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveManifestRaw(map: Record<string, DownloadRecord>): Promise<void> {
  await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(map));
}

// Serializes every manifest read-modify-write behind an in-process promise
// chain. The store already prevents two downloads racing for the *same*
// lesson (downloadingIds guard) and downloads a course sequentially, but a
// download for one lesson can still overlap a delete/clear-all touching a
// different manifest entry (e.g. a background course download while the
// user removes an unrelated download from the Downloads screen). Without
// this lock, whichever write lands last silently clobbers the other's
// manifest entry, leaving an orphaned file the UI can never see or delete.
let manifestLock: Promise<unknown> = Promise.resolve();
function withManifest<T>(
  fn: (map: Record<string, DownloadRecord>) => Promise<[T, Record<string, DownloadRecord>]>
): Promise<T> {
  const run = manifestLock.then(async () => {
    const map = await loadManifestRaw();
    const [result, nextMap] = await fn(map);
    await saveManifestRaw(nextMap);
    return result;
  });
  manifestLock = run.catch(() => {});
  return run;
}

/** A lesson's audio is downloadable only when it's a remote URL — bundled require() ids are already local. */
export function isRemoteAudioSource(source: AudioSource | undefined): source is string {
  return typeof source === "string";
}

export async function listDownloads(): Promise<DownloadRecord[]> {
  const map = await loadManifestRaw();
  return Object.values(map).sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
}

export function totalBytes(records: DownloadRecord[]): number {
  return records.reduce((sum, r) => sum + r.sizeBytes, 0);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function downloadLesson(input: {
  lessonId: string;
  courseId: string;
  title: string | LocalizedText;
  courseTitle?: string | LocalizedText;
  remoteUrl: string;
}): Promise<DownloadRecord> {
  return withManifest(async (map) => {
    const prior = map[input.lessonId];
    if (prior) {
      try {
        const f = fileForRecord(prior);
        if (f.exists) f.delete();
      } catch {
        // Best effort.
      }
    }

    ensureDir();
    const filename = `${input.lessonId}.${extFromUrl(input.remoteUrl)}`;
    const dest = new File(downloadsDir(), filename);
    const downloaded = await File.downloadFileAsync(input.remoteUrl, dest, { idempotent: true });

    const record: DownloadRecord = {
      lessonId: input.lessonId,
      courseId: input.courseId,
      title: input.title,
      courseTitle: input.courseTitle,
      filename,
      sizeBytes: downloaded.size ?? 0,
      downloadedAt: new Date().toISOString(),
    };
    return [record, { ...map, [input.lessonId]: record }];
  });
}

export async function deleteDownload(lessonId: string): Promise<void> {
  return withManifest(async (map) => {
    const record = map[lessonId];
    if (record) {
      try {
        const f = fileForRecord(record);
        if (f.exists) f.delete();
      } catch {
        // Best effort.
      }
    }
    const next = { ...map };
    delete next[lessonId];
    return [undefined, next];
  });
}

export async function clearAllDownloads(): Promise<void> {
  return withManifest(async () => {
    try {
      const dir = downloadsDir();
      if (dir.exists) dir.delete();
    } catch {
      // Best effort.
    }
    return [undefined, {}];
  });
}

/**
 * Best-effort, fire-and-forget removal of the old volatile Paths.cache dir
 * the previous lazy cache (lib/audio-cache.ts) used. Nothing references it
 * once that module is deleted — this just reclaims OS-cache space. Safe to
 * call on every app start; called from the downloads store's hydrate().
 */
export function cleanupLegacyCache(): void {
  try {
    const dir = new Directory(Paths.cache, LEGACY_CACHE_DIR_NAME);
    if (dir.exists) dir.delete();
  } catch {
    // Best effort.
  }
}

/**
 * Read-only lookup against the durable download manifest — resolves a
 * lesson's audio to its local file only if the user explicitly downloaded
 * it, otherwise returns the original remote source unchanged so playback
 * streams over the network exactly as if no download existed. Deliberately
 * named apart from the old lib/audio-cache.ts's getCachedAudioSource, which
 * this replaces: that function opportunistically downloaded on first play,
 * a materially different contract this one does not preserve.
 */
export async function resolveDownloadedAudioSource(
  lessonId: string,
  source: AudioSource | undefined
): Promise<AudioSource | undefined> {
  if (source == null) return undefined;
  if (typeof source === "number") return source; // bundled require() id

  try {
    const map = await loadManifestRaw();
    const record = map[lessonId];
    if (!record) return source;

    const file = fileForRecord(record);
    if (!file.exists) {
      // Stale manifest entry (file purged externally) — self-heal.
      await withManifest(async (m) => {
        const n = { ...m };
        delete n[lessonId];
        return [undefined, n];
      });
      return source;
    }
    return file.uri;
  } catch {
    return source;
  }
}
