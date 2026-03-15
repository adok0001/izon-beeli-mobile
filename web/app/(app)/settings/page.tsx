"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { cn } from "@/lib/utils";

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
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as typeof theme | null;
    if (saved) {
      // Apply saved theme to state and document root on mount
      handleTheme(saved);
    }
  }, []);

  const handleTheme = (t: typeof theme) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else if (t === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">Settings</h1>

      {/* Learning language */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-3">
          Learning Language
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
          Appearance
        </h2>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTheme(t)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium border capitalize transition-colors",
                theme === t
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400 hover:border-brand-400"
              )}
            >
              {t === "light" ? "☀️ Light" : t === "dark" ? "🌙 Dark" : "💻 System"}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
