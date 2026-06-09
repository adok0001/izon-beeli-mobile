import { headers } from "next/headers";
import type { UiLanguage } from "./ui-language";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";

export async function getRequestLocale(): Promise<UiLanguage> {
  const h = await headers();
  const loc = h.get("x-locale");
  if (loc === "fr" || loc === "pcm") return loc;
  return "en";
}

export function localeAlternates(locale: UiLanguage, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const canonical = locale === "en" ? p : `/${locale}${p}`;
  return {
    canonical,
    languages: {
      en: `${BASE_URL}${p}`,
      fr: `${BASE_URL}/fr${p}`,
      pcm: `${BASE_URL}/pcm${p}`,
      "x-default": `${BASE_URL}${p}`,
    } as Record<string, string>,
  };
}
