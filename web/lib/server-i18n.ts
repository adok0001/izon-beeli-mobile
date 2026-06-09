import { en } from "@mobile/lib/locales/en";
import { fr } from "@mobile/lib/locales/fr";
import { pcm } from "@mobile/lib/locales/pcm";
import { cookies } from "next/headers";
import { normalizeUiLanguage, UI_LANGUAGE_COOKIE, type UiLanguage } from "./ui-language";

const DICTS = { en, fr, pcm } as const;

type Dict = Record<string, unknown>;

/** Resolve a dotted key path (e.g. "web.landing.heroTitle") against a dict. */
function resolve(dict: Dict, path: string): string | undefined {
  const value = path
    .split(".")
    .reduce<unknown>((acc, key) => (acc as Dict | undefined)?.[key], dict);
  return typeof value === "string" ? value : undefined;
}

/**
 * Server-side translator for React Server Components, which cannot use the
 * react-i18next hook. Reads the UI-language cookie and resolves keys against
 * the matching locale, falling back to English (mirrors the client i18n
 * `fallbackLng: "en"` behaviour).
 */
export async function getServerT(): Promise<{
  lang: UiLanguage;
  t: (key: string) => string;
}> {
  const cookieStore = await cookies();
  const lang = normalizeUiLanguage(cookieStore.get(UI_LANGUAGE_COOKIE)?.value);
  const dict = DICTS[lang] as unknown as Dict;
  const fallback = en as unknown as Dict;

  const t = (key: string): string => resolve(dict, key) ?? resolve(fallback, key) ?? key;
  return { lang, t };
}
