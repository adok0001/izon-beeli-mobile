"use client";

/**
 * Admin — Series & Stories overview (read-only).
 *
 * Web port of the mobile `/admin/discover-stories` screen. Surfaces the Discover
 * "story" layer in one place:
 *   • Interactive stories (`/interactive-stories`) — the branching film experiences.
 *   • Story arcs (`/story-arcs`) — podcast season + course arcs.
 *   • Link health — films whose `storyId` resolves to neither an interactive
 *     story nor an arc, so a broken/plain link is easy to spot.
 *
 * Interactive-story content is DB-backed but authored elsewhere; this screen is
 * strictly read-only.
 */

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DiscoverItem, InteractiveStory } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clapperboard, Film, Link2Off } from "lucide-react";

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

  // Mirror the mobile logic exactly.
  const storyIds = new Set(stories.map((s) => s.id));
  const arcIds = new Set(arcs.map((a) => a.id));
  const linkedTo = (id: string) => items.filter((i) => i.storyId === id);
  const brokenLinks = items.filter(
    (i) => i.type === "film" && i.storyId && !storyIds.has(i.storyId) && !arcIds.has(i.storyId)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900 dark:text-white">
          <Clapperboard className="h-6 w-6 text-brand-500" />
          Series &amp; Stories
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          The Discover story layer at a glance. Interactive-story content is authored
          elsewhere, so it is read-only here. Edit Discover cards (and their Story link
          field) on Culture Content.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-500 dark:border-neutral-700 dark:border-t-brand-500" />
        </div>
      ) : (
        <>
          {/* Interactive stories */}
          <section>
            <SectionHeader title="Interactive Stories" count={stories.length} />
            {stories.length === 0 ? (
              <p className="text-sm text-neutral-400">None loaded.</p>
            ) : (
              <div className="space-y-2.5">
                {stories.map((s) => {
                  const links = linkedTo(s.id);
                  return (
                    <Card key={s.id}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{s.coverEmoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {s.title}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            {s.id} · {Object.keys(s.scenes).length} scenes · {s.author}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {links.length > 0 ? (
                          links.map((l) => (
                            <LinkChip key={l.id} label={`▶ ${l.title}`} />
                          ))
                        ) : (
                          <LinkChip label="not linked to any card" tone="warn" />
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Story arcs */}
          <section>
            <SectionHeader title="Story Arcs" count={arcs.length} />
            {arcs.length === 0 ? (
              <p className="text-sm text-neutral-400">None loaded.</p>
            ) : (
              <div className="space-y-2.5">
                {arcs.map((a) => {
                  const links = linkedTo(a.id);
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

          {/* Link health */}
          <section>
            <SectionHeader title="Broken Film Links" count={brokenLinks.length} />
            {brokenLinks.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  ✓ All links resolve — every film links to a valid interactive story or arc.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {brokenLinks.map((i) => (
                  <Card key={i.id}>
                    <div className="flex items-start gap-2.5">
                      <Film className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 dark:text-white">{i.title}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                          <Link2Off className="h-3.5 w-3.5 shrink-0" />
                          storyId “{i.storyId ?? ""}” matches no interactive story or arc — opens a plain detail page.
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
