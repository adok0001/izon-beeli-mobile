"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Clapperboard, Mic, PenLine, type LucideIcon } from "lucide-react";

export type DiscoverItem = {
  id: string;
  type: "film" | "podcast" | "blog";
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  duration: number;
  coverGradient: [string, string];
  featured: boolean;
  /**
   * The experience the card OPENS. A film IS its story (its own `id` once it has
   * a scene graph); a podcast opens its season. Prefer `scenes` / `seasonArcId`.
   */
  storyId?: string;
  /** The season the card BELONGS TO (`culture_items.season_arc_id`). */
  seasonArcId?: string;
  /** A film's branching scene graph, folded inline (a film IS its story). */
  scenes?: Record<string, unknown>;
  audioUrl?: string;
  contentUrl?: string;
  body?: string;
  showNotes?: string;
};

/** A film opens the branching player by its own id once it carries a scene
 *  graph; a podcast opens its season via `storyId`. Everything else is detail. */
function cardHref(item: DiscoverItem): string {
  if (item.type === "film" && item.scenes) return `/culture/story/${item.id}`;
  if (item.storyId) return `/culture/story/${item.storyId}`;
  return `/culture/content/${item.id}`;
}

export type DiscoverFilter = "all" | "blog" | "podcast" | "film";

/** Each Discover content type maps to a monochrome lucide mark (no cover emoji). */
export const DISCOVER_TYPE_ICON: Record<DiscoverItem["type"], LucideIcon> = {
  blog: PenLine,
  podcast: Mic,
  film: Clapperboard,
};

const TYPE_CONFIG = {
  blog:    { color: "#38bdf8", label: "BLOG",    cta: "Read Article" },
  podcast: { color: "#a855f7", label: "PODCAST", cta: "Listen" },
  film:    { color: "#fb923c", label: "FILM",    cta: "Watch" },
};

/** A podcast card that opens a season IS a Season (a series of lessons), so it
 *  reads "Season" rather than "Podcast". */
function cardConfig(item: DiscoverItem) {
  const isSeason = item.type === "podcast" && !!item.storyId && !item.audioUrl;
  return isSeason
    ? { ...TYPE_CONFIG.podcast, label: "SEASON", cta: "View Season" }
    : TYPE_CONFIG[item.type];
}

function formatDuration(seconds: number) {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

function HeroCard({ item }: { item: DiscoverItem }) {
  const cfg = cardConfig(item);
  const href = cardHref(item);
  const Icon = DISCOVER_TYPE_ICON[item.type];

  return (
    <Link
      href={href}
      className="block rounded-2xl overflow-hidden mb-6 group"
      style={{ textDecoration: "none" }}
    >
      <div
        className="relative h-60 flex items-end"
        style={{ background: `linear-gradient(135deg, ${item.coverGradient[0]}, ${item.coverGradient[1]})` }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent 30%, ${item.coverGradient[1]}dd)` }}
        />
        <span className="absolute inset-0 flex items-center justify-center opacity-[0.07] select-none pointer-events-none">
          <Icon className="w-28 h-28 text-neutral-50" strokeWidth={1.25} />
        </span>
        <div
          className="absolute top-4 left-5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black tracking-widest"
          style={{ backgroundColor: "rgba(7,7,15,0.7)", color: cfg.color, border: `1px solid ${cfg.color}40` }}
        >
          {cfg.label}
        </div>
        <div className="relative z-10 p-5 w-full">
          <h2 className="text-xl font-black text-neutral-50 tracking-tight leading-snug mb-1.5 group-hover:text-amber-200 transition-colors line-clamp-2">
            {item.title}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-50/60 font-semibold">{item.author}</span>
            <span className="text-neutral-50/30 text-xs">·</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${cfg.color}25`, color: cfg.color }}
            >
              {cfg.cta}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ContentCard({ item }: { item: DiscoverItem }) {
  const cfg = cardConfig(item);
  const href = cardHref(item);
  const Icon = DISCOVER_TYPE_ICON[item.type];
  const date = new Date(item.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Link
      href={href}
      className="flex gap-3 p-3.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all group"
      style={{ textDecoration: "none", borderLeftWidth: 3, borderLeftColor: cfg.color }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `linear-gradient(135deg, ${item.coverGradient[0]}, ${item.coverGradient[1]})` }}
      >
        <Icon className="w-5 h-5 text-neutral-50/90" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-black tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
          <span className="text-neutral-400 text-[10px]">· {formatDuration(item.duration)}</span>
        </div>
        <h3 className="text-sm font-bold text-neutral-50 leading-snug group-hover:text-amber-200 transition-colors line-clamp-2 mb-1">
          {item.title}
        </h3>
        <p className="text-[11px] text-neutral-400 line-clamp-2">{item.description}</p>
        <div className="mt-1.5 text-[10px] text-neutral-400/70">{item.author} · {date}</div>
      </div>
    </Link>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-1">
      <div className="flex-1 h-px bg-white/[0.08]" />
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-amber-600" />
        <span className="text-[9px] font-black tracking-[0.2em] text-neutral-400 uppercase">{label}</span>
        <div className="w-1 h-1 rounded-full bg-amber-600" />
      </div>
      <div className="flex-1 h-px bg-white/[0.08]" />
    </div>
  );
}

