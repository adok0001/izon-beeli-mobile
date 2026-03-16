"use client";

import {
    applyTheme,
    getStoredTheme,
    persistTheme,
    type AppTheme,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { id: "izon", name: "Izon" },
  { id: "akan", name: "Akan" },
  { id: "amharic", name: "Amharic" },
  { id: "yoruba", name: "Yoruba" },
  { id: "swahili", name: "Swahili" },
  { id: "hausa", name: "Hausa" },
  { id: "igbo", name: "Igbo" },
  { id: "oromo", name: "Oromo" },
] as const;

export default function SettingsPage() {
  const { selectedLanguageId, setLanguage } = useLanguageStore();
  const { uiLanguage, setUiLanguage } = useUiLanguageStore();
  const { t } = useTranslation();
  const [theme, setTheme] = useState<AppTheme>("system");

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
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-medium border text-left transition-colors",
                selectedLanguageId === lang.id
                  ? "bg-brand-50 border-brand-400 text-brand-700 dark:bg-brand-950/40 dark:border-brand-700 dark:text-brand-300"
                  : "border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-400 hover:border-brand-300"
              )}
            >
              {lang.name}
              {selectedLanguageId === lang.id && (
                <span className="float-right text-brand-500">✓</span>
              )}
            </button>
          ))}
        </div>
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
    </div>
  );
}
