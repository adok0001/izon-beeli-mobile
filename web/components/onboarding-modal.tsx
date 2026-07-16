"use client";

import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguageStore } from "@/store/language-store";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
          <Globe className="h-8 w-8 mx-auto mb-3 text-brand-600 dark:text-brand-400" strokeWidth={1.5} />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {t("onboarding.title", { defaultValue: "Which language do you want to learn?" })}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t("onboarding.subtitle", { defaultValue: "You can change this anytime in settings." })}
          </p>
        </div>

        {/* Language selector */}
        <div className="mb-6">
          <LanguageSelector
            value={picked}
            onChange={setPicked}
            allowCustom={true}
            placeholder="Choose a language…"
            className="w-full"
          />
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
