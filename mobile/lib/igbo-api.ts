import { ApiError } from "./api";

const IGBO_API_BASE = "https://igboapi.com/api/v1";

function igboHeaders(): HeadersInit {
  const token = process.env.EXPO_PUBLIC_IGBO_API_TOKEN;
  if (!token) throw new Error("EXPO_PUBLIC_IGBO_API_TOKEN is not set");
  return { Authorization: `Bearer ${token}` };
}

async function igboFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${IGBO_API_BASE}${path}`, { headers: igboHeaders() });
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { body = undefined; }
    const message = (body as any)?.error ?? `Igbo API error ${res.status}`;
    throw new ApiError(res.status, message, body);
  }
  return res.json() as Promise<T>;
}

// --- Types ---

export interface IgboApiDefinition {
  wordClass: string;
  definitions: string[];
  nsibidi: string;
  nsibidiCharacters: string[];
  igboDefinitions: { igbo: string; nsibidi: string }[];
}

export interface IgboApiDialect {
  dialects: string[];
  pronunciation: string;
  variations: string[];
}

export interface IgboApiExample {
  igbo: string;
  english: string;
  nsibidi?: string;
  pronunciations?: { audio: string; speaker: string }[];
}

export interface IgboApiWord {
  id: string;
  word: string;
  definitions: IgboApiDefinition[];
  dialects?: Record<string, IgboApiDialect>;
  examples?: IgboApiExample[];
  pronunciation?: string;
  attributes?: Record<string, boolean>;
  frequency?: number;
}

export interface IgboApiNsibidi {
  id: string;
  nsibidi: string;
  definitions: string[];
  pronunciation?: string;
  wordClass?: string;
}

// --- Endpoints ---

export async function searchIgboWords(keyword: string): Promise<IgboApiWord[]> {
  return igboFetch<IgboApiWord[]>(`/words?keyword=${encodeURIComponent(keyword)}&limit=20`);
}

export async function getIgboWord(id: string): Promise<IgboApiWord> {
  return igboFetch<IgboApiWord>(`/words/${id}`);
}

export async function getIgboExamples(wordId: string): Promise<IgboApiExample[]> {
  return igboFetch<IgboApiExample[]>(`/examples?associatedWordId=${wordId}`);
}

export async function getNsibidiCharacters(keyword?: string): Promise<IgboApiNsibidi[]> {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  return igboFetch<IgboApiNsibidi[]>(`/nsibidi${query}`);
}

export async function getNsibidiCharacter(id: string): Promise<IgboApiNsibidi> {
  return igboFetch<IgboApiNsibidi>(`/nsibidi/${id}`);
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
  const def = w.definitions[0];
  const example = w.examples?.[0];
  const audio = example?.pronunciations?.[0]?.audio;

  return {
    id: `igbo-api-${w.id}`,
    word: w.word,
    english: def?.definitions[0] ?? "",
    nsibidi: def?.nsibidi ?? "",
    pronunciation: w.pronunciation,
    example: example?.igbo,
    exampleTranslation: example?.english,
    audioUrl: audio,
    wordClass: def?.wordClass,
  };
}
