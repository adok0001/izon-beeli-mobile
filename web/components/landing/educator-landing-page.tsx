"use client";

import Link from "next/link";
import {
  Languages,
  GraduationCap,
  BookOpen,
  BarChart3,
  Award,
  ArrowRight,
  Check,
} from "lucide-react";

const HOW_IT_WORKS = [
  { step: "1", title: "Create a classroom", desc: "Takes 2 minutes. No setup fees, no credit card." },
  { step: "2", title: "Invite students", desc: "Share a code. Students join instantly on any device." },
  { step: "3", title: "Assign & track", desc: "Assign lessons, monitor progress, and watch retention improve." },
];

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Classroom Management",
    desc: "Create groups, bulk-enroll students with an invite code, manage multiple classes from one dashboard.",
    color: "text-brand-400",
  },
  {
    icon: BookOpen,
    title: "Lesson Assignment",
    desc: "Assign any lesson to any group — drawing from 70+ African languages across every skill level.",
    color: "text-gold-400",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    desc: "See completion rates, quiz scores, and streak data per student. Know who needs support before they fall behind.",
    color: "text-indigo-400",
  },
  {
    icon: Award,
    title: "Student Motivation",
    desc: "XP, streaks, and leaderboards keep students competing — with each other and themselves.",
    color: "text-green-400",
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
    name: "Community",
    price: "Free",
    students: "Up to 10 students",
    features: ["1 classroom", "Lesson assignment", "Basic progress view"],
    cta: "Get Started",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Classroom Starter",
    price: "$99/mo",
    students: "Up to 30 students",
    features: ["Unlimited classrooms", "Full progress reports", "Priority support"],
    cta: "Start Free Trial",
    href: "/sign-up",
    highlight: true,
  },
  {
    name: "Institution",
    price: "Custom",
    students: "Unlimited students",
    features: ["Custom onboarding", "Dedicated account manager", "SLA & invoicing"],
    cta: "Contact Us",
    href: "/support",
    highlight: false,
  },
];

export function EducatorLandingPage() {
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
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-800 flex items-center justify-center shadow-glow-sm">
                <Languages className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">Beeli</span>
            </Link>
            <span className="hidden sm:block text-xs font-semibold uppercase tracking-widest text-brand-400">
              For Educators
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="btn-ghost text-sm">Sign In</Link>
            <Link href="/sign-up" className="btn-primary text-sm">Create a Classroom</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="animate-fade-in max-w-4xl mx-auto">
          <span className="badge bg-brand-500/10 border border-brand-500/20 text-brand-300 mb-6">
            Free for educators · No setup fees
          </span>
          <h1 className="mt-4 text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05]">
            <span className="gradient-text-bold">Your students will</span>
            <br />actually do the homework.
          </h1>
          <p className="mt-6 text-xl sm:text-2xl text-neutral-400 font-medium">
            Classroom tools for heritage language schools and university departments.
          </p>
          <p className="mt-3 text-sm text-neutral-600">
            Assign lessons, track progress, and teach 70+ African languages — all from one free dashboard.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up" className="btn-primary px-8 py-3.5 text-base shadow-glow">
              Create a Classroom — Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/learn"
              className="btn-ghost px-8 py-3.5 text-base border border-white/[0.10]"
            >
              See the Platform
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="flex flex-col items-center text-center py-8 sm:py-0 sm:px-8">
              <div className="w-10 h-10 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mb-4">
                <span className="text-brand-400 font-extrabold text-sm">{step.step}</span>
              </div>
              <h3 className="font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-neutral-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Everything your classroom needs.
          </h2>
          <p className="text-center text-neutral-500 mb-12 max-w-xl mx-auto">
            Built into the platform. No third-party tools. No extra cost.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

      {/* Language coverage */}
      <section className="relative py-20 px-4 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            We cover the languages your students need.
          </h2>
          <p className="text-neutral-500 mb-12">
            Yoruba, Igbo, Swahili, Hausa, Amharic, Twi, Izon, Somali — and 60+ more.
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

      {/* Target institutions */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-3xl font-extrabold text-white mb-12">
            Built for communities like yours.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="surface-raised p-8">
              <h3 className="text-lg font-bold text-white mb-3">Heritage Language Schools</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                Weekend and supplementary schools teaching Yoruba, Igbo, Twi, Somali, Amharic to diaspora children in the UK, US, Canada, and beyond.
              </p>
              <p className="text-xs text-neutral-600 italic">
                &ldquo;The app teaching diaspora kids the language behind their favorite songs.&rdquo;
              </p>
            </div>
            <div className="surface-raised p-8">
              <h3 className="text-lg font-bold text-white mb-3">University Departments</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                African language programs at SOAS London, Howard University, UCLA, University of Lagos, University of Nairobi, and peer institutions.
              </p>
              <p className="text-xs text-neutral-600 italic">
                &ldquo;Give your students a living language — one built by the community, for the community.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl font-extrabold text-white mb-4">
            Free to start. Always.
          </h2>
          <p className="text-center text-neutral-500 mb-12">
            No paywalls on language learning. Scale up only when your program grows.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-7 rounded-2xl border ${
                  plan.highlight
                    ? "surface-brand shadow-glow-sm"
                    : "surface-raised"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
                )}
                <div className="mb-6">
                  <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">
                    {plan.name}
                  </div>
                  <div className="text-3xl font-extrabold text-white">{plan.price}</div>
                  <div className="text-xs text-neutral-500 mt-1">{plan.students}</div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-neutral-400">
                      <Check className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={plan.highlight ? "btn-primary w-full justify-center" : "btn-ghost w-full justify-center border border-white/[0.10]"}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-28 px-4 text-center">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
            Give your students a
            <br />
            <span className="gradient-text-gold">living language.</span>
          </h2>
          <p className="text-neutral-500 mb-10 text-lg">
            Built by the community. For the community.
          </p>
          <Link href="/sign-up" className="btn-primary px-10 py-4 text-base shadow-glow-lg">
            Create a Classroom Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
          <span>© {new Date().getFullYear()} Beeli. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-neutral-400 transition-colors">
              For Learners
            </Link>
            <Link href="/privacy" className="hover:text-neutral-400 transition-colors">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-neutral-400 transition-colors">
              Support
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
