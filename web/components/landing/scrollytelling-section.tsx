"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Chapter {
  id: string;
  label: string;
  index: number;
  stat: string;
  statLabel: string;
  headline: string;
  body: string[];
  accent: string;
  visualContent: React.ReactNode;
}

// ── Hook: step observer ───────────────────────────────────────────────────────

function useActiveStep(count: number) {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>(Array(count).fill(null));

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(i); },
        { threshold: 0.5, rootMargin: "0px 0px -20% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return { active, stepRefs };
}

// ── Visual panels per chapter ─────────────────────────────────────────────────

function VisualShell({ accent, label, children }: { accent: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-10 pt-8 pb-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: accent + "90" }}>
          {label}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center px-10 pb-10">
        {children}
      </div>
    </div>
  );
}

function StatVisual({ stat, label, accent }: { stat: string; label: string; accent: string }) {
  return (
    <VisualShell accent={accent} label={`Filed · ${new Date().getFullYear()}`}>
      <span
        className="block font-display font-bold leading-[0.9] tracking-tighter text-white mb-6"
        style={{ fontSize: "clamp(5rem,11vw,8rem)" }}
      >
        {stat}
      </span>
      <div className="h-px w-16 mb-4" style={{ background: accent }} />
      <span className="text-neutral-400 text-sm uppercase tracking-[0.18em] font-mono leading-relaxed">
        {label}
      </span>
    </VisualShell>
  );
}

function MapVisual({ accent }: { accent: string }) {
  const regions = [
    { name: "West Africa",     count: "700+", highlight: true },
    { name: "East Africa",     count: "300+", highlight: false },
    { name: "Central Africa",  count: "400+", highlight: false },
    { name: "Horn of Africa",  count: "60+",  highlight: false },
    { name: "Southern Africa", count: "280+", highlight: false },
    { name: "North Africa",    count: "60+",  highlight: false },
    { name: "Niger Delta",     count: "40+",  highlight: true },
  ];

  return (
    <VisualShell accent={accent} label="Regional index · Africa">
      <div className="space-y-3">
        {regions.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between py-2 border-b"
            style={{ borderColor: r.highlight ? accent + "40" : "rgba(255,255,255,0.06)" }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: r.highlight ? "white" : "rgba(255,255,255,0.45)" }}
            >
              {r.name}
            </span>
            <span
              className="font-mono text-xs font-bold"
              style={{ color: r.highlight ? accent : "rgba(255,255,255,0.2)" }}
            >
              {r.count}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-white/[0.06]">
        <span className="font-display font-bold text-5xl text-white leading-none">54</span>
        <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-600 mt-1">countries</span>
      </div>
    </VisualShell>
  );
}

