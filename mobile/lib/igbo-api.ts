import { apiFetch } from "./api";

/**
 * Igbo dictionary lookups go through our own server (`/igbo/*`), which proxies
 * igboapi.com. The upstream token lives in the server env as IGBO_API_TOKEN —
 * it must never come back here, since EXPO_PUBLIC_* values are inlined into the
 * app binary at build time.
 *
 * The proxy accepts guests, so no auth token is passed. `apiFetch` already
 * throws the same `ApiError` this module used to throw itself.
 */
async function igboFetch<T>(path: string): Promise<T> {
  return apiFetch<T>(`/igbo${path}`);
}

// --- Types ---

export interface IgboApiExample {
  igbo?: string;
  english?: string;
  nsibidi?: string;
  pronunciations?: { audio?: string; speaker?: string }[] | null;
}

/**
 * A word from igboapi.com, as the API actually returns it.
 *
 * Every field is optional and defensively typed on purpose — this shape is not
 * under our control, and an unexpected payload must degrade to a thinner entry
 * rather than throw inside a React Query `queryFn` (which would blank the whole
 * result list). An earlier version of this type modelled `definitions` as an
 * array of objects with nested `definitions`/`wordClass`/`nsibidi`; the API
 * returns a flat array of strings with `wordClass` and `nsibidi` at the top
 * level, so the adapter threw on every single lookup.
 */
export interface IgboApiWord {
  id: string;
  word: string;
  /** Flat gloss list, e.g. ["to eat to fill; satisfied with meal"]. */
  definitions?: string[] | null;
  wordClass?: string;
  nsibidi?: string;
  /** An audio URL on this API, not a phonetic transcription. */
  pronunciation?: string;
  examples?: IgboApiExample[] | null;
  attributes?: Record<string, boolean>;
}

// --- Endpoints ---

export async function searchIgboWords(keyword: string): Promise<IgboApiWord[]> {
  return igboFetch<IgboApiWord[]>(`/words?keyword=${encodeURIComponent(keyword)}&limit=20`);
}

export async function getIgboWord(id: string): Promise<IgboApiWord> {
  return igboFetch<IgboApiWord>(`/words/${encodeURIComponent(id)}`);
}

export async function getIgboExamples(wordId: string): Promise<IgboApiExample[]> {
  return igboFetch<IgboApiExample[]>(
    `/examples?associatedWordId=${encodeURIComponent(wordId)}`,
  );
}

// --- Adapter ---
// Maps an IgboApiWord to the shape expected by DictionaryEntry.
// Import and use this wherever you build Igbo dictionary entries from API data.

export interface IgboApiDictionaryShape {
  id: string;
  word: string;
  english: string;
  nsibidi: string;
  pronunciation: string | undefined;
  example: string | undefined;
  exampleTranslation: string | undefined;
  audioUrl: string | undefined;
  wordClass: string | undefined;
}

export function adaptIgboWord(w: IgboApiWord): IgboApiDictionaryShape {
  const example = w.examples?.[0] ?? undefined;

  // `pronunciation` carries an audio URL rather than a transcription, so route it
  // to audioUrl and leave the phonetic field empty instead of rendering a link.
  const pronunciationIsAudio = !!w.pronunciation?.startsWith("http");

  return {
    id: `igbo-api-${w.id}`,
    word: w.word,
    english: w.definitions?.filter(Boolean).join("; ") ?? "",
    nsibidi: w.nsibidi || "",
    pronunciation: pronunciationIsAudio ? undefined : w.pronunciation,
    example: example?.igbo,
    exampleTranslation: example?.english,
    audioUrl:
      example?.pronunciations?.[0]?.audio ??
      (pronunciationIsAudio ? w.pronunciation : undefined),
    wordClass: w.wordClass,
  };
}
