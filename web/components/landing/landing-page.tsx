"use client";

import { ArrowRight, BookOpen, Globe, GraduationCap, Headphones, Languages, Mic, Monitor, Search, Smartphone, Users, Volume2 } from "lucide-react";
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
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── #2 — Animated counter ─────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, trigger: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    const raf = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [trigger, target, duration]);
  return count;
}

// Parse "70+", "500M+", "7" → { num: 70, suffix: "+" } etc.
function parseStat(value: string): { num: number; suffix: string } {
  const m = value.match(/^([\d.]+)(M\+|\+|)?$/);
  if (!m) return { num: 0, suffix: value };
  const raw = parseFloat(m[1]);
  const unit = m[2] ?? "";
  if (unit.includes("M")) return { num: raw, suffix: "M+" };
  return { num: raw, suffix: unit };
}

function AnimatedStat({ value, label, refLabel }: { value: string; label: string; refLabel: string }) {
  const { ref, visible } = useReveal();
  const { num, suffix } = parseStat(value);
  const count = useCountUp(num, 1600, visible);
  return (
    <div ref={ref} className="flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.28em] text-neutral-700 mb-3 font-medium">
        {refLabel}
      </span>
      <span className="font-display font-bold text-5xl text-amber-400 leading-none tabular-nums">
        {count}{suffix}
      </span>
      <span className="mt-3 text-sm text-neutral-500">{label}</span>
    </div>
  );
}

// ── #3 — Language cycling hero ────────────────────────────────────────────────

const HERO_PHRASES = [
  { text: "Your language",    lang: "English" },
  { text: "Ède rẹ",           lang: "Yoruba" },
  { text: "Asụsụ gị",        lang: "Igbo" },
  { text: "Lugha yako",       lang: "Swahili" },
  { text: "Luqadaada",        lang: "Somali" },
  { text: "ቋንቋህ",             lang: "Amharic" },
  { text: "Wo kasa",          lang: "Twi" },
  { text: "Enị beeli",          lang: "Izon" },
];

