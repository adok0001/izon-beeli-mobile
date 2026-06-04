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
    function onScroll() {
      const mid = window.innerHeight * 0.5;
      let best = 0;
      let bestDist = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = (rect.top + rect.bottom) / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setActive(best);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { active, stepRefs };
}

// ── Visual panels per chapter ─────────────────────────────────────────────────

function VisualShell({ accent, label, children }: { accent: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full w-full" style={{ background: "rgb(10,10,20)" }}>
      <div className="px-10 pt-7 pb-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: accent }}>
          {label}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-start px-10 pt-8 pb-8 overflow-y-auto">
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
    <VisualShell accent={accent} label="◉ Recording — Bayelsa State, 2023">
      <div className="flex items-end gap-[3px] h-20 mb-8">
        {heights.map((h, i) => (
          <div
            key={i}
            className="w-[4px] rounded-full"
            style={{
              height: `${h * 5}px`,
              background: accent,
              opacity: 0.4 + (h / 14) * 0.55,
              animation: `wave-bar ${0.6 + i * 0.09}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>
      <span className="font-display font-bold text-white leading-none mb-3" style={{ fontSize: "clamp(3rem,8vw,5rem)" }}>
        2M
      </span>
      <div className="h-px w-12 mb-3" style={{ background: accent }} />
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
        Izon speakers
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-700 mt-1">
        0 digital keyboards, until now
      </span>
    </VisualShell>
  );
}

function ArchiveVisual({ accent }: { accent: string }) {
  const rows = [
    { lang: "Yoruba",   speakers: "45M"  },
    { lang: "Izon",     speakers: "2M"   },
    { lang: "Afar",     speakers: "3M"   },
    { lang: "Itsekiri", speakers: "800K" },
    { lang: "Oromo",    speakers: "40M"  },
    { lang: "Urhobo",   speakers: "1.5M" },
  ];
  return (
    <VisualShell accent={accent} label="Archive — beeli.app">
      <span
        className="block font-display font-bold leading-none text-white mb-5"
        style={{ fontSize: "clamp(3rem,6vw,5rem)" }}
      >
        70+
      </span>
      <div className="space-y-0">
        {rows.map((r, i) => (
          <div
            key={r.lang}
            className="flex items-center justify-between py-2 border-b"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <span className="text-sm font-medium" style={{ color: i === 1 ? "white" : "rgba(255,255,255,0.5)" }}>
              {r.lang}
            </span>
            <span className="font-mono text-[10px]" style={{ color: i === 1 ? accent : "rgba(255,255,255,0.2)" }}>
              {r.speakers}
            </span>
          </div>
        ))}
        <div className="pt-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-700">
            + 64 more languages
          </span>
        </div>
      </div>
    </VisualShell>
  );
}

function RecoveryVisual({ accent }: { accent: string }) {
  const facts = [
    { n: "500M+", label: "diaspora speakers globally" },
    { n: "1 in 3", label: "grew up without their mother tongue" },
    { n: "∞",     label: "latency is not loss" },
  ];
  return (
    <VisualShell accent={accent} label="Diaspora · Global data">
      <div className="space-y-5">
        {facts.map((f, i) => (
          <div key={i}>
            <span
              className="block font-display font-bold leading-none text-white mb-1"
              style={{ fontSize: i === 0 ? "clamp(2.4rem,5vw,3.5rem)" : "clamp(1.8rem,4vw,2.5rem)" }}
            >
              {f.n}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              {f.label}
            </span>
            {i < facts.length - 1 && (
              <div className="mt-4 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            )}
          </div>
        ))}
      </div>
    </VisualShell>
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

// ── Fixed visual panel (bypasses overflow-x:hidden sticky bug) ────────────────

function useFixedPanel(sectionRef: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState({ left: 0, width: 0 });

  useEffect(() => {
    function update() {
      if (!sectionRef.current) return;
      const sr = sectionRef.current.getBoundingClientRect();
      // Only show once section header has scrolled off top; hide once section bottom exits
      const navH = 64; // sticky nav height
      const inView = sr.top < navH && sr.bottom > window.innerHeight * 0.6;
      setVisible(inView);
      // Mirror the left column of the max-w-7xl grid exactly
      if (window.innerWidth >= 1024) {
        const containerW = Math.min(1280, window.innerWidth - 48);
        const containerLeft = (window.innerWidth - containerW) / 2 + 24;
        setRect({ left: containerLeft, width: containerW / 2 });
      }
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sectionRef]);

  return { visible, ...rect };
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScrollytellingSection() {
  const chapters = buildChapters();
  const { active, stepRefs } = useActiveStep(chapters.length);
  const sectionRef = useRef<HTMLElement>(null);
  const { visible, left, width } = useFixedPanel(sectionRef);

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
      ref={sectionRef}
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

      {/* Fixed left visual panel — position:fixed bypasses overflow-x:hidden sticky bug */}
      {visible && (
        <div
          className="hidden lg:flex flex-col justify-center fixed z-30 pointer-events-none"
          style={{ left, width, top: 64, bottom: 0 }}
        >
          {/* Chapter label */}
          <div className="absolute top-6 left-6">
            <span
              className="font-mono text-[9px] uppercase tracking-[0.28em] transition-colors duration-500"
              style={{ color: currentChapter.accent + "80" }}
            >
              {String(active + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")} — {currentChapter.label}
            </span>
          </div>

          {/* Visual content — capped height so it looks right on tall viewports */}
          <div
            className="relative mx-6 rounded-2xl overflow-hidden border pointer-events-auto"
            style={{
              height: "min(60vh, 520px)",
              background: "rgb(10,10,20)",
              transition: "border-color 0.6s ease",
              borderColor: currentChapter.accent + "50",
              boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px -16px rgba(0,0,0,0.6)`,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background: `linear-gradient(to right, transparent, ${currentChapter.accent}60, transparent)` }}
            />
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
          <div className="mx-6 mt-5 h-px bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((active + 1) / chapters.length) * 100}%`, background: currentChapter.accent }}
            />
          </div>
        </div>
      )}

      {/* Scrollytelling layout */}
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-0">

          {/* Left column spacer — keeps grid layout, actual visual is fixed above */}
          <div className="hidden lg:block" />

          {/* Right: scrolling narrative */}
          <div className="lg:pl-16 xl:pl-24">
            {chapters.map((ch, i) => (
              <div
                key={ch.id}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="flex flex-col justify-center py-24"
                style={{ minHeight: "min(100vh, 820px)" }}
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

                <h3 className="font-display font-bold text-2xl sm:text-3xl xl:text-4xl text-white leading-snug mb-8 max-w-lg">
                  {ch.headline}
                </h3>

                <div className="space-y-5 max-w-lg">
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
