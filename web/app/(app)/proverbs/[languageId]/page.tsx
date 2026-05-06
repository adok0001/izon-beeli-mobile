"use client";

import { apiFetch } from "@/lib/api";
import { localizeField } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Proverb } from "@/types";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronUp, Quote, Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// ── Single proverb card ───────────────────────────────────────────────────────

function ProverbCard({ proverb }: Readonly<{ proverb: Proverb }>) {
  const { t } = useTranslation();
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={() => setExpanded((v) => !v)}
      className="w-full text-left rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
          <Quote className="h-4 w-4 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold italic text-neutral-900 dark:text-white leading-snug">
            &ldquo;{proverb.text}&rdquo;
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {localizeField(proverb.translation, proverb.translationFr, uiLanguage)}
          </p>

          {expanded && (
            <div className="mt-3 space-y-2">
              <div className="rounded-lg bg-amber-100/60 dark:bg-amber-900/30 px-3 py-2">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  {localizeField(proverb.meaning, proverb.meaningFr, uiLanguage)}
                </p>
              </div>
              {proverb.literal && proverb.literal !== proverb.translation && (
                <p className="text-xs italic text-neutral-400 dark:text-neutral-500">
                  {t("proverbs.literal")} {proverb.literal}
                </p>
              )}
              {proverb.tags && proverb.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proverb.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 mt-1">
          {expanded
            ? <ChevronUp className="h-4 w-4 text-amber-500" />
            : <ChevronDown className="h-4 w-4 text-amber-500" />
          }
        </div>
      </div>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProverbsPage() {
  const { t } = useTranslation();
  const { languageId } = useParams<{ languageId: string }>();
  const [query, setQuery] = useState("");

  const { data: proverbs = [], isLoading } = useQuery<Proverb[]>({
    queryKey: ["proverbs", languageId],
    queryFn: () => apiFetch<Proverb[]>(`/proverbs?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId,
  });

  const languageTitle =
    LANGUAGES.find((l) => l.id === languageId)?.name ??
    ((languageId ?? "").charAt(0).toUpperCase() + (languageId ?? "").slice(1));

  const filtered = query.trim()
    ? proverbs.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.text.toLowerCase().includes(q) ||
          p.translation?.toLowerCase().includes(q) ||
          p.meaning?.toLowerCase().includes(q) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      })
    : proverbs;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/listen"
          className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-3 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("tabs.practice")}
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {languageTitle} {t("proverbs.titleSuffix")}
        </h1>
        {proverbs.length > 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {proverbs.length} {t("proverbs.titleSuffix").toLowerCase()}
          </p>
        )}
      </div>

      {/* Search */}
      {proverbs.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("proverbs.searchPlaceholder", { language: languageTitle })}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 dark:focus:border-amber-600 transition-colors"
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((k) => (
            <div
              key={k}
              className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Quote className="mx-auto mb-3 h-10 w-10 text-neutral-200 dark:text-neutral-700" />
          <p className="font-medium text-neutral-400 dark:text-neutral-500">
            {query ? t("proverbs.noResults") : t("proverbs.noProverbs")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((proverb) => (
            <ProverbCard key={proverb.id} proverb={proverb} />
          ))}
        </div>
      )}
    </div>
  );
}
