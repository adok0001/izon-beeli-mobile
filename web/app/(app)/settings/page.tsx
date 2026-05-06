"use client";

import { apiFetch } from "@/lib/api";
import {
    applyTheme,
    getStoredTheme,
    persistTheme,
    type AppTheme,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { FeedbackCategory } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ExternalLink, HelpCircle, MessageSquare, Shield } from "lucide-react";
import { Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const FEEDBACK_CATEGORY_KEYS: Record<FeedbackCategory, string> = {
  bug:        "feedback.categoryBug",
  suggestion: "feedback.categorySuggestion",
  other:      "feedback.categoryOther",
};

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
    const savedTheme = getStoredTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const handleTheme = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    persistTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const getThemeLabel = (themeOption: typeof theme) => {
    switch (themeOption) {
      case "light":
        return (
          <>
            <Sun className="h-4 w-4" />
            {t("settings.themeLight")}
          </>
        );
      case "dark":
        return (
          <>
            <Moon className="h-4 w-4" />
            {t("settings.themeDark")}
          </>
        );
      default:
        return (
          <>
            <Monitor className="h-4 w-4" />
            {t("settings.themeSystem")}
          </>
        );
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">{t("settings.title")}</h1>

      {/* Learning language */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-3">
          {t("settings.learningLanguage")}
        </h2>
        <LanguageSelector
          value={selectedLanguageId}
          onChange={setLanguage}
          allowCustom={true}
          className="w-full"
        />
      </section>

      {/* Theme */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-3">
          {t("settings.appearance")}
        </h2>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => handleTheme(themeOption)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium capitalize border transition-colors",
                theme === themeOption
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400 hover:border-brand-400"
              )}
            >
              {getThemeLabel(themeOption)}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-3">
          {t("settings.uiLanguage")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "en", label: "English" },
            { id: "fr", label: "Français" },
            { id: "pcm", label: "Naija" },
          ] as const).map((lang) => (
            <button
              key={lang.id}
              onClick={() => setUiLanguage(lang.id)}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-medium border text-left transition-colors",
                uiLanguage === lang.id
                  ? "bg-brand-50 border-brand-400 text-brand-700 dark:bg-brand-950/40 dark:border-brand-700 dark:text-brand-300"
                  : "border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-400 hover:border-brand-300"
              )}
            >
              {lang.label}
              {uiLanguage === lang.id && <span className="float-right text-brand-500">✓</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Help & Feedback */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-3">
          {t("settings.helpSection")}
        </h2>

        {/* Link cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Link
            href="/support"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-brand-400 dark:hover:border-brand-600 transition-colors group"
          >
            <HelpCircle className="h-4 w-4 text-brand-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{t("settings.faq")}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{t("settings.faqDesc")}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600 shrink-0 ml-auto" />
          </Link>
          <Link
            href="/privacy"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-brand-400 dark:hover:border-brand-600 transition-colors group"
          >
            <Shield className="h-4 w-4 text-brand-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{t("settings.privacyPolicy")}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{t("settings.privacyPolicyDesc")}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600 shrink-0 ml-auto" />
          </Link>
        </div>

        {/* Feedback form */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-brand-500" />
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{t("settings.sendFeedbackSection")}</p>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mb-3">
            {(["bug", "suggestion", "other"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFeedbackCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  feedbackCategory === cat
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-brand-400"
                )}
              >
                {t(FEEDBACK_CATEGORY_KEYS[cat])}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            placeholder={t("feedback.descriptionPlaceholder")}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-3"
          />

          <div className="flex justify-end">
            <button
              onClick={() => sendFeedback.mutate()}
              disabled={!feedbackMessage.trim() || sendFeedback.isPending}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {sendFeedback.isPending ? t("common.saveInProgress") : t("feedback.submit")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