function CyclingHeroLine() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;

    if (phase === "in") {
      // hold for 2.4s then start out
      t = setTimeout(() => setPhase("out"), 2400);
    } else if (phase === "out") {
      // wait for exit transition (400ms) then advance index
      t = setTimeout(() => {
        setIndex((i) => (i + 1) % HERO_PHRASES.length);
        setPhase("in");
      }, 420);
    }
    return () => clearTimeout(t);
  }, [phase, index]);

  const current = HERO_PHRASES[index];
  const isIn = phase === "in";

  return (
    <div className="relative overflow-visible" style={{ minHeight: "1.25em", paddingBottom: "0.2em" }}>
      {/* Main text */}
      <span
        className="block font-display font-bold leading-[1.05] tracking-tight text-white"
        style={{
          fontSize: "clamp(3.5rem,9vw,7.5rem)",
          opacity: isIn ? 1 : 0,
          transform: isIn ? "translateY(0)" : "translateY(-18px)",
          transition: "opacity 0.38s cubic-bezier(0.16,1,0.3,1), transform 0.38s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {current.text}
      </span>

      {/* Language name pill — fades alongside the text */}
      <span
        className="absolute bottom-0 right-0 text-[10px] uppercase tracking-[0.22em] text-amber-500/50 font-semibold"
        style={{
          opacity: isIn && index !== 0 ? 0.8 : 0,
          transition: "opacity 0.38s ease",
        }}
      >
        {current.lang}
      </span>
    </div>
  );
}

// ── Circular orbit text (Wispr-style) ────────────────────────────────────────

function CircularOrbit({ text, radius = 130 }: { text: string; radius?: number }) {
  const size = (radius + 18) * 2;
  const cx = radius + 18;
  const arc = `M ${cx},${cx} m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`;
  return (
    <svg
      width={size} height={size}
      aria-hidden
      className="animate-spin-slow select-none pointer-events-none"
    >
      <defs><path id="orbit-path" d={arc} fill="none" /></defs>
      <text fontSize="10" letterSpacing="3" fontWeight="500">
        <textPath href="#orbit-path" className="fill-neutral-700 uppercase">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

// ── Word-by-word audio demo strip (Wispr-style) ───────────────────────────────

const DEMO_PHRASES = [
  { words: ["Ẹ", "káàbọ̀", "sí", "ilé", "-", "welcome", "home"], badge: "Yoruba" },
  { words: ["Karibu", "kujifunza", "-", "welcome", "to", "learn"], badge: "Swahili" },
  { words: ["Nnọọ", "n'asụsụ", "gị", "-", "hear", "your", "tongue"], badge: "Igbo" },
  { words: ["Akwaaba", "-", "you", "are", "welcome", "here"], badge: "Twi" },
  { words: ["Nụa", "ẹbodẹ-a", "-", "welcome,", "welcome"], badge: "Izon" }
];

function AudioDemoStrip() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const phrase = DEMO_PHRASES[phraseIdx];
    if (wordIdx < phrase.words.length) {
      const t = setTimeout(() => setWordIdx((w) => w + 1), 280);
      return () => clearTimeout(t);
    }
    // all words shown — show badge after short pause
    const t1 = setTimeout(() => setShowBadge(true), 350);
    // hold then advance to next phrase
    const t2 = setTimeout(() => {
      setShowBadge(false);
      setWordIdx(0);
      setPhraseIdx((i) => (i + 1) % DEMO_PHRASES.length);
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phraseIdx, wordIdx]);

  const phrase = DEMO_PHRASES[phraseIdx];
  const visibleWords = phrase.words.slice(0, wordIdx);

  return (
    <div className="relative flex items-center gap-3 mt-10">
      {/* Waveform pill */}
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
        <div className="flex items-end gap-[2px] h-4">
          {[3,5,7,5,8,4,6,3,5,7].map((h, i) => (
            <div
              key={i}
              className="w-[2px] bg-amber-500/60 rounded-full"
              style={{ height: `${h * 2}px`, animation: `pulse-glow ${0.4 + i * 0.07}s ease-in-out infinite alternate` }}
            />
          ))}
        </div>
      </div>

      {/* Words + badge */}
      <div className="relative min-h-[2rem] flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {visibleWords.map((word, i) => (
          <span
            key={`${phraseIdx}-${i}`}
            className="text-sm font-medium text-neutral-300"
            style={{ animation: "fade-in 0.18s ease-out both" }}
          >
            {word}
          </span>
        ))}
        {showBadge && (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-400 font-semibold"
            style={{ animation: "scale-in 0.22s ease-out both" }}
          >
            <Volume2 className="h-2.5 w-2.5" />
            {phrase.badge} · Native speaker audio
          </span>
        )}
      </div>
    </div>
  );
}

// ── Interactive persona pill selector (Wispr-style) ──────────────────────────

function PersonaPillSelector() {
  const [active, setActive] = useState(0);
  const current = PERSONAS[active];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Pills */}
      <div className="flex flex-wrap gap-3">
        {PERSONAS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActive(i)}
            className={[
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-200",
              active === i
                ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                : "bg-white/[0.03] border-white/[0.08] text-neutral-500 hover:border-white/20 hover:text-neutral-300",
            ].join(" ")}
          >
            <p.icon className="h-3.5 w-3.5" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div
        key={active}
        className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 overflow-hidden"
        style={{ animation: "fade-in 0.28s ease-out both" }}
      >
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <span className="text-[10px] uppercase tracking-[0.28em] text-amber-600/70 font-semibold">
          {current.label}
        </span>
        <h3 className="font-display font-bold text-2xl text-white mt-3 mb-3 leading-snug">
          {current.headline}
        </h3>
        <p className="text-sm text-neutral-500 leading-relaxed">{current.desc}</p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-1.5 mt-6 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          Start free <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "70+",   label: "African Languages", ref: "Cat. No. 001" },
  { value: "7",     label: "Regions Covered",   ref: "Cat. No. 002" },
  { value: "500M+", label: "Diaspora Speakers", ref: "Cat. No. 003" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Search,
    title: "Find your language",
    desc: "Browse 70+ African languages by name, region, or dialect. Chances are yours is already here.",
  },
  {
    step: "02",
    icon: Headphones,
    title: "Hear it first",
    desc: "Every word is recorded by native speakers. You train your ear before your eye. Sound before script.",
  },
  {
    step: "03",
    icon: Mic,
    title: "Speak with confidence",
    desc: "Practice pronunciation, build vocabulary, and track your progress — free, forever.",
  },
];

