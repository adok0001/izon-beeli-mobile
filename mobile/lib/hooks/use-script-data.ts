import { useQuery } from "@tanstack/react-query";
import { isNetworkError } from "@/lib/api";
import {
  fetchAndCacheScriptCharacters,
  readCachedScriptCharacters,
  type ScriptCharacterRow,
} from "@/lib/content-snapshot";
import { useIsOffline } from "@/lib/hooks/use-offline";
import type {
  AdinkraCategory,
  AdinkraSymbol,
  GeezCharacter,
  NsibidiCategory,
  NsibidiCharacter,
} from "@/types/scripts";

function toNsibidi(row: ScriptCharacterRow): NsibidiCharacter {
  return {
    id: row.id,
    character: row.character,
    codePoint: row.codePoint ?? 0,
    name: row.name ?? row.hint ?? row.answer,
    meaning: row.meaning ?? row.answer,
    category: (row.category as NsibidiCategory) ?? "community",
  };
}

function toGeez(row: ScriptCharacterRow): GeezCharacter {
  return {
    id: row.id,
    character: row.character,
    baseConsonant: row.baseConsonant ?? row.category ?? "",
    order: row.vowelOrder ?? 0,
    romanization: row.answer,
  };
}

function toAdinkra(row: ScriptCharacterRow): AdinkraSymbol {
  return {
    id: row.id,
    name: row.name ?? row.answer,
    akanName: row.akanName ?? row.answer,
    meaning: row.meaning ?? row.hint ?? "",
    proverb: row.proverb ?? "",
    svgPath: row.svgPath ?? "",
    svgViewBox: row.svgViewBox ?? "0 0 100 100",
    category: (row.category as AdinkraCategory) ?? "wisdom",
  };
}

/**
 * Generic fetch+adapt+offline-cache for one script's character set. Scripts
 * are public, unauthenticated content, so there's no guest-vs-signed-in split
 * — only online/offline, same as the dictionary hook's network fallback.
 */
function useScriptCharacters<T>(scriptId: string, adapt: (row: ScriptCharacterRow) => T) {
  const isOffline = useIsOffline();
  return useQuery<T[]>({
    queryKey: ["script-characters", scriptId],
    queryFn: async () => {
      const fallback = async () => (await readCachedScriptCharacters(scriptId))?.map(adapt) ?? [];
      if (isOffline) return fallback();
      try {
        const rows = await fetchAndCacheScriptCharacters(scriptId);
        return (rows ?? []).map(adapt);
      } catch (err) {
        if (isNetworkError(err)) return fallback();
        throw err;
      }
    },
  });
}

export function useNsibidiCharacters() {
  return useScriptCharacters("nsibidi-igbo", toNsibidi);
}

export function useGeezCharacters() {
  return useScriptCharacters("geez-amharic", toGeez);
}

export function useAdinkraSymbols() {
  return useScriptCharacters("adinkra-akan", toAdinkra);
}
