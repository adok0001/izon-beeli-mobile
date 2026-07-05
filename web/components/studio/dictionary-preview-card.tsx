"use client";

import Image from "next/image";
import { Volume2 } from "lucide-react";

export interface PreviewDictionaryEntry {
  word: string;
  translations?: Partial<Record<string, string>>;
  english: string;
  french?: string | null;
  category: string;
  pronunciation?: string | null;
  example?: string | null;
  exampleTranslations?: Partial<Record<string, string>>;
  exampleTranslation?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

/** Mirrors the hero + example sections of mobile's entry-detail.tsx — the
 * learner-facing look of a dictionary entry, fed a draft directly (no fetch,
 * no published-only filter to bypass). */
export function DictionaryPreviewCard({ entry }: Readonly<{ entry: PreviewDictionaryEntry }>) {
  const englishText = entry.translations?.en ?? entry.english;
  const exampleTranslationText = entry.exampleTranslations?.en ?? entry.exampleTranslation ?? "";

  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {entry.imageUrl && (
        <div className="relative mb-5 h-40 w-full overflow-hidden rounded-2xl">
          <Image src={entry.imageUrl} alt={entry.word} fill className="object-cover" unoptimized />
        </div>
      )}
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">{entry.word}</h1>
      {entry.pronunciation && (
        <p className="mt-2 text-sm italic text-neutral-500 dark:text-neutral-400">/{entry.pronunciation}/</p>
      )}
      <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-300">{englishText}</p>
      {entry.french && (
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="mr-1.5 rounded-full border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400">FR</span>
          {entry.french}
        </p>
      )}

      <div className="mt-6 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white">
          <Volume2 className="h-6 w-6" />
        </div>
        <p className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
          {entry.audioUrl ? "Hear pronunciation" : "Text-to-speech"}
        </p>
      </div>

      <div className="mt-4 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400">
        {entry.category}
      </div>

      {entry.example && (
        <div className="mt-6 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left dark:border-neutral-800 dark:bg-neutral-800/50">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Example</p>
          <p className="text-sm text-neutral-900 dark:text-white">{entry.example}</p>
          {exampleTranslationText && (
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{exampleTranslationText}</p>
          )}
        </div>
      )}
    </div>
  );
}
