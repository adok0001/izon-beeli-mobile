"use client";

import { ArrowRight, BookOpen, Globe, GraduationCap, Headphones, Languages, Mic, Monitor, Search, Smartphone, Users, Volume2 } from "lucide-react";
import Link from "next/link";
import { ScrollytellingSection } from "@/components/landing/scrollytelling-section";
import { IzonSkitSection } from "@/components/marketing/izon-skit-section";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { localeHref } from "@/lib/locale-href";

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

// ── Fractal SVG background ────────────────────────────────────────────────────

function FractalBackground() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.025] select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="tri" x="0" y="0" width="80" height="69.28" patternUnits="userSpaceOnUse">
          <polygon points="40,0 80,69.28 0,69.28" fill="none" stroke="rgb(245,158,11)" strokeWidth="0.5" />
          <polygon points="0,0 40,69.28 80,0" fill="none" stroke="rgb(245,158,11)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tri)" />
    </svg>
  );
}

// ── Editorial pull-quote ──────────────────────────────────────────────────────

function PullQuote({ children, attribution }: { children: React.ReactNode; attribution: string }) {
  const { ref, visible } = useReveal(0.2);
  return (
    <div
      ref={ref}
      className="relative py-20 px-6 overflow-hidden border-y border-white/[0.05]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(24px)",
        transition: "opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <span className="block font-display italic text-3xl sm:text-4xl md:text-5xl text-white/80 leading-[1.2] tracking-[-0.01em]">
          {children}
        </span>
        <span className="mt-8 block text-[10px] uppercase tracking-[0.32em] text-amber-500/50 font-semibold">
          — {attribution}
        </span>
      </div>
    </div>
  );
}

// ── Ambient Soundscape Grid ───────────────────────────────────────────────────

type RegionKey = "west" | "east" | "southern" | "horn" | "delta";

const REGION_COLORS: Record<RegionKey, { bg: string; border: string; accent: string; tone: number }> = {
  west:     { bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.2)",  accent: "#f59e0b", tone: 110 },
  east:     { bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.2)",  accent: "#10b981", tone: 146 },
  southern: { bg: "rgba(99,102,241,0.06)",  border: "rgba(99,102,241,0.2)",  accent: "#6366f1", tone: 196 },
  horn:     { bg: "rgba(239,68,68,0.06)",   border: "rgba(239,68,68,0.2)",   accent: "#ef4444", tone: 164 },
  delta:    { bg: "rgba(168,85,247,0.06)",  border: "rgba(168,85,247,0.2)",  accent: "#a855f7", tone: 130 },
};

const SOUNDSCAPE_LANGS = [
  { name: "Yoruba",   region: "West Africa",     regionKey: "west" as RegionKey,     ambient: "City market · Lagos",     flag: "🇳🇬" },
  { name: "Igbo",     region: "West Africa",     regionKey: "west" as RegionKey,     ambient: "Village drums · Enugu",   flag: "🇳🇬" },
  { name: "Hausa",    region: "West Africa",     regionKey: "west" as RegionKey,     ambient: "Desert wind · Kano",      flag: "🇳🇬" },
  { name: "Twi",      region: "West Africa",     regionKey: "west" as RegionKey,     ambient: "Rain on iron roofs",      flag: "🇬🇭" },
  { name: "Wolof",    region: "West Africa",     regionKey: "west" as RegionKey,     ambient: "Ocean breeze · Dakar",    flag: "🇸🇳" },
  { name: "Bambara",  region: "West Africa",     regionKey: "west" as RegionKey,     ambient: "River canoe · Mali",      flag: "🇲🇱" },
  { name: "Fula",     region: "West Africa",     regionKey: "west" as RegionKey,     ambient: "Cattle bells · Sahel",    flag: "🇬🇳" },
  { name: "Swahili",  region: "East Africa",     regionKey: "east" as RegionKey,     ambient: "Dhow harbour · Mombasa",  flag: "🇰🇪" },
  { name: "Amharic",  region: "East Africa",     regionKey: "east" as RegionKey,     ambient: "Church bells · Addis",    flag: "🇪🇹" },
  { name: "Kikuyu",   region: "East Africa",     regionKey: "east" as RegionKey,     ambient: "Tea farm mist",           flag: "🇰🇪" },
  { name: "Oromo",    region: "East Africa",     regionKey: "east" as RegionKey,     ambient: "Highland plains",         flag: "🇪🇹" },
  { name: "Zulu",     region: "Southern Africa", regionKey: "southern" as RegionKey, ambient: "Isicathamiya harmonics",  flag: "🇿🇦" },
  { name: "Shona",    region: "Southern Africa", regionKey: "southern" as RegionKey, ambient: "Mbira in the evening",    flag: "🇿🇼" },
  { name: "Somali",   region: "Horn of Africa",  regionKey: "horn" as RegionKey,     ambient: "Port wind · Mogadishu",   flag: "🇸🇴" },
  { name: "Afar",     region: "Horn of Africa",  regionKey: "horn" as RegionKey,     ambient: "Salt lake silence",       flag: "🇩🇯" },
  { name: "Izon",     region: "Niger Delta",     regionKey: "delta" as RegionKey,    ambient: "Creek water at dusk",     flag: "🇳🇬" },
  { name: "Itsekiri", region: "Niger Delta",     regionKey: "delta" as RegionKey,    ambient: "Mangrove birds",          flag: "🇳🇬" },
  { name: "Urhobo",   region: "Niger Delta",     regionKey: "delta" as RegionKey,    ambient: "Udje song circles",       flag: "🇳🇬" },
];

