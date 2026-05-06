import { LANGUAGES } from "@mobile/lib/data/languages";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";

interface DictEntry {
  id: string;
  word: string;
  english: string;
  category: string;
  pronunciation: string | null;
  example: string | null;
  exampleTranslation: string | null;
}

const CATEGORY_EMOJI: Record<string, string> = {
  greetings: "👋", numbers: "🔢", family: "👨‍👩‍👧", food: "🍲",
  body: "🫀", animals: "🐾", time: "⏰", verbs: "⚡",
  adjectives: "🎨", phrases: "💬", nouns: "📦", nature: "🌿",
};

export function generateStaticParams() {
  return LANGUAGES.map((l) => ({ languageId: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ languageId: string }>;
}): Promise<Metadata> {
  const { languageId } = await params;
  const lang = LANGUAGES.find((l) => l.id === languageId);
  if (!lang) return {};

  const title = `${lang.name} Dictionary — Words, Translations & Audio`;
  const description = `Browse the ${lang.name} (${lang.nativeName}) dictionary. English translations, pronunciation guides, example sentences, and audio recordings for ${lang.region} vocabulary.`;

  return {
    title,
    description,
    alternates: { canonical: `/dictionary/${languageId}` },
    keywords: [
      `${lang.name} dictionary`,
      `${lang.name} words`,
      `${lang.name} vocabulary`,
      `${lang.name} English translation`,
      `${lang.nativeName}`,
      `${lang.region} language dictionary`,
      "African language dictionary",
    ],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/dictionary/${languageId}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function getSampleEntries(languageId: string): Promise<DictEntry[]> {
  try {
    const res = await fetch(`${API}/dictionary?languageId=${languageId}&limit=12`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function DictionaryLanguagePage({
  params,
}: {
  params: Promise<{ languageId: string }>;
}) {
  const { languageId } = await params;
  const lang = LANGUAGES.find((l) => l.id === languageId);
  if (!lang) notFound();

  const entries = await getSampleEntries(languageId);

  const categories = [...new Set(entries.map((e) => e.category))];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${lang.name} Dictionary`,
    description: `${lang.name} (${lang.nativeName}) vocabulary with English translations, pronunciation, and example sentences.`,
    url: `${BASE_URL}/dictionary/${languageId}`,
    creator: { "@type": "Organization", name: "Aurufie (Beeli)", url: BASE_URL },
    inLanguage: [languageId, "en"],
    keywords: `${lang.name}, ${lang.nativeName}, ${lang.region}, African languages, dictionary`,
    license: "https://creativecommons.org/licenses/by/4.0/",
  };

  return (
    <>
      <Script id="ld-dictionary" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(jsonLd)}
      </Script>

      <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {/* Nav */}
        <nav className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-sm">
          <Link href="/learn" className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white">
            Aurufie
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/learn" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/learn" className="px-4 py-1.5 rounded-full bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors">
              Get started free
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 mb-4">
            {lang.region}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            {lang.name} Dictionary
          </h1>
          <p className="text-xl text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
            {lang.nativeName}
          </p>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
            {entries.length > 0
              ? `Browse ${entries.length > 11 ? "hundreds of" : ""} ${lang.name} words with English translations, pronunciation guides, and example sentences.`
              : `The ${lang.name} dictionary is growing. Help us by contributing words.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dictionary" className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors text-sm">
              Browse full dictionary →
            </Link>
            <Link href={`/learn/${languageId}`} className="px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:border-brand-400 transition-colors text-sm">
              Learn {lang.name}
            </Link>
          </div>
        </section>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="max-w-4xl mx-auto px-6 mb-8 flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">
                {CATEGORY_EMOJI[cat] ?? "📝"} {cat}
              </span>
            ))}
          </div>
        )}

        {/* Word table */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          {entries.length > 0 ? (
            <>
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_auto] bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  <span>{lang.name}</span>
                  <span>English</span>
                  <span>Category</span>
                </div>
                {entries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[1fr_1fr_auto] items-start px-4 py-3 gap-4 ${i < entries.length - 1 ? "border-b border-neutral-100 dark:border-neutral-800/60" : ""}`}
                  >
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">{entry.word}</p>
                      {entry.pronunciation && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">/{entry.pronunciation}/</p>
                      )}
                      {entry.example && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 italic line-clamp-1">{entry.example}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-neutral-700 dark:text-neutral-300">{entry.english}</p>
                      {entry.exampleTranslation && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 italic line-clamp-1">{entry.exampleTranslation}</p>
                      )}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 capitalize whitespace-nowrap">
                      {entry.category}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-neutral-400 dark:text-neutral-500 mt-4">
                Showing a sample —{" "}
                <Link href="/dictionary" className="text-brand-600 dark:text-brand-400 hover:underline">
                  explore the full {lang.name} dictionary
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
              <p className="text-2xl mb-3">📖</p>
              <h2 className="text-xl font-bold mb-2">No entries yet</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm max-w-sm mx-auto">
                Know {lang.name}? Be the first to contribute words to this dictionary.
              </p>
              <Link href="/contribute" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
                Add {lang.name} words
              </Link>
            </div>
          )}
        </section>

        {/* Contribute CTA */}
        <section className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="max-w-4xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Know {lang.name}?</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                Help build the dictionary. Every word contributed reaches thousands of learners.
              </p>
            </div>
            <Link
              href="/contribute"
              className="shrink-0 px-6 py-3 rounded-xl border-2 border-brand-600 text-brand-600 dark:text-brand-400 font-semibold hover:bg-brand-600 hover:text-white transition-colors text-sm"
            >
              Contribute a word
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-100 dark:border-neutral-800 py-8 text-center text-xs text-neutral-400">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/support" className="hover:underline">Support</Link>
            <Link href="/contribute" className="hover:underline">Contribute</Link>
          </div>
          © {new Date().getFullYear()} Aurufie — Preserving African languages, one word at a time.
        </footer>
      </main>
    </>
  );
}
