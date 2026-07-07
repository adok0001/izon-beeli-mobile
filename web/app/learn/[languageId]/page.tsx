import { LANGUAGES } from "@mobile/lib/data/languages";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getRequestLocale, localeAlternates } from "@/lib/locale-meta";
import { localizeField } from "@/lib/localize";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";

interface Course {
  id: string;
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  level: string;
  lessonsCount: number;
  order: number;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  intermediate: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  advanced: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
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

  const title = `Learn ${lang.name} Online — Free Audio Lessons`;
  const description = `Start learning ${lang.name} (${lang.nativeName}) with free audio lessons, vocabulary drills, and quizzes. A ${lang.region} language learning app.`;

  const locale = await getRequestLocale();
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/learn/${languageId}`),
    keywords: [
      `learn ${lang.name}`,
      `${lang.name} language`,
      `${lang.name} lessons`,
      `${lang.nativeName}`,
      `${lang.region} languages`,
      "African language learning",
      "Aurufie",
    ],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/learn/${languageId}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function getCourses(languageId: string): Promise<Course[]> {
  try {
    const res = await fetch(`${API}/courses?languageId=${languageId}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function LearnLanguagePage({
  params,
}: {
  params: Promise<{ languageId: string }>;
}) {
  const { languageId } = await params;
  const lang = LANGUAGES.find((l) => l.id === languageId);
  if (!lang) notFound();

  const courses = await getCourses(languageId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Learn ${lang.name} — Courses`,
    description: `Audio lessons and courses to learn ${lang.name} (${lang.nativeName})`,
    url: `${BASE_URL}/learn/${languageId}`,
    itemListElement: courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: localizeField(c.title, c.titleFr, "en"),
        description: localizeField(c.description, c.descriptionFr, "en"),
        url: `${BASE_URL}/learn`,
        provider: {
          "@type": "Organization",
          name: "Aurufie (Beeli)",
          url: BASE_URL,
        },
        educationalLevel: c.level,
        inLanguage: languageId,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
        },
      },
    })),
  };

  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Learn", path: "/learn" },
    { name: lang.name, path: `/learn/${languageId}` },
  ]);

  return (
    <>
      <Script id="ld-courses" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(jsonLd)}
      </Script>
      <Script id="ld-breadcrumb" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(breadcrumbLd)}
      </Script>

      <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {/* Nav */}
        <nav className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-sm">
          <Link href="/learn" className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white">
            Aurufie
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/learn"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/learn"
              className="px-4 py-1.5 rounded-full bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 mb-4">
            {lang.region}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            Learn {lang.name}
          </h1>
          <p className="text-xl text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
            {lang.nativeName}
          </p>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
            Master {lang.name} with audio-first lessons, spaced-repetition vocabulary, and a growing community of speakers and learners.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/learn"
              className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors text-sm"
            >
              Start learning free →
            </Link>
            <Link
              href={`/dictionary/${languageId}`}
              className="px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:border-brand-400 transition-colors text-sm"
            >
              Browse dictionary
            </Link>
          </div>
        </section>

        {/* Courses */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          {courses.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold mb-6">
                {lang.name} Courses
                <span className="ml-3 text-sm font-normal text-neutral-400">{courses.length} available</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href="/learn"
                    className="group block p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-brand-400 dark:hover:border-brand-700 transition-colors bg-white dark:bg-neutral-900"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {localizeField(course.title, course.titleFr, "en")}
                      </h3>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${LEVEL_COLOR[course.level] ?? "bg-neutral-100 text-neutral-600"}`}>
                        {LEVEL_LABEL[course.level] ?? course.level}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3">
                      {localizeField(course.description, course.descriptionFr, "en")}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {course.lessonsCount} {course.lessonsCount === 1 ? "lesson" : "lessons"}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
              <p className="text-2xl mb-3">🌱</p>
              <h2 className="text-xl font-bold mb-2">{lang.name} is coming soon</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto text-sm">
                We&apos;re building {lang.name} content. Help us get there faster by contributing words and phrases.
              </p>
              <Link
                href="/contribute"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                Contribute to {lang.name}
              </Link>
            </div>
          )}
        </section>

        {/* Features strip */}
        <section className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="max-w-4xl mx-auto px-6 py-12 grid sm:grid-cols-4 gap-6 text-center">
            {[
              { emoji: "🎧", label: "Audio lessons", sub: "Native speaker recordings" },
              { emoji: "📖", label: "Dictionary", sub: "Growing word bank" },
              { emoji: "🧠", label: "Spaced repetition", sub: "Never forget a word" },
              { emoji: "🌍", label: "Community", sub: "Native speaker contributors" },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-2xl mb-1">{f.emoji}</div>
                <p className="font-semibold text-sm text-neutral-900 dark:text-white">{f.label}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{f.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to learn {lang.name}?</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Free to start. No credit card required.
          </p>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
          >
            Get started for free
          </Link>
        </section>

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