const REGION_ORDER: RegionKey[] = ["west", "east", "southern", "horn", "delta"];
const REGION_LABELS: Record<RegionKey, string> = {
  west: "West Africa", east: "East Africa", southern: "Southern Africa",
  horn: "Horn of Africa", delta: "Niger Delta",
};

function useAmbientTone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const play = useCallback((freq: number, accent: string) => {
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;

      // Stop any current tone
      if (nodesRef.current) {
        nodesRef.current.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        const { osc } = nodesRef.current;
        setTimeout(() => { try { osc.stop(); } catch { /* noop */ } }, 200);
        nodesRef.current = null;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.value = freq;

      // Add a gentle fifth overtone
      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = freq * 1.5;
      const gain2 = ctx.createGain();
      gain2.gain.value = 0.08;

      filter.type = "lowpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.5;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.15);

      osc.connect(filter); osc2.connect(gain2); gain2.connect(filter);
      filter.connect(gain); gain.connect(ctx.destination);

      osc.start(); osc2.start();
      nodesRef.current = { osc, gain };
      // Auto-stop after 2.2 s
      gain.gain.setTargetAtTime(0, ctx.currentTime + 1.8, 0.2);
      setTimeout(() => {
        try { osc.stop(); osc2.stop(); } catch { /* noop */ }
        nodesRef.current = null;
      }, 2400);
    } catch { /* AudioContext blocked — silently skip */ }
  }, []);

  const stop = useCallback(() => {
    if (!ctxRef.current || !nodesRef.current) return;
    const { gain, osc } = nodesRef.current;
    gain.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.08);
    setTimeout(() => { try { osc.stop(); } catch { /* noop */ } }, 200);
    nodesRef.current = null;
  }, []);

  return { play, stop };
}