const PERSONAS = [
  {
    icon: Globe,
    label: "Diaspora",
    headline: "Reconnect with home",
    desc: "Millions of Africans abroad grew up without access to their mother tongue. Beeli closes that gap.",
  },
  {
    icon: Users,
    label: "Heritage Learners",
    headline: "It's your language",
    desc: "You hear it at family gatherings but never formally learned it. Start now — no textbook required.",
  },
  {
    icon: GraduationCap,
    label: "Educators",
    headline: "Teach it properly",
    desc: "Build structured lessons backed by native-speaker audio. Import to your class in minutes.",
  },
  {
    icon: BookOpen,
    label: "Researchers",
    headline: "Document, preserve",
    desc: "African languages are disappearing at speed. Contribute audio, vocabulary, and context to keep them alive.",
  },
];

const FEATURES = [
  {
    roman: "I",
    icon: Volume2,
    title: "Audio-First Learning",
    desc: "Every word recorded by native speakers. Segment-synced transcripts. Train your ear before your eye.",
  },
  {
    roman: "II",
    icon: Globe,
    title: "Cultural Depth",
    desc: "Language is culture. Learn Adinkra symbols, Ge'ez script, oral proverbs, and the stories behind the words.",
  },
  {
    roman: "III",
    icon: Users,
    title: "Community-Powered",
    desc: "Native speakers earn XP for contributing vocabulary and audio. The community builds the platform.",
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
  { name: "Fula", region: "West Africa" },
  { name: "Shona", region: "Southern Africa" },
];

const TICKER_LANGS = [
  "Yoruba", "Igbo", "Swahili", "Hausa", "Amharic", "Izon", "Twi",
  "Wolof", "Somali", "Zulu", "Fula", "Shona", "Kikuyu", "Lingala", "Bambara",
];

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="w-10 h-px bg-amber-500/50" />
      <span className="text-[10px] uppercase tracking-[0.32em] text-amber-500/70 font-semibold">
        {children}
      </span>
    </div>
  );
}

