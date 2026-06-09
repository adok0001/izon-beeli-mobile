"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { localeHref } from "@/lib/locale-href";
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

// ── Static data (non-translatable) ────────────────────────────────────────────

const HOW_IT_WORKS = [
  { roman: "I",   titleKey: "web.educators.howStep1Title", descKey: "web.educators.howStep1Desc" },
  { roman: "II",  titleKey: "web.educators.howStep2Title", descKey: "web.educators.howStep2Desc" },
  { roman: "III", titleKey: "web.educators.howStep3Title", descKey: "web.educators.howStep3Desc" },
];

const FEATURES = [
  { roman: "I",   icon: GraduationCap, titleKey: "web.educators.feature1Title", descKey: "web.educators.feature1Desc" },
  { roman: "II",  icon: BookOpen,      titleKey: "web.educators.feature2Title", descKey: "web.educators.feature2Desc" },
  { roman: "III", icon: BarChart3,     titleKey: "web.educators.feature3Title", descKey: "web.educators.feature3Desc" },
  { roman: "IV",  icon: Award,         titleKey: "web.educators.feature4Title", descKey: "web.educators.feature4Desc" },
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
    ref: "web.educators.plan1Ref",
    name: "web.educators.plan1Name",
    price: "web.educators.plan1Price",
    students: "web.educators.plan1Students",
    features: ["web.educators.plan1Feature1", "web.educators.plan1Feature2", "web.educators.plan1Feature3"],
    cta: "web.educators.plan1Cta",
    hrefKey: "/sign-up" as const,
    highlight: false,
  },
  {
    ref: "web.educators.plan2Ref",
    name: "web.educators.plan2Name",
    price: "web.educators.plan2Price",
    students: "web.educators.plan2Students",
    features: ["web.educators.plan2Feature1", "web.educators.plan2Feature2", "web.educators.plan2Feature3"],
    cta: "web.educators.plan2Cta",
    hrefKey: "/sign-up" as const,
    highlight: true,
  },
  {
    ref: "web.educators.plan3Ref",
    name: "web.educators.plan3Name",
    price: "web.educators.plan3Price",
    students: "web.educators.plan3Students",
    features: ["web.educators.plan3Feature1", "web.educators.plan3Feature2", "web.educators.plan3Feature3"],
    cta: "web.educators.plan3Cta",
    hrefKey: "/support" as const,
    highlight: false,
  },
];

