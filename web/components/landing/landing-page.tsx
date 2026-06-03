"use client";

import Link from "next/link";
import {
  Languages,
  Volume2,
  Globe,
  Users,
  ArrowRight,
} from "lucide-react";

const STATS = [
  { value: "70+", label: "African Languages" },
  { value: "7", label: "Regions Covered" },
  { value: "500M+", label: "Diaspora Speakers" },
];

const FEATURES = [
  {
    icon: Volume2,
    title: "Audio-First Learning",
    desc: "Every word recorded by native speakers. Segment-synced transcripts. Train your ear before your eye.",
    color: "text-brand-400",
  },
  {
    icon: Globe,
    title: "Cultural Depth",
    desc: "Language is culture. Learn Adinkra symbols, Ge'ez script, oral proverbs, and the stories behind the words.",
    color: "text-gold-400",
  },
  {
    icon: Users,
    title: "Community-Powered",
    desc: "Native speakers earn XP for contributing vocabulary and audio. The community builds the platform.",
    color: "text-indigo-400",
  },
];

const LANGUAGES = [
  { name: "Yoruba", region: "West Africa" },
  { name: "Igbo", region: "West Africa" },
  { name: "Swahili", region: "East Africa" },
  { name: "Hausa", region: "West Africa" },
  { name: "Amharic", region: "East Africa" },
  { name: "Izon", region: "Niger Delta" },
  { name: "Twi", region: "West Africa" },
  { name: "Wolof", region: "West Africa" },
  { name: "Somali", region: "East Africa" },
  { name: "Zulu", region: "Southern Africa" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05050c] text-neutral-50 overflow-x-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-100" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-brand-900/30 blur-[140px] animate-aurora" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-brand-900/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-indigo-900/15 blur-[90px]" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-purple-800/10 blur-[70px]" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-dark border-b border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-800 flex items-center justify-center shadow-glow-sm">
                <Languages className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">Beeli</span>
            </div>
            <Link
              href="/for-educators"
              className="hidden sm:block text-sm text-neutral-400 hover:text-white transition-colors"
            >
              For Educators
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="btn-ghost text-sm">Sign In</Link>
            <Link href="/sign-up" className="btn-primary text-sm">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="animate-fade-in max-w-4xl mx-auto">
          <span className="badge bg-brand-500/10 border border-brand-500/20 text-brand-300 mb-6">
            Audio-first · Free · 70+ Languages
          </span>
          <h1 className="mt-4 text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05]">
            <span className="gradient-text-bold">Your language,</span>
            <br />your roots.
          </h1>
          <p className="mt-6 text-xl sm:text-2xl text-neutral-400 font-medium">
            70+ African languages. Audio-first. Free.
          </p>
          <p className="mt-3 text-sm text-neutral-600">
            Built with native speakers. Used by diaspora communities worldwide.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up" className="btn-primary px-8 py-3.5 text-base shadow-glow">
              Start Learning Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="btn-ghost px-8 py-3.5 text-base border border-white/[0.10]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
          {STATS.map((s) => (
            <div key={s.value} className="flex flex-col items-center py-6 sm:py-0">
              <span className="text-4xl font-extrabold gradient-text">{s.value}</span>
              <span className="mt-1 text-sm text-neutral-500 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature pillars */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Built differently.
          </h2>
          <p className="text-center text-neutral-500 mb-12 max-w-xl mx-auto">
            Most apps are built for European languages. Beeli was built for Africa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="surface-raised highlight-top p-7 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.05]">
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Language showcase */}
      <section className="relative py-20 px-4 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Your language is here.
          </h2>
          <p className="text-neutral-500 mb-12">
            From the Niger Delta to the Horn of Africa — and everywhere the diaspora calls home.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {LANGUAGES.map((l) => (
              <div
                key={l.name}
                className="glass rounded-2xl px-5 py-4 text-left min-w-[120px]"
              >
                <div className="font-bold text-white text-sm">{l.name}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{l.region}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Beeli */}
      <section className="relative py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="surface-brand relative p-8 sm:p-12 text-center overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
            <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-8">
              The Beeli difference
            </p>
            <div className="flex items-center justify-center gap-8 sm:gap-16 mb-10">
              <div className="text-center">
                <div className="text-5xl font-extrabold text-neutral-600">4</div>
                <div className="text-xs text-neutral-600 mt-1">Other apps</div>
              </div>
              <div className="text-2xl text-neutral-700 font-light">vs</div>
              <div className="text-center">
                <div className="text-5xl font-extrabold gradient-text">70+</div>
                <div className="text-xs text-brand-400 mt-1 font-semibold">Beeli</div>
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              Duolingo covers 4 African languages.
              <br />
              <span className="gradient-text">We cover 70+.</span>
            </h3>
            <p className="mt-4 text-neutral-500 text-sm max-w-md mx-auto">
              African languages aren&apos;t an afterthought. They&apos;re the whole point.
            </p>
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="relative py-28 px-4 text-center">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
            Start learning your
            <br />
            <span className="gradient-text-gold">mother tongue.</span>
          </h2>
          <p className="text-neutral-500 mb-10 text-lg">
            Free forever. No credit card. Start in 60 seconds.
          </p>
          <Link href="/sign-up" className="btn-primary px-10 py-4 text-base shadow-glow-lg">
            Start Learning Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
          <span>© {new Date().getFullYear()} Beeli. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-neutral-400 transition-colors">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-neutral-400 transition-colors">
              Support
            </Link>
            <Link href="/for-educators" className="hover:text-neutral-400 transition-colors">
              For Educators
            </Link>
            <Link
              href="/sign-up"
              className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