// ── Landing page ──────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06060e] text-neutral-50 overflow-x-hidden">

      {/* ── #1 Film grain overlay ── */}
      <div aria-hidden className="grain-overlay" />

      {/* Ambient layers */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-amber-900/[0.18] blur-[180px] animate-aurora" />
        <div className="absolute top-1/2 -left-48 w-96 h-96 rounded-full bg-brand-900/20 blur-[130px]" />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 rounded-full bg-amber-800/[0.12] blur-[110px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 glass-dark border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-[0_0_20px_-4px_rgb(245_158_11_/0.5)]">
                <Languages className="h-4 w-4 text-white" />
              </div>
              <span className="font-display font-bold text-white text-xl tracking-tight">Beeli</span>
            </div>
            <Link
              href="/for-educators"
              className="hidden sm:block text-[11px] uppercase tracking-widest text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              For Educators
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="btn-ghost text-sm">Sign In</Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_24px_-6px_rgb(245_158_11_/0.5)] hover:shadow-[0_0_36px_-6px_rgb(245_158_11_/0.7)]"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center px-6 py-32 overflow-hidden">
        {/* Circular orbit — positioned left of headline, like Wispr */}
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 hidden lg:block opacity-60">
          <CircularOrbit text="Hear it · Speak it · Live it · Hear it · Speak it · Live it · " radius={120} />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-3xl animate-fade-in">
            <SectionLabel>Collection No. 001 — African Languages</SectionLabel>

            {/* ── #3 Language cycling headline ── */}
            <h1 className="font-display font-bold leading-[0.92] tracking-tight">
              <CyclingHeroLine />
              <span
                className="block text-amber-400"
                style={{ fontSize: "clamp(3.5rem,9vw,7.5rem)" }}
              >
                lives here.
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-neutral-400 max-w-lg leading-relaxed">
              70+ African languages. Audio-first. Built with native speakers.
              Free forever.
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              From the Niger Delta to the Horn of Africa — and everywhere the diaspora calls home.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_60px_-12px_rgb(245_158_11_/0.65)] hover:shadow-[0_0_80px_-12px_rgb(245_158_11_/0.85)]"
              >
                Start Learning Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
              >
                Sign In
              </Link>
            </div>

            {/* Word-by-word audio demo strip */}
            <AudioDemoStrip />

            {/* Platform availability badges */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.28em] text-neutral-700 font-medium">Available on</span>
              {[
                { icon: Smartphone, label: "iOS" },
                { icon: Smartphone, label: "Android" },
                { icon: Monitor,    label: "Web" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] text-neutral-500"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Decorative letterform */}
          <div
            aria-hidden
            className="absolute right-0 bottom-0 hidden lg:flex items-end opacity-[0.03] select-none pointer-events-none overflow-hidden h-[70vh]"
          >
            <span
              className="font-display font-bold leading-none text-white"
              style={{ fontSize: "clamp(18rem, 28vw, 32rem)", lineHeight: 0.85 }}
            >
              Aː
            </span>
          </div>
        </div>
      </section>

      {/* ── #2 Stats band with animated counters ── */}
      <section className="relative border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <div
              key={s.value}
              className={`flex flex-col py-10 sm:px-12 ${i > 0 ? "sm:border-l border-white/[0.06]" : ""}`}
            >
              <AnimatedStat value={s.value} label={s.label} refLabel={s.ref} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Language ticker ── */}
      <div className="relative border-b border-white/[0.04] overflow-hidden py-4 bg-white/[0.01]">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#06060e] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#06060e] to-transparent z-10 pointer-events-none" />
        <div className="flex items-center animate-ticker" style={{ width: "max-content" }}>
          {[...TICKER_LANGS, ...TICKER_LANGS].map((lang, i) => (
            <span key={i} className="flex items-center gap-5 px-5">
              <span className="text-[11px] text-neutral-600 uppercase tracking-[0.22em] whitespace-nowrap font-medium">
                {lang}
              </span>
              <span className="w-1 h-1 rounded-full bg-amber-500/35 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="relative py-28 px-6 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16">
              <SectionLabel>How It Works</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                Three steps. One language.
              </h2>
              <p className="mt-4 text-neutral-500 max-w-sm text-sm leading-relaxed">
                No app store required to try it. Free forever. No card.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.06]">
            {HOW_IT_WORKS.map((item, i) => (
              <Reveal key={item.step} delay={i * 100}>
                <div className="group relative bg-[#06060e] p-10 h-full hover:bg-white/[0.02] transition-colors duration-300">
                  <div className="absolute top-8 right-9 font-display font-bold text-6xl text-white/[0.04] leading-none select-none">
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                    <item.icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature halls ── */}
      <section className="relative py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16">
              <SectionLabel>Exhibition Halls</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                Built differently.
              </h2>
              <p className="mt-4 text-neutral-500 max-w-sm text-sm leading-relaxed">
                Most apps are built for European languages. Beeli was built for Africa.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 110}>
                <div className="group relative h-full bg-white/[0.025] border border-white/[0.06] rounded-2xl p-8 hover:border-amber-500/25 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden">
                  <span className="absolute top-6 right-7 text-[10px] uppercase tracking-[0.28em] text-neutral-700 font-medium">
                    {f.roman}
                  </span>
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent group-hover:via-amber-500/65 transition-all duration-300" />
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:bg-amber-500/15 transition-colors duration-300">
                    <f.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-white mb-3 leading-snug">
                    {f.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Language placard grid ── */}
      <section className="relative py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
              <div>
                <SectionLabel>Permanent Collection</SectionLabel>
                <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                  Your language
                  <br />is here.
                </h2>
              </div>
              <p className="text-sm text-neutral-600 max-w-xs sm:text-right leading-relaxed">
                From the Niger Delta to the Horn of Africa — and everywhere the diaspora calls home.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {LANGUAGES.map((l, i) => (
              <Reveal key={l.name} delay={i * 45}>
                <div className="group relative bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] hover:border-amber-500/20 transition-all duration-200 overflow-hidden cursor-default">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/25 group-hover:bg-amber-500/55 transition-colors duration-200" />
                  <div className="text-sm font-semibold text-white mt-1">{l.name}</div>
                  <div className="text-[10px] text-neutral-600 mt-1 uppercase tracking-wide">{l.region}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="relative py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16">
              <SectionLabel>Who It&apos;s For</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                Built for the diaspora.
                <br />
                <span className="text-amber-400">Open to everyone.</span>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <PersonaPillSelector />
          </Reveal>
        </div>
      </section>

      {/* ── Comparison panel ── */}
      <Reveal>
        <section className="relative py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="relative border border-white/[0.07] rounded-2xl p-12 sm:p-20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/[0.12] via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

              <div className="relative text-center">
                <SectionLabel>The Beeli Difference</SectionLabel>

                <div className="flex items-center justify-center gap-16 sm:gap-32 my-12">
                  <div className="text-center">
                    <div className="font-display font-bold text-6xl sm:text-8xl text-neutral-700 leading-none">4</div>
                    <div className="text-[11px] text-neutral-700 mt-3 uppercase tracking-widest">Other apps</div>
                  </div>
                  <div className="text-neutral-700 text-sm uppercase tracking-widest">vs</div>
                  <div className="text-center">
                    <div className="font-display font-bold text-6xl sm:text-8xl text-amber-400 leading-none">70+</div>
                    <div className="text-[11px] text-amber-600 mt-3 uppercase tracking-widest font-semibold">Beeli</div>
                  </div>
                </div>

                <h3 className="font-display font-bold text-3xl sm:text-4xl text-white leading-snug">
                  Duolingo covers 4 African languages.
                  <br />
                  <span className="text-amber-400">We cover 70+.</span>
                </h3>
                <p className="mt-5 text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
                  African languages aren&apos;t an afterthought. They&apos;re the whole point.
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── CTA ── */}
      <Reveal>
        <section className="relative py-32 px-6 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[380px] rounded-full bg-amber-900/[0.18] blur-[140px] pointer-events-none" />

          <div className="max-w-3xl mx-auto relative">
            <div className="flex items-center justify-center gap-6 mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.05]" />
              <SectionLabel>Begin Your Journey</SectionLabel>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.05]" />
            </div>

            <h2 className="font-display font-bold text-5xl sm:text-6xl text-white leading-tight mb-4">
              Start learning your
              <br />
              <span className="text-amber-400">mother tongue.</span>
            </h2>
            <p className="text-neutral-500 mb-10 text-base">
              Free forever. No credit card. Start in 60 seconds.
            </p>
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-base transition-all duration-200 shadow-[0_0_72px_-12px_rgb(245_158_11_/0.65)] hover:shadow-[0_0_100px_-12px_rgb(245_158_11_/0.85)]"
            >
              Start Learning Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-700">
          <span className="font-display">© {new Date().getFullYear()} Beeli. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy</Link>
            <Link href="/support" className="hover:text-neutral-400 transition-colors">Support</Link>
            <Link href="/for-educators" className="hover:text-neutral-400 transition-colors">For Educators</Link>
            <Link href="/sign-up" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
