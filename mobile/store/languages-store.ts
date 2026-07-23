/**
 * In-memory hydration for the DB-backed language catalog (see
 * `lib/languages-snapshot.ts`), replacing the hand-authored
 * `lib/data/languages.ts` bundle. Hydrated once at app boot (mirrors
 * `content-store.ts`); `useLanguages()`/`useActiveLanguages()` give reactive
 * access for render code, and the getters below read the current in-memory
 * list synchronously for non-reactive/utility use (e.g. inside query
 * functions), matching the rest of the snapshot getters' shape.
 */
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { fetchAndCacheLanguages, readCachedLanguages } from "@/lib/languages-snapshot";
import type { Language } from "@/types";

interface LanguagesStoreState {
  languages: Language[];
  hydrating: boolean;
  hydrate: () => Promise<void>;
}

export const useLanguagesStore = create<LanguagesStoreState>((set, get) => ({
  languages: [],
  hydrating: false,

  hydrate: async () => {
    if (get().hydrating) return;
    set({ hydrating: true });

    try {
      const cached = await readCachedLanguages();
      if (cached) set({ languages: cached });

      const fresh = await fetchAndCacheLanguages();
      if (fresh) set({ languages: fresh });
    } finally {
      set({ hydrating: false });
    }
  },
}));

/** Reactive: the full language catalog, re-rendering once hydration resolves. */
export function useLanguages(): Language[] {
  return useLanguagesStore((s) => s.languages);
}

/** Reactive: languages with real hand-crafted content — used in learner-facing pickers.
 *  `useShallow` keeps the freshly-`filter`ed array from reading as a new snapshot every
 *  render, which otherwise trips Zustand's getSnapshot cache into an infinite loop. */
export function useActiveLanguages(): Language[] {
  return useLanguagesStore(useShallow((s) => s.languages.filter((l) => l.hasContent)));
}

export function getLanguages(): Language[] {
  return useLanguagesStore.getState().languages;
}

export function getActiveLanguages(): Language[] {
  return getLanguages().filter((l) => l.hasContent);
}

/** Look up a language's display name by its id. Returns the id if not found. */
export function getLanguageName(id: string): string {
  return getLanguages().find((l) => l.id === id)?.name ?? id;
}

/** Raw region name for a language id (e.g. "Niger Delta"), or "" if unknown. */
export function getLanguageRegion(id: string): string {
  return getLanguages().find((l) => l.id === id)?.region ?? "";
}

/**
 * Maps a raw region string to its i18n key (e.g. "Niger Delta" → "regions.nigerDelta").
 *
 * `as const` rather than an explicit `Record<string, TranslationKey>`: the web app
 * compiles this file too, and its `@/*` alias points at its own root, so importing
 * a mobile-only type here would break that build. The literal types flow to the
 * mobile call sites anyway, where `t()` validates them.
 */
export const REGION_KEY_MAP = {
  "Niger Delta": "regions.nigerDelta",
  Southwest: "regions.southwest",
  Southeast: "regions.southeast",
  "North Central": "regions.northCentral",
  North: "regions.north",
  "West Africa": "regions.westAfrica",
  "East Africa": "regions.eastAfrica",
  "North Africa": "regions.northAfrica",
  "Southern Africa": "regions.southernAfrica",
} as const;

/** The i18n keys REGION_KEY_MAP can yield. */
export type RegionKey = (typeof REGION_KEY_MAP)[keyof typeof REGION_KEY_MAP];

/** i18n key for a raw region name (e.g. "Niger Delta"), or "" if unknown. */
export function getRegionKey(region: string): RegionKey | "" {
  return region in REGION_KEY_MAP
    ? REGION_KEY_MAP[region as keyof typeof REGION_KEY_MAP]
    : "";
}

/** i18n key for a language's region label, or "" if unknown. */
export function getLanguageRegionKey(id: string): RegionKey | "" {
  return getRegionKey(getLanguageRegion(id));
}
