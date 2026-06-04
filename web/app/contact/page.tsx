"use client";

import { ArrowLeft, ArrowRight, BookOpen, Building2, GraduationCap, Mic } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContactType = "institution" | "access" | "partner" | "general";

interface TypeConfig {
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle: string;
  showOrg: boolean;
  accent: string;
  accentBg: string;
  subject: string;
}

const TYPE_CONFIGS: Record<ContactType, TypeConfig> = {
  institution: {
    icon: <Building2 className="w-5 h-5" />,
    label: "Partnership",
    title: "Partner with Aurufie.",
    subtitle:
      "Schools, universities, and NGOs — tell us about your organisation and how we can work together.",
    showOrg: true,
    accent: "#a855f7",
    accentBg: "rgba(168,85,247,0.10)",
    subject: "Institution Partnership Inquiry",
  },
  access: {
    icon: <Building2 className="w-5 h-5" />,
    label: "Institutional Access",
    title: "Request institutional access.",
    subtitle:
      "Get classroom tools, progress tracking, and structured curriculum for your programme.",
    showOrg: true,
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.10)",
    subject: "Institutional Access Request",
  },
  partner: {
    icon: <Mic className="w-5 h-5" />,
    label: "Language Partner",
    title: "Become a language partner.",
    subtitle:
      "Bring your community, language expertise, or cultural knowledge into the Aurufie platform.",
    showOrg: false,
    accent: "#f59e0b",
    accentBg: "rgba(245,158,11,0.10)",
    subject: "Language Partner Inquiry",
  },
  general: {
    icon: <BookOpen className="w-5 h-5" />,
    label: "General",
    title: "Get in touch.",
    subtitle: "Questions, ideas, or feedback — we read every message.",
    showOrg: false,
    accent: "#10b981",
    accentBg: "rgba(16,185,129,0.10)",
    subject: "Aurufie Inquiry",
  },
};

const TYPE_TABS: { id: ContactType; icon: React.ReactNode; label: string }[] = [
  { id: "institution", icon: <Building2 className="w-4 h-4" />, label: "Partnership" },
  { id: "access", icon: <GraduationCap className="w-4 h-4" />, label: "Institutional Access" },
  { id: "partner", icon: <Mic className="w-4 h-4" />, label: "Language Partner" },
  { id: "general", icon: <BookOpen className="w-4 h-4" />, label: "General" },
];

function isContactType(v: string | null): v is ContactType {
  return v === "institution" || v === "access" || v === "partner" || v === "general";
}

// ── Form ──────────────────────────────────────────────────────────────────────

function ContactForm({ config }: { config: TypeConfig }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = [
      config.showOrg && org ? `Organisation: ${org}\n` : "",
      message,
    ].join("");
    const mailtoUrl = `mailto:hello@beeli.app?subject=${encodeURIComponent(config.subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${body}`)}`;
    window.location.href = mailtoUrl;
    setSent(true);
  }

  const inputBase =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-opacity-60 transition-colors duration-200";

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ background: config.accentBg, color: config.accent }}
        >
          ✓
        </div>
        <h3 className="font-display text-2xl text-white">Your message is on its way.</h3>
        <p className="text-neutral-500 text-sm max-w-xs">
          We&apos;ll reply to {email || "your email"} as soon as we can.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-semibold transition-colors duration-200"
          style={{ color: config.accent }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
            Name
          </label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputBase}
            style={{ "--focus-color": config.accent } as React.CSSProperties}
            onFocus={(e) => (e.currentTarget.style.borderColor = config.accent + "60")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
            Email
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputBase}
            onFocus={(e) => (e.currentTarget.style.borderColor = config.accent + "60")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>
      </div>

      {config.showOrg && (
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
            Organisation
          </label>
          <input
            type="text"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="University, school, or NGO name"
            className={inputBase}
            onFocus={(e) => (e.currentTarget.style.borderColor = config.accent + "60")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>
      )}

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Message
        </label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your needs, goals, or questions…"
          className={`${inputBase} resize-none`}
          onFocus={(e) => (e.currentTarget.style.borderColor = config.accent + "60")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-200 mt-2"
        style={{
          background: config.accent,
          color: config.accent === "#f59e0b" ? "#1a1a1a" : "#fff",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Send message
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

// ── Inner page (needs Suspense for useSearchParams) ───────────────────────────

function ContactPageInner() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type");
  const [activeType, setActiveType] = useState<ContactType>(
    isContactType(rawType) ? rawType : "general"
  );

  const config = TYPE_CONFIGS[activeType];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Grain */}
      <div className="grain-overlay" />

      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-start justify-center">
        <div
          className="w-[700px] h-[500px] opacity-[0.07] blur-3xl"
          style={{ background: `radial-gradient(ellipse, ${config.accent}, transparent 70%)` }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-16">
        {/* Back nav */}
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors duration-200 mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Aurufie
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 mb-6"
            style={{ background: config.accentBg, borderColor: config.accent + "30", color: config.accent }}
          >
            {config.icon}
            <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{config.label}</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-white tracking-[-0.02em] leading-[1.05] mb-4">
            {config.title}
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-lg">{config.subtitle}</p>
        </div>

        {/* Type tabs */}
        <div className="flex flex-wrap gap-2 p-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] mb-10">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeType === tab.id
                  ? "text-white"
                  : "text-neutral-500 hover:text-white"
              }`}
              style={
                activeType === tab.id
                  ? { background: config.accent + "20", color: config.accent }
                  : {}
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8 border"
          style={{
            background: config.accentBg,
            borderColor: config.accent + "20",
          }}
        >
          <ContactForm key={activeType} config={config} />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/[0.05] flex items-center justify-between text-xs text-neutral-600 font-mono">
          <span>© {new Date().getFullYear()} Aurufie · Beeli</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors duration-150">Privacy</Link>
            <Link href="/support" className="hover:text-white transition-colors duration-150">Support</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
      <ContactPageInner />
    </Suspense>
  );
}
