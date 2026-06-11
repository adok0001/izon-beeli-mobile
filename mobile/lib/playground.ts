import { getAccent } from "@/constants/accent-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type GameCategory = "quick" | "listening" | "reading" | "scripts" | "explore";

export interface PlaygroundGame {
  id: string;
  i18nKey: string; // playground.games.<key>
  icon: string;
  color: string;
  route: string;
  category: GameCategory;
  requires?: "script" | "adinkra" | "nsibidi";
  tag?: "daily";
}

export const GAME_CATEGORIES: GameCategory[] = ["quick", "listening", "reading", "scripts", "explore"];

export const GAMES: PlaygroundGame[] = [
  { id: "speed-round", i18nKey: "speedRound", icon: "bolt.fill", color: getAccent("amber").solid, route: "/speed-round", category: "quick" },
  { id: "recall-bingo", i18nKey: "recallBingo", icon: "square.grid.3x3.fill", color: getAccent("green").solid, route: "/recall-bingo", category: "quick" },
  { id: "quiz", i18nKey: "quiz", icon: "lightbulb.fill", color: getAccent("amber").solid, route: "/quiz", category: "quick" },
  { id: "matching-game", i18nKey: "match", icon: "rectangle.grid.2x2", color: getAccent("purple").solid, route: "/matching-game", category: "quick" },
  { id: "word-review", i18nKey: "wordReview", icon: "brain.head.profile", color: getAccent("green").solid, route: "/word-review", category: "quick" },
  { id: "dictation", i18nKey: "dictation", icon: "waveform", color: getAccent("sky").solid, route: "/dictation", category: "listening" },
  { id: "say-it-back", i18nKey: "sayItBack", icon: "mic.fill", color: getAccent("rose").solid, route: "/say-it-back", category: "listening" },
  { id: "fill-proverb", i18nKey: "fillProverb", icon: "text.quote", color: getAccent("purple").solid, route: "/fill-proverb", category: "reading" },
  { id: "sentence-builder", i18nKey: "sentenceBuilder", icon: "text.alignleft", color: getAccent("orange").solid, route: "/sentence-builder", category: "reading" },
  { id: "script-decode", i18nKey: "scriptDecode", icon: "character.book.closed", color: getAccent("teal").solid, route: "/script-decode", category: "scripts", requires: "script" },
  { id: "trace-symbol", i18nKey: "traceSymbol", icon: "pencil.tip", color: getAccent("amber").solid, route: "/trace-symbol", category: "scripts", requires: "script" },
  { id: "etymology-trail", i18nKey: "etymologyTrail", icon: "clock.arrow.circlepath", color: getAccent("sky").solid, route: "/etymology-trail", category: "explore" },
  { id: "word-challenge", i18nKey: "wordChallenge", icon: "pencil.and.scribble", color: getAccent("rose").solid, route: "/word-challenge", category: "explore", tag: "daily" },
];

// Languages with script/symbol content. Lifted from the per-screen checks that
// previously lived in the listen tab.
const SCRIPT_LANGUAGES = ["amharic", "tigrinya", "oromo"];
const ADINKRA_LANGUAGES = ["ga", "ewe", "dagbani", "akan"];
const NSIBIDI_LANGUAGES = ["igbo"];

export function languageHasScripts(languageId: string): boolean {
  return (
    SCRIPT_LANGUAGES.includes(languageId) ||
    ADINKRA_LANGUAGES.includes(languageId) ||
    NSIBIDI_LANGUAGES.includes(languageId)
  );
}

export function relevantGames(languageId: string): PlaygroundGame[] {
  const hasScripts = languageHasScripts(languageId);
  return GAMES.filter((g) => (g.requires ? hasScripts : true));
}

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function dayOfYear(date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

export interface FeaturedContext {
  languageId: string;
  dueCount: number;
  wordChallengeDone: boolean;
}

// Deterministic per calendar day so the hero doesn't reshuffle between renders.
export function pickFeaturedGame(ctx: FeaturedContext, date = new Date()): PlaygroundGame {
  const pool = relevantGames(ctx.languageId);
  const byId = (id: string) => pool.find((g) => g.id === id);

  if (ctx.dueCount >= 8) {
    const g = byId(dayOfYear(date) % 2 === 0 ? "speed-round" : "word-review") ?? byId("speed-round");
    if (g) return g;
  }
  if (!ctx.wordChallengeDone) {
    const g = byId("word-challenge");
    if (g) return g;
  }
  const scripts = pool.filter((g) => g.category === "scripts");
  if (scripts.length > 0 && dayOfYear(date) % 3 === 0) {
    return scripts[dayOfYear(date) % scripts.length];
  }
  return pool[dayOfYear(date) % pool.length];
}

// Shelf order: games with due-word relevance first, then unplayed today, then the rest.
export function rankShelfGames(
  ctx: FeaturedContext,
  featuredId: string,
  playedToday: string[],
  limit = 5
): PlaygroundGame[] {
  const pool = relevantGames(ctx.languageId).filter((g) => g.id !== featuredId);
  const score = (g: PlaygroundGame) => {
    let s = 0;
    if (ctx.dueCount > 0 && (g.id === "word-review" || g.id === "speed-round")) s -= 2;
    if (!playedToday.includes(g.id)) s -= 1;
    return s;
  };
  return [...pool].sort((a, b) => score(a) - score(b)).slice(0, limit);
}

// ── Played-today tracking ────────────────────────────────────────────────────
const PLAYED_STORAGE_KEY = "playground:played";

interface PlaygroundState {
  date: string;
  playedToday: string[];
  _hydrated: boolean;
  hydrate: () => Promise<void>;
  markPlayed: (gameId: string) => void;
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  date: dayKey(),
  playedToday: [],
  _hydrated: false,
  hydrate: async () => {
    if (get()._hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(PLAYED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { date: string; played: string[] };
        if (parsed.date === dayKey()) {
          set({ playedToday: parsed.played, date: parsed.date, _hydrated: true });
          return;
        }
      }
    } catch {
      // Corrupt or missing state — start fresh for today.
    }
    set({ playedToday: [], date: dayKey(), _hydrated: true });
  },
  markPlayed: (gameId) => {
    const today = dayKey();
    const prev = get().date === today ? get().playedToday : [];
    if (prev.includes(gameId)) return;
    const played = [...prev, gameId];
    set({ playedToday: played, date: today });
    AsyncStorage.setItem(PLAYED_STORAGE_KEY, JSON.stringify({ date: today, played })).catch(() => {});
  },
}));
