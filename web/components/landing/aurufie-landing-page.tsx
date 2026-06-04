"use client";

import {
  Archive,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Headphones,
  Mic,
  Play,
  Shield,
  Star,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Scroll reveal ─────────────────────────────────────────────────────────────

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

// ── Fractal background ────────────────────────────────────────────────────────

function FractalBackground() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.025] select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="aurufie-tri" x="0" y="0" width="80" height="69.28" patternUnits="userSpaceOnUse">
          <polygon points="40,0 80,69.28 0,69.28" fill="none" stroke="rgb(168,85,247)" strokeWidth="0.5" />
          <polygon points="0,0 40,69.28 80,0" fill="none" stroke="rgb(168,85,247)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#aurufie-tri)" />
    </svg>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-brand-400 mb-4">
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. HERO SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-neutral-950">
      <div className="grain-overlay" />
      <FractalBackground />

      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[800px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, rgb(168,85,247) 0%, transparent 70%)" }} />
      </div>

      {/* Orbit decoration */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="w-[560px] h-[560px] rounded-full border border-brand-500/10"
          style={{ animation: "spin-slow 60s linear infinite" }}
        />
        <div
          className="absolute w-[440px] h-[440px] rounded-full border border-amber-500/8"
          style={{ animation: "spin-slow 90s linear infinite reverse" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 border border-brand-500/20 rounded-full px-4 py-1.5 mb-10"
          style={{ background: "rgba(168,85,247,0.06)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-400">
            Aurufie · Language Preservation Platform
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-[-0.02em] text-white mb-6">
          Reconnect With Your Language.{" "}
          <span className="gradient-text-gold italic">Help Keep It Alive.</span>
        </h1>

        {/* Subtext */}
        <p className="font-sans text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Aurufie is a community-driven platform preserving underrepresented languages
          through learning, storytelling, and cultural memory.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 shadow-glow-md hover:shadow-glow-lg"
          >
            Start Learning
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/contribute"
            className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:bg-white/5"
          >
            Contribute Your Language
          </Link>
        </div>

        {/* Secondary CTA */}
        <a
          href="#media"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-white text-sm font-medium transition-colors duration-200"
        >
          Watch Stories
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SOCIAL PROOF STRIP
// ═══════════════════════════════════════════════════════════════════════════════

function StatCounter({
  target,
  suffix = "",
  label,
  start,
}: {
  target: number;
  suffix?: string;
  label: string;
  start: boolean;
}) {
  const value = useCountUp(target, 1600, start);
  return (
    <div className="flex flex-col items-center gap-1 px-8 py-6">
      <span className="font-display text-4xl sm:text-5xl text-white tabular-nums">
        {value.toLocaleString()}{suffix}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{label}</span>
    </div>
  );
}

function SocialProofStrip() {
  const { ref, visible } = useReveal(0.3);
  return (
    <div
      ref={ref}
      className="border-y border-white/[0.06] bg-neutral-950/80 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.1s" }}
        >
          <StatCounter target={70} suffix="+" label="Languages Supported" start={visible} />
          <StatCounter target={1240} label="Contributors" start={visible} />
          <StatCounter target={8500} label="Audio Recordings" start={visible} />
          <StatCounter target={320} label="Stories Preserved" start={visible} />
        </div>
        <div className="text-center py-3 border-t border-white/[0.04]">
          <span className="font-mono text-[10px] text-neutral-600 tracking-[0.2em] uppercase">
            Built with Devekeme funding
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MEDIA LAYER
// ═══════════════════════════════════════════════════════════════════════════════

type MediaTab = "watch" | "listen" | "stories";

const MEDIA_TABS: { id: MediaTab; label: string; icon: React.ReactNode }[] = [
  { id: "watch", label: "Watch", icon: <Play className="w-4 h-4" /> },
  { id: "listen", label: "Listen", icon: <Headphones className="w-4 h-4" /> },
  { id: "stories", label: "Stories", icon: <Volume2 className="w-4 h-4" /> },
];

const MEDIA_CONTENT: Record<
  MediaTab,
  { cards: { title: string; meta: string }[]; cta: string; ctaHref: string; desc: string }
> = {
  watch: {
    desc: "Mini lessons and cultural storytelling clips from native speakers — the Reconnect series.",
    cta: "Learn through real voices",
    ctaHref: "/learn",
    cards: [
      { title: "Izon: Greeting Rituals", meta: "Mini Lesson · 4 min" },
      { title: "Yoruba Proverbs Explained", meta: "Cultural Clip · 7 min" },
      { title: "The Reconnect Series — Ep. 1", meta: "Documentary · 12 min" },
      { title: "Swahili Coast Stories", meta: "Mini Lesson · 5 min" },
    ],
  },
  listen: {
    desc: "Elder interviews, language discussions, and diaspora identity episodes — available free.",
    cta: "Hear the language behind the lessons",
    ctaHref: "/listen",
    cards: [
      { title: "Voices of the Delta", meta: "Podcast · Episode 8" },
      { title: "An Elder Remembers", meta: "Interview · 34 min" },
      { title: "Language & Identity in London", meta: "Discussion · 28 min" },
      { title: "The Last Fluent Speakers", meta: "Documentary Audio · 45 min" },
    ],
  },
  stories: {
    desc: "Short films — cultural narratives, mythology, and diaspora reconnection stories.",
    cta: "Experience language as culture",
    ctaHref: "/stories",
    cards: [
      { title: "The Fisherman's Riddle", meta: "Short Film · 8 min" },
      { title: "Mother Tongue", meta: "Diaspora Story · 11 min" },
      { title: "Myths of the Creek", meta: "Mythology · 6 min" },
      { title: "Three Generations", meta: "Documentary · 14 min" },
    ],
  },
};

function MediaCard({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="glass-dark rounded-xl p-5 flex flex-col gap-3 cursor-pointer group hover:scale-[1.02] transition-transform duration-200 border border-white/[0.06] hover:border-brand-500/20">
      <div className="w-full aspect-video rounded-lg bg-white/[0.03] flex items-center justify-center border border-white/[0.04] group-hover:border-brand-500/15 transition-colors duration-200">
        <Play className="w-8 h-8 text-white/20 group-hover:text-brand-400 transition-colors duration-200" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white leading-snug">{title}</p>
        <p className="text-[11px] font-mono text-neutral-500 mt-1 uppercase tracking-[0.12em]">{meta}</p>
      </div>
    </div>
  );
}

function MediaLayer() {
  const [active, setActive] = useState<MediaTab>("watch");
  const content = MEDIA_CONTENT[active];

  return (
    <section id="media" className="py-24 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel>Media</SectionLabel>
          <h2 className="font-display text-4xl sm:text-5xl text-white mb-4 tracking-[-0.01em]">
            The language, in its own voice.
          </h2>
        </Reveal>

        {/* Tab switcher */}
        <Reveal delay={100}>
          <div className="flex gap-1 p-1 rounded-full border border-white/[0.08] bg-white/[0.02] w-fit mt-8 mb-12">
            {MEDIA_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  active === tab.id
                    ? "bg-brand-600 text-white shadow-glow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Panel */}
        <div
          key={active}
          style={{ animation: "fade-in 0.35s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <p className="text-neutral-400 text-base mb-8 max-w-xl">{content.desc}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {content.cards.map((card) => (
              <MediaCard key={card.title} {...card} />
            ))}
          </div>
          <Link
            href={content.ctaHref}
            className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-semibold text-sm transition-colors duration-200"
          >
            {content.cta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PROBLEM SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const PROBLEM_BULLETS = [
  "No structured learning tools for underrepresented languages",
  "No audio preservation systems built for communities",
  "No centralized cultural archive accessible to diaspora",
  "No digital access for heritage learners abroad",
];

function ProblemSection() {
  return (
    <section id="problem" className="py-24 border-y border-white/[0.05] bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left — pull quote */}
          <Reveal>
            <blockquote className="font-display italic text-3xl sm:text-4xl text-white/80 leading-[1.25] tracking-[-0.01em]">
              &ldquo;Thousands of languages are disappearing from the digital world — not because
              they are no longer spoken, but because they are no longer documented, taught,
              or accessible.&rdquo;
            </blockquote>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-amber-500/50">
              The Crisis
            </p>
          </Reveal>

          {/* Right — bullets */}
          <Reveal delay={150}>
            <SectionLabel>The Problem</SectionLabel>
            <ul className="space-y-5 mt-2">
              {PROBLEM_BULLETS.map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <span className="mt-0.5 text-amber-500 font-bold text-lg leading-none select-none">×</span>
                  <span className="text-neutral-300 text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-12">
              <a
                href="#solution"
                className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors duration-200"
              >
                See how Aurufie is rebuilding language infrastructure
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SOLUTION LAYER
// ═══════════════════════════════════════════════════════════════════════════════

const SOLUTION_PILLARS = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    name: "Learn",
    subtitle: "Beeli",
    desc: "Structured, audio-first courses built around real voices, cultural context, and community knowledge.",
    href: "/learn",
    color: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.2)",
    accent: "#a855f7",
  },
  {
    icon: <Headphones className="w-6 h-6" />,
    name: "Listen",
    subtitle: "Audio Library",
    desc: "An ever-growing archive of native speech, elder recordings, oral histories, and language discussions.",
    href: "/listen",
    color: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    accent: "#f59e0b",
  },
  {
    icon: <Archive className="w-6 h-6" />,
    name: "Explore",
    subtitle: "Cultural Archive",
    desc: "Stories, proverbs, mythology, and material culture — a living record of each language's world.",
    href: "/archive",
    color: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    accent: "#10b981",
  },
  {
    icon: <Mic className="w-6 h-6" />,
    name: "Contribute",
    subtitle: "Community System",
    desc: "Record, review, translate, and teach — every contribution builds the infrastructure for the next generation.",
    href: "/contribute",
    color: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.2)",
    accent: "#6366f1",
  },
];

function SolutionLayer() {
  return (
    <section id="solution" className="py-24 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel>The Platform</SectionLabel>
          <h2 className="font-display text-4xl sm:text-5xl text-white mb-4 tracking-[-0.01em]">
            Aurufie is built on 4 connected systems.
          </h2>
          <p className="text-neutral-400 text-lg max-w-xl mb-16">
            Each system reinforces the others — learning feeds the archive, contributors power learning.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SOLUTION_PILLARS.map((pillar, i) => (
            <Reveal key={pillar.name} delay={i * 80}>
              <Link
                href={pillar.href}
                className="group flex flex-col h-full rounded-2xl p-6 border transition-all duration-300 hover:shadow-glow-md"
                style={{
                  background: pillar.color,
                  borderColor: pillar.border,
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: `${pillar.accent}20`, color: pillar.accent }}
                >
                  {pillar.icon}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: pillar.accent }}>
                  {pillar.subtitle}
                </p>
                <h3 className="font-display text-2xl text-white mb-3">{pillar.name}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed flex-1">{pillar.desc}</p>
                <div className="mt-5 flex items-center gap-1 text-sm font-semibold transition-colors duration-200" style={{ color: pillar.accent }}>
                  Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-150" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CONTRIBUTION ECONOMY
// ═══════════════════════════════════════════════════════════════════════════════

const CONTRIBUTION_BENEFITS = [
  {
    icon: <Star className="w-5 h-5" />,
    title: "Status",
    desc: "XP, titles, and recognition visible across the platform and community.",
    color: "#f59e0b",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Access",
    desc: "Beeli Plus, early features, and priority content — earned, not purchased.",
    color: "#a855f7",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Rights",
    desc: "Reviewing privileges and Language Steward roles for top contributors.",
    color: "#6366f1",
  },
  {
    icon: <Archive className="w-5 h-5" />,
    title: "Shells",
    desc: "In-app currency redeemable for rewards, unlocks, and future access tiers.",
    color: "#10b981",
  },
];

function ContributionEconomy() {
  return (
    <section className="py-24 relative overflow-hidden bg-neutral-950">
      {/* Purple accent glow */}
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, rgb(168,85,247) 0%, transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <Reveal>
            <SectionLabel>Contributor Economy</SectionLabel>
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-6 tracking-[-0.01em]">
              You don&apos;t just learn the language.{" "}
              <span className="gradient-text italic">You help build it.</span>
            </h2>
            <p className="text-neutral-400 text-base mb-8 leading-relaxed">
              Aurufie is fully funded by Devekeme during its early phase. Instead of cash payments,
              contributors receive recognition, access, and future value within the platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contribute"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-glow-md hover:shadow-glow-lg text-sm"
              >
                Become a Contributor
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contribute#xp"
                className="inline-flex items-center gap-2 border border-brand-500/25 hover:border-brand-500/50 text-brand-300 font-semibold px-6 py-3 rounded-full transition-all duration-200 text-sm"
              >
                Start Earning XP
              </Link>
            </div>
          </Reveal>

          {/* Right — benefits */}
          <Reveal delay={120}>
            <div className="space-y-4">
              {CONTRIBUTION_BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${b.color}18`, color: b.color }}
                  >
                    {b.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-1">{b.title}</h4>
                    <p className="text-neutral-500 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. LEARNING SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const LEARNING_FEATURES = [
  { icon: <BookOpen className="w-5 h-5" />, title: "Structured lessons", desc: "Progressive curriculum designed with educators and native speakers." },
  { icon: <Volume2 className="w-5 h-5" />, title: "Audio-first learning", desc: "Every lesson begins with the sound of the language — not a textbook." },
  { icon: <Archive className="w-5 h-5" />, title: "Cultural context", desc: "Vocabulary, proverbs, and meaning embedded in real cultural moments." },
  { icon: <Mic className="w-5 h-5" />, title: "Stories & real usage", desc: "Learn through oral literature, folklore, and authentic community speech." },
];

function LearningSection() {
  return (
    <section className="py-24 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel>Beeli · Learning</SectionLabel>
          <h2 className="font-display text-4xl sm:text-5xl text-white mb-4 tracking-[-0.01em]">
            Learn your language through{" "}
            <span className="gradient-text-gold italic">real voices.</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-xl mb-16">
            Beeli is Aurufie&apos;s learning engine — structured, culturally grounded, and built
            for diaspora learners reconnecting with their heritage.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {LEARNING_FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div className="surface rounded-2xl p-6 h-full flex flex-col gap-4 hover:shadow-glow-md transition-shadow duration-300">
                <div className="w-10 h-10 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed flex-1">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 shadow-glow-md hover:shadow-glow-lg"
            >
              Start Learning Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/learn#plus"
              className="font-semibold text-sm transition-colors duration-200"
              style={{ color: "#f59e0b" }}
            >
              Upgrade to Beeli Plus →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. EDUCATOR SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const EDUCATOR_BENEFITS = [
  "Create courses and lessons using your own language knowledge",
  "Gain XP and recognition as a verified contributor",
  "Become eligible for Language Steward roles",
  "Earn future revenue share as a select creator",
];

function EducatorSection() {
  return (
    <section className="py-24 border-y border-white/[0.05] bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <Reveal>
            <SectionLabel>Educators & Creators</SectionLabel>
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-6 tracking-[-0.01em]">
              Your knowledge is{" "}
              <span className="gradient-text italic">infrastructure.</span>
            </h2>
            <p className="text-neutral-400 text-base mb-8 leading-relaxed">
              Join educators, elders, and cultural experts building the future of your language.
              Your contributions become the foundation others learn from.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/for-educators"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-3 rounded-full transition-all duration-200 text-sm shadow-glow-gold"
              >
                <GraduationCap className="w-4 h-4" />
                Become an Educator
              </Link>
              <Link
                href="/contribute"
                className="inline-flex items-center gap-2 border border-amber-500/25 hover:border-amber-500/50 text-amber-400 font-semibold px-6 py-3 rounded-full transition-all duration-200 text-sm"
              >
                Contribute Content
              </Link>
            </div>
          </Reveal>

          {/* Right — benefits */}
          <Reveal delay={120}>
            <ul className="space-y-5">
              {EDUCATOR_BENEFITS.map((b, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono">
                    {i + 1}
                  </div>
                  <p className="text-neutral-300 text-base leading-relaxed">{b}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. INSTITUTIONAL SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const INSTITUTION_FEATURES = [
  "Classroom tools for structured group learning",
  "Progress tracking and learner analytics",
  "Structured curriculum aligned with cultural context",
  "Cultural integration for heritage language programs",
];

function InstitutionalSection() {
  return (
    <section className="py-24 bg-neutral-900/50">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel>Institutions</SectionLabel>
          <h2 className="font-display text-4xl sm:text-5xl text-white mb-4 tracking-[-0.01em] max-w-2xl">
            A platform for teaching, preserving, and scaling language education.
          </h2>
          <p className="text-neutral-400 text-lg max-w-xl mb-12">
            Schools, universities, NGOs, and cultural organisations — Aurufie provides
            the infrastructure for serious language programming.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-4 mb-12 max-w-2xl">
          {INSTITUTION_FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                <p className="text-neutral-300 text-sm">{f}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact?type=institution"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 shadow-glow-md hover:shadow-glow-lg"
            >
              <Building2 className="w-4 h-4" />
              Partner With Aurufie
            </Link>
            <Link
              href="/contact?type=access"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:bg-white/5"
            >
              Request Institutional Access
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. COMMUNITY PROOF
// ═══════════════════════════════════════════════════════════════════════════════

function CommunityProof() {
  const { ref, visible } = useReveal(0.2);
  return (
    <section ref={ref} className="py-24 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel>Community</SectionLabel>
          <h2 className="font-display text-4xl sm:text-5xl text-white mb-4 tracking-[-0.01em]">
            A living ecosystem.
          </h2>
          <p className="text-neutral-400 text-lg max-w-xl mb-16">
            Every week, contributors around the world add to the archive. Here&apos;s what&apos;s happened recently.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Top Contributors", stat: "1,240+", meta: "All time", icon: <Users className="w-5 h-5" />, color: "#a855f7" },
            { label: "Languages Active", stat: "70+", meta: "Being built now", icon: <Star className="w-5 h-5" />, color: "#f59e0b" },
            { label: "Stories Added", stat: "47", meta: "This month", icon: <Archive className="w-5 h-5" />, color: "#10b981" },
            { label: "New Recordings", stat: "312", meta: "Last 30 days", icon: <Mic className="w-5 h-5" />, color: "#6366f1" },
          ].map((card, i) => (
            <Reveal key={card.label} delay={i * 80}>
              <div className="surface rounded-2xl p-6 flex flex-col gap-4 hover:shadow-glow-md transition-shadow duration-300">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.color}18`, color: card.color }}
                >
                  {card.icon}
                </div>
                <div>
                  <p
                    className="font-display text-4xl text-white tabular-nums"
                    style={{ opacity: visible ? 1 : 0, transition: `opacity 0.6s ease ${i * 100}ms` }}
                  >
                    {card.stat}
                  </p>
                  <p className="font-semibold text-white text-sm mt-1">{card.label}</p>
                  <p className="text-neutral-500 text-xs font-mono uppercase tracking-[0.14em] mt-0.5">{card.meta}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. FINAL CTA
// ═══════════════════════════════════════════════════════════════════════════════

const FINAL_LANES = [
  {
    label: "I am here to learn",
    cta: "Start Beeli — free",
    href: "/learn",
    desc: "Structured lessons, audio-first courses, and cultural depth — start at any level.",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(99,102,241,0.10) 100%)",
    border: "rgba(168,85,247,0.25)",
    accent: "#a855f7",
    glow: "shadow-glow-md",
  },
  {
    label: "I am here to contribute",
    cta: "Join Contributor System",
    href: "/contribute",
    desc: "Record, review, translate, and teach — earn XP, Shells, and stewardship roles.",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(239,68,68,0.08) 100%)",
    border: "rgba(245,158,11,0.25)",
    accent: "#f59e0b",
    glow: "shadow-glow-gold",
  },
  {
    label: "I am an institution",
    cta: "Request partnership",
    href: "/contact?type=institution",
    desc: "Classroom tools, progress tracking, and curriculum — for schools, universities, and NGOs.",
    gradient: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.08) 100%)",
    border: "rgba(16,185,129,0.2)",
    accent: "#10b981",
    glow: "shadow-glow-sm",
  },
];

function FinalCTA() {
  return (
    <section className="py-24 bg-neutral-950 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-10"
          style={{ background: "radial-gradient(ellipse at center bottom, rgb(168,85,247) 0%, transparent 60%)" }} />
      </div>
      <div className="grain-overlay" />

      <div className="relative max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-16">
            <SectionLabel>Join Aurufie</SectionLabel>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white tracking-[-0.02em]">
              Where do you begin?
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {FINAL_LANES.map((lane, i) => (
            <Reveal key={lane.label} delay={i * 100}>
              <div
                className={`flex flex-col rounded-2xl p-8 border h-full transition-all duration-300 hover:scale-[1.015] hover:${lane.glow}`}
                style={{ background: lane.gradient, borderColor: lane.border }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] mb-4" style={{ color: lane.accent }}>
                  {lane.label}
                </p>
                <p className="text-neutral-400 text-sm leading-relaxed flex-1 mb-8">{lane.desc}</p>
                <Link
                  href={lane.href}
                  className="inline-flex items-center justify-center gap-2 font-bold py-3.5 px-6 rounded-full transition-all duration-200 text-sm"
                  style={{
                    background: `${lane.accent}20`,
                    border: `1px solid ${lane.accent}40`,
                    color: lane.accent,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = `${lane.accent}30`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = `${lane.accent}20`;
                  }}
                >
                  {lane.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AurufieLandingPage() {
  return (
    <main className="bg-neutral-950 text-white min-h-screen overflow-x-hidden">
      <HeroSection />
      <SocialProofStrip />
      <MediaLayer />
      <ProblemSection />
      <SolutionLayer />
      <ContributionEconomy />
      <LearningSection />
      <EducatorSection />
      <InstitutionalSection />
      <CommunityProof />
      <FinalCTA />
    </main>
  );
}
