"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Building2, Mic, Globe, Users } from "lucide-react";
import type { PublicStats, ContentPartner } from "@/app/about/page";
import { LANGUAGES } from "@mobile/lib/data/languages";

// ── Utilities ──────────────────────────────────────────────────────────────────

function getLanguageName(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.name ?? id;
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
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
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-brand-400 mb-4">
      {children}
    </span>
  );
}

function StatCard({ target, label, icon: Icon, start }: { target: number; label: string; icon: React.ElementType; start: boolean }) {
  const value = useCountUp(target, 1600, start);
  return (
    <div className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
      <Icon className="h-5 w-5 text-brand-400 mb-1" />
      <span className="text-4xl font-bold text-white tabular-nums">
        {value.toLocaleString()}
        {target >= 1000 ? "+" : ""}
      </span>
      <span className="text-sm text-neutral-400 text-center">{label}</span>
    </div>
  );
}

function LanguageMilestone({ langId, count, target, percent }: { langId: string; count: number; target: number; percent: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-white">{getLanguageName(langId)}</span>
        <span className="text-neutral-400 tabular-nums">
          {count.toLocaleString()} <span className="text-neutral-600">/ {target.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-1000 ease-out"
          style={{ width: `${Math.max(percent, percent > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

// ── Standards feature list ─────────────────────────────────────────────────────

const STANDARDS = [
  { icon: BookOpen, label: "Definitions & multiple senses" },
  { icon: Mic, label: "Native-speaker audio" },
  { icon: Globe, label: "Sentence examples in context" },
  { icon: Users, label: "Synonyms & antonyms" },
  { icon: BookOpen, label: "Semantic hierarchies" },
  { icon: Globe, label: "Etymology trails" },
  { icon: Users, label: "Dialectal variants" },
];

// ── Main component ─────────────────────────────────────────────────────────────

export function AboutContent({ stats, partners }: { stats: PublicStats | null; partners: ContentPartner[] }) {
  const { ref: statsRef, visible: statsVisible } = useReveal(0.1);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Back nav */}
      <div className="sticky top-0 z-10 border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Beeli
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-24 space-y-32">

        {/* ── Mission ── */}
        <section>
          <Reveal>
            <SectionLabel>Mission</SectionLabel>
            <h1 className="text-5xl font-bold leading-tight mb-6 max-w-3xl">
              Building the most rigorous dictionary infrastructure for African languages.
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed">
              Most African languages still lack structured, machine-readable lexicographic data —
              the foundation every other language technology depends on. Beeli is building it
              systematically, in collaboration with native speaker communities and academic institutions,
              one verified entry at a time.
            </p>
          </Reveal>
        </section>

        {/* ── By the Numbers ── */}
        <section ref={statsRef}>
          <Reveal>
            <SectionLabel>By the Numbers</SectionLabel>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Reveal delay={0}>
              <StatCard
                target={stats?.totalEntries ?? 0}
                label="Dictionary entries"
                icon={BookOpen}
                start={statsVisible}
              />
            </Reveal>
            <Reveal delay={80}>
              <StatCard
                target={stats?.totalLanguages ?? 0}
                label="Languages covered"
                icon={Globe}
                start={statsVisible}
              />
            </Reveal>
            <Reveal delay={160}>
              <StatCard
                target={stats?.partnerCount ?? 0}
                label="Institutional partners"
                icon={Building2}
                start={statsVisible}
              />
            </Reveal>
            <Reveal delay={240}>
              <StatCard
                target={20}
                label="Countries reached"
                icon={Users}
                start={statsVisible}
              />
            </Reveal>
          </div>
        </section>

        {/* ── Language Milestones ── */}
        {stats?.targetLanguages && stats.targetLanguages.length > 0 && (
          <section>
            <Reveal>
              <SectionLabel>Language Milestones</SectionLabel>
              <p className="text-neutral-400 text-sm mb-8 max-w-lg">
                Entry counts are live. Progress bars show our path to each language&apos;s lexicographic target.
              </p>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              {stats.targetLanguages.map((lang, i) => (
                <Reveal key={lang.languageId} delay={i * 50}>
                  <LanguageMilestone
                    langId={lang.languageId}
                    count={lang.count}
                    target={lang.target}
                    percent={lang.percent}
                  />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ── Institutional Partners ── */}
        {partners.length > 0 && (
          <section>
            <Reveal>
              <SectionLabel>Institutional Partners</SectionLabel>
              <p className="text-neutral-400 text-sm mb-8 max-w-lg">
                Universities and research institutions collaborating on Beeli&apos;s language datasets.
              </p>
            </Reveal>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {partners.map((partner, i) => (
                <Reveal key={partner.id} delay={i * 60}>
                  <a
                    href={partner.url ?? undefined}
                    target={partner.url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="block p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-brand-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white group-hover:text-brand-300 transition-colors">{partner.name}</p>
                        {partner.region && (
                          <p className="text-xs text-neutral-500 mt-0.5">{partner.region}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                        {partner.type}
                      </span>
                    </div>
                    {partner.languageIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {partner.languageIds.map((lid) => (
                          <span key={lid} className="text-[10px] text-brand-400 bg-brand-950/40 border border-brand-900 px-1.5 py-0.5 rounded-full">
                            {getLanguageName(lid)}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ── Lexicographic Standards ── */}
        <section>
          <Reveal>
            <SectionLabel>Lexicographic Standards</SectionLabel>
            <p className="text-neutral-400 text-sm mb-8 max-w-lg">
              Every Beeli dictionary entry is built to the same rigorous standard — the same infrastructure
              that powers professional reference works.
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {STANDARDS.map(({ icon: Icon, label }, i) => (
              <Reveal key={label} delay={i * 40}>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                  <Icon className="h-4 w-4 text-brand-400 shrink-0" />
                  <span className="text-sm text-neutral-300">{label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
