import type { UiLanguage } from "./ui-language";

export function localeHref(locale: UiLanguage | string, path: string): string {
  if (locale === "en") return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${p}`;
}