const INSTITUTIONS = [
  {
    titleKey: "web.educators.institution1Title",
    bodyKey: "web.educators.institution1Body",
    quoteKey: "web.educators.institution1Quote",
  },
  {
    titleKey: "web.educators.institution2Title",
    bodyKey: "web.educators.institution2Body",
    quoteKey: "web.educators.institution2Quote",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function EducatorLandingPage() {
  const { t } = useTranslation();
  const locale = useUiLanguageStore((s) => s.uiLanguage);
  const lh = (path: string) => localeHref(locale, path);

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
              {t("web.educators.navForEducators")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={lh("/sign-in")} className="btn-ghost text-sm">{t("web.educators.navSignIn")}</Link>
            <Link
              href={lh("/sign-up")}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_24px_-6px_rgb(245_158_11_/0.5)] hover:shadow-[0_0_36px_-6px_rgb(245_158_11_/0.7)]"
            >
              {t("web.educators.navCreateClassroom")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[88vh] flex flex-col justify-center px-6 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-3xl animate-fade-in">
            <SectionLabel>{t("web.educators.heroCollectionLabel")}</SectionLabel>

            <h1 className="font-display font-bold leading-[0.92] tracking-tight">
              <span className="block text-[clamp(3rem,8vw,6.5rem)] text-white">
                {t("web.educators.heroHeadline1")}
              </span>
              <span className="block text-[clamp(3rem,8vw,6.5rem)] text-amber-400">
                {t("web.educators.heroHeadlineAccent")}
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-neutral-400 max-w-lg leading-relaxed">
              {t("web.educators.heroSubhead")}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              {t("web.educators.heroSubheadSub")}
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href={lh("/sign-up")}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 shadow-[0_0_60px_-12px_rgb(245_158_11_/0.65)] hover:shadow-[0_0_80px_-12px_rgb(245_158_11_/0.85)]"
              >
                {t("web.educators.heroPrimary")}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href={lh("/learn")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
              >
                {t("web.educators.heroSecondary")}
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
                <h3 className="font-display font-semibold text-lg text-white mb-2">{t(step.titleKey)}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{t(step.descKey)}</p>
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
              <SectionLabel>{t("web.educators.featuresLabel")}</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                {t("web.educators.featuresTitle")}
              </h2>
              <p className="mt-4 text-neutral-500 max-w-sm text-sm leading-relaxed">
                {t("web.educators.featuresSub")}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.roman} delay={i * 90}>
                <div className="group relative h-full bg-white/[0.025] border border-white/[0.06] rounded-2xl p-8 hover:border-amber-500/25 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden">
                  <span className="absolute top-6 right-7 text-[10px] uppercase tracking-[0.28em] text-neutral-700 font-medium">
                    {f.roman}
                  </span>
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent group-hover:via-amber-500/60 transition-all duration-300" />
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:bg-amber-500/15 transition-colors duration-300">
                    <f.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-white mb-3">{t(f.titleKey)}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{t(f.descKey)}</p>
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
                <SectionLabel>{t("web.educators.languagesLabel")}</SectionLabel>
                <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                  {t("web.educators.languagesTitle")}
                </h2>
              </div>
              <p className="text-sm text-neutral-600 max-w-xs sm:text-right leading-relaxed">
                {t("web.educators.languagesSub")}
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
              <SectionLabel>{t("web.educators.institutionsLabel")}</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white">
                {t("web.educators.institutionsTitle")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {INSTITUTIONS.map((card, i) => (
                <Reveal key={card.titleKey} delay={i * 100}>
                  <div className="relative bg-white/[0.025] border border-white/[0.06] rounded-2xl p-8 overflow-hidden h-full">
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
                    <h3 className="font-display font-semibold text-xl text-white mb-3">{t(card.titleKey)}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed mb-5">{t(card.bodyKey)}</p>
                    <p className="text-xs text-neutral-600 italic border-l-2 border-amber-500/30 pl-3">
                      &ldquo;{t(card.quoteKey)}&rdquo;
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
              <SectionLabel>{t("web.educators.pricingLabel")}</SectionLabel>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white">
                {t("web.educators.pricingTitle")}
              </h2>
              <p className="mt-4 text-neutral-500 max-w-sm mx-auto text-sm">
                {t("web.educators.pricingSub")}
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
                    <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-600 mb-3">{t(plan.ref)}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">{t(plan.name)}</div>
                    <div className={`font-display font-bold text-4xl leading-none mb-1 ${plan.highlight ? "text-amber-400" : "text-white"}`}>
                      {t(plan.price)}
                    </div>
                    <div className="text-xs text-neutral-600 mt-2">{t(plan.students)}</div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-8">
                    {plan.features.map((fKey) => (
                      <li key={fKey} className="flex items-center gap-2 text-sm text-neutral-400">
                        <Check className={`h-3.5 w-3.5 shrink-0 ${plan.highlight ? "text-amber-400" : "text-neutral-600"}`} />
                        {t(fKey)}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={lh(plan.hrefKey)}
                    className={
                      plan.highlight
                        ? "inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200"
                        : "inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
                    }
                  >
                    {t(plan.cta)}
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
              <SectionLabel>{t("web.educators.ctaLabel")}</SectionLabel>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.05]" />
            </div>
            <h2 className="font-display font-bold text-5xl sm:text-6xl text-white leading-tight mb-4">
              {t("web.educators.ctaTitle")}
              <br />
              <span className="text-amber-400">{t("web.educators.ctaAccent")}</span>
            </h2>
            <p className="text-neutral-500 mb-10 text-base">
              {t("web.educators.ctaSub")}
            </p>
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-base transition-all duration-200 shadow-[0_0_72px_-12px_rgb(245_158_11_/0.65)] hover:shadow-[0_0_100px_-12px_rgb(245_158_11_/0.85)]"
            >
              {t("web.educators.ctaButton")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-700">
          <span className="font-display">© {new Date().getFullYear()} Beeli. {t("web.educators.footerRights")}</span>
          <div className="flex gap-6">
            <Link href={lh("/home")} className="hover:text-neutral-400 transition-colors">{t("web.educators.footerForLearners")}</Link>
            <Link href={lh("/privacy")} className="hover:text-neutral-400 transition-colors">{t("web.educators.footerPrivacy")}</Link>
            <Link href={lh("/support")} className="hover:text-neutral-400 transition-colors">{t("web.educators.footerSupport")}</Link>
            <Link href={lh("/sign-up")} className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
              {t("web.educators.footerGetStarted")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
