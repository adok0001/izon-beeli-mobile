import { create } from "zustand";
import { localize } from "@/lib/localize";
import type { MatchingPair, MatchingGameResult } from "@/types";

type TileKind = "word" | "english";

export interface Tile {
  id: string;
  pairId: string;
  label: string;
  kind: TileKind;
  matched: boolean;
  selected: boolean;
  flash: "none" | "correct" | "incorrect";
}

type Phase = "idle" | "active" | "results";

interface MatchingState {
  phase: Phase;
  tiles: Tile[];
  selectedTileId: string | null;
  attempts: number;
  matchedCount: number;
  totalPairs: number;
  startTime: number;

  startGame: (pairs: MatchingPair[]) => void;
  selectTile: (tileId: string) => { matched: boolean; done: boolean } | null;
  clearFlash: () => void;
  getResult: () => MatchingGameResult;
  reset: () => void;
}

function shuffleTiles(arr: Tile[]): Tile[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const useMatchingStore = create<MatchingState>((set, get) => ({
  phase: "idle",
  tiles: [],
  selectedTileId: null,
  attempts: 0,
  matchedCount: 0,
  totalPairs: 0,
  startTime: 0,

  startGame: (pairs) => {
    const tiles: Tile[] = [];
    for (const pair of pairs) {
      tiles.push({
        id: `${pair.id}-word`,
        pairId: pair.id,
        label: pair.word,
        kind: "word",
        matched: false,
        selected: false,
        flash: "none",
      });
      tiles.push({
        id: `${pair.id}-eng`,
        pairId: pair.id,
        label: localize(pair.english, "en"),
        kind: "english",
        matched: false,
        selected: false,
        flash: "none",
      });
    }
    set({
      phase: "active",
      tiles: shuffleTiles(tiles),
      selectedTileId: null,
      attempts: 0,
      matchedCount: 0,
      totalPairs: pairs.length,
      startTime: Date.now(),
    });
  },

  selectTile: (tileId) => {
    const { tiles, selectedTileId, matchedCount, totalPairs } = get();
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile || tile.matched) return null;

    // First selection
    if (!selectedTileId) {
      set({
        selectedTileId: tileId,
        tiles: tiles.map((t) =>
          t.id === tileId ? { ...t, selected: true } : t
        ),
      });
      return null;
    }

    // Same tile tapped again
    if (selectedTileId === tileId) {
      set({
        selectedTileId: null,
        tiles: tiles.map((t) =>
          t.id === tileId ? { ...t, selected: false } : t
        ),
      });
      return null;
    }

    const firstTile = tiles.find((t) => t.id === selectedTileId);
    if (!firstTile) return null;

    // Same kind (both word or both english) — don't match
    if (firstTile.kind === tile.kind) {
      // Switch selection
      set({
        selectedTileId: tileId,
        tiles: tiles.map((t) => ({
          ...t,
          selected: t.id === tileId,
        })),
      });
      return null;
    }

    const matched = firstTile.pairId === tile.pairId;
    const newAttempts = get().attempts + 1;
    const newMatchedCount = matched ? matchedCount + 1 : matchedCount;
    const done = newMatchedCount === totalPairs;

    set({
      attempts: newAttempts,
      matchedCount: newMatchedCount,
      selectedTileId: null,
      phase: done ? "results" : "active",
      tiles: tiles.map((t) => {
        if (t.id === tileId || t.id === selectedTileId) {
          return {
            ...t,
            matched: matched ? true : t.matched,
            selected: false,
            flash: matched ? "correct" : "incorrect",
          };
        }
        return { ...t, selected: false };
      }),
    });

    return { matched, done };
  },

  clearFlash: () => {
    set({
      tiles: get().tiles.map((t) => ({ ...t, flash: "none" })),
    });
  },

  getResult: () => {
    const { totalPairs, attempts, startTime } = get();
    const timeElapsed = Math.round((Date.now() - startTime) / 1000);
    // Best possible is totalPairs attempts (one per pair)
    const accuracy =
      attempts > 0
        ? Math.round((totalPairs / attempts) * 100)
        : 0;
    return { totalPairs, attempts, timeElapsed, accuracy: Math.min(accuracy, 100) };
  },

  reset: () => {
    set({
      phase: "idle",
      tiles: [],
      selectedTileId: null,
      attempts: 0,
      matchedCount: 0,
      totalPairs: 0,
      startTime: 0,
    });
  },
}));
