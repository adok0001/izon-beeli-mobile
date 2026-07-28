/**
 * igboapi.com client. Used by the `/igbo/*` proxy (which keeps the token off the
 * client) and by the wordbank's "adopt an external word" path.
 *
 * Note the auth header: igboapi.com authenticates via `X-API-Key`. The mobile
 * client historically sent `Authorization: Bearer`, which the upstream rejects
 * with a 400 — Igbo lookups had never actually returned results.
 */
import type { DictionaryCategory } from "./dictionary-categories.js";

const IGBO_API_BASE = "https://igboapi.com/api/v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

const cache = new Map<string, { data: unknown; expiresAt: number }>();

function readCache(key: string): unknown | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.data;
}

function writeCache(key: string, data: unknown): void {
  // Bound the map so a long-lived instance can't grow without limit.
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export interface IgboFetchResult {
  status: number;
  body: unknown;
}

/** Fetches an upstream path, with caching. Upstream errors pass through unchanged. */
export async function igboFetch(path: string): Promise<IgboFetchResult> {
  const cached = readCache(path);
  if (cached !== undefined) return { status: 200, body: cached };

  const token = process.env.IGBO_API_TOKEN;
  if (!token) {
    console.warn("[igbo] IGBO_API_TOKEN is not set — Igbo lookups are unavailable");
    return { status: 503, body: { error: "Igbo dictionary is unavailable" } };
  }

  let res: Response;
  try {
    res = await fetch(`${IGBO_API_BASE}${path}`, { headers: { "X-API-Key": token } });
  } catch (err) {
    console.error("[igbo] upstream request failed", err);
    return { status: 502, body: { error: "Igbo dictionary is unreachable" } };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }

  if (!res.ok) {
    const asError = body as { message?: string; error?: string } | undefined;
    return {
      status: res.status,
      body: { error: asError?.message ?? asError?.error ?? `Igbo API error ${res.status}` },
    };
  }

  writeCache(path, body);
  return { status: 200, body };
}

// ---------- Adaptation to a dictionary_entries row ----------

interface IgboApiExample {
  igbo?: string;
  english?: string;
  pronunciations?: { audio?: string }[] | null;
}

/**
 * A word as igboapi.com actually returns it: `definitions` is a flat string
 * array, with `wordClass` and `nsibidi` at the top level, and `pronunciation`
 * holding an audio URL rather than a transcription. Everything is optional so an
 * unexpected payload yields a thinner row instead of throwing.
 */
export interface IgboApiWord {
  id: string;
  word: string;
  definitions?: string[] | null;
  wordClass?: string;
  nsibidi?: string;
  pronunciation?: string;
  examples?: IgboApiExample[] | null;
}

/**
 * Igbo API word classes → Beeli dictionary categories. Mirrors
 * mobile/lib/hooks/use-igbo-search.ts; unmapped classes fall back to "nouns".
 */
const WORD_CLASS_TO_CATEGORY: Record<string, DictionaryCategory> = {
  // Verified against live API payloads. Unmapped classes fall back to "nouns".
  NNC: "nouns",          // noun, common
  NNO: "nouns",
  NNO2: "nouns",
  NM: "nouns",           // proper name, e.g. Nwabụ̄ēzè
  ND: "adjectives",      // noun descriptor, e.g. nnukwu "large"
  ADJ: "adjectives",
  // "adverbs" now exists as a category, but remapping ADV would recategorise
  // previously imported rows inconsistently — left as a deliberate decision.
  ADV: "adjectives",
  AV: "verbs",           // active verb, e.g. riju "to eat to fill"
  AVM: "verbs",
  MV: "verbs",           // main verb, e.g. bù ibù "be big"
  PV: "verbs",           // phrasal verb, e.g. jì ụkwụ "trek"
  ESUF: "verbs",         // extensional suffix — attaches to verbs
  VB: "verbs",
  VBD: "verbs",
  VBG: "verbs",
  PRN: "pronouns",
  CD: "numbers",         // cardinal, e.g. ìriàtọ nà otù "thirty one"
  NUM: "numbers",
  "NNC Mgbe": "time",
  PREP: "phrases",
  CONJ: "phrases",
  INTJ: "greetings",
};

/** The synthetic, namespaced id an adopted Igbo API word gets in dictionary_entries. */
export function igboEntryId(externalId: string): string {
  return `igbo-api-${externalId}`;
}

export interface AdoptedIgboEntry {
  id: string;
  languageId: string;
  word: string;
  english: string;
  category: string;
  pronunciation: string | null;
  example: string | null;
  exampleTranslation: string | null;
  audioUrl: string | null;
  contributorName: string;
}

/** Maps an upstream word onto a dictionary_entries row. Returns null if unusable. */
export function adaptIgboWord(w: IgboApiWord): AdoptedIgboEntry | null {
  const english = w.definitions?.filter(Boolean).join("; ").trim();
  if (!w.word?.trim() || !english) return null;

  const example = w.examples?.[0];
  // `pronunciation` is an audio URL here, not a transcription.
  const pronunciationIsAudio = !!w.pronunciation?.startsWith("http");

  return {
    id: igboEntryId(w.id),
    languageId: "igbo",
    word: w.word.trim(),
    english,
    category: WORD_CLASS_TO_CATEGORY[w.wordClass ?? ""] ?? "nouns",
    pronunciation: pronunciationIsAudio ? null : w.pronunciation ?? null,
    example: example?.igbo ?? null,
    exampleTranslation: example?.english ?? null,
    audioUrl:
      example?.pronunciations?.[0]?.audio ??
      (pronunciationIsAudio ? w.pronunciation ?? null : null),
    contributorName: "igboapi.com",
  };
}

/** Fetches a single upstream word by id and adapts it. Returns null if not found/unusable. */
export async function fetchAndAdaptIgboWord(externalId: string): Promise<AdoptedIgboEntry | null> {
  const { status, body } = await igboFetch(`/words/${encodeURIComponent(externalId)}`);
  if (status !== 200 || !body || typeof body !== "object") return null;
  return adaptIgboWord(body as IgboApiWord);
}
