"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Languages,
  GraduationCap,
  BookOpen,
  BarChart3,
  Award,
  ArrowRight,
  Check,
} from "lucide-react";

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
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

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

// ── Data ──────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { roman: "I",   title: "Create a classroom",  desc: "Takes 2 minutes. No setup fees, no credit card." },
  { roman: "II",  title: "Invite students",      desc: "Share a code. Students join instantly on any device." },
  { roman: "III", title: "Assign & track",       desc: "Assign lessons, monitor progress, and watch retention improve." },
];

const FEATURES = [
  {
    roman: "I",
    icon: GraduationCap,
    title: "Classroom Management",
    desc: "Create groups, bulk-enroll students with an invite code, manage multiple classes from one dashboard.",
  },
  {
    roman: "II",
    icon: BookOpen,
    title: "Lesson Assignment",
    desc: "Assign any lesson to any group — drawing from 70+ African languages across every skill level.",
  },
  {
    roman: "III",
    icon: BarChart3,
    title: "Progress Tracking",
    desc: "See completion rates, quiz scores, and streak data per student. Know who needs support before they fall behind.",
  },
  {
    roman: "IV",
    icon: Award,
    title: "Student Motivation",
    desc: "XP, streaks, and leaderboards keep students competing — with each other and themselves.",
  },
];

const LANGUAGES = [
  { name: "Yoruba", region: "West Africa" },
  { name: "Igbo", region: "West Africa" },
  { name: "Twi", region: "West Africa" },
  { name: "Somali", region: "East Africa" },
  { name: "Amharic", region: "East Africa" },
  { name: "Swahili", region: "East Africa" },
  { name: "Hausa", region: "West Africa" },
  { name: "Izon", region: "Niger Delta" },
  { name: "Wolof", region: "West Africa" },
  { name: "Zulu", region: "Southern Africa" },
];

