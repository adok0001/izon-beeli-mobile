import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

const STORAGE_KEY = "@beeli/journal-recordings";
const AUDIO_DIR_NAME = "journal-audio";

// We persist only the *filename* of each recording, never an absolute path.
// expo-av records into the volatile cache dir (Library/Caches/AV/…) and the
// absolute URI embeds the app container UUID — both change across launches /
// reinstalls, which is what caused the "asset doesn't exist" / AVPlayerItem
// -11800 errors. Reconstructing the path from Paths.document at read time keeps
// recordings playable across sessions.

function audioDir(): Directory {
  return new Directory(Paths.document, AUDIO_DIR_NAME);
}

function ensureDir(): Directory {
  const dir = audioDir();
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

async function load(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function save(map: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

// Resolve a stored filename to an existing absolute URI, or null if the file is
// gone. Older builds stored absolute URIs; those no longer resolve and are
// treated as missing so the UI falls back cleanly.
function resolveUri(filename: string): string | null {
  try {
    const file = new File(audioDir(), filename);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

export async function getRecording(entryId: string): Promise<string | null> {
  const map = await load();
  const stored = map[entryId];
  if (!stored) return null;

  const uri = resolveUri(stored);
  if (!uri) {
    // Stale mapping (file purged / legacy absolute path) — clean it up.
    delete map[entryId];
    await save(map);
    return null;
  }
  return uri;
}

export async function setRecording(entryId: string, sourceUri: string): Promise<void> {
  ensureDir();

  // Remove any previous recording for this entry before copying the new one.
  await deleteRecording(entryId);

  const ext = sourceUri.split("?")[0].split(".").pop() || "m4a";
  const safeId = entryId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeId}-${Date.now()}.${ext}`;

  try {
    const source = new File(sourceUri);
    const dest = new File(audioDir(), filename);
    source.copy(dest);
  } catch {
    // If the source file is gone we simply don't persist a recording.
    return;
  }

  const map = await load();
  map[entryId] = filename;
  await save(map);
}

export async function deleteRecording(entryId: string): Promise<void> {
  const map = await load();
  const stored = map[entryId];
  if (!stored) return;

  try {
    const file = new File(audioDir(), stored);
    if (file.exists) file.delete();
  } catch {
    // Best effort — drop the mapping regardless.
  }

  delete map[entryId];
  await save(map);
}

export async function migrateRecording(tempId: string, newId: string): Promise<void> {
  const map = await load();
  if (map[tempId]) {
    map[newId] = map[tempId];
    delete map[tempId];
    await save(map);
  }
}
