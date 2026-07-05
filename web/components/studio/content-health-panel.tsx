"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

interface ContentHealth {
  languageId: string;
  dictionaryCoverage: { distinctWords: number; coveredWords: number; pct: number };
  translationCoverage: { locale: string; total: number; covered: number; pct: number }[];
  mediaCoverage: {
    total: number;
    audio: { count: number; pct: number };
    image: { count: number; pct: number };
    exampleAudio: { count: number; pct: number };
  };
  statusBreakdown: { entityType: string; draft: number; in_review: number; published: number; archived: number }[];
}

function Bar({ label, pct }: Readonly<{ label: string; pct: number }>) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
        <span className="font-semibold text-neutral-900 dark:text-white">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-white/[0.06] overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Beeli Studio content-health dashboard for a single language — reused on the
 * educator (scoped) and admin (any language) overview pages. */
export function ContentHealthPanel({ languageId }: Readonly<{ languageId: string }>) {
  const { getToken } = useAuth();

  const { data, isPending } = useQuery<ContentHealth>({
    queryKey: ["educator", "content-health", languageId],
    queryFn: async () =>
      apiFetch<ContentHealth>(`/educator/content-health?languageId=${languageId}`, {
        token: (await getToken()) ?? undefined,
      }),
    enabled: !!languageId,
    staleTime: 30_000,
  });

  if (!languageId) return null;
  if (isPending) return <p className="text-sm text-neutral-500">Loading content health…</p>;
  if (!data) return null;

  const totalPublished = data.statusBreakdown.reduce((sum, e) => sum + e.published, 0);
  const totalDraft = data.statusBreakdown.reduce((sum, e) => sum + e.draft, 0);
  const totalInReview = data.statusBreakdown.reduce((sum, e) => sum + e.in_review, 0);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-5">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Content Health</h3>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{totalPublished}</p>
          <p className="text-xs text-neutral-500">Published</p>
        </div>
        <div>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{totalInReview}</p>
          <p className="text-xs text-neutral-500">In review</p>
        </div>
        <div>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{totalDraft}</p>
          <p className="text-xs text-neutral-500">Draft</p>
        </div>
      </div>

      <div className="space-y-2">
        <Bar label="Dictionary coverage" pct={data.dictionaryCoverage.pct} />
        <Bar label="Audio coverage" pct={data.mediaCoverage.audio.pct} />
        <Bar label="Image coverage" pct={data.mediaCoverage.image.pct} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500">Translation coverage</p>
        {data.translationCoverage.map((t) => (
          <Bar key={t.locale} label={t.locale.toUpperCase()} pct={t.pct} />
        ))}
      </div>
    </div>
  );
}
