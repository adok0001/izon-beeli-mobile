"use client";

/**
 * Admin — Films & Seasons overview (read-only).
 *
 * Surfaces the Discover "story" layer in one place:
 *   • Films with a story (`/interactive-stories` — now film rows carrying a scene
 *     graph, since interactive stories were folded into culture_items).
 *   • Seasons (`/story-arcs`) — with the cards that belong to each.
 *
 * A film IS its story (its scenes live on the film row), so there is no longer a
 * separate "broken story link" class to surface. Content is authored elsewhere;
 * this screen is strictly read-only.
 */

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DiscoverItem, InteractiveStory } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Clapperboard } from "lucide-react";

interface StoryArcSummary {
  id: string;
  courseId: string;
  title: string;
}

function SectionHeader({ title, count }: Readonly<{ title: string; count: number }>) {
  return (
    <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
      {title}
      <span className="ml-2 text-neutral-400 dark:text-neutral-500">{count}</span>
    </h2>
  );
}

function LinkChip({ label, tone }: Readonly<{ label: string; tone?: "warn" }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        tone === "warn"
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400"
          : "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
      )}
    >
      {label}
    </span>
  );
}

function Card({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {children}
    </div>
  );
}

export default function DiscoverStoriesAdminPage() {
  const { getToken } = useAuth();

  const { data: items = [], isLoading: itemsLoading } = useQuery<DiscoverItem[]>({
    queryKey: ["admin", "culture-items"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DiscoverItem[]>("/culture-items", { token: token ?? undefined });
    },
    staleTime: 60_000,
  });

  const { data: stories = [], isLoading: storiesLoading } = useQuery<InteractiveStory[]>({
    queryKey: ["admin", "interactive-stories"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<InteractiveStory[]>("/interactive-stories", { token: token ?? undefined });
    },
    staleTime: 60_000,
  });

  const { data: arcs = [], isLoading: arcsLoading } = useQuery<StoryArcSummary[]>({
    queryKey: ["admin", "story-arcs"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<StoryArcSummary[]>("/story-arcs", { token: token ?? undefined });
    },
    staleTime: 60_000,
  });

  const isLoading = itemsLoading || storiesLoading || arcsLoading;

  // Cards that belong to a season (films set in its world, podcasts that open it).
  const cardsInSeason = (arcId: string) => items.filter((i) => i.seasonArcId === arcId);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900 dark:text-white">
          <Clapperboard className="h-6 w-6 text-brand-500" />
          Films &amp; Seasons
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          The Discover story layer at a glance. A film carries its own branching scene
          graph; content is authored elsewhere, so this screen is read-only.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-500 dark:border-neutral-700 dark:border-t-brand-500" />
        </div>
      ) : (
        <>
          {/* Films with a story */}
          <section>
            <SectionHeader title="Films with a story" count={stories.length} />
            {stories.length === 0 ? (
              <p className="text-sm text-neutral-400">None loaded.</p>
            ) : (
              <div className="space-y-2.5">
                {stories.map((s) => (
                  <Card key={s.id}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                        <Clapperboard className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {s.title}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {s.id} · {Object.keys(s.scenes).length} scenes · {s.author}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Seasons */}
          <section>
            <SectionHeader title="Seasons" count={arcs.length} />
            {arcs.length === 0 ? (
              <p className="text-sm text-neutral-400">None loaded.</p>
            ) : (
              <div className="space-y-2.5">
                {arcs.map((a) => {
                  const links = cardsInSeason(a.id);
                  return (
                    <Card key={a.id}>
                      <p className="font-semibold text-neutral-900 dark:text-white">{a.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {a.id} · course {a.courseId}
                      </p>
                      {links.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {links.map((l) => (
                            <LinkChip key={l.id} label={`▶ ${l.title}`} />
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
