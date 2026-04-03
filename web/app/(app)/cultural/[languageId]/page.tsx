"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Globe2 } from "lucide-react";
import { use, useState } from "react";
import { useTranslation } from "react-i18next";

interface KeyTerm {
  word: string;
  english: string;
}

interface CulturalItem {
  id: string;
  languageId: string;
  title: string;
  category: string;
  description: string;
  emoji?: string | null;
  keyTerms: KeyTerm[];
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "colors", label: "Colors" },
  { id: "naming", label: "Naming" },
  { id: "festivals", label: "Festivals" },
  { id: "myths", label: "Myths & Stories" },
  { id: "music", label: "Music" },
  { id: "clothing", label: "Clothing" },
  { id: "cuisine", label: "Cuisine" },
  { id: "greetings", label: "Greetings" },
];

const LANGUAGE_NAMES: Record<string, string> = {
  izon: "Izon", akan: "Akan", amharic: "Amharic", yoruba: "Yoruba",
  swahili: "Swahili", hausa: "Hausa", igbo: "Igbo", oromo: "Oromo",
};

export default function CulturalPage({ params }: Readonly<{ params: Promise<{ languageId: string }> }>) {
  const { languageId } = use(params);
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: items = [], isLoading } = useQuery<CulturalItem[]>({
    queryKey: ["cultural", languageId],
    queryFn: () => apiFetch<CulturalItem[]>(`/cultural?languageId=${languageId}`),
  });

  const filtered = activeCategory === "all"
    ? items
    : items.filter((item) => item.category === activeCategory);

  const langName = LANGUAGE_NAMES[languageId] ?? languageId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
          <Globe2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
            {langName} Culture
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("practice.sectionCulture")}
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="overflow-x-auto scrollbar-hide mb-6">
        <div className="flex gap-2 pb-2 w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                activeCategory === cat.id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "border-neutral-200 text-neutral-600 hover:border-purple-400 dark:border-neutral-700 dark:text-neutral-400"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <Globe2 className="mx-auto h-10 w-10 mb-3" />
          <p className="font-medium">No content yet for this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                {item.emoji && (
                  <span className="text-3xl shrink-0">{item.emoji}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-neutral-900 dark:text-white">{item.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-xs font-medium text-purple-700 dark:text-purple-300 capitalize">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {item.keyTerms.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                    Key Terms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.keyTerms.map((term) => (
                      <div
                        key={term.word}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                      >
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{term.word}</span>
                        <span className="text-neutral-400">·</span>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">{term.english}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
