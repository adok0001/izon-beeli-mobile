import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { getRequestLocale, localeAlternates } from "@/lib/locale-meta";

const APP_NAME = "Beeli (Aurufie)";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: "Support",
    description: "Get help with Beeli (Aurufie) — the African language learning app.",
    alternates: localeAlternates(locale, "/support"),
    openGraph: {
      title: `Support | ${APP_NAME}`,
      description: "Get help with Beeli (Aurufie) — the African language learning app.",
      url: `${BASE_URL}/support`,
      type: "article",
    },
  };
}

type FaqItem = {
  q: string;
  a: string | string[];
};

const FAQS: FaqItem[] = [
  {
    q: "How do I reset my learning progress?",
    a: "Go to Profile → Settings → Data → Reset Progress. This will clear all lesson completions, XP, and streaks. This action cannot be undone.",
  },
  {
    q: "How does the streak system work?",
    a: [
      "Your streak increases by 1 for each day you complete at least one qualifying action.",
      "Qualifying actions are completing a lesson or completing a quiz.",
      "Listening to lesson audio without completing the lesson does not count.",
      "Multiple completions on the same day still count as one streak day only.",
      "If you miss a day, your streak resets to 0 unless a Streak Freeze is applied.",
    ],
  },
  {
    q: "What is the simplest way to keep my streak alive every day?",
    a: [
      "Complete at least one lesson or one quiz before your device's local day ends.",
      "If you are short on time, do a quick quiz and then check your streak count on the Learn or Profile screen.",
    ],
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
    a: "Go to the Multiplayer section to join a public matchmaking queue or create a private session with an invite code. You&apos;ll compete against another learner in real-time vocabulary quizzes.",
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
        text: Array.isArray(a) ? a.join(" ") : a,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <Script id="ld-support-faq" type="application/ld+json">
        {JSON.stringify(faqJsonLd)}
      </Script>

      {/* Subtle top glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-[0.06] blur-3xl rounded-full"
          style={{ background: "radial-gradient(ellipse, rgb(168,85,247), transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-16">
        {/* Back nav */}
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors duration-200"
        >
          <span aria-hidden>←</span> Back to Aurufie
        </Link>

        {/* Header */}
        <div className="mt-12 mb-10">
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-brand-400 mb-4">
            Help Centre
          </span>
          <h1 className="font-display text-5xl sm:text-6xl text-white tracking-[-0.02em] leading-[1.05] mb-4">
            Support.
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Learn African languages, interactively. Find answers below or reach us directly.
          </p>
        </div>

        {/* Contact card */}
        <div className="rounded-2xl p-6 border border-brand-500/20 mb-12"
          style={{ background: "rgba(168,85,247,0.07)" }}>
          <h2 className="font-semibold text-white text-base mb-2">Can&rsquo;t find your answer?</h2>
          <p className="text-neutral-400 text-sm mb-5 leading-relaxed">
            Email us and we&rsquo;ll get back to you as soon as possible.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:support@izon-beeli.com"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all duration-200"
            >
              Email Support
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all duration-200 hover:bg-white/5"
            >
              Partnership or Access Requests
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
            Frequently Asked Questions
          </span>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group py-5 cursor-pointer">
              <summary className="flex items-center justify-between gap-4 list-none font-medium text-neutral-200 hover:text-white transition-colors duration-150">
                {q}
                <span className="shrink-0 text-neutral-600 group-open:rotate-180 transition-transform duration-200 select-none text-xs">
                  ▾
                </span>
              </summary>
              {Array.isArray(a) ? (
                <ul className="mt-3 space-y-2 pl-0 text-neutral-500 text-sm leading-relaxed">
                  {a.map((line, index) => (
                    <li key={`${q}-line-${index}`} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-500/50 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-neutral-500 text-sm leading-relaxed">{a}</p>
              )}
            </details>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.05] flex items-center justify-between text-xs text-neutral-600 font-mono">
          <span>© {new Date().getFullYear()} Aurufie · Beeli</span>
          <Link
            href="/privacy"
            className="hover:text-white transition-colors duration-150"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
