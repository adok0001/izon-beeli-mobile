"use client";

import { LanguageSelector } from "@/components/ui/language-selector";
import { cn } from "@/lib/utils";
import { ChevronLeft, X } from "lucide-react";
import { useTranslation } from "react-i18next";

// ── Shared types ────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "greetings", "family", "numbers", "food", "body", "animals",
  "nature", "colors", "time", "verbs", "adjectives", "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Course { id: string; title: string; languageId: string; }
export interface Bounty { id: string; title: string; description: string; languageId: string; category?: string; reward: number; progressPercent: number; }
export type BountyTarget = { id: string; languageId: string; category?: string };
export type Flow = "word" | "bulk" | "lesson" | "bounties" | "reviewer";

// ── Shared UI ───────────────────────────────────────────────────────────────

export const fieldCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm px-3 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function Label({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
      {children}
    </label>
  );
}

export function StepHeader({ step, total, title, onBack }: Readonly<{ step: number; total: number; title: string; onBack: () => void }>) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <p className="text-xs text-neutral-400 mb-0.5">{t("contribute.stepOf", { step, total })}</p>
        <h2 className="font-bold text-neutral-900 dark:text-white">{title}</h2>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn("h-1.5 w-6 rounded-full", i < step ? "bg-amber-500" : "bg-neutral-200 dark:bg-neutral-700")}
          />
        ))}
      </div>
    </div>
  );
}

export function LanguagePicker({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Label>{t("contribute.languageRequired")}</Label>
      <LanguageSelector
        value={value}
        onChange={onChange}
        allowCustom={true}
        className="w-full"
      />
    </div>
  );
}

export function ErrorMsg({ msg }: Readonly<{ msg: string | null }>) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 dark:text-red-400 mt-1">{msg}</p>;
}

export function SuccessBanner({ message, onClose }: Readonly<{ message: string; onClose: () => void }>) {
  return (
    <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 mb-6">
      <div className="flex-1 text-sm text-green-800 dark:text-green-300">{message}</div>
      <button onClick={onClose} className="text-green-500 hover:text-green-700 mt-0.5">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
