"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";
import { useAudioStore } from "@/store/audio-store";
import { cn } from "@/lib/utils";

interface DictionaryWord {
  id: string;
  word: string;
  english: string;
  category: string;
  pronunciation?: string;
  audioUrl?: string;
}

export default function DictionaryPage() {
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: words = [], isLoading } = useQuery<DictionaryWord[]>({
    queryKey: ["dictionary", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DictionaryWord[]>(`/dictionary?language=${selectedLanguageId}`, {
        token: token ?? undefined,
      });
    },
  });

  const categories = ["all", ...Array.from(new Set(words.map((w) => w.category)))];

  const filtered = words.filter((w) => {
    const matchSearch =
      !search ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.english.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || w.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dictionary</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Browse and search vocabulary
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border capitalize transition-colors",
              category === cat
                ? "bg-brand-600 text-white border-brand-600"
                : "border-neutral-200 text-neutral-600 hover:border-brand-400 dark:border-neutral-700 dark:text-neutral-400"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Word list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <p className="text-4xl mb-3">📖</p>
          <p className="font-medium">No words found</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {filtered.map((word) => (
            <div key={word.id} className="flex items-center gap-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 dark:text-white">{word.word}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{word.english}</p>
                {word.pronunciation && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic mt-0.5">
                    /{word.pronunciation}/
                  </p>
                )}
              </div>
              <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full px-2.5 py-0.5 shrink-0 capitalize">
                {word.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