function WaveformVisual({ accent }: { accent: string }) {
  const heights = [3,6,9,12,8,14,10,7,13,9,5,11,8,6,10,13,7,9,4,12,8,11,6,9,3];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-12">
      {/* Cassette-like label */}
      <div
        className="w-full max-w-[240px] rounded-xl border px-5 py-4"
        style={{ borderColor: accent + "40", background: accent + "08" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-[9px] uppercase tracking-[0.24em] font-mono font-semibold"
            style={{ color: accent }}
          >
            ◉ Recording
          </span>
          <span className="flex-1 h-px" style={{ background: accent + "30" }} />
        </div>
        <div className="flex items-end gap-[3px] h-16 mb-4">
          {heights.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                height: `${h * 3.5}px`,
                background: accent,
                opacity: 0.5 + (h / 14) * 0.45,
                animation: `wave-bar ${0.6 + i * 0.09}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
        <span className="block font-display italic text-white/50 text-xs leading-relaxed">
          Izon elder · Bayelsa State, 2023
        </span>
      </div>
      <div className="text-center max-w-[200px]">
        <span className="block font-display font-bold text-2xl text-white/80 mb-1">
          2M
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">
          Izon speakers · 0 keyboards
        </span>
      </div>
    </div>
  );
}

function ArchiveVisual({ accent }: { accent: string }) {
  const rows = [
    { lang: "Yoruba",   speakers: "45M",  status: "active" },
    { lang: "Izon",     speakers: "2M",   status: "active" },
    { lang: "Afar",     speakers: "3M",   status: "growing" },
    { lang: "Itsekiri", speakers: "800K", status: "active" },
    { lang: "Oromo",    speakers: "40M",  status: "growing" },
    { lang: "Urhobo",   speakers: "1.5M", status: "active" },
  ];
  return (
    <div className="flex flex-col justify-center h-full px-8 py-12">
      <span
        className="block font-mono text-[9px] uppercase tracking-[0.3em] mb-6 opacity-50"
        style={{ color: accent }}
      >
        Archive — beeli.app
      </span>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={r.lang}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg border"
            style={{
              background: "rgba(255,255,255,0.02)",
              borderColor: i === 1 ? accent + "50" : "rgba(255,255,255,0.06)",
              animation: `fade-in 0.4s ease-out ${i * 80}ms both`,
            }}
          >
            <span className="text-sm text-white/80 font-medium">{r.lang}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-neutral-600">{r.speakers}</span>
              <span
                className="text-[9px] uppercase tracking-[0.16em] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  color: accent,
                  background: accent + "18",
                }}
              >
                {r.status}
              </span>
            </div>
          </div>
        ))}
        <div className="pt-2 pl-3">
          <span className="font-mono text-[9px] text-neutral-700">+ 64 more languages</span>
        </div>
      </div>
    </div>
  );
}

function RecoveryVisual({ accent }: { accent: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 px-12">
      {/* Progress rings */}
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={accent} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="264"
            strokeDashoffset="66"
            opacity="0.8"
          />
          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
          <circle
            cx="50" cy="50" r="30" fill="none"
            stroke={accent} strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="188"
            strokeDashoffset="94"
            opacity="0.5"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-3xl text-white">75%</span>
          <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-wider mt-1">of goal</span>
        </div>
      </div>
      <div className="text-center">
        <span className="block text-sm text-white/60 font-display italic">
          Languages documented this year
        </span>
        <span className="block mt-2 font-mono text-[9px] uppercase tracking-[0.24em] opacity-40" style={{ color: accent }}>
          Community · Native speakers · Scholars
        </span>
      </div>
    </div>
  );
}

// ── Chapter data ──────────────────────────────────────────────────────────────

function buildChapters(): Chapter[] {
  return [
    {
      id: "weight",
      index: 0,
      label: "The Weight of Silence",
      stat: "2 000",
      statLabel: "languages in Africa",
      headline: "The most linguistically diverse continent on Earth.",
      body: [
        "Africa holds more than 2 000 distinct languages — a third of all human tongues. They carry legal systems, cosmologies, healing practices, and histories that exist nowhere in writing.",
        "And yet, the global internet speaks fewer than 100 of them. Most African languages have no digital presence at all.",
        "When a language disappears, it does not just lose words. It loses the world those words described.",
      ],
      accent: "#f59e0b",
      visualContent: null,
    },
    {
      id: "geography",
      index: 1,
      label: "Where They Come From",
      stat: "54",
      statLabel: "countries, one continent",
      headline: "Five regions. Thousands of tongues.",
      body: [
        "West Africa alone holds more languages than the entirety of Europe. The Niger Delta — a region the size of Belgium — is home to more than 40 distinct tongues.",
        "The Horn of Africa gave the world Amharic, Somali, Afar. East Africa produced Swahili, Kikuyu, Oromo. Southern Africa: Zulu, Shona, Xhosa.",
        "These are not dialects of each other. They are fully independent linguistic systems, each shaped by millennia of independent human thought.",
      ],
      accent: "#10b981",
      visualContent: null,
    },
    {
      id: "izon",
      index: 2,
      label: "One Voice, Nearly Lost",
      stat: "2M",
      statLabel: "Izon speakers",
      headline: "Izon: two million speakers, almost no digital trace.",
      body: [
        "The Izon people of the Niger Delta speak a language that encodes a relationship with water, mangrove, and creek unlike any other. Their tonal system is among the most complex in West Africa.",
        "Until recently, typing Izon on a phone was impossible. No keyboard. No autocorrect. No dictionary.",
        "\"Enị beeli\" — \"hear my tongue\" — is an Izon phrase. It became the name of this platform.",
      ],
      accent: "#a855f7",
      visualContent: null,
    },
    {
      id: "recovery",
      index: 3,
      label: "What Survives",
      stat: "500M+",
      statLabel: "diaspora speakers globally",
      headline: "The diaspora is the archive.",
      body: [
        "Half a billion people of African descent live outside the continent. Many grew up hearing their parents' language without ever learning to speak it. They understand it — partially. It lives in them, unactivated.",
        "This is not loss. This is latency.",
        "With the right tools, that latency becomes fluency. Audio-first. Native speaker voices. No textbook required.",
      ],
      accent: "#ef4444",
      visualContent: null,
    },
    {
      id: "archive",
      index: 4,
      label: "The Archive",
      stat: "70+",
      statLabel: "languages on Beeli",
      headline: "We built the infrastructure that should have existed.",
      body: [
        "Beeli is a living archive. Every word recorded by native speakers. Every lesson built from living language, not colonial transcription.",
        "Educators upload vocabulary sets. Community members verify pronunciations. The platform grows because the community grows it.",
        "70 languages today. The work continues.",
      ],
      accent: "#f59e0b",
      visualContent: null,
    },
  ];
}

// ── Chapter nav dot ───────────────────────────────────────────────────────────

function ChapterNav({
  chapters,
  active,
  onSelect,
}: {
  chapters: Chapter[];
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <nav
      aria-label="Documentary chapters"
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3"
    >
      {chapters.map((ch, i) => (
        <button
          key={ch.id}
          onClick={() => onSelect(i)}
          title={ch.label}
          className="group flex items-center gap-2 justify-end"
        >
          <span
            className="text-[9px] uppercase tracking-[0.2em] font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
            style={{ color: active === i ? ch.accent : "#525252" }}
          >
            {ch.label}
          </span>
          <span
            className="block rounded-full transition-all duration-300"
            style={{
              width: active === i ? "6px" : "4px",
              height: active === i ? "6px" : "4px",
              background: active === i ? ch.accent : "#404040",
              boxShadow: active === i ? `0 0 8px 2px ${ch.accent}60` : "none",
            }}
          />
        </button>
      ))}
    </nav>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScrollytellingSection() {
  const chapters = buildChapters();
  const { active, stepRefs } = useActiveStep(chapters.length);

  const currentChapter = chapters[active];

  function scrollToChapter(i: number) {
    stepRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const visuals = [
    <StatVisual key="weight" stat="2 000" label="languages in Africa" accent="#f59e0b" />,
    <MapVisual key="geo" accent="#10b981" />,
    <WaveformVisual key="izon" accent="#a855f7" />,
    <RecoveryVisual key="recovery" accent="#ef4444" />,
    <ArchiveVisual key="archive" accent="#f59e0b" />,
  ];

  return (
    <section
      className="relative bg-[#04040c] border-y border-white/[0.04]"
      aria-label="Interactive documentary: African languages"
    >
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-10 h-px bg-amber-500/50" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-500/70">
            Interactive Documentary
          </span>
        </div>
        <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight max-w-2xl">
          The 70+ Languages
          <br />
          <span className="font-display italic font-normal text-amber-400/70">
            That Almost Weren&apos;t.
          </span>
        </h2>
        <p className="mt-4 text-neutral-600 text-sm max-w-md leading-relaxed">
          Scroll to read the story. ↓
        </p>
      </div>

      {/* Scrollytelling layout */}
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-0">

          {/* Left: sticky visual panel */}
          <div className="hidden lg:block relative">
            <div className="sticky top-0 h-screen flex flex-col justify-center">
              {/* Chapter label */}
              <div className="absolute top-8 left-0">
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.28em] transition-colors duration-500"
                  style={{ color: currentChapter.accent + "80" }}
                >
                  {String(active + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")} — {currentChapter.label}
                </span>
              </div>

              {/* Visual content */}
              <div
                className="relative h-[60vh] rounded-2xl overflow-hidden border"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  transition: "border-color 0.6s ease, background 0.6s ease",
                  borderColor: currentChapter.accent + "30",
                  boxShadow: `inset 0 0 60px -20px ${currentChapter.accent}10`,
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[1px] transition-colors duration-600"
                  style={{ background: `linear-gradient(to right, transparent, ${currentChapter.accent}60, transparent)` }}
                />

                {/* Crossfade visual */}
                {visuals.map((v, i) => (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{
                      opacity: i === active ? 1 : 0,
                      transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1)",
                      pointerEvents: i === active ? "auto" : "none",
                    }}
                  >
                    {v}
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-6 h-px bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((active + 1) / chapters.length) * 100}%`,
                    background: currentChapter.accent,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: scrolling narrative */}
          <div className="lg:pl-16 xl:pl-24">
            {chapters.map((ch, i) => (
              <div
                key={ch.id}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="min-h-screen flex flex-col justify-center py-24"
              >
                {/* Mobile: show stat above text */}
                <div className="lg:hidden mb-8">
                  <span
                    className="block font-display font-bold leading-none"
                    style={{ fontSize: "clamp(4rem,10vw,6rem)", color: ch.accent }}
                  >
                    {ch.stat}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-600 mt-1">
                    {ch.statLabel}
                  </span>
                </div>

                {/* Chapter label */}
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="font-mono text-[9px] uppercase tracking-[0.3em]"
                    style={{ color: ch.accent + "80" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="h-px flex-1 max-w-[3rem]" style={{ background: ch.accent + "40" }} />
                  <span
                    className="font-mono text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: ch.accent + "60" }}
                  >
                    {ch.label}
                  </span>
                </div>

                <h3 className="font-display font-bold text-2xl sm:text-3xl text-white leading-snug mb-8 max-w-md">
                  {ch.headline}
                </h3>

                <div className="space-y-5 max-w-md">
                  {ch.body.map((para, j) => (
                    <p
                      key={j}
                      className="text-neutral-400 leading-relaxed"
                      style={{ fontSize: j === 1 ? "1rem" : "0.9375rem" }}
                    >
                      {j === 1 && i === 2
                        ? <><em className="text-neutral-300 font-display not-italic">&ldquo;{para.replace(/^"|"$/g, "")}</em></>
                        : para}
                    </p>
                  ))}
                </div>

                {/* Chapter separator */}
                {i < chapters.length - 1 && (
                  <div className="mt-16 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.04]" />
                    <span className="font-mono text-[9px] text-neutral-800 uppercase tracking-[0.2em]">
                      continue ↓
                    </span>
                  </div>
                )}

                {/* Last chapter: CTA */}
                {i === chapters.length - 1 && (
                  <div className="mt-12">
                    <Link
                      href="/learn"
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200"
                      style={{
                        background: ch.accent,
                        color: "#04040c",
                        boxShadow: `0 0 40px -8px ${ch.accent}80`,
                      }}
                    >
                      Join the archive — start free
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chapter nav */}
      <ChapterNav chapters={chapters} active={active} onSelect={scrollToChapter} />
    </section>
  );
}
