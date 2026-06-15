import { LANGUAGES } from "@mobile/lib/data/languages";
import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";
const LOCALES = ["en", "fr", "pcm", "ar", "pt"] as const;

function localeUrl(locale: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return locale === "en" ? `${BASE_URL}${p}` : `${BASE_URL}/${locale}${p}`;
}

function withAlternates(path: string) {
  return {
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l === "en" ? "x-default" : l, localeUrl(l, path)])
      ) as Record<string, string>,
    },
  };
}

function publicEntry(
  path: string,
  opts: { changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }
): MetadataRoute.Sitemap {
  const now = new Date();
  return LOCALES.map((locale) => ({
    url: localeUrl(locale, path),
    lastModified: now,
    changeFrequency: opts.changeFrequency,
    priority: locale === "en" ? Math.round(opts.priority * 100) / 100 : Math.round((opts.priority - 0.05) * 100) / 100,
    ...withAlternates(path),
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // ── Public marketing pages (all locales) ──────────────────────────────────
    ...publicEntry("/", { changeFrequency: "daily", priority: 1 }),
    ...publicEntry("/home", { changeFrequency: "daily", priority: 1 }),
...publicEntry("/for-educators", { changeFrequency: "monthly", priority: 0.7 }),
    ...publicEntry("/culture", { changeFrequency: "weekly", priority: 0.7 }),
    ...publicEntry("/contact", { changeFrequency: "monthly", priority: 0.5 }),
    ...publicEntry("/support", { changeFrequency: "monthly", priority: 0.5 }),
    ...publicEntry("/privacy", { changeFrequency: "yearly", priority: 0.3 }),

    // ── App-only pages (en only, no locale variants) ───────────────────────────
    {
      url: `${BASE_URL}/leaderboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/bounties`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contribute`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/quiz`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },

    // ── Per-language learn pages (all locales) ─────────────────────────────────
    ...LANGUAGES.flatMap((l) =>
      publicEntry(`/learn/${l.id}`, { changeFrequency: "weekly", priority: 0.85 })
    ),

    // ── Per-language dictionary pages (all locales) ────────────────────────────
    ...LANGUAGES.flatMap((l) =>
      publicEntry(`/dictionary/${l.id}`, { changeFrequency: "daily", priority: 0.8 })
    ),
  ];
}