const PLANS = [
  {
    ref: "Cat. No. 001",
    name: "Community",
    price: "Free",
    students: "Up to 10 students",
    features: ["1 classroom", "Lesson assignment", "Basic progress view"],
    cta: "Get Started",
    href: "/sign-up",
    highlight: false,
  },
  {
    ref: "Cat. No. 002",
    name: "Classroom Starter",
    price: "$99/mo",
    students: "Up to 30 students",
    features: ["Unlimited classrooms", "Full progress reports", "Priority support"],
    cta: "Start Free Trial",
    href: "/sign-up",
    highlight: true,
  },
  {
    ref: "Cat. No. 003",
    name: "Institution",
    price: "Custom",
    students: "Unlimited students",
    features: ["Custom onboarding", "Dedicated account manager", "SLA & invoicing"],
    cta: "Contact Us",
    href: "/support",
    highlight: false,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function EducatorLandingPage() {
  return (
    <div className="min-h-screen bg-[#06060e] text-neutral-50 overflow-x-hidden">

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
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-[0_0_20px_-4px_rgb(245_158_11_/0.5)]">
                <Languages className="h-4 w-4 text-white" />
              </div>
              <span className="font-display font-bold text-white text-xl tracking-tight">Beeli</span>
            </Link>
            <span className="hidden sm:block text-[11px] uppercase tracking-widest text-amber-500/70 font-semibold">
              For Educators
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="btn-ghost text-sm">Sign In</Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_24px_-6px_rgb(245_158_11_/0.5)] hover:shadow-[0_0_36px_-6px_rgb(245_158_11_/0.7)]"
            >
              Create a Classroom
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[88vh] flex flex-col justify-center px-6 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-3xl animate-fade-in">
            <SectionLabel>Collection No. 002 — Educator Suite</SectionLabel>

            <h1 className="font-display font-bold leading-[0.92] tracking-tight">
              <span className="block text-[clamp(3rem,8vw,6.5rem)] text-white">
                Your students will
              </span>
              <span className="block text-[clamp(3rem,8vw,6.5rem)] text-amber-400">
                actually show up.
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-neutral-400 max-w-lg leading-relaxed">
              Classroom tools for heritage language schools and university departments. Free to start.
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Assign lessons, track progress, and teach 70+ African languages — all from one dashboard.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_60px_-12px_rgb(245_158_11_/0.65)] hover:shadow-[0_0_80px_-12px_rgb(245_158_11_/0.85)]"
              >
                Create a Classroom — Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
              >
                See the Platform
              </Link>
            </div>
          </div>

          {/* Decorative letterform */}
          <div
            aria-hidden
            className="absolute right-0 bottom-0 hidden lg:flex items-end opacity-[0.03] select-none pointer-events-none overflow-hidden h-[60vh]"
          >
            <span
              className="font-display font-bold leading-none text-white"
              style={{ fontSize: "clamp(16rem, 24vw, 28rem)", lineHeight: 0.85 }}
            >
              ✦
            </span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <Reveal>
        <section className="relative border-y border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.roman}
                className={`flex flex-col py-10 sm:px-12 ${i > 0 ? "sm:border-l border-white/[0.06]" : ""}`}
              >
                <span className="font-display font-bold text-3xl text-amber-400/30 mb-4 leading-none">
                  {step.roman}
                </span>
                <h3 className="font-display font-semibold text-lg text-white mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Feature grid ── */}
      <section className="relative py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16">
              <SectionLabel>Exhibition Halls</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                Everything your<br />classroom needs.
              </h2>
              <p className="mt-4 text-neutral-500 max-w-sm text-sm leading-relaxed">
                Built into the platform. No third-party tools. No extra cost.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <div className="group relative h-full bg-white/[0.025] border border-white/[0.06] rounded-2xl p-8 hover:border-amber-500/25 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden">
                  <span className="absolute top-6 right-7 text-[10px] uppercase tracking-[0.28em] text-neutral-700 font-medium">
                    {f.roman}
                  </span>
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent group-hover:via-amber-500/60 transition-all duration-300" />
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:bg-amber-500/15 transition-colors duration-300">
                    <f.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-white mb-3">{f.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Language coverage ── */}
      <section className="relative py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
              <div>
                <SectionLabel>Permanent Collection</SectionLabel>
                <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                  We cover the languages<br />your students need.
                </h2>
              </div>
              <p className="text-sm text-neutral-600 max-w-xs sm:text-right leading-relaxed">
                Yoruba, Igbo, Swahili, Hausa, Amharic, Twi, Izon, Somali — and 60+ more.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {LANGUAGES.map((l, i) => (
              <Reveal key={l.name} delay={i * 45}>
                <div className="group relative bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] hover:border-amber-500/20 transition-all duration-200 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/25 group-hover:bg-amber-500/55 transition-colors" />
                  <div className="text-sm font-semibold text-white mt-1">{l.name}</div>
                  <div className="text-[10px] text-neutral-600 mt-1 uppercase tracking-wide">{l.region}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Target institutions ── */}
      <Reveal>
        <section className="relative py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <SectionLabel>Built For</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white">
                Communities like yours.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  title: "Heritage Language Schools",
                  body: "Weekend and supplementary schools teaching Yoruba, Igbo, Twi, Somali, Amharic to diaspora children in the UK, US, Canada, and beyond.",
                  quote: "The app teaching diaspora kids the language behind their favorite songs.",
                },
                {
                  title: "University Departments",
                  body: "African language programs at SOAS London, Howard University, UCLA, University of Lagos, University of Nairobi, and peer institutions.",
                  quote: "Give your students a living language — one built by the community, for the community.",
                },
              ].map((card, i) => (
                <Reveal key={card.title} delay={i * 100}>
                  <div className="relative bg-white/[0.025] border border-white/[0.06] rounded-2xl p-8 overflow-hidden h-full">
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
                    <h3 className="font-display font-semibold text-xl text-white mb-3">{card.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed mb-5">{card.body}</p>
                    <p className="text-xs text-neutral-600 italic border-l-2 border-amber-500/30 pl-3">
                      &ldquo;{card.quote}&rdquo;
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Pricing ── */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="mb-14 text-center">
              <SectionLabel>Pricing</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white">
                Free to start. Always.
              </h2>
              <p className="mt-4 text-neutral-500 max-w-sm mx-auto text-sm">
                No paywalls on language learning. Scale up only when your program grows.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 90}>
                <div
                  className={`relative flex flex-col h-full rounded-2xl border p-7 overflow-hidden ${
                    plan.highlight
                      ? "bg-amber-500/[0.07] border-amber-500/30 shadow-[0_0_52px_-12px_rgb(245_158_11_/0.3)]"
                      : "bg-white/[0.02] border-white/[0.07]"
                  }`}
                >
                  {/* Top accent */}
                  <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${plan.highlight ? "via-amber-500/60" : "via-white/[0.1]"} to-transparent`} />

                  <div className="mb-6">
                    <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-600 mb-3">{plan.ref}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">{plan.name}</div>
                    <div className={`font-display font-bold text-4xl leading-none mb-1 ${plan.highlight ? "text-amber-400" : "text-white"}`}>
                      {plan.price}
                    </div>
                    <div className="text-xs text-neutral-600 mt-2">{plan.students}</div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-neutral-400">
                        <Check className={`h-3.5 w-3.5 shrink-0 ${plan.highlight ? "text-amber-400" : "text-neutral-600"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={
                      plan.highlight
                        ? "inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200"
                        : "inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
                    }
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <Reveal>
        <section className="relative py-32 px-6 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[380px] rounded-full bg-amber-900/[0.18] blur-[140px] pointer-events-none" />
          <div className="max-w-3xl mx-auto relative">
            <div className="flex items-center justify-center gap-6 mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.05]" />
              <SectionLabel>Open Doors</SectionLabel>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.05]" />
            </div>
            <h2 className="font-display font-bold text-5xl sm:text-6xl text-white leading-tight mb-4">
              Give your students a
              <br />
              <span className="text-amber-400">living language.</span>
            </h2>
            <p className="text-neutral-500 mb-10 text-base">
              Built by the community. For the community.
            </p>
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-base transition-all duration-200 shadow-[0_0_72px_-12px_rgb(245_158_11_/0.65)] hover:shadow-[0_0_100px_-12px_rgb(245_158_11_/0.85)]"
            >
              Create a Classroom Free
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
            <Link href="/" className="hover:text-neutral-400 transition-colors">For Learners</Link>
            <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy</Link>
            <Link href="/support" className="hover:text-neutral-400 transition-colors">Support</Link>
            <Link href="/sign-up" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