function SoundscapeCard({
  lang,
  onHover,
  onLeave,
}: {
  lang: typeof SOUNDSCAPE_LANGS[number];
  onHover: (freq: number, accent: string) => void;
  onLeave: () => void;
}) {
  const [active, setActive] = useState(false);
  const colors = REGION_COLORS[lang.regionKey];

  return (
    <div
      className="group relative rounded-xl p-4 cursor-pointer overflow-hidden transition-all duration-300"
      style={{
        background: active ? colors.bg : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? colors.border : "rgba(255,255,255,0.06)"}`,
        transform: active ? "translateY(-2px)" : "none",
        boxShadow: active ? `0 8px 32px -8px ${colors.accent}30` : "none",
      }}
      onMouseEnter={() => { setActive(true); onHover(colors.tone, colors.accent); }}
      onMouseLeave={() => { setActive(false); onLeave(); }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl transition-opacity duration-300"
        style={{ background: colors.accent, opacity: active ? 0.7 : 0.2 }}
      />

      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-semibold text-white">{lang.name}</span>
        <span className="text-base leading-none">{lang.flag}</span>
      </div>

      {/* Waveform — visible on hover */}
      <div
        className="flex items-end gap-[2px] h-3 mb-2 transition-opacity duration-200"
        style={{ opacity: active ? 1 : 0 }}
      >
        {[2, 4, 6, 4, 7, 3, 5, 4, 6, 3].map((h, i) => (
          <div
            key={i}
            className="w-[2px] rounded-full transition-all"
            style={{
              height: `${h * 2}px`,
              background: colors.accent,
              animation: active ? `wave-bar ${0.4 + i * 0.07}s ease-in-out infinite alternate` : "none",
            }}
          />
        ))}
      </div>

      <div
        className="text-[10px] uppercase tracking-[0.16em] transition-colors duration-200"
        style={{ color: active ? colors.accent : "rgba(115,115,115,1)" }}
      >
        {active ? lang.ambient : lang.region}
      </div>
    </div>
  );
}

function AmbientSoundscapeGrid() {
  const { play, stop } = useAmbientTone();
  const grouped = REGION_ORDER.map((key) => ({
    key,
    label: REGION_LABELS[key],
    color: REGION_COLORS[key],
    langs: SOUNDSCAPE_LANGS.filter((l) => l.regionKey === key),
  }));

  return (
    <div className="space-y-10">
      {grouped.map(({ key, label, color, langs }) => (
        <div key={key}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: color.accent }} />
            <span
              className="font-mono text-[9px] uppercase tracking-[0.2em]"
              style={{ color: color.accent + "99" }}
            >
              {label}
            </span>
            <div className="flex-1 h-px" style={{ background: color.border }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {langs.map((lang) => (
              <SoundscapeCard
                key={lang.name}
                lang={lang}
                onHover={(freq, accent) => play(freq, accent)}
                onLeave={stop}
              />
            ))}
          </div>
        </div>
      ))}
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
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-700 mb-3">
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
  const { t } = useTranslation();
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
            {phrase.badge} · {t("web.landing.demoNativeAudio")}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Interactive persona pill selector (Wispr-style) ──────────────────────────

function PersonaPillSelector() {
  const { t } = useTranslation();
  const locale = useUiLanguageStore((s) => s.uiLanguage);
  const [active, setActive] = useState(0);
  const current = PERSONAS[active];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Pills */}
      <div className="flex flex-wrap gap-3">
        {PERSONAS.map((p, i) => (
          <button
            key={p.labelKey}
            onClick={() => setActive(i)}
            className={[
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-200",
              active === i
                ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                : "bg-white/[0.03] border-white/[0.08] text-neutral-500 hover:border-white/20 hover:text-neutral-300",
            ].join(" ")}
          >
            <p.icon className="h-3.5 w-3.5" />
            {t(p.labelKey)}
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
          {t(current.labelKey)}
        </span>
        <h3 className="font-display font-bold text-2xl text-white mt-3 mb-3 leading-snug">
          {t(current.headlineKey)}
        </h3>
        <p className="text-sm text-neutral-500 leading-relaxed">{t(current.descKey)}</p>
        <Link
          href={localeHref(locale, "/learn")}
          className="inline-flex items-center gap-1.5 mt-6 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          {t("web.landing.personasStartFree")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "70+",   labelKey: "web.landing.statsLanguages", ref: "Cat. No. 001" },
  { value: "7",     labelKey: "web.landing.statsRegions",   ref: "Cat. No. 002" },
  { value: "500M+", labelKey: "web.landing.statsSpeakers",  ref: "Cat. No. 003" },
];

const HOW_IT_WORKS = [
  { step: "01", icon: Search,     titleKey: "web.landing.howStep1Title", descKey: "web.landing.howStep1Desc" },
  { step: "02", icon: Headphones, titleKey: "web.landing.howStep2Title", descKey: "web.landing.howStep2Desc" },
  { step: "03", icon: Mic,        titleKey: "web.landing.howStep3Title", descKey: "web.landing.howStep3Desc" },
];

const PERSONAS = [
  { icon: Globe,         labelKey: "web.landing.persona1Label", headlineKey: "web.landing.persona1Headline", descKey: "web.landing.persona1Desc" },
  { icon: Users,         labelKey: "web.landing.persona2Label", headlineKey: "web.landing.persona2Headline", descKey: "web.landing.persona2Desc" },
  { icon: GraduationCap, labelKey: "web.landing.persona3Label", headlineKey: "web.landing.persona3Headline", descKey: "web.landing.persona3Desc" },
  { icon: BookOpen,      labelKey: "web.landing.persona4Label", headlineKey: "web.landing.persona4Headline", descKey: "web.landing.persona4Desc" },
];

const FEATURES = [
  { roman: "I",   icon: Volume2, titleKey: "web.landing.feature1Title", descKey: "web.landing.feature1Desc" },
  { roman: "II",  icon: Globe,   titleKey: "web.landing.feature2Title", descKey: "web.landing.feature2Desc" },
  { roman: "III", icon: Users,   titleKey: "web.landing.feature3Title", descKey: "web.landing.feature3Desc" },
];


const TICKER_LANGS = [
  "Yoruba", "Igbo", "Swahili", "Hausa", "Amharic", "Izon", "Twi",
  "Wolof", "Somali", "Zulu", "Fula", "Shona", "Kikuyu", "Lingala", "Bambara",
];

// ── OS Window chrome ─────────────────────────────────────────────────────────

function WindowTitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f56", opacity: 0.5 }} />
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e", opacity: 0.5 }} />
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27c93f", opacity: 0.5 }} />
      <span className="flex-1 text-center font-mono text-[9px] text-neutral-600 tracking-wide select-none">
        {title}
      </span>
    </div>
  );
}

// ── Draggable lesson preview window ──────────────────────────────────────────

const LESSON_PREVIEW = {
  lang: "Izon",
  script: "Enị beeli",
  translation: "Hear your tongue",
  words: ["Ebe", "ami", "beeli", "—", "hear", "my", "tongue"],
};

function DraggableWindow() {
  const { t } = useTranslation();
  const posRef = useRef({ x: 0, y: 0 });
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Word-by-word playback when "playing"
  useEffect(() => {
    if (!playing) return;
    if (wordIdx >= LESSON_PREVIEW.words.length) {
      const t = setTimeout(() => { setWordIdx(0); setPlaying(false); }, 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setWordIdx((w) => w + 1), 300);
    return () => clearTimeout(t);
  }, [playing, wordIdx]);

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      ox: posRef.current.x, oy: posRef.current.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current || !elRef.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const x = dragStart.current.ox + dx;
    const y = dragStart.current.oy + dy;
    posRef.current = { x, y };
    elRef.current.style.transform = `translate(${x}px,${y}px)`;
  }

  function onPointerUp() { dragStart.current = null; }

  return (
    <div
      ref={elRef}
      className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block w-72 rounded-2xl overflow-hidden z-20"
      style={{
        background: "rgba(12,12,22,0.85)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 32px 80px -16px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.05)",
        transition: "box-shadow 0.4s ease",
        willChange: "transform",
      }}
    >
      {/* Title bar — drag handle */}
      <div
        className="cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <WindowTitleBar title="Beeli — Lesson Preview" />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-mono text-[9px] text-amber-500/60 uppercase tracking-[0.2em] mb-1">
              Niger Delta · Izon
            </div>
            <div className="font-display font-bold text-2xl text-white leading-none">
              {LESSON_PREVIEW.script}
            </div>
            <div className="font-display italic text-neutral-500 text-sm mt-1">
              {t("web.landing.previewTranslation")}
            </div>
          </div>
          <span className="text-2xl select-none">🇳🇬</span>
        </div>

        {/* Waveform + word strip */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mb-4">
          <div className="flex items-end gap-[2px] h-5 mb-3">
            {[2,4,6,8,5,7,4,6,3,5,7,4,8,5,3,6,4,7].map((h, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full"
                style={{
                  height: `${h * 2}px`,
                  background: playing ? "#f59e0b" : "rgba(245,158,11,0.3)",
                  animation: playing ? `wave-bar ${0.35 + i * 0.05}s ease-in-out infinite alternate` : "none",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-1.5 gap-y-1 min-h-[1.4rem]">
            {LESSON_PREVIEW.words.slice(0, wordIdx).map((w, i) => (
              <span key={i} className="text-xs font-medium text-neutral-300" style={{ animation: "fade-in 0.15s ease-out both" }}>
                {w}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setWordIdx(0); setPlaying(true); }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono hover:bg-amber-500/20 transition-colors duration-200"
        >
          {playing ? t("web.landing.previewPlaying") : t("web.landing.previewPlay")}
        </button>
      </div>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="w-10 h-px bg-amber-500/50" />
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-500/70">
        {children}
      </span>
    </div>
  );
}

// ── Landing page ──────────────────────────────────────────────────────────────

export function LandingPage() {
  const { t } = useTranslation();
  const locale = useUiLanguageStore((s) => s.uiLanguage);
  const lh = (path: string) => localeHref(locale, path);
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
              href={lh("/for-educators")}
              className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {t("web.landing.navForEducators")}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={lh("/learn")}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_24px_-6px_rgb(245_158_11_/0.5)] hover:shadow-[0_0_36px_-6px_rgb(245_158_11_/0.7)]"
            >
              {t("web.landing.navStartLearning")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center px-6 py-32 overflow-hidden">
        <FractalBackground />
        {/* Circular orbit — positioned left of headline, like Wispr */}
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 hidden lg:block opacity-60">
          <CircularOrbit text="Hear it · Speak it · Live it · Hear it · Speak it · Live it · " radius={120} />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-3xl animate-fade-in">
            <SectionLabel>{t("web.landing.heroCollectionLabel")}</SectionLabel>

            {/* ── #3 Language cycling headline ── */}
            <h1 className="font-display font-bold leading-[0.92] tracking-tight">
              <CyclingHeroLine />
              <span
                className="block text-amber-400"
                style={{ fontSize: "clamp(3.5rem,9vw,7.5rem)" }}
              >
                {t("web.landing.heroLivesHere")}
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-neutral-400 max-w-lg leading-relaxed">
              {t("web.landing.heroSubhead")}
              <em className="font-display italic text-neutral-300 not-italic">{t("web.landing.heroSubheadFree")}</em>
            </p>
            <p className="mt-3 font-display italic text-neutral-600 text-base sm:text-lg" style={{ fontStyle: "italic" }}>
              {t("web.landing.heroSubheadItalic")}
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href={lh("/learn")}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_60px_-12px_rgb(245_158_11_/0.65)] hover:shadow-[0_0_80px_-12px_rgb(245_158_11_/0.85)]"
              >
                {t("web.landing.heroCtaPrimary")}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href={lh("/learn")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
              >
                {t("web.landing.heroCtaSecondary")}
              </Link>
            </div>

            {/* Word-by-word audio demo strip */}
            <AudioDemoStrip />

            {/* Platform availability badges */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-neutral-700">{t("web.landing.heroAvailableOn")}</span>
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

          <DraggableWindow />
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
              <AnimatedStat value={s.value} label={t(s.labelKey)} refLabel={s.ref} />
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
              <span className="font-mono text-[10px] text-neutral-600 uppercase tracking-[0.18em] whitespace-nowrap">
                {lang}
              </span>
              <span className="w-1 h-1 rounded-full bg-amber-500/35 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ── Izon skit ── */}
      <IzonSkitSection />

      {/* ── How it works ── */}
      <section className="relative py-28 px-6 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16">
              <SectionLabel>{t("web.landing.howLabel")}</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                {t("web.landing.howTitle")}
              </h2>
              <p className="mt-4 text-neutral-500 max-w-sm text-sm leading-relaxed">
                {t("web.landing.howSubtitle")}
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
                  <h3 className="font-display font-semibold text-lg text-white mb-3">{t(item.titleKey)}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{t(item.descKey)}</p>
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
              <SectionLabel>{t("web.landing.featuresLabel")}</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                {t("web.landing.featuresTitle")}
              </h2>
              <p className="mt-4 text-neutral-500 max-w-sm text-sm leading-relaxed">
                {t("web.landing.featuresSubtitle")}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.roman} delay={i * 110}>
                <div className="group relative h-full bg-white/[0.025] border border-white/[0.06] rounded-2xl hover:border-amber-500/25 hover:bg-white/[0.04] transition-all duration-400 overflow-hidden">
                  {/* Poolsuite-style window title bar */}
                  <WindowTitleBar title={`hall.${f.roman.toLowerCase()} — ${t(f.titleKey)}`} />
                  <div className="p-8">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:bg-amber-500/15 transition-colors duration-300">
                      <f.icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <h3 className="font-display font-semibold text-xl text-white mb-3 leading-snug">
                      {t(f.titleKey)}
                    </h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">{t(f.descKey)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pull-quote ── */}
      <PullQuote attribution={t("web.landing.quoteAttribution")}>
        {t("web.landing.quoteText")}
      </PullQuote>

      {/* ── Interactive Documentary ── */}
      <ScrollytellingSection />

      {/* ── Ambient Soundscape Grid ── */}
      <section className="relative py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
              <div>
                <SectionLabel>{t("web.landing.soundscapeLabel")}</SectionLabel>
                <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                  {t("web.landing.soundscapeTitleLine1")}
                  <br />
                  <span className="font-display italic font-normal text-amber-400">{t("web.landing.soundscapeTitleLine2")}</span>
                </h2>
              </div>
              <p className="text-sm text-neutral-600 max-w-xs sm:text-right leading-relaxed">
                {t("web.landing.soundscapeHint")}
                <br />
                <span className="text-neutral-700">{t("web.landing.soundscapeHintSub")}</span>
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <AmbientSoundscapeGrid />
          </Reveal>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="relative py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16">
              <SectionLabel>{t("web.landing.personasLabel")}</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                {t("web.landing.personasTitle")}
                <br />
                <span className="text-amber-400">{t("web.landing.personasTitleAccent")}</span>
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
                <SectionLabel>{t("web.landing.comparisonLabel")}</SectionLabel>

                <div className="flex items-center justify-center gap-16 sm:gap-32 my-12">
                  <div className="text-center">
                    <div className="font-display font-bold text-6xl sm:text-8xl text-neutral-700 leading-none">4</div>
                    <div className="text-[11px] text-neutral-700 mt-3 uppercase tracking-widest">{t("web.landing.comparisonOtherApps")}</div>
                  </div>
                  <div className="text-neutral-700 text-sm uppercase tracking-widest">{t("web.landing.comparisonVs")}</div>
                  <div className="text-center">
                    <div className="font-display font-bold text-6xl sm:text-8xl text-amber-400 leading-none">70+</div>
                    <div className="text-[11px] text-amber-600 mt-3 uppercase tracking-widest font-semibold">{t("web.landing.comparisonBeeli")}</div>
                  </div>
                </div>

                <h3 className="font-display font-bold text-3xl sm:text-4xl text-white leading-snug">
                  {t("web.landing.comparisonHeadline")}
                  <br />
                  <span className="text-amber-400">{t("web.landing.comparisonHeadlineAccent")}</span>
                </h3>
                <p className="mt-5 text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
                  {t("web.landing.comparisonSubtext")}
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
              <SectionLabel>{t("web.landing.ctaLabel")}</SectionLabel>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.05]" />
            </div>

            <h2 className="font-display font-bold text-5xl sm:text-6xl text-white leading-tight mb-4">
              {t("web.landing.ctaTitle")}
              <br />
              <span className="text-amber-400">{t("web.landing.ctaTitleAccent")}</span>
            </h2>
            <p className="text-neutral-500 mb-10 text-base">
              {t("web.landing.ctaSubtitle")}
            </p>
            <Link
              href={lh("/learn")}
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-base transition-all duration-200 shadow-[0_0_72px_-12px_rgb(245_158_11_/0.65)] hover:shadow-[0_0_100px_-12px_rgb(245_158_11_/0.85)]"
            >
              {t("web.landing.ctaButton")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-700">
          <span className="font-display">© {new Date().getFullYear()} Beeli. {t("web.landing.footerRights")}</span>
          <div className="flex gap-6">
            <Link href={lh("/privacy")} className="hover:text-neutral-400 transition-colors">{t("web.landing.footerPrivacy")}</Link>
            <Link href={lh("/support")} className="hover:text-neutral-400 transition-colors">{t("web.landing.footerSupport")}</Link>
            <Link href={lh("/for-educators")} className="hover:text-neutral-400 transition-colors">{t("web.landing.footerForEducators")}</Link>
            <Link href={lh("/culture")} className="hover:text-neutral-400 transition-colors">{t("web.landing.footerBlog")}</Link>
            <Link href={lh("/learn")} className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
              {t("web.landing.footerGetStarted")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
