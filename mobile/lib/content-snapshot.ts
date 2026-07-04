/**
 * Fetches the DB-backed offline content snapshot (dictionary, sentences,
 * proverbs, cultural content, scripts, interactive stories) and persists it to
 * AsyncStorage, mirroring the pattern in `lib/catalog-cache.ts`. This replaces
 * the hand-authored `lib/data/*` bundle as the offline/guest fallback: the
 * server is the only source of truth, so guests and signed-in users can no
 * longer drift apart.
 *
 * Read access for render code goes through `store/content-store.ts`, which
 * hydrates from here into memory so call sites can read synchronously (the
 * bundle getters they're replacing were synchronous too).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, isNetworkError } from "@/lib/api";
import type { DictionaryEntry } from "@/lib/dictionary";
import type { Course, InteractiveStory, Lesson, Proverb, SentenceTemplate } from "@/types";

const VERSION = "v1";
const PREFIX = `content-snapshot:${VERSION}:`;
const snapshotKey = (languageId: string) => `${PREFIX}${languageId}`;

export interface ScriptCharacterRow {
  id: string;
  scriptId: string;
  character: string;
  answer: string;
  hint: string | null;
  category: string | null;
  displayOrder: number;
  name: string | null;
  meaning: string | null;
  codePoint: number | null;
  baseConsonant: string | null;
  vowelOrder: number | null;
  akanName: string | null;
  proverb: string | null;
  svgPath: string | null;
  svgViewBox: string | null;
}

export interface ScriptRow {
  id: string;
  languageId: string;
  name: string;
  description: string | null;
  iconCharacter: string | null;
  accentColor: string | null;
}

// The server's `toApiInteractiveStory` reconstructs exactly the app's
// InteractiveStory shape (coverGradient tuple, typed scene graph).
export type InteractiveStoryRow = InteractiveStory;

export interface CulturalContentRow {
  id: string;
  languageId: string;
  category: string;
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  imageEmoji: string;
  featured: boolean;
  keyTerms: { word: string; english: string }[];
  [key: string]: unknown;
}

export interface TranscriptSegmentRow {
  id: string;
  lessonId: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string | null;
  translationFr: string | null;
  order: number;
  speaker: string | null;
  roman: string | null;
}

export interface ContentSnapshot {
  version: string;
  languageId: string;
  dictionary: DictionaryEntry[];
  sentences: SentenceTemplate[];
  proverbs: Proverb[];
  cultural: CulturalContentRow[];
  scripts: { scripts: ScriptRow[]; characters: ScriptCharacterRow[] };
  interactiveStories: InteractiveStoryRow[];
  courses: Course[];
  lessons: { lessons: Lesson[]; segments: TranscriptSegmentRow[] };
}

export async function readCachedSnapshot(languageId: string): Promise<ContentSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(snapshotKey(languageId));
    return raw ? (JSON.parse(raw) as ContentSnapshot) : null;
  } catch {
    return null;
  }
}

function writeCachedSnapshot(languageId: string, snapshot: ContentSnapshot): void {
  AsyncStorage.setItem(snapshotKey(languageId), JSON.stringify(snapshot)).catch(() => {});
}

/**
 * Fetches the latest published snapshot for a language and persists it. Falls
 * back to the last cached snapshot on any network error, and to `null` if
 * neither is available (first-ever launch, offline).
 */
export async function fetchAndCacheSnapshot(languageId: string): Promise<ContentSnapshot | null> {
  try {
    const snapshot = await apiFetch<ContentSnapshot>(
      `/content/snapshot?lang=${encodeURIComponent(languageId)}`
    );
    writeCachedSnapshot(languageId, snapshot);
    return snapshot;
  } catch (err) {
    if (isNetworkError(err)) return readCachedSnapshot(languageId);
    throw err;
  }
}

/**
 * Nsibidi/Ge'ez/Adinkra are standalone exploration screens, not scoped to the
 * learner's selected/enrolled language — pulling a full per-language snapshot
 * (dictionary included) just to offline-cache one script's character set would
 * be wasteful. These get their own small dedicated cache instead.
 */
const scriptCharsKey = (scriptId: string) => `${PREFIX}script-chars:${scriptId}`;

export async function readCachedScriptCharacters(
  scriptId: string
): Promise<ScriptCharacterRow[] | null> {
  try {
    const raw = await AsyncStorage.getItem(scriptCharsKey(scriptId));
    return raw ? (JSON.parse(raw) as ScriptCharacterRow[]) : null;
  } catch {
    return null;
  }
}

export async function fetchAndCacheScriptCharacters(
  scriptId: string
): Promise<ScriptCharacterRow[] | null> {
  try {
    const rows = await apiFetch<ScriptCharacterRow[]>(`/scripts/${scriptId}/characters`);
    AsyncStorage.setItem(scriptCharsKey(scriptId), JSON.stringify(rows)).catch(() => {});
    return rows;
  } catch (err) {
    if (isNetworkError(err)) return readCachedScriptCharacters(scriptId);
    throw err;
  }
}
