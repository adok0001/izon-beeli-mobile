import type { Language } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

/**
 * Server-side language catalog fetch, for `generateStaticParams`/`generateMetadata`/
 * server components (SSG/build time and request time) — cached for a day, mirroring
 * the per-page `getCourses` pattern this replaces call sites of `@mobile/lib/data/languages` in.
 */
export async function getLanguages(): Promise<Language[]> {
  try {
    const res = await fetch(`${API}/languages`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("Failed to fetch languages:", e);
    return [];
  }
}
