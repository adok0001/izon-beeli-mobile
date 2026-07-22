/**
 * Fetches the DB-backed language catalog and persists it to AsyncStorage,
 * mirroring `lib/content-snapshot.ts`. Replaces the hand-authored
 * `lib/data/languages.ts` bundle as the offline/guest fallback.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, isNetworkError } from "@/lib/api";
import type { Language } from "@/types";

const CACHE_KEY = "languages-snapshot:v1";

export async function readCachedLanguages(): Promise<Language[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Language[]) : null;
  } catch {
    return null;
  }
}

function writeCachedLanguages(languages: Language[]): void {
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(languages)).catch(() => {});
}

/**
 * Fetches the latest language catalog and persists it. Falls back to the last
 * cached list on any network error, and to `null` if neither is available
 * (first-ever launch, offline).
 */
export async function fetchAndCacheLanguages(): Promise<Language[] | null> {
  try {
    const languages = await apiFetch<Language[]>("/languages");
    writeCachedLanguages(languages);
    return languages;
  } catch (err) {
    if (isNetworkError(err)) return readCachedLanguages();
    throw err;
  }
}
