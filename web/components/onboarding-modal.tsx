"use client";

import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { id: "izon",    name: "Izon",    flag: "🇳🇬" },
  { id: "yoruba",  name: "Yoruba",  flag: "🇳🇬" },
  { id: "igbo",    name: "Igbo",    flag: "🇳🇬" },
  { id: "hausa",   name: "Hausa",   flag: "🇳🇬" },
  { id: "akan",    name: "Akan",    flag: "🇬🇭" },
  { id: "swahili", name: "Swahili", flag: "🇰🇪" },
  { id: "amharic", name: "Amharic", flag: "🇪🇹" },
  { id: "oromo",   name: "Oromo",   flag: "🇪🇹" },
] as const;

const STORAGE_KEY = "beeli_onboarded";

export function OnboardingModal() {
  const { t } = useTranslation();
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(selectedLanguageId);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const confirm = () => {
    setLanguage(picked);
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-3">🌍</div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {t("onboarding.title", { defaultValue: "Which language do you want to learn?" })}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t("onboarding.subtitle", { defaultValue: "You can change this anytime in settings." })}
          </p>
        </div>

        {/* Language grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setPicked(lang.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left",
                picked === lang.id
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-brand-300 dark:hover:border-brand-700"
              )}
            >
              <span className="text-base">{lang.flag}</span>
              {lang.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={confirm}
          className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          {t("onboarding.cta", { defaultValue: "Get started" })}
        </button>
      </div>
    </div>
  );
}
