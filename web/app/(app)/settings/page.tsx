"use client";

import { apiFetch } from "@/lib/api";
import { applyTheme, getStoredTheme, persistTheme, type AppTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { FeedbackCategory } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ExternalLink, HelpCircle, MessageSquare, Monitor, Moon, Shield, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const FEEDBACK_CATEGORY_KEYS: Record<FeedbackCategory, string> = {
  bug:        "feedback.categoryBug",
  suggestion: "feedback.categorySuggestion",
  other:      "feedback.categoryOther",
};

// ── Window chrome (Poolsuite-style) ──────────────────────────────────────────

function WindowTitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50/80 dark:bg-white/[0.02] rounded-t-2xl">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f56", opacity: 0.45 }} />
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e", opacity: 0.45 }} />
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27c93f", opacity: 0.45 }} />
      <span className="flex-1 text-center font-mono text-[9px] text-neutral-400 dark:text-neutral-600 tracking-wide select-none truncate">
        {title}
      </span>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-px bg-amber-500/50" />
      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-500/70">
        {children}
      </span>
    </div>
  );
}

// ── Settings panel card ───────────────────────────────────────────────────────

function SettingsPanel({ windowTitle, children }: { windowTitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-100 dark:border-white/[0.07] overflow-hidden bg-white dark:bg-white/[0.02]">
      <WindowTitleBar title={windowTitle} />
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const { uiLanguage, setUiLanguage } = useUiLanguageStore();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [theme, setTheme] = useState<AppTheme>("system");
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const sendFeedback = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({ category: feedbackCategory, message: feedbackMessage.trim(), platform: "web" }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      setFeedbackMessage("");
      toast.success(t("settings.feedbackSent"));
    },
  });

  useEffect(() => {
    setTheme(getStoredTheme());
    applyTheme(getStoredTheme());
  }, []);

  const handleTheme = (next: AppTheme) => {
    setTheme(next);
    persistTheme(next);
    applyTheme(next);
  };

  const THEME_OPTIONS: { id: AppTheme; icon: typeof Sun; label: string }[] = [
    { id: "light",  icon: Sun,     label: t("settings.themeLight") },
    { id: "dark",   icon: Moon,    label: t("settings.themeDark") },
    { id: "system", icon: Monitor, label: t("settings.themeSystem") },
  ];

  const UI_LANGS = [
    { id: "en"  as const, label: "English",    flag: "🇬🇧" },
    { id: "fr"  as const, label: "Français",   flag: "🇫🇷" },
    { id: "pcm" as const, label: "Naija",      flag: "🇳🇬" },
    { id: "ar"  as const, label: "العربية",    flag: "🇸🇦" },
    { id: "pt"  as const, label: "Português",  flag: "🇵🇹" },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">

      {/* Page header */}
      <div>
        <SectionLabel>{t("settings.title")}</SectionLabel>
        <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white leading-tight">
          {t("settings.title")}
        </h1>
      </div>

      {/* ── Learning language ── */}
      <SettingsPanel windowTitle={`pref.language — ${t("settings.learningLanguage")}`}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600 mb-3">
          {t("settings.learningLanguage")}
        </p>
        <LanguageSelector
          value={selectedLanguageId}
          onChange={setLanguage}
          allowCustom={true}
          className="w-full"
        />
      </SettingsPanel>

      {/* ── Appearance ── */}
      <SettingsPanel windowTitle={`pref.appearance — ${t("settings.appearance")}`}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600 mb-3">
          {t("settings.appearance")}
        </p>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleTheme(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200",
                theme === id
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-[0_0_16px_-4px_rgb(245_158_11_/0.3)]"
                  : "border-neutral-100 dark:border-white/[0.07] text-neutral-500 dark:text-neutral-500 hover:border-amber-400/30 dark:hover:border-amber-500/20 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </SettingsPanel>

      {/* ── UI language ── */}
      <SettingsPanel windowTitle={`pref.ui-language — ${t("settings.uiLanguage")}`}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600 mb-3">
          {t("settings.uiLanguage")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {UI_LANGS.map(({ id, label, flag }) => (
            <button
              key={id}
              onClick={() => setUiLanguage(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200",
                uiLanguage === id
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-[0_0_14px_-4px_rgb(245_158_11_/0.25)]"
                  : "border-neutral-100 dark:border-white/[0.07] text-neutral-600 dark:text-neutral-400 hover:border-amber-400/30 dark:hover:border-amber-500/20"
              )}
            >
              <span className="text-base leading-none">{flag}</span>
              <span className="truncate">{label}</span>
              {uiLanguage === id && (
                <span className="ml-auto font-mono text-[9px] text-amber-500">✓</span>
              )}
            </button>
          ))}
        </div>
      </SettingsPanel>

      {/* ── Help & links ── */}
      <SettingsPanel windowTitle={`help — ${t("settings.helpSection")}`}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600 mb-3">
          {t("settings.helpSection")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/support"
            className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-100 dark:border-white/[0.07] hover:border-amber-400/30 dark:hover:border-amber-500/20 transition-all duration-200"
          >
            <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{t("settings.faq")}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-600 truncate">{t("settings.faqDesc")}</p>
            </div>
            <ExternalLink className="h-3 w-3 text-neutral-300 dark:text-neutral-700 shrink-0 ml-auto group-hover:text-amber-400 transition-colors" />
          </Link>
          <Link
            href="/privacy"
            className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-100 dark:border-white/[0.07] hover:border-amber-400/30 dark:hover:border-amber-500/20 transition-all duration-200"
          >
            <Shield className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{t("settings.privacyPolicy")}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-600 truncate">{t("settings.privacyPolicyDesc")}</p>
            </div>
            <ExternalLink className="h-3 w-3 text-neutral-300 dark:text-neutral-700 shrink-0 ml-auto group-hover:text-amber-400 transition-colors" />
          </Link>
        </div>
      </SettingsPanel>

      {/* ── Feedback ── */}
      <SettingsPanel windowTitle={`feedback — ${t("settings.sendFeedbackSection")}`}>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-amber-500" />
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
            {t("settings.sendFeedbackSection")}
          </p>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-3">
          {(["bug", "suggestion", "other"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFeedbackCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-[0.16em] border transition-all duration-200",
                feedbackCategory === cat
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "border-neutral-100 dark:border-white/[0.07] text-neutral-500 dark:text-neutral-500 hover:border-amber-400/25"
              )}
            >
              {t(FEEDBACK_CATEGORY_KEYS[cat])}
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          value={feedbackMessage}
          onChange={(e) => setFeedbackMessage(e.target.value)}
          placeholder={t("feedback.descriptionPlaceholder")}
          className="w-full rounded-xl border border-neutral-100 dark:border-white/[0.07] bg-neutral-50 dark:bg-white/[0.02] text-sm px-4 py-3 text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500/40 resize-none font-sans"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono text-[9px] text-neutral-300 dark:text-neutral-700">{feedbackMessage.length}/2000</span>
          <button
            onClick={() => sendFeedback.mutate()}
            disabled={!feedbackMessage.trim() || sendFeedback.isPending}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06060e] font-bold text-sm transition-all duration-200 disabled:opacity-40 shadow-[0_0_16px_-4px_rgb(245_158_11_/0.4)] hover:shadow-[0_0_24px_-4px_rgb(245_158_11_/0.6)]"
          >
            {sendFeedback.isPending ? t("common.saveInProgress") : t("feedback.submit")}
          </button>
        </div>
      </SettingsPanel>

      {/* App version */}
      <div className="text-center pb-4">
        <p className="font-display font-bold text-neutral-900 dark:text-white">Beeli</p>
        <p className="font-mono text-[9px] text-neutral-300 dark:text-neutral-700 mt-0.5 uppercase tracking-[0.2em]">
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0"}
        </p>
      </div>
    </div>
  );
}