const FILTERS: { id: DiscoverFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blog", label: "Blog" },
  { id: "podcast", label: "Podcast" },
  { id: "film", label: "Film" },
];

export function CulturePage() {
  const [filter, setFilter] = useState<DiscoverFilter>("all");

  const { data: items = [], isLoading } = useQuery<DiscoverItem[]>({
    queryKey: ["culture-items", filter],
    queryFn: () => apiFetch<DiscoverItem[]>(filter === "all" ? "/culture-items" : `/culture-items?type=${filter}`),
    staleTime: 5 * 60 * 1000,
  });

  const featured = items.filter((i) => i.featured);
  const rest = items.filter((i) => !i.featured);
  const hero = featured[0];
  const featuredStrip = featured.slice(1);

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Header */}
      <div className="sticky top-0 z-20 px-5 md:px-10 pt-6 pb-4 border-b bg-[#07070f] border-white/[0.07]">
        <div className="max-w-3xl mx-auto">
          <p className="text-[9px] font-bold tracking-[0.3em] text-amber-600 uppercase mb-1">
            Beeli Media
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-neutral-50 tracking-tight leading-none">
            CULTURE
          </h1>
          <p className="text-sm text-neutral-400 mt-1.5">
            Essays, conversations, and films from inside the world of African languages.
          </p>
          <div className="h-px mt-3 mb-4 opacity-30 bg-gold-500" />
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((opt) => {
              const active = filter === opt.id;
              const color = opt.id === "blog" ? "#38bdf8" : opt.id === "podcast" ? "#a855f7" : opt.id === "film" ? "#fb923c" : "#f59e0b";
              return (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  className="rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-all"
                  style={{
                    backgroundColor: active ? `${color}18` : "rgba(46,50,69,0.6)",
                    border: `1px solid ${active ? `${color}60` : "rgba(255,255,255,0.07)"}`,
                    color: active ? color : "#a3a3a3",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 md:px-10 pt-6 pb-20">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
        )}

        {!isLoading && hero && <HeroCard item={hero} />}

        {!isLoading && featuredStrip.length > 0 && (
          <div className="mb-6">
            <SectionRule label="Featured" />
            <div className="grid md:grid-cols-2 gap-3">
              {featuredStrip.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && rest.length > 0 && (
          <div>
            <SectionRule label="All Content" />
            <div className="grid md:grid-cols-2 gap-3">
              {rest.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <Clapperboard className="w-12 h-12 mb-4 text-neutral-500" strokeWidth={1.25} />
            <p className="text-base font-bold text-neutral-50 mb-1">Nothing here yet</p>
            <p className="text-sm text-neutral-400">Check back soon for new stories and films.</p>
          </div>
        )}
      </div>
    </div>
  );
}
