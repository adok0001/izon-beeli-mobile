import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

const APP_NAME = "Beeli (Aurufie)";

export const metadata: Metadata = {
  title: `Support | ${APP_NAME}`,
  description:
    "Get help with Beeli (Aurufie) — the African language learning app.",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: `Support | ${APP_NAME}`,
    description: "Get help with Beeli (Aurufie) — the African language learning app.",
    url: "/support",
    type: "article",
  },
};

const FAQS = [
  {
    q: "How do I reset my learning progress?",
    a: "Go to Profile → Settings → Data → Reset Progress. This will clear all lesson completions, XP, and streaks. This action cannot be undone.",
  },
  {
    q: "How does the streak system work?",
    a: "Your streak increases by 1 each day you complete at least one lesson or quiz. Missing a day resets the streak to 0. You can use a Streak Freeze (earned via XP) to protect your streak for one missed day.",
  },
  {
    q: "How do I contribute vocabulary?",
    a: "Tap the Contribute tab on the app or visit /contribute on the web. You can submit words, their English translations, and optional audio recordings. Submissions are reviewed by moderators before they appear in the community dictionary.",
  },
  {
    q: "How do I earn XP?",
    a: "Completing lessons, quizzes, daily challenges, multiplayer sessions, and approved vocabulary contributions all award XP. Your total XP determines your level (Newcomer through Legend).",
  },
  {
    q: "What is the word bank?",
    a: "The word bank is your personal saved vocabulary list. Tap the bookmark icon on any dictionary entry to save it. Use the Word Review feature to practice saved words with spaced repetition.",
  },
  {
    q: "How does multiplayer work?",
    a: "Go to the Multiplayer section to join a public matchmaking queue or create a private session with an invite code. You'll compete against another learner in real-time vocabulary quizzes.",
  },
  {
    q: "Can I use Beeli offline?",
    a: "Some content (lessons and dictionary) may be cached for offline reading, but audio playback and progress syncing require an internet connection.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Profile → Settings → Account → Delete Account. This permanently removes all your data including progress, journal entries, contributions, and push tokens. The action cannot be undone. You can also email us to request deletion.",
  },
  {
    q: "I found a bug or want to give feedback.",
    a: "Use the Feedback option in the app (Profile → Feedback) to submit a report directly. You can also email us.",
  },
];

export default function SupportPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Script id="ld-support-faq" type="application/ld+json">
        {JSON.stringify(faqJsonLd)}
      </Script>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/learn"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Beeli (Aurufie)
        </Link>

        <h1 className="mt-8 text-4xl font-bold tracking-tight">Support</h1>
        <p className="mt-3 text-lg text-neutral-500 dark:text-neutral-400">
          Learn African languages, interactively.
        </p>

        {/* Contact card */}
        <div className="mt-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold">Contact Us</h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Can&rsquo;t find the answer below? Email us and we&rsquo;ll get back
            to you as soon as possible.
          </p>
          <a
            href="mailto:support@izon-beeli.com"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Email Support
          </a>
        </div>

        {/* FAQ */}
        <h2 className="mt-12 text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="mt-6 divide-y divide-neutral-200 dark:divide-neutral-800">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group py-5 cursor-pointer"
            >
              <summary className="flex items-center justify-between gap-4 list-none font-medium text-neutral-900 dark:text-white">
                {q}
                <span className="shrink-0 text-neutral-400 group-open:rotate-180 transition-transform duration-200 select-none">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                {a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-400 dark:text-neutral-500">
          <span>© {new Date().getFullYear()} Beeli (Aurufie). All rights reserved.</span>
          <Link
            href="/privacy"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
