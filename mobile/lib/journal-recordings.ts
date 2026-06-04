import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@beeli/journal-recordings";

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

export async function getRecording(entryId: string): Promise<string | null> {
  const map = await load();
  return map[entryId] ?? null;
}

export async function setRecording(entryId: string, uri: string): Promise<void> {
  const map = await load();
  map[entryId] = uri;
  await save(map);
}

export async function deleteRecording(entryId: string): Promise<void> {
  const map = await load();
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
